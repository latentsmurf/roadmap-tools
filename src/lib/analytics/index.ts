import { FieldValue } from "firebase-admin/firestore"
import { adminDb } from "@/lib/firebase-admin"
import { logger } from "@/lib/logger"

/**
 * Analytics event types
 */
export type AnalyticsEvent =
  | "page_view"
  | "roadmap_view"
  | "item_view"
  | "item_vote"
  | "item_subscribe"
  | "filter_applied"
  | "view_changed"
  | "zoom_changed"
  | "search_performed"

/**
 * Analytics event data
 */
export interface AnalyticsEventData {
  event: AnalyticsEvent
  roadmapId?: string
  itemId?: string
  workspaceId?: string
  userId?: string
  sessionId?: string
  metadata?: Record<string, unknown>
  timestamp?: Date
}

/**
 * Aggregated metrics for a roadmap
 */
export interface RoadmapMetrics {
  roadmapId: string
  views: number
  uniqueVisitors: number
  totalVotes: number
  totalSubscribers: number
  itemViews: Record<string, number>
  periodStart: Date
  periodEnd: Date
}

/**
 * Dashboard summary data
 */
export interface DashboardSummary {
  totalRoadmaps: number
  totalItems: number
  totalVotes: number
  totalSubscribers: number
  recentActivity: ActivityItem[]
  topRoadmaps: RoadmapStats[]
  topItems: ItemStats[]
}

/**
 * Activity item for recent activity feed
 */
export interface ActivityItem {
  id: string
  type: "vote" | "subscribe" | "item_created" | "roadmap_created"
  resourceId: string
  resourceTitle: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

/**
 * Roadmap statistics
 */
export interface RoadmapStats {
  id: string
  title: string
  slug: string
  views: number
  votes: number
  itemCount: number
}

/**
 * Item statistics
 */
export interface ItemStats {
  id: string
  title: string
  roadmapId: string
  votes: number
  views: number
}

/**
 * Analytics service for tracking and querying metrics
 */
class AnalyticsService {
  private eventsCollection = "analytics_events"
  private metricsCollection = "analytics_metrics"

  /**
   * Track an analytics event
   */
  async trackEvent(data: AnalyticsEventData): Promise<void> {
    try {
      const docRef = adminDb.collection(this.eventsCollection).doc()

      await docRef.set({
        ...data,
        timestamp: data.timestamp || FieldValue.serverTimestamp(),
      })
    } catch (error) {
      // Don't throw - analytics should not break the main flow
      logger.error("Failed to track analytics event", error as Error, {
        event: data.event,
      })
    }
  }

  /**
   * Track a page view
   */
  async trackPageView(roadmapId: string, sessionId?: string, userId?: string): Promise<void> {
    await this.trackEvent({
      event: "roadmap_view",
      roadmapId,
      sessionId,
      userId,
    })
  }

  /**
   * Track an item view
   */
  async trackItemView(
    itemId: string,
    roadmapId: string,
    sessionId?: string,
    userId?: string
  ): Promise<void> {
    await this.trackEvent({
      event: "item_view",
      itemId,
      roadmapId,
      sessionId,
      userId,
    })
  }

  /**
   * Track a vote
   */
  async trackVote(
    itemId: string,
    roadmapId: string,
    sessionId?: string,
    userId?: string
  ): Promise<void> {
    await this.trackEvent({
      event: "item_vote",
      itemId,
      roadmapId,
      sessionId,
      userId,
    })
  }

  /**
   * Get dashboard summary for a workspace
   */
  async getDashboardSummary(workspaceId: string): Promise<DashboardSummary> {
    try {
      // Get roadmap counts
      const roadmapsSnap = await adminDb
        .collection("roadmaps")
        .where("workspaceId", "==", workspaceId)
        .get()

      const roadmapIds = roadmapsSnap.docs.map((d) => d.id)
      const totalRoadmaps = roadmapsSnap.size

      // Get item counts and votes
      let totalItems = 0
      let totalVotes = 0
      const itemsPromises = roadmapIds.map(async (roadmapId) => {
        const itemsSnap = await adminDb
          .collection("items")
          .where("roadmapId", "==", roadmapId)
          .get()

        const items = itemsSnap.docs.map((d) => d.data())
        totalItems += items.length
        totalVotes += items.reduce((sum, item) => sum + (item.votes || 0), 0)

        return items
      })

      await Promise.all(itemsPromises)

      // Get subscriber count (approximate via events)
      const subscriberSnap = await adminDb
        .collection(this.eventsCollection)
        .where("event", "==", "item_subscribe")
        .where("workspaceId", "==", workspaceId)
        .count()
        .get()

      const totalSubscribers = subscriberSnap.data().count

      // Get recent activity
      const recentActivity = await this.getRecentActivity(workspaceId, 10)

      // Get top roadmaps
      const topRoadmaps = await this.getTopRoadmaps(workspaceId, 5)

      // Get top items
      const topItems = await this.getTopItems(workspaceId, 5)

      return {
        totalRoadmaps,
        totalItems,
        totalVotes,
        totalSubscribers,
        recentActivity,
        topRoadmaps,
        topItems,
      }
    } catch (error) {
      logger.error("Error getting dashboard summary", error as Error, {
        workspaceId,
      })
      return {
        totalRoadmaps: 0,
        totalItems: 0,
        totalVotes: 0,
        totalSubscribers: 0,
        recentActivity: [],
        topRoadmaps: [],
        topItems: [],
      }
    }
  }

