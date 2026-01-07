"use client"

import { ItemCard } from "./item-card"
import { format } from "date-fns"

interface ChangelogItem {
  id: string
  title: string
  status: string
  confidence: string
  votes: number
  description?: string
  featured: boolean
  groupId?: string
  updatedAt?: string
}

interface ChangelogFeedProps {
  items: ChangelogItem[]
  onItemClick: (item: ChangelogItem) => void
}

export function ChangelogFeed({ items, onItemClick }: ChangelogFeedProps) {
  // Filter for SHIPPED items
  const shippedItems = items.filter((i) => i.status === "SHIPPED")

  if (shippedItems.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-lg">
        No value has been shipped yet. Check back soon!
      </div>
    )
  }

  // Sort by updatedAt desc (simulated by mocked mock dates if real data missing, but we assume items have date)
  const sortedItems = [...shippedItems].sort((a, b) => {
    // Fallback timestamps for MVP if real ones aren't available on client yet
    const dateA = a.updatedAt || new Date().toISOString()
    const dateB = b.updatedAt || new Date().toISOString()
    return new Date(dateB).getTime() - new Date(dateA).getTime()
  })

  return (
    <div className="max-w-3xl mx-auto space-y-8 relative pl-6 border-l-2 border-muted">
      {sortedItems.map((item) => (
        <div key={item.id} className="relative mb-10">
          {/* Timeline dot */}
          <div className="absolute -left-[31px] top-6 w-4 h-4 rounded-full bg-primary border-4 border-background" />

          <div className="text-sm text-muted-foreground mb-2 font-mono">
            {format(new Date(item.updatedAt || new Date()), "MMMM d, yyyy")}
          </div>

          <div
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
              hideStatus // Already known as Shipped
            />
          </div>
        </div>
      ))}
    </div>
  )
}
