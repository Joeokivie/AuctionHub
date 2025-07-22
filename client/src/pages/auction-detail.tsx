import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/header";
import BidModal from "@/components/bid-modal";
import CountdownTimer from "@/components/countdown-timer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useCallback } from "react";
import { Clock, User, Tag, Calendar, Gavel, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import type { AuctionWithDetails, Bid, User as UserType } from "@shared/schema";

export default function AuctionDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [showBidModal, setShowBidModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: currentUserData } = useCurrentUser();

  const { data: auction, isLoading } = useQuery<AuctionWithDetails>({
    queryKey: ["/api/auctions", id],
  });

  const { data: bids = [] } = useQuery<(Bid & { bidder: UserType })[]>({
    queryKey: ["/api/auctions", id, "bids"],
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest(`/api/auctions/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
      toast({
        title: "Success",
        description: "Auction deleted successfully",
      });
      // Use setTimeout to ensure the redirect happens after the current render cycle
      setTimeout(() => {
        setLocation("/");
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete auction",
        variant: "destructive",
      });
    },
  });

  const handleDelete = useCallback(() => {
    if (confirm("Are you sure you want to delete this auction? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  }, [deleteMutation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-200 h-96 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Auction Not Found</h2>
              <p className="text-gray-600 mb-6">The auction you're looking for doesn't exist.</p>
              <Button onClick={() => setLocation("/")}>Back to Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isAuctionEnded = new Date() > new Date(auction.endTime);
  const isOwner = currentUserData?.user?.id === auction.sellerId;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-200">
              {auction.imageUrl ? (
                <img 
                  src={auction.imageUrl} 
                  alt={auction.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-full h-full flex items-center justify-center text-gray-400 ${auction.imageUrl ? 'hidden' : ''}`}>
                <Tag className="h-24 w-24" />
              </div>
            </div>
          </div>

          {/* Auction Info */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {auction.category.name}
                    </Badge>
                    {isAuctionEnded && (
                      <Badge variant="destructive" className="ml-2">
                        Ended
                      </Badge>
                    )}
                    <h1 className="text-3xl font-bold text-gray-900 mt-2">
                      {auction.title}
                    </h1>
                    <p className="text-gray-600 mt-3">
                      {auction.description}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <User className="h-4 w-4" />
                    <span>Seller: {auction.seller.firstName} {auction.seller.lastName}</span>
                  </div>

                  <div className="flex justify-between items-center py-4 border-y">
                    <div>
                      <p className="text-sm text-gray-500">Current Bid</p>
                      <p className="text-3xl font-bold text-red-600">
                        ${Number(auction.currentBid).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Bids</p>
                      <p className="text-2xl font-semibold">{auction.bidCount}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-4 border-t">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {isAuctionEnded ? "Auction Ended" : "Time Left:"}
                      </span>
                    </div>
                    {!isAuctionEnded && (
                      <CountdownTimer endTime={new Date(auction.endTime)} />
                    )}
                  </div>

                  {!isAuctionEnded && (
                    <>
                      {isOwner ? (
                        <Button 
                          onClick={handleDelete}
                          variant="destructive"
                          className="w-full"
                          size="lg"
                          disabled={deleteMutation.isPending || auction.bidCount > 0}
                        >
                          <Trash2 className="h-5 w-5 mr-2" />
                          {deleteMutation.isPending ? "Deleting..." : "Delete Auction"}
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => setShowBidModal(true)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                          size="lg"
                        >
                          <Gavel className="h-5 w-5 mr-2" />
                          Place Bid
                        </Button>
                      )}
                    </>
                  )}
                  
                  {isOwner && auction.bidCount > 0 && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      Cannot delete auction with existing bids
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Auction Details */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Auction Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Starting Bid:</span>
                    <span className="font-medium">${Number(auction.startingBid).toLocaleString()}</span>
                  </div>
                  {auction.reservePrice && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Reserve Price:</span>
                      <span className="font-medium">${Number(auction.reservePrice).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Started:</span>
                    <span className="font-medium">
                      {new Date(auction.startTime).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Ends:</span>
                    <span className="font-medium">
                      {new Date(auction.endTime).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bid History */}
        {bids.length > 0 && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Bid History</h3>
              <div className="space-y-3">
                {bids.slice(0, 10).map((bid, index) => (
                  <div key={bid.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {bid.bidder.firstName[0]}{bid.bidder.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {bid.bidder.firstName} {bid.bidder.lastName[0]}.
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(bid.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${Number(bid.amount).toLocaleString()}</p>
                      {index === 0 && <Badge variant="default" className="text-xs">Highest</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Bid Modal */}
      <BidModal
        isOpen={showBidModal}
        onClose={() => setShowBidModal(false)}
        auction={auction}
      />
    </div>
  );
}