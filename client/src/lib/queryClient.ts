import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { ApiError } from "./api-error";

/**
 * Checks if response is OK and throws ApiError if not
 */
async function throwIfResNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    let errorData: unknown = res.statusText;

    try {
      const text = await res.text();
      if (text) {
        try {
          // Try to parse as JSON
          errorData = JSON.parse(text);
        } catch {
          // If not JSON, use text as is
          errorData = text;
        }
      }
    } catch {
      // If we can't read the body, use statusText
      errorData = res.statusText;
    }

    throw new ApiError(res.status, errorData);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: { on401: UnauthorizedBehavior }) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
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
      // Cache data for 5 minutes to improve perceived performance
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Keep cached data for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
