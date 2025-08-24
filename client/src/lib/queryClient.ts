import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from '../components/auth-provider';

// Get API base URL from environment variable or default to current origin
function getApiBaseUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
  // Remove trailing slash to avoid double slashes
  const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  console.log('🌐 API Base URL:', baseUrl, 'from env:', import.meta.env.VITE_API_URL);
  return baseUrl;
}

// Get auth token from Supabase
async function getAuthToken(): Promise<string | null> {
  try {
    console.log('🔍 Debug - Environment variables:', {
      supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
      supabaseAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
    });
    
    // First try to get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('🔍 Debug - Session:', {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      hasRefreshToken: !!session?.refresh_token,
      tokenLength: session?.access_token?.length,
      sessionError: sessionError?.message,
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      isExpired: session?.expires_at ? Date.now() > session.expires_at * 1000 : null,
      userEmail: session?.user?.email
    });
    
    // If no session at all, user needs to log in
    if (!session) {
      console.log('❌ No session found - user needs to log in');
      console.log('💡 Redirecting to login...');
      window.location.href = '/login';
      return null;
    }
    
    // Check if token is expired or will expire soon (within 5 minutes)
    const isExpiredOrExpiringSoon = session?.expires_at && (Date.now() > (session.expires_at - 300) * 1000);
    
    if (!session.access_token || isExpiredOrExpiringSoon) {
      console.log('🔄 Token expired/expiring soon or missing, attempting refresh...');
      console.log('🔄 Refresh token available:', !!session.refresh_token);
      
      if (!session.refresh_token) {
        console.log('❌ No refresh token available - user needs to log in again');
        console.log('💡 Redirecting to login...');
        window.location.href = '/login';
        return null;
      }
      
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      console.log('🔄 Refresh result:', {
        hasRefreshedSession: !!refreshedSession,
        hasNewAccessToken: !!refreshedSession?.access_token,
        refreshError: refreshError?.message,
        newTokenLength: refreshedSession?.access_token?.length
      });
      
      if (refreshError) {
        console.error('❌ Token refresh failed:', refreshError.message);
        console.log('💡 Clearing local session and redirecting to login...');
        await supabase.auth.signOut();
        window.location.href = '/login';
        return null;
      }
      
      if (refreshedSession?.access_token) {
        console.log('✅ Token refreshed successfully');
        return refreshedSession.access_token;
      } else {
        console.log('❌ Refresh succeeded but no new token received');
        console.log('💡 Redirecting to login...');
        window.location.href = '/login';
        return null;
      }
    }
    
    console.log('✅ Using existing valid token');
    return session.access_token;
  } catch (error) {
    console.error('❌ Error getting auth token:', error);
    console.log('💡 Clearing session and redirecting to login...');
    await supabase.auth.signOut();
    window.location.href = '/login';
    return null;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // If it's a 401 error, log additional debug info
    if (res.status === 401) {
      console.error('🚫 Authentication failed:', {
        status: res.status,
        statusText: res.statusText,
        response: text,
        url: res.url
      });
      
      // You might want to redirect to login or show a re-auth modal here
      // For now, just log the error
      console.log('💡 Suggestion: User may need to log in again');
    }
    
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // If URL starts with /, prepend the API base URL
  const fullUrl = url.startsWith('/') ? `${getApiBaseUrl()}${url}` : url;
  
  // Get auth token
  const token = await getAuthToken();
  
  console.log('🔍 Debug - API Request:', {
    url: fullUrl,
    method,
    hasToken: !!token,
    tokenLength: token?.length
  });
  
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log('🔍 Debug - Added Authorization header');
  } else {
    console.log('🔍 Debug - No token available, skipping Authorization header');
  }
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    // If URL starts with /, prepend the API base URL
    const fullUrl = url.startsWith('/') ? `${getApiBaseUrl()}${url}` : url;
    
    // Get auth token
    const token = await getAuthToken();
    
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const res = await fetch(fullUrl, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds instead of Infinity
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
