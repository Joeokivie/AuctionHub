import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Gavel, DollarSign, Users, HandMetal, FileText, List, Database, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AuctionWithDetails, User } from "@shared/schema";

interface AdminStats {
  activeAuctions: number;
  totalRevenue: number;
  registeredUsers: number;
  totalBids: number;
}

export default function AdminDashboard() {
  const { toast } = useToast();

  const { data: currentUser } = useQuery<{ user: User } | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: !!currentUser,
  });

  const { data: salesReport = [] } = useQuery<AuctionWithDetails[]>({
    queryKey: ["/api/admin/reports/sales"],
    enabled: !!currentUser,
  });

  const { data: activeAuctions = [] } = useQuery<AuctionWithDetails[]>({
    queryKey: ["/api/admin/reports/active-auctions"],
    enabled: !!currentUser,
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/reports/users"],
    enabled: !!currentUser,
  });

  const exportData = (data: any, filename: string) => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export successful",
      description: `${filename} has been downloaded.`,
    });
  };

  if (!currentUser) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600">
            You need to be logged in to access the admin dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate category sales for the chart
  const categorySales = salesReport.reduce((acc, auction) => {
    const categoryName = auction.category.name;
    const currentBid = Number(auction.currentBid);
    acc[categoryName] = (acc[categoryName] || 0) + currentBid;
    return acc;
  }, {} as Record<string, number>);

  const maxSales = Math.max(...Object.values(categorySales));

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Gavel className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Auctions</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeAuctions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats?.totalRevenue?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Registered Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.registeredUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <HandMetal className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bids</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalBids || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales by Category */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Sales by Category (Last 30 Days)</h3>
            <div className="space-y-3">
              {Object.entries(categorySales).map(([category, sales]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{category}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${maxSales > 0 ? (sales / maxSales) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">${sales.toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {Object.keys(categorySales).length === 0 && (
                <p className="text-gray-500 text-center py-4">No sales data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent High-Value Sales */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent High-Value Sales</h3>
            <div className="space-y-4">
              {salesReport
                .sort((a, b) => Number(b.currentBid) - Number(a.currentBid))
                .slice(0, 3)
                .map((auction) => (
                  <div key={auction.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                    <div>
                      <p className="font-medium">{auction.title}</p>
                      <p className="text-sm text-gray-600">
                        Sold to: {auction.seller.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        ${Number(auction.currentBid).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(auction.endTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              {salesReport.length === 0 && (
                <p className="text-gray-500 text-center py-4">No sales data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Generation */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Generate Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="p-6 h-auto flex-col items-start"
              onClick={() => exportData(salesReport, 'sales_report')}
            >
              <FileText className="h-6 w-6 text-blue-600 mb-2" />
              <h4 className="font-medium">Items Sold by Date</h4>
              <p className="text-sm text-gray-600 mt-1 text-left">
                Generate sales report for specific date range
              </p>
              <div className="flex items-center mt-2 text-blue-600">
                <Download className="h-4 w-4 mr-1" />
                <span className="text-xs">Download JSON</span>
              </div>
            </Button>

            <Button
              variant="outline"
              className="p-6 h-auto flex-col items-start"
              onClick={() => exportData(activeAuctions, 'active_auctions')}
            >
              <List className="h-6 w-6 text-blue-600 mb-2" />
              <h4 className="font-medium">Active Auctions</h4>
              <p className="text-sm text-gray-600 mt-1 text-left">
                List all currently active auction items
              </p>
              <div className="flex items-center mt-2 text-blue-600">
                <Download className="h-4 w-4 mr-1" />
                <span className="text-xs">Download JSON</span>
              </div>
            </Button>

            <Button
              variant="outline"
              className="p-6 h-auto flex-col items-start"
              onClick={() => exportData(allUsers, 'user_database')}
            >
              <Database className="h-6 w-6 text-blue-600 mb-2" />
              <h4 className="font-medium">User Database</h4>
              <p className="text-sm text-gray-600 mt-1 text-left">
                Export registered user information
              </p>
              <div className="flex items-center mt-2 text-blue-600">
                <Download className="h-4 w-4 mr-1" />
                <span className="text-xs">Download JSON</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Auctions Preview */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Current Active Auctions</h3>
          <div className="space-y-3">
            {activeAuctions.slice(0, 5).map((auction) => (
              <div key={auction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{auction.title}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {auction.category.name}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {auction.bidCount} bids
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">
                    ${Number(auction.currentBid).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Ends: {new Date(auction.endTime).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {activeAuctions.length === 0 && (
              <p className="text-gray-500 text-center py-4">No active auctions</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
