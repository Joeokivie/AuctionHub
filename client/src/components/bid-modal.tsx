import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import CountdownTimer from "./countdown-timer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AuctionWithDetails, User } from "@shared/schema";

const bidSchema = z.object({
  amount: z.number().min(1, "Bid amount is required"),
  shippingAddress: z.string().min(1, "Shipping address is required"),
});

type BidFormData = z.infer<typeof bidSchema>;

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: AuctionWithDetails;
}

export default function BidModal({ isOpen, onClose, auction }: BidModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery<{ user: User } | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<BidFormData>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      amount: Number(auction.currentBid) + 1,
      shippingAddress: currentUser?.user.shippingAddress || "",
    },
  });

  const bidMutation = useMutation({
    mutationFn: (data: BidFormData) =>
      apiRequest("POST", `/api/auctions/${auction.id}/bids`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions", auction.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions", auction.id.toString(), "bids"] });
      toast({
        title: "Bid placed successfully!",
        description: "Your bid has been submitted.",
      });
      onClose();
      reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to place bid",
        description: error.message || "An error occurred while placing your bid.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BidFormData) => {
    if (!currentUser) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to place a bid.",
        variant: "destructive",
      });
      return;
    }

    bidMutation.mutate(data);
  };

  const currentBidAmount = Number(auction.currentBid);
  const watchedAmount = watch("amount");
  const minBid = currentBidAmount + 1;

  // Check if user is not logged in
  if (!currentUser && isOpen) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
          </DialogHeader>
          <div className="p-6 text-center">
            <p className="text-gray-600 mb-6">
              To buy or sell, You need to register. It takes 5 minutes to do it and then you can conveniently buy/Sell. Have Fun.
            </p>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Place Bid</DialogTitle>
        </DialogHeader>

        {/* Product Summary */}
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">{auction.title}</h4>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Current Bid:</span>
              <span className="text-lg font-bold text-red-600">
                ${currentBidAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Time Left:</span>
              <CountdownTimer endTime={new Date(auction.endTime)} />
            </div>
          </CardContent>
        </Card>

        {/* Bid Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="amount">Your Bid Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              min={minBid}
              step="1"
              {...register("amount", { valueAsNumber: true })}
              placeholder={`Enter amount (min: $${minBid.toLocaleString()})`}
            />
            {errors.amount && (
              <p className="text-sm text-red-600 mt-1">{errors.amount.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Minimum bid: ${minBid.toLocaleString()} (current bid + $1)
            </p>
          </div>

          <div>
            <Label htmlFor="shippingAddress">Shipping Address</Label>
            <Textarea
              id="shippingAddress"
              rows={3}
              {...register("shippingAddress")}
              placeholder="Enter your shipping address"
            />
            {errors.shippingAddress && (
              <p className="text-sm text-red-600 mt-1">{errors.shippingAddress.message}</p>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={bidMutation.isPending || (watchedAmount && watchedAmount <= currentBidAmount)}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {bidMutation.isPending ? "Placing Bid..." : "Place Bid"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
