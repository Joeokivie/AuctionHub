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
import { CloudUpload, Upload, X } from "lucide-react";
import type { InsertAuction, Category, User } from "@shared/schema";
import { z } from "zod";
import { useState, useRef } from "react";

type SellFormData = InsertAuction & { duration: number };

export default function SellForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    resolver: zodResolver(z.object({
      title: z.string().min(1, "Title is required"),
      description: z.string().min(1, "Description is required"),
      categoryId: z.number().min(1, "Please select a category"),
      startingBid: z.string().min(1, "Starting bid is required").refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: "Starting bid must be a valid positive number"
      }),
      reservePrice: z.string().optional().refine(val => !val || val.trim() === "" || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
        message: "Reserve price must be a valid positive number"
      }),
      duration: z.number().min(1).max(30),
      imageUrl: z.string().optional(),
      sellerId: z.number().optional()
    })),
    defaultValues: {
      title: "",
      description: "",
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
      setImageFile(null);
      setImagePreview("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: any) => {
      console.error("Auction creation failed:", error);
      toast({
        title: "Failed to create auction",
        description: error.message || "An error occurred while creating your auction.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please choose an image smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please choose an image file (PNG, JPG, GIF).",
          variant: "destructive",
        });
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = (data: SellFormData) => {
    if (!currentUser) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to sell items.",
        variant: "destructive",
      });
      return;
    }

    // Use the image preview (base64) if file was uploaded, otherwise use URL field
    const finalImageUrl = imagePreview || data.imageUrl || "";

    const submitData = {
      ...data,
      sellerId: currentUser.user.id,
      imageUrl: finalImageUrl,
      reservePrice: data.reservePrice && data.reservePrice.trim() !== "" ? data.reservePrice : undefined,
    };
    
    createAuctionMutation.mutate(submitData);
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

            {/* Image Upload Area */}
            <div>
              <Label>Item Photos</Label>
              {imagePreview ? (
                <div className="border-2 border-gray-300 rounded-lg p-4">
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-w-full h-48 object-cover mx-auto rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    {imageFile?.name}
                  </p>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CloudUpload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Drag and drop your images here, or</p>
                  <Button type="button" variant="link" className="text-blue-600 hover:text-blue-700 font-medium">
                    browse files
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
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
