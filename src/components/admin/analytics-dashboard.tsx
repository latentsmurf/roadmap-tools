"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Users, ThumbsUp, Bell, TrendingUp, Eye, Loader2 } from "lucide-react"
import type { DashboardSummary, RoadmapStats, ItemStats, ActivityItem } from "@/lib/analytics"

interface AnalyticsDashboardProps {
  workspaceId?: string
}

export function AnalyticsDashboard({ workspaceId = "default" }: AnalyticsDashboardProps) {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true)
        const response = await fetch(`/api/v1/analytics?workspaceId=${workspaceId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch analytics")
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [workspaceId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-12 text-destructive">
        <p>Error loading analytics: {error}</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Roadmaps"
          value={data.totalRoadmaps}
          icon={BarChart3}
          description="Active roadmaps"
        />
        <StatCard
          title="Total Items"
          value={data.totalItems}
          icon={TrendingUp}
          description="Features & updates"
        />
        <StatCard
          title="Total Votes"
          value={data.totalVotes}
          icon={ThumbsUp}
          description="User engagement"
        />
        <StatCard
          title="Subscribers"
          value={data.totalSubscribers}
          icon={Bell}
          description="Email subscribers"
        />
      </div>

      {/* Top Roadmaps & Items */}
      <div className="grid gap-6 md:grid-cols-2">
        <TopRoadmapsCard roadmaps={data.topRoadmaps} />
        <TopItemsCard items={data.topItems} />
      </div>

      {/* Recent Activity */}
      <RecentActivityCard activity={data.recentActivity} />
    </div>
  )
}

// Stat Card Component
interface StatCardProps {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  description: string
}

function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

// Top Roadmaps Card
interface TopRoadmapsCardProps {
  roadmaps: RoadmapStats[]
}

function TopRoadmapsCard({ roadmaps }: TopRoadmapsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Roadmaps</CardTitle>
        <CardDescription>Most viewed roadmaps</CardDescription>
      </CardHeader>
      <CardContent>
        {roadmaps.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No roadmaps yet</p>
        ) : (
          <div className="space-y-4">
            {roadmaps.map((roadmap, index) => (
              <div key={roadmap.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-4">
                    {index + 1}.
                  </span>
                  <div>
                    <p className="font-medium">{roadmap.title}</p>
                    <p className="text-xs text-muted-foreground">
                      /{roadmap.slug} • {roadmap.itemCount} items
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    {roadmap.views}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <ThumbsUp className="h-3 w-3" />
                    {roadmap.votes}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Top Items Card
interface TopItemsCardProps {
  items: ItemStats[]
}

function TopItemsCard({ items }: TopItemsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Items</CardTitle>
        <CardDescription>Most voted features</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No items yet</p>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-4">
                    {index + 1}.
                  </span>
                  <p className="font-medium truncate max-w-[200px]">{item.title}</p>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  {item.votes}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Recent Activity Card
interface RecentActivityCardProps {
  activity: ActivityItem[]
}

function RecentActivityCard({ activity }: RecentActivityCardProps) {
  const activityIcons = {
    vote: ThumbsUp,
    subscribe: Bell,
    item_created: TrendingUp,
    roadmap_created: BarChart3,
  }

  const activityLabels = {
    vote: "voted on",
    subscribe: "subscribed to",
    item_created: "created",
    roadmap_created: "created roadmap",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest user interactions</CardDescription>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {activity.map((item) => {
              const Icon = activityIcons[item.type] || Users
              const label = activityLabels[item.type] || item.type

              return (
                <div key={item.id} className="flex items-center gap-4 text-sm">
                  <div className="p-2 bg-muted rounded-full">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">
                      <span className="text-muted-foreground">Someone</span> <span>{label}</span>{" "}
                      <span className="font-medium">{item.resourceTitle}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(item.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
  }
  if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  }
  if (diffMins > 0) {
    return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
  }
  return "Just now"
}
