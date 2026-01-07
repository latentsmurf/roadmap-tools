import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { analytics } from "@/lib/analytics"
import { hasPermission } from "@/lib/auth/permissions"
import { logger } from "@/lib/logger"

/**
 * GET /api/v1/analytics - Get dashboard analytics summary
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permission
    if (!hasPermission(session.user.role, "admin:access")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get("workspaceId") || "default"

    const summary = await analytics.getDashboardSummary(workspaceId)

    return NextResponse.json(summary)
  } catch (error) {
    logger.error("Error fetching analytics", error as Error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}

/**
 * POST /api/v1/analytics - Track an analytics event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, roadmapId, itemId, workspaceId, sessionId, metadata } = body

    if (!event) {
      return NextResponse.json({ error: "Event type is required" }, { status: 400 })
    }

    // Get user ID if authenticated
    const session = await auth()
    const userId = session?.user?.id

    await analytics.trackEvent({
      event,
      roadmapId,
      itemId,
      workspaceId,
      sessionId,
      userId,
      metadata,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Error tracking analytics event", error as Error)
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 })
  }
}
