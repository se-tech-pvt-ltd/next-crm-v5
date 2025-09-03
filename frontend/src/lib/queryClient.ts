import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { http } from "@/services/http";

async function throwIfErrorLike(res: { ok?: boolean; status?: number; json?: any }) {
  if (res && res.ok === false) {
    throw new Error(`${res.status}: Request failed`);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const data = await http.get<any>(queryKey[0] as string);
      return data as T;
    } catch (e: any) {
      if (unauthorizedBehavior === "returnNull" && e?.status === 401) {
        return null as any;
      }
      await throwIfErrorLike({ ok: false, status: e?.status });
      throw e;
    }
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
