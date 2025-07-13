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
      
      try {
        const response = await apiRequest('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${currentToken}`
          }
        });
        return response.user;
      } catch (error) {
        // If token is invalid, try to refresh
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            const refreshResponse = await apiRequest('/api/auth/refresh', {
              method: 'POST',
              body: JSON.stringify({ refresh_token: refreshToken })
            });
            
            if (refreshResponse.success) {
              localStorage.setItem('access_token', refreshResponse.access_token);
              setToken(refreshResponse.access_token);
              
              // Retry user request with new token
              const userResponse = await apiRequest('/api/auth/user', {
                headers: {
                  'Authorization': `Bearer ${refreshResponse.access_token}`
                }
              });
              return userResponse.user;
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            setToken(null);
            throw refreshError;
          }
        }
        throw error;
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
        await apiRequest('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`
          }
        });
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