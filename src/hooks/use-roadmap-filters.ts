"use client"

import { useState, useMemo, useCallback } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import type { Item, ItemStatus, ZoomLevel, ViewType } from "@/types"

interface UseRoadmapFiltersOptions {
  items: Item[]
  initialZoom?: ZoomLevel
  initialView?: ViewType
}

interface UseRoadmapFiltersResult {
  // Filter state
  search: string
  setSearch: (value: string) => void
  statusFilters: ItemStatus[]
  setStatusFilters: (filters: ItemStatus[]) => void
  categoryFilters: string[]
  setCategoryFilters: (filters: string[]) => void

  // View state
  zoom: ZoomLevel
  setZoom: (level: ZoomLevel) => void
  viewType: ViewType
  setViewType: (type: ViewType) => void

  // Computed values
  filteredItems: Item[]
  availableCategories: string[]
  availableStatuses: ItemStatus[]

  // Helpers
  clearFilters: () => void
  hasActiveFilters: boolean
}

/**
 * Hook to manage roadmap filtering, search, and view state
 */
export function useRoadmapFilters({
  items,
  initialZoom = "standard",
  initialView = "list",
}: UseRoadmapFiltersOptions): UseRoadmapFiltersResult {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get initial values from URL
  const urlZoom = searchParams.get("zoom") as ZoomLevel | null
  const urlView = searchParams.get("view") as ViewType | null

  // Local state for filters
  const [search, setSearch] = useState("")
  const [statusFilters, setStatusFilters] = useState<ItemStatus[]>([])
  const [categoryFilters, setCategoryFilters] = useState<string[]>([])
  const [zoom, setZoomState] = useState<ZoomLevel>(urlZoom || initialZoom)
  const [viewType, setViewTypeState] = useState<ViewType>(urlView || initialView)

  // Update URL when zoom changes
  const setZoom = useCallback(
    (level: ZoomLevel) => {
      setZoomState(level)
      const params = new URLSearchParams(searchParams.toString())
      params.set("zoom", level)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  // Update URL when view type changes
  const setViewType = useCallback(
    (type: ViewType) => {
      setViewTypeState(type)
      const params = new URLSearchParams(searchParams.toString())
      params.set("view", type)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  // Extract available categories from items
  const availableCategories = useMemo(() => {
    const categories = new Set<string>()
    items.forEach((item) => {
      item.categories?.forEach((cat) => categories.add(cat))
    })
    return Array.from(categories).sort()
  }, [items])

  // Extract available statuses from items
  const availableStatuses = useMemo(() => {
    const statuses = new Set<ItemStatus>()
    items.forEach((item) => statuses.add(item.status))
    return Array.from(statuses)
  }, [items])

  // Filter items based on current filters
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesTitle = item.title.toLowerCase().includes(searchLower)
        const matchesDescription = item.description?.toLowerCase().includes(searchLower)
        if (!matchesTitle && !matchesDescription) {
          return false
        }
      }

      // Status filter
      if (statusFilters.length > 0 && !statusFilters.includes(item.status)) {
        return false
      }

      // Category filter
      if (categoryFilters.length > 0) {
        const itemCategories = item.categories || []
        const hasMatchingCategory = categoryFilters.some((cat) => itemCategories.includes(cat))
        if (!hasMatchingCategory) {
          return false
        }
      }

      return true
    })
  }, [items, search, statusFilters, categoryFilters])

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return search.length > 0 || statusFilters.length > 0 || categoryFilters.length > 0
  }, [search, statusFilters, categoryFilters])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearch("")
    setStatusFilters([])
    setCategoryFilters([])
  }, [])

  return {
    // Filter state
    search,
    setSearch,
    statusFilters,
    setStatusFilters,
    categoryFilters,
    setCategoryFilters,

    // View state
    zoom,
    setZoom,
    viewType,
    setViewType,

    // Computed values
    filteredItems,
    availableCategories,
    availableStatuses,

    // Helpers
    clearFilters,
    hasActiveFilters,
  }
}
