"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ZoomToggle } from "./zoom-toggle"
import { ItemCard } from "./item-card"
import { ItemDetailDrawer } from "./item-detail-drawer"
import { FilterBar } from "./filter-bar"
import { RoadmapBoard } from "./roadmap-board"
import { RoadmapTimeline } from "./roadmap-timeline"
import { ChangelogFeed } from "./changelog-feed"
import { ThemeStudio } from "./theme-studio"
import { ZoomLevel } from "@/types"

interface RoadmapViewProps {
    items: {
        id: string
        title: string
        status: string
        confidence: string
        votes: number
        groupId?: string
        description?: string
        featured: boolean
    }[]
    groups?: {
        id: string
        name: string
    }[]
}

export function RoadmapView({ items, groups = [] }: RoadmapViewProps) {
    const searchParams = useSearchParams()
    const initialZoom = (searchParams.get('zoom') as ZoomLevel) || 'standard'
    const [zoom, setZoom] = useState<ZoomLevel>(initialZoom)

    useEffect(() => {
        const z = searchParams.get('zoom') as ZoomLevel
        if (z && ['snapshot', 'standard', 'deep'].includes(z)) {
            setZoom(z)
        }
    }, [searchParams])

    // Filter state
    const [search, setSearch] = useState("")
    const [statusFilters, setStatusFilters] = useState<string[]>([])
    const [categoryFilters, setCategoryFilters] = useState<string[]>([])

    // Filter logic based on zoom and local filters
    let displayItems = items.filter(item => {
        // Status filter
        if (statusFilters.length > 0 && !statusFilters.includes(item.status)) return false
        // Search filter
        if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false
        // Category filter
        if (categoryFilters.length > 0 && (!item.groupId || !categoryFilters.includes(item.groupId))) return false
        return true
    })

    if (zoom === 'snapshot') {
        // In snapshot, show only featured or top items
        displayItems = displayItems.filter(i => i.featured).slice(0, 20)
        // If no featured, show first 4
        if (displayItems.length === 0) displayItems = items.slice(0, 4)
    }

    // Drawer state
    const [selectedItem, setSelectedItem] = useState<any>(null)

    // View Type State
    const [viewType, setViewType] = useState<'list' | 'board' | 'timeline' | 'changelog'>('list')

    // Sort items if list view?
    // Maintain existing filter logic

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-2 rounded-lg border shadow-sm sticky top-2 z-10 w-full overflow-x-auto">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <span className="text-sm font-medium pl-2 hidden sm:inline text-nowrap">View Controls</span>
                    <ZoomToggle value={zoom} onChange={setZoom} />
                    <div className="flex items-center bg-muted/50 rounded-lg p-1 overflow-x-auto">
                        <Button
                            variant={viewType === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setViewType('list')}
                        >
                            List
                        </Button>
                        <Button
                            variant={viewType === 'board' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setViewType('board')}
                        >
                            Board
                        </Button>
                        <Button
                            variant={viewType === 'timeline' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setViewType('timeline')}
                        >
                            Timeline
                        </Button>
                        <Button
                            variant={viewType === 'changelog' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setViewType('changelog')}
                        >
                            Changelog
                        </Button>
                    </div>
                </div>
                <div className="w-full sm:w-auto min-w-[200px]">
                    <FilterBar
                        onSearchChange={setSearch}
                        onStatusFilterChange={setStatusFilters}
                        onCategoryFilterChange={setCategoryFilters}
                        selectedStatuses={statusFilters}
                        selectedCategories={categoryFilters}
                        groups={groups}
                    />
                </div>
            </div>

            {viewType === 'board' ? (
                <RoadmapBoard items={displayItems} onItemClick={setSelectedItem} />
            ) : viewType === 'timeline' ? (
                <RoadmapTimeline items={displayItems} onItemClick={setSelectedItem} />
            ) : viewType === 'changelog' ? (
                <ChangelogFeed items={items} onItemClick={setSelectedItem} />
                /* Note: ChangelogFeed manages its own filtering (SHIPPED only), but we pass raw items to it */
            ) : (
                <div className={`grid gap-4 ${zoom === 'snapshot' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
                    {displayItems.length === 0 && (
                        <div className="col-span-full text-center py-20 text-muted-foreground bg-muted/20 rounded-lg">
                            No items found for this view.
                        </div>
                    )}
                    {displayItems.map(item => (
                        <div key={item.id} onClick={() => setSelectedItem(item)} className="cursor-pointer transition-transform hover:scale-[1.01]">
                            <ItemCard
                                {...item}
                                // Cast string status to union type safely
                                status={item.status as any}
                                confidence={item.confidence as any}
                                zoom={zoom}
                                description={zoom !== 'snapshot' ? item.description : undefined}
                            />
                        </div>
                    ))}
                </div>
            )}

            <ItemDetailDrawer
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                item={selectedItem}
            />

            {zoom === 'deep' && viewType === 'list' && (
                <div className="p-4 bg-muted/50 text-center text-sm rounded-md">
                    Showing all hidden items (Deep view active)
                </div>
            )}

            <ThemeStudio />
        </div>
    )
}
