import { getCurrentUserQueryFn } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

// Legacy compatible hook name; now just queries /api/auth/me using cookies
const useAuth = () => {
  const query = useQuery({
    queryKey: ["authUser"],
    queryFn: getCurrentUserQueryFn,
    staleTime: 5 * 60_000, // 5 minutes
    refetchInterval: 10 * 60_000, // 10 minutes instead of 5
    refetchOnWindowFocus: false, // Disable refetch on window focus to prevent loop
    retry: (failureCount, error) => {
      const authCookieName = process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || 'auth_active';
      const authTokenCookieName = process.env.NEXT_PUBLIC_AUTH_TOKEN_COOKIE_NAME || 'auth_token';
      const hasAuthCookie = typeof window !== 'undefined' && (
        document.cookie.includes(`${authCookieName}=true`) ||
        document.cookie.includes(`${authTokenCookieName}=`) ||
        document.cookie.includes('auth_status=success')
      );
      const axiosError = error as { response?: { status: number } };
      if (axiosError?.response?.status === 401) {
        return hasAuthCookie && failureCount < 2;
      }
      return failureCount < 2;
    },
    throwOnError: false,
  });
/*   console.log('[useAuth] Query state:', {
    data: query.data,
    error: query.error,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    cookies: typeof window !== 'undefined' ? document.cookie : 'server-side'
  }); */

  return query;
};

export default useAuth;
