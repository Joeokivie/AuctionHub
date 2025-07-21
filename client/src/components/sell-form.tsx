import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAuctionSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload } from "lucide-react";
import type { InsertAuction, Category, User } from "@shared/schema";

type SellFormData = InsertAuction & { duration: number };

export default function SellForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: currentUser } = useQuery<{ user: User } | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<SellFormData>({
    resolver: zodResolver(insertAuctionSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: 0,
      startingBid: "",
      reservePrice: "",
      duration: 7,
      imageUrl: "",
    },
  });

  const createAuctionMutation = useMutation({
    mutationFn: (data: SellFormData) => apiRequest("POST", "/api/auctions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      toast({
        title: "Auction created successfully!",
        description: "Your item has been listed for auction.",
      });
      reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create auction",
        description: error.message || "An error occurred while creating your auction.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SellFormData) => {
    if (!currentUser) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to sell items.",
        variant: "destructive",
      });
      return;
    }

    createAuctionMutation.mutate({
      ...data,
      sellerId: currentUser.user.id,
    });
  };

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to sell items on AuctionHub.
            </p>
            <p className="text-gray-600">
              To buy or sell, You need to register. It takes 5 minutes to do it and then you can conveniently buy/Sell. Have Fun.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold mb-6">List Your Item for Auction</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Item Title */}
            <div>
              <Label htmlFor="title">Item Title</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="e.g., Vintage Rolex Watch, Brand New Condition"
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Category</Label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && (
                <p className="text-sm text-red-600 mt-1">{errors.categoryId.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Item Description</Label>
              <Textarea
                id="description"
                rows={4}
                {...register("description")}
                placeholder="Provide detailed description of your item including condition, age, specifications..."
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Starting Price & Reserve Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startingBid">Starting Bid ($)</Label>
                <Input
                  id="startingBid"
                  type="number"
                  min="1"
                  step="0.01"
                  {...register("startingBid")}
                  placeholder="0.00"
                />
                {errors.startingBid && (
                  <p className="text-sm text-red-600 mt-1">{errors.startingBid.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="reservePrice">Reserve Price ($) - Optional</Label>
                <Input
                  id="reservePrice"
                  type="number"
                  min="1"
                  step="0.01"
                  {...register("reservePrice")}
                  placeholder="Optional"
                />
                {errors.reservePrice && (
                  <p className="text-sm text-red-600 mt-1">{errors.reservePrice.message}</p>
                )}
              </div>
            </div>

            {/* Auction Duration */}
            <div>
              <Label htmlFor="duration">Auction Duration</Label>
              <Controller
                name="duration"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Days</SelectItem>
                      <SelectItem value="5">5 Days</SelectItem>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="10">10 Days</SelectItem>
                      <SelectItem value="14">14 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.duration && (
                <p className="text-sm text-red-600 mt-1">{errors.duration.message}</p>
              )}
            </div>

            {/* Image URL */}
            <div>
              <Label htmlFor="imageUrl">Item Image URL (Optional)</Label>
              <Input
                id="imageUrl"
                {...register("imageUrl")}
                placeholder="https://example.com/image.jpg"
              />
              {errors.imageUrl && (
                <p className="text-sm text-red-600 mt-1">{errors.imageUrl.message}</p>
              )}
            </div>

            {/* Image Upload Area (Visual Only) */}
            <div>
              <Label>Item Photos</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <CloudUpload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop your images here, or</p>
                <Button type="button" variant="link" className="text-blue-600 hover:text-blue-700 font-medium">
                  browse files
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  PNG, JPG, GIF up to 10MB each (max 8 photos)
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Note: For now, please use the Image URL field above
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <Button
                type="submit"
                disabled={createAuctionMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {createAuctionMutation.isPending ? "Creating Auction..." : "Create Auction"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
