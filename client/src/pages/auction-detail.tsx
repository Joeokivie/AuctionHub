import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import BidModal from "@/components/bid-modal";
import CountdownTimer from "@/components/countdown-timer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { Clock, User, Tag, Calendar, Gavel } from "lucide-react";
import type { AuctionWithDetails, Bid, User as UserType } from "@shared/schema";

export default function AuctionDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [showBidModal, setShowBidModal] = useState(false);

  const { data: auction, isLoading } = useQuery<AuctionWithDetails>({
    queryKey: ["/api/auctions", id],
  });

  const { data: bids = [] } = useQuery<(Bid & { bidder: UserType })[]>({
    queryKey: ["/api/auctions", id, "bids"],
    enabled: !!id,
  });

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
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Tag className="h-24 w-24" />
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{auction.category.name}</Badge>
                {isAuctionEnded && <Badge variant="destructive">Ended</Badge>}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{auction.title}</h1>
              <p className="text-gray-600 text-lg">{auction.description}</p>
            </div>

            {/* Seller Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {auction.seller.firstName[0]}{auction.seller.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {auction.seller.firstName} {auction.seller.lastName}
                    </p>
                    <p className="text-sm text-gray-500">Seller</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bidding Section */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
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
                    <Button 
                      onClick={() => setShowBidModal(true)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                      size="lg"
                    >
                      <Gavel className="h-5 w-5 mr-2" />
                      Place Bid
                    </Button>
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

      <BidModal 
        isOpen={showBidModal}
        onClose={() => setShowBidModal(false)}
        auction={auction}
      />
    </div>
  );
}
