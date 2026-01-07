"use client"

import { ItemCard } from "./item-card"

interface RoadmapItem {
  id: string
  title: string
  status: string
  confidence: string
  votes: number
  description?: string
  featured: boolean
  groupId?: string
  group?: string
}

interface RoadmapTimelineProps {
  items: RoadmapItem[]
  onItemClick: (item: RoadmapItem) => void
}

const TIMEFRAMES = [
  { id: "now", label: "Now (Q4 2025)" },
  { id: "next", label: "Next (Q1 2026)" },
  { id: "later", label: "Later (2026+)" },
]

export function RoadmapTimeline({ items, onItemClick }: RoadmapTimelineProps) {
  // For MVP, if items don't have a 'group' property, we randomly assign or just put them in "Now"
  // But wait, our API payload has 'group' mapped from... nowhere currently?
  // Let's rely on status mapping for now to simulate timeframe if group is missing
  // Exploring -> Later, Building -> Next, Testing -> Now? Or just use status.

  // Better: status mapping
  // Building/Testing -> Now
  // Exploring -> Next
  // (Everything else) -> Later

  const getGroup = (item: RoadmapItem) => {
    if (item.group) return item.group // If real group exists
    const s = item.status
    if (s === "TESTING" || s === "BUILDING") return "now"
    if (s === "EXPLORING") return "next"
    return "later"
  }

  return (
    <div className="space-y-8">
      {TIMEFRAMES.map((tf) => {
        const groupItems = items.filter((i) => getGroup(i) === tf.id && i.status !== "SHIPPED")

        if (groupItems.length === 0) return null

        return (
          <div key={tf.id} className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="w-2 h-8 bg-primary rounded-full inline-block" />
              {tf.label}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="cursor-pointer transition-transform hover:scale-[1.01]"
                >
                  <ItemCard
                    title={item.title}
                    description={item.description}
                    status={item.status as "EXPLORING" | "BUILDING" | "TESTING" | "SHIPPED"}
                    confidence={item.confidence as "TENTATIVE" | "LIKELY" | "CONFIDENT" | undefined}
                    votes={item.votes}
                    zoom="standard"
                  />
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Fallback if all items are shipped/cancelled */}
      {items.every((i) => i.status === "SHIPPED") && (
        <div className="text-center py-10 text-muted-foreground">
          All active initiatives have been shipped! See the Changelog.
        </div>
      )}
    </div>
  )
}
