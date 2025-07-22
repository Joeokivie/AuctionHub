import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/header";
import AuctionCard from "@/components/auction-card";
import SellForm from "@/components/sell-form";
import AdminDashboard from "@/components/admin-dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter } from "lucide-react";
import type { AuctionWithDetails, Category } from "@shared/schema";

export default function Home() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("browse");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState("ending-soon");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Handle URL parameters for category selection
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      setActiveTab("browse");
    }
  }, [location]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  const { data: auctions = [], isLoading } = useQuery<AuctionWithDetails[]>({
    queryKey: ["/api/auctions", selectedCategory, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/auctions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch auctions');
      return response.json();
    }
  });

  // Filter and sort auctions
  const filteredAuctions = (Array.isArray(auctions) ? auctions : []).filter(auction => {
    const matchesPrice = (!priceMin || Number(auction.currentBid) >= Number(priceMin)) &&
                        (!priceMax || Number(auction.currentBid) <= Number(priceMax));
    return matchesPrice;
  }).sort((a, b) => {
    switch (sortBy) {
      case "ending-soon":
        return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
      case "newest-first":
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      case "price-low-high":
        return Number(a.currentBid) - Number(b.currentBid);
      case "price-high-low":
        return Number(b.currentBid) - Number(a.currentBid);
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(filteredAuctions.length / itemsPerPage);
  const paginatedAuctions = filteredAuctions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCategoryClick = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    setSelectedCategory(category ? category.id.toString() : "");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Category Navigation */}
      <nav className="bg-gray-100 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-8 py-3 overflow-x-auto">
            <button
              onClick={() => handleCategoryClick("")}
              className={`whitespace-nowrap text-sm font-medium hover:text-blue-600 ${
                !selectedCategory ? "text-gray-900" : "text-gray-600"
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.name)}
                className={`whitespace-nowrap text-sm font-medium hover:text-blue-600 ${
                  selectedCategory === category.id.toString() ? "text-gray-900" : "text-gray-600"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b">
            <button
              onClick={() => setActiveTab("browse")}
              className={`py-2 px-1 border-b-2 font-medium ${
                activeTab === "browse"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Browse Auctions
            </button>
            <button
              onClick={() => setActiveTab("sell")}
              className={`py-2 px-1 border-b-2 font-medium ${
                activeTab === "sell"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Sell Item
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`py-2 px-1 border-b-2 font-medium ${
                activeTab === "admin"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Admin Reports
            </button>
          </nav>
        </div>

        {/* Browse Auctions Tab */}
        {activeTab === "browse" && (
          <div className="flex gap-8">
            {/* Filter Sidebar */}
            <aside className="w-64 flex-shrink-0">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Filters</h3>
                  
                  {/* Search */}
                  <div className="mb-6">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search auctions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Price Range</h4>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                        className="w-20"
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                        className="w-20"
                      />
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Sort By</h4>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ending-soon">Ending Soon</SelectItem>
                        <SelectItem value="newest-first">Newest First</SelectItem>
                        <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                        <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Auction Status */}
                  <div>
                    <h4 className="font-medium mb-2">Status</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <Checkbox className="mr-2" defaultChecked />
                        <span className="text-sm">Active Auctions</span>
                      </label>
                      <label className="flex items-center">
                        <Checkbox className="mr-2" />
                        <span className="text-sm">Buy It Now</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Auction Grid */}
            <div className="flex-1">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow animate-pulse">
                      <div className="w-full h-48 bg-gray-200 rounded-t-lg"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedAuctions.map((auction) => (
                      <AuctionCard key={auction.id} auction={auction} />
                    ))}
                  </div>

                  {filteredAuctions.length === 0 && !isLoading && (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No auctions found</h3>
                      <p className="text-gray-600">Try adjusting your filters or search terms.</p>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-12">
                      <nav className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </nav>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Sell Item Tab */}
        {activeTab === "sell" && <SellForm />}

        {/* Admin Reports Tab */}
        {activeTab === "admin" && <AdminDashboard />}
      </main>
    </div>
  );
}
