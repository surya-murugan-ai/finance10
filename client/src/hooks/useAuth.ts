import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Initialize token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const currentToken = localStorage.getItem('access_token');
      if (!currentToken) {
        throw new Error("No token found");
      }
      
      const response = await apiRequest('GET', '/api/auth/user');
      const result = await response.json();
      
      if (result.success) {
        return result.user;
      } else {
        throw new Error(result.message || 'Failed to get user');
      }
    },
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const login = (userData: any, accessToken: string, refreshToken?: string) => {
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    setToken(accessToken);
    queryClient.setQueryData(["/api/auth/user"], userData);
  };

  const logout = async () => {
    try {
      const currentToken = localStorage.getItem('access_token');
      if (currentToken) {
        await apiRequest('POST', '/api/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setToken(null);
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
    }
  };

  return {
    user,
    isLoading: isLoading && !!token,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    token,
    error
  };
}