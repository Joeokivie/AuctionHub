import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, loginSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertUser, LoginData } from "@shared/schema";

interface AuthModalsProps {
  isOpen: "login" | "register" | null;
  onClose: () => void;
  onSwitchMode: (mode: "login" | "register") => void;
}

export default function AuthModals({ isOpen, onClose, onSwitchMode }: AuthModalsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      shippingAddress: "",
      creditCardInfo: "",
      phoneNumber: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginData) => apiRequest("POST", "/api/auth/login", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      onClose();
      loginForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: InsertUser) => apiRequest("POST", "/api/auth/register", data),
    onSuccess: () => {
      toast({
        title: "Registration successful",
        description: "Please log in with your new account.",
      });
      onSwitchMode("login");
      registerForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: InsertUser) => {
    registerMutation.mutate(data);
  };

  return (
    <>
      {/* Login Modal */}
      <Dialog open={isOpen === "login"} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Login to Your Account</DialogTitle>
          </DialogHeader>

          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="login-username">Username</Label>
              <Input
                id="login-username"
                {...loginForm.register("username")}
                placeholder="Enter your username"
              />
              {loginForm.formState.errors.username && (
                <p className="text-sm text-red-600 mt-1">
                  {loginForm.formState.errors.username.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                {...loginForm.register("password")}
                placeholder="Enter your password"
              />
              {loginForm.formState.errors.password && (
                <p className="text-sm text-red-600 mt-1">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => onSwitchMode("register")}
                className="text-blue-600 hover:text-blue-700"
              >
                Don't have an account? Register here
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Registration Modal */}
      <Dialog open={isOpen === "register"} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
          </DialogHeader>

          <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  {...registerForm.register("firstName")}
                  placeholder="John"
                />
                {registerForm.formState.errors.firstName && (
                  <p className="text-sm text-red-600 mt-1">
                    {registerForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  {...registerForm.register("lastName")}
                  placeholder="Doe"
                />
                {registerForm.formState.errors.lastName && (
                  <p className="text-sm text-red-600 mt-1">
                    {registerForm.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...registerForm.register("email")}
                placeholder="john@example.com"
              />
              {registerForm.formState.errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {registerForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                {...registerForm.register("username")}
                placeholder="johndoe"
              />
              {registerForm.formState.errors.username && (
                <p className="text-sm text-red-600 mt-1">
                  {registerForm.formState.errors.username.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...registerForm.register("password")}
                placeholder="Enter secure password"
              />
              {registerForm.formState.errors.password && (
                <p className="text-sm text-red-600 mt-1">
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="shippingAddress">Shipping Address</Label>
              <Textarea
                id="shippingAddress"
                rows={3}
                {...registerForm.register("shippingAddress")}
                placeholder="Enter your shipping address"
              />
              {registerForm.formState.errors.shippingAddress && (
                <p className="text-sm text-red-600 mt-1">
                  {registerForm.formState.errors.shippingAddress.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
              <Input
                id="phoneNumber"
                {...registerForm.register("phoneNumber")}
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <Label htmlFor="creditCardInfo">Credit Card Info (Optional)</Label>
              <Input
                id="creditCardInfo"
                {...registerForm.register("creditCardInfo")}
                placeholder="Credit card information"
              />
            </div>

            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {registerMutation.isPending ? "Creating Account..." : "Create Account"}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => onSwitchMode("login")}
                className="text-blue-600 hover:text-blue-700"
              >
                Already have an account? Login here
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
