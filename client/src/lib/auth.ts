import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useCurrentUser() {
  return useQuery<{ user: User } | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });
}

export function useIsAuthenticated() {
  const { data: currentUser } = useCurrentUser();
  return !!currentUser;
}
