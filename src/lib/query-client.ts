import { QueryClient } from "@tanstack/react-query"

/**
 * Create a new QueryClient with default options
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Cache data for 30 minutes
        gcTime: 30 * 60 * 1000,
        // Retry failed requests 3 times with exponential backoff
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus in production only
        refetchOnWindowFocus: process.env.NODE_ENV === "production",
        // Don't refetch on reconnect by default
        refetchOnReconnect: false,
      },
      mutations: {
        // Retry mutations once
        retry: 1,
      },
    },
  })
}

// Query keys factory for consistent key management
export const queryKeys = {
  // Roadmap keys
  roadmaps: {
    all: ["roadmaps"] as const,
    lists: () => [...queryKeys.roadmaps.all, "list"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.roadmaps.lists(), filters] as const,
    details: () => [...queryKeys.roadmaps.all, "detail"] as const,
    detail: (slug: string) => [...queryKeys.roadmaps.details(), slug] as const,
    byWorkspace: (workspaceId: string) =>
      [...queryKeys.roadmaps.all, "workspace", workspaceId] as const,
  },

  // Item keys
  items: {
    all: ["items"] as const,
    lists: () => [...queryKeys.items.all, "list"] as const,
    list: (roadmapId: string, filters?: Record<string, unknown>) =>
      [...queryKeys.items.lists(), roadmapId, filters] as const,
    details: () => [...queryKeys.items.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.items.details(), id] as const,
    byStatus: (roadmapId: string, status: string) =>
      [...queryKeys.items.all, roadmapId, "status", status] as const,
  },

  // Group keys
  groups: {
    all: ["groups"] as const,
    list: (roadmapId: string) => [...queryKeys.groups.all, "list", roadmapId] as const,
  },
}
