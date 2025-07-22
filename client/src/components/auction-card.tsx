import { Link } from "wouter";
import CountdownTimer from "./countdown-timer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gavel, Tag } from "lucide-react";
import type { AuctionWithDetails } from "@shared/schema";

interface AuctionCardProps {
  auction: AuctionWithDetails;
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const isAuctionEnded = new Date() > new Date(auction.endTime);

  return (
    <Card className="auction-card hover:shadow-lg transition-shadow cursor-pointer">
      <Link href={`/auction/${auction.id}`}>
        <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gray-200">
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
            <Tag className="h-16 w-16" />
          </div>
        </div>
      </Link>
      
      <CardContent className="p-4">
        <div className="mb-2">
          <Badge variant="outline" className="text-xs">
            {auction.category.name}
          </Badge>
          {isAuctionEnded && (
            <Badge variant="destructive" className="ml-2 text-xs">
              Ended
            </Badge>
          )}
        </div>
        
        <Link href={`/auction/${auction.id}`}>
          <h3 className="font-semibold text-lg mb-2 hover:text-blue-600 line-clamp-2">
            {auction.title}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {auction.description}
        </p>
        
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-sm text-gray-500">Current Bid</p>
            <p className="text-xl font-bold text-red-600">
              ${Number(auction.currentBid).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Bids</p>
            <p className="text-lg font-semibold">{auction.bidCount}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {isAuctionEnded ? (
              <span className="text-sm text-gray-500 font-medium">
                Auction Ended
              </span>
            ) : (
              <CountdownTimer endTime={new Date(auction.endTime)} />
            )}
          </div>
          
          {!isAuctionEnded && (
            <Link href={`/auction/${auction.id}`}>
              <Button size="sm" className="bg-red-600 hover:bg-red-700">
                <Gavel className="h-4 w-4 mr-1" />
                Bid Now
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
