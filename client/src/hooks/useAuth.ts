import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    // Return null for 401 errors to show login page
    queryFn: async ({ queryKey }) => {
      const url = queryKey.join("/") as string;
      const fullUrl = url.startsWith('http') ? url : `http://localhost:8000${url}`;
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return null;
      }
      
      const res = await fetch(fullUrl, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
      });
      
      if (res.status === 401) {
        // Clear invalid token
        localStorage.removeItem('auth_token');
        return null;
      }
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      return await res.json();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
