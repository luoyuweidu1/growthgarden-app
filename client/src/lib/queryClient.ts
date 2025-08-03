import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Get API base URL from environment variable or default to current origin
function getApiBaseUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
  // Remove trailing slash to avoid double slashes
  return apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
}

// Get auth token from Supabase
async function getAuthToken(): Promise<string | null> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('🔍 Debug - Environment variables:', {
      supabaseUrl: !!supabaseUrl,
      supabaseAnonKey: !!supabaseAnonKey
    });
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase environment variables not found');
      return null;
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { session } } = await supabase.auth.getSession();
    
    console.log('🔍 Debug - Session:', {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      tokenLength: session?.access_token?.length
    });
    
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
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
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