  /**
   * Get recent activity for a workspace
   */
  async getRecentActivity(workspaceId: string, limit = 20): Promise<ActivityItem[]> {
    try {
      const snapshot = await adminDb
        .collection(this.eventsCollection)
        .where("workspaceId", "==", workspaceId)
        .orderBy("timestamp", "desc")
        .limit(limit)
        .get()

      return snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          type: this.eventToActivityType(data.event),
          resourceId: data.itemId || data.roadmapId || "",
          resourceTitle: data.metadata?.title || "Unknown",
          timestamp: data.timestamp?.toDate() || new Date(),
          metadata: data.metadata,
        }
      })
    } catch (error) {
      logger.error("Error getting recent activity", error as Error, {
        workspaceId,
      })
      return []
    }
  }

  /**
   * Get top roadmaps by views
   */
  async getTopRoadmaps(workspaceId: string, limit = 5): Promise<RoadmapStats[]> {
    try {
      // Get roadmaps for this workspace
      const roadmapsSnap = await adminDb
        .collection("roadmaps")
        .where("workspaceId", "==", workspaceId)
        .get()

      const roadmapStats: RoadmapStats[] = await Promise.all(
        roadmapsSnap.docs.map(async (doc) => {
          const data = doc.data()

          // Count views from analytics
          const viewsSnap = await adminDb
            .collection(this.eventsCollection)
            .where("roadmapId", "==", doc.id)
            .where("event", "==", "roadmap_view")
            .count()
            .get()

          // Count total votes from items
          const itemsSnap = await adminDb.collection("items").where("roadmapId", "==", doc.id).get()

          const votes = itemsSnap.docs.reduce((sum, item) => sum + (item.data().votes || 0), 0)

          return {
            id: doc.id,
            title: data.title,
            slug: data.slug,
            views: viewsSnap.data().count,
            votes,
            itemCount: itemsSnap.size,
          }
        })
      )

      // Sort by views and return top N
      return roadmapStats.sort((a, b) => b.views - a.views).slice(0, limit)
    } catch (error) {
      logger.error("Error getting top roadmaps", error as Error, {
        workspaceId,
      })
      return []
    }
  }

  /**
   * Get top items by votes
   */
  async getTopItems(workspaceId: string, limit = 5): Promise<ItemStats[]> {
    try {
      // Get roadmap IDs for this workspace
      const roadmapsSnap = await adminDb
        .collection("roadmaps")
        .where("workspaceId", "==", workspaceId)
        .get()

      const roadmapIds = roadmapsSnap.docs.map((d) => d.id)

      if (roadmapIds.length === 0) {
        return []
      }

      // Get all items for these roadmaps, sorted by votes
      const itemsSnap = await adminDb
        .collection("items")
        .where("roadmapId", "in", roadmapIds.slice(0, 10)) // Firestore limits 'in' to 10
        .orderBy("votes", "desc")
        .limit(limit)
        .get()

      return itemsSnap.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          title: data.title,
          roadmapId: data.roadmapId,
          votes: data.votes || 0,
          views: 0, // Would need to aggregate from events
        }
      })
    } catch (error) {
      logger.error("Error getting top items", error as Error, { workspaceId })
      return []
    }
  }

  /**
   * Get roadmap metrics for a time period
   */
  async getRoadmapMetrics(
    roadmapId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RoadmapMetrics> {
    try {
      // Get view events
      const viewsSnap = await adminDb
        .collection(this.eventsCollection)
        .where("roadmapId", "==", roadmapId)
        .where("event", "==", "roadmap_view")
        .where("timestamp", ">=", startDate)
        .where("timestamp", "<=", endDate)
        .get()

      // Count unique visitors by sessionId
      const uniqueSessions = new Set(viewsSnap.docs.map((d) => d.data().sessionId).filter(Boolean))

      // Get vote events
      const votesSnap = await adminDb
        .collection(this.eventsCollection)
        .where("roadmapId", "==", roadmapId)
        .where("event", "==", "item_vote")
        .where("timestamp", ">=", startDate)
        .where("timestamp", "<=", endDate)
        .count()
        .get()

      // Get subscribe events
      const subscribesSnap = await adminDb
        .collection(this.eventsCollection)
        .where("roadmapId", "==", roadmapId)
        .where("event", "==", "item_subscribe")
        .where("timestamp", ">=", startDate)
        .where("timestamp", "<=", endDate)
        .count()
        .get()

      // Get item view counts
      const itemViewsSnap = await adminDb
        .collection(this.eventsCollection)
        .where("roadmapId", "==", roadmapId)
        .where("event", "==", "item_view")
        .where("timestamp", ">=", startDate)
        .where("timestamp", "<=", endDate)
        .get()

      const itemViews: Record<string, number> = {}
      itemViewsSnap.docs.forEach((doc) => {
        const itemId = doc.data().itemId
        if (itemId) {
          itemViews[itemId] = (itemViews[itemId] || 0) + 1
        }
      })

      return {
        roadmapId,
        views: viewsSnap.size,
        uniqueVisitors: uniqueSessions.size,
        totalVotes: votesSnap.data().count,
        totalSubscribers: subscribesSnap.data().count,
        itemViews,
        periodStart: startDate,
        periodEnd: endDate,
      }
    } catch (error) {
      logger.error("Error getting roadmap metrics", error as Error, {
        roadmapId,
      })
      return {
        roadmapId,
        views: 0,
        uniqueVisitors: 0,
        totalVotes: 0,
        totalSubscribers: 0,
        itemViews: {},
        periodStart: startDate,
        periodEnd: endDate,
      }
    }
  }

  /**
   * Convert event type to activity type
   */
  private eventToActivityType(event: string): ActivityItem["type"] {
    switch (event) {
      case "item_vote":
        return "vote"
      case "item_subscribe":
        return "subscribe"
      default:
        return "vote"
    }
  }
}

// Export singleton instance
export const analytics = new AnalyticsService()
