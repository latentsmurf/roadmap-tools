"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-client"
import type { Roadmap, Item, Group } from "@/types"

/**
 * Fetch roadmap data from the API
 */
async function fetchRoadmap(slug: string): Promise<{
  roadmap: Roadmap
  items: Item[]
  groups: Group[]
}> {
  const response = await fetch(`/api/v1/roadmaps/${slug}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch roadmap: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Hook to fetch a roadmap by slug with items and groups
 */
export function useRoadmap(slug: string) {
  return useQuery({
    queryKey: queryKeys.roadmaps.detail(slug),
    queryFn: () => fetchRoadmap(slug),
    enabled: !!slug,
  })
}

/**
 * Hook to access just the roadmap data
 */
export function useRoadmapData(slug: string) {
  const { data, ...rest } = useRoadmap(slug)
  return {
    roadmap: data?.roadmap,
    ...rest,
  }
}

/**
 * Hook to access items from a roadmap
 */
export function useRoadmapItems(slug: string) {
  const { data, ...rest } = useRoadmap(slug)
  return {
    items: data?.items ?? [],
    ...rest,
  }
}

/**
 * Hook to access groups from a roadmap
 */
export function useRoadmapGroups(slug: string) {
  const { data, ...rest } = useRoadmap(slug)
  return {
    groups: data?.groups ?? [],
    ...rest,
  }
}

/**
 * Vote mutation with optimistic update
 */
export function useVoteMutation(slug: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch("/api/v1/items/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      })

      if (!response.ok) {
        throw new Error("Failed to vote")
      }

      return response.json()
    },
    // Optimistic update
    onMutate: async (itemId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.roadmaps.detail(slug),
      })

      // Snapshot previous value
      const previousData = queryClient.getQueryData<{
        roadmap: Roadmap
        items: Item[]
        groups: Group[]
      }>(queryKeys.roadmaps.detail(slug))

      // Optimistically update
      if (previousData) {
        queryClient.setQueryData(queryKeys.roadmaps.detail(slug), {
          ...previousData,
          items: previousData.items.map((item) =>
            item.id === itemId ? { ...item, votes: item.votes + 1 } : item
          ),
        })
      }

      return { previousData }
    },
    // Rollback on error
    onError: (_err, _itemId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.roadmaps.detail(slug), context.previousData)
      }
    },
    // Refetch after mutation
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.roadmaps.detail(slug),
      })
    },
  })
}

/**
 * Subscribe to item mutation
 */
export function useSubscribeMutation(slug: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ itemId, email }: { itemId: string; email: string }) => {
      const response = await fetch("/api/v1/items/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, email }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to subscribe")
      }

      return response.json()
    },
    onSuccess: () => {
      // Could show a toast notification here
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.roadmaps.detail(slug),
      })
    },
  })
}
