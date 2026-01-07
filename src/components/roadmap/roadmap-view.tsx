"use client"

import { useState, useMemo, useCallback } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { ZoomToggle } from "./zoom-toggle"
import { ItemCard } from "./item-card"
import { ItemDetailDrawer } from "./item-detail-drawer"
import { FilterBar } from "./filter-bar"
import { RoadmapBoard } from "./roadmap-board"
import { RoadmapTimeline } from "./roadmap-timeline"
import { ChangelogFeed } from "./changelog-feed"
import { ThemeStudio } from "./theme-studio"
import { ViewTypeSelector } from "./view-type-selector"
import type { ZoomLevel, ViewType } from "@/types"

interface RoadmapItem {
  id: string
  title: string
  status: string
  confidence: string
  votes: number
  groupId?: string
  description?: string
  featured: boolean
}

interface RoadmapGroup {
  id: string
  name: string
}

interface RoadmapViewProps {
  items: RoadmapItem[]
  groups?: RoadmapGroup[]
}

/**
 * Hook to manage roadmap view state and filtering
 */
function useRoadmapViewState(items: RoadmapItem[]) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get initial values from URL
  const urlZoom = searchParams.get("zoom") as ZoomLevel | null
  const urlView = searchParams.get("view") as ViewType | null

  // View state
  const [zoom, setZoomState] = useState<ZoomLevel>(urlZoom || "standard")
  const [viewType, setViewTypeState] = useState<ViewType>(urlView || "list")

  // Filter state
  const [search, setSearch] = useState("")
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [categoryFilters, setCategoryFilters] = useState<string[]>([])

  // URL sync for zoom
  const setZoom = useCallback(
    (level: ZoomLevel) => {
      setZoomState(level)
      const params = new URLSearchParams(searchParams.toString())
      params.set("zoom", level)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  // URL sync for view type
  const setViewType = useCallback(
    (type: ViewType) => {
      setViewTypeState(type)
      const params = new URLSearchParams(searchParams.toString())
      params.set("view", type)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  // Filter items
  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      // Status filter
      if (statusFilters.length > 0 && !statusFilters.includes(item.status)) {
        return false
      }
      // Search filter
      if (search && !item.title.toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      // Category filter (by groupId)
      if (
        categoryFilters.length > 0 &&
        (!item.groupId || !categoryFilters.includes(item.groupId))
      ) {
        return false
      }
      return true
    })

    // Snapshot view shows only featured items
    if (zoom === "snapshot") {
      const featured = result.filter((i) => i.featured).slice(0, 20)
      result = featured.length > 0 ? featured : items.slice(0, 4)
    }

    return result
  }, [items, statusFilters, search, categoryFilters, zoom])

  return {
    zoom,
    setZoom,
    viewType,
    setViewType,
    search,
    setSearch,
    statusFilters,
    setStatusFilters,
    categoryFilters,
    setCategoryFilters,
    filteredItems,
  }
}

export function RoadmapView({ items, groups = [] }: RoadmapViewProps) {
  const {
    zoom,
    setZoom,
    viewType,
    setViewType,
    setSearch,
    statusFilters,
    setStatusFilters,
    categoryFilters,
    setCategoryFilters,
    filteredItems,
  } = useRoadmapViewState(items)

  // Drawer state for item details
  const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null)

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <RoadmapControlBar
        zoom={zoom}
        onZoomChange={setZoom}
        viewType={viewType}
        onViewTypeChange={setViewType}
        statusFilters={statusFilters}
        onStatusFilterChange={setStatusFilters}
        categoryFilters={categoryFilters}
        onCategoryFilterChange={setCategoryFilters}
        onSearchChange={setSearch}
        groups={groups}
      />

      {/* Content Views */}
      <RoadmapContent
        viewType={viewType}
        zoom={zoom}
        items={filteredItems}
        allItems={items}
        onItemClick={setSelectedItem}
      />

      {/* Item Detail Drawer */}
      <ItemDetailDrawer
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
      />

      {/* Deep View Indicator */}
      {zoom === "deep" && viewType === "list" && (
        <div className="p-4 bg-muted/50 text-center text-sm rounded-md">
          Showing all hidden items (Deep view active)
        </div>
      )}

      {/* Theme Customization */}
      <ThemeStudio />
    </div>
  )
}

// === Sub-components ===

interface RoadmapControlBarProps {
  zoom: ZoomLevel
  onZoomChange: (zoom: ZoomLevel) => void
  viewType: ViewType
  onViewTypeChange: (type: ViewType) => void
  statusFilters: string[]
  onStatusFilterChange: (filters: string[]) => void
  categoryFilters: string[]
  onCategoryFilterChange: (filters: string[]) => void
  onSearchChange: (search: string) => void
  groups: RoadmapGroup[]
}

function RoadmapControlBar({
  zoom,
  onZoomChange,
  viewType,
  onViewTypeChange,
  statusFilters,
  onStatusFilterChange,
  categoryFilters,
  onCategoryFilterChange,
  onSearchChange,
  groups,
}: RoadmapControlBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-2 rounded-lg border shadow-sm sticky top-2 z-10 w-full overflow-x-auto">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <span className="text-sm font-medium pl-2 hidden sm:inline text-nowrap">View Controls</span>
        <ZoomToggle value={zoom} onChange={onZoomChange} />
        <ViewTypeSelector value={viewType} onChange={onViewTypeChange} />
      </div>
      <div className="w-full sm:w-auto min-w-[200px]">
        <FilterBar
          onSearchChange={onSearchChange}
          onStatusFilterChange={onStatusFilterChange}
          onCategoryFilterChange={onCategoryFilterChange}
          selectedStatuses={statusFilters}
          selectedCategories={categoryFilters}
          groups={groups}
        />
      </div>
    </div>
  )
}

interface RoadmapContentProps {
  viewType: ViewType
  zoom: ZoomLevel
  items: RoadmapItem[]
  allItems: RoadmapItem[]
  onItemClick: (item: RoadmapItem) => void
}

function RoadmapContent({ viewType, zoom, items, allItems, onItemClick }: RoadmapContentProps) {
  if (viewType === "board") {
    return <RoadmapBoard items={items} onItemClick={onItemClick} />
  }

  if (viewType === "timeline") {
    return <RoadmapTimeline items={items} onItemClick={onItemClick} />
  }

  if (viewType === "changelog") {
    // ChangelogFeed manages its own filtering (SHIPPED only)
    return <ChangelogFeed items={allItems} onItemClick={onItemClick} />
  }

  // List view (default)
  return <RoadmapListView items={items} zoom={zoom} onItemClick={onItemClick} />
}

interface RoadmapListViewProps {
  items: RoadmapItem[]
  zoom: ZoomLevel
  onItemClick: (item: RoadmapItem) => void
}

function RoadmapListView({ items, zoom, onItemClick }: RoadmapListViewProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-lg">
        No items found for this view.
      </div>
    )
  }

  const gridClass =
    zoom === "snapshot" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3"

  return (
    <div className={`grid gap-4 ${gridClass}`}>
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onItemClick(item)}
          className="cursor-pointer transition-transform hover:scale-[1.01]"
        >
          <ItemCard
            {...item}
            // Cast to ItemCard's expected types (subset of global types)
            status={item.status as "EXPLORING" | "BUILDING" | "TESTING" | "SHIPPED"}
            confidence={item.confidence as "TENTATIVE" | "LIKELY" | "CONFIDENT" | undefined}
            zoom={zoom}
            description={zoom !== "snapshot" ? item.description : undefined}
          />
        </div>
      ))}
    </div>
  )
}
