import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import AuthModals from "./auth-modals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, User, LogOut } from "lucide-react";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User as UserType } from "@shared/schema";

export default function Header() {
  const [showAuthModal, setShowAuthModal] = useState<"login" | "register" | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery<{ user: UserType } | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/">
                <h1 className="text-2xl font-bold text-blue-600 cursor-pointer">
                  AuctionHub
                </h1>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search auctions..."
                  className="pl-10"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {currentUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {currentUser.user.firstName[0]}{currentUser.user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span>{currentUser.user.firstName} {currentUser.user.lastName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowAuthModal("login")}
                  >
                    Login
                  </Button>
                  <Button 
                    onClick={() => setShowAuthModal("register")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Register
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModals 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(null)}
        onSwitchMode={(mode) => setShowAuthModal(mode)}
      />
    </>
  );
}
