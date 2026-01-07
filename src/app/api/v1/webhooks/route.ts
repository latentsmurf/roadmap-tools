import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { webhookService, type WebhookEventType } from "@/lib/webhooks"
import { hasPermission } from "@/lib/auth/permissions"
import { logger } from "@/lib/logger"
import { z } from "zod"

const CreateWebhookSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  url: z.string().url("Must be a valid URL"),
  events: z
    .array(
      z.enum([
        "item.created",
        "item.updated",
        "item.deleted",
        "item.voted",
        "item.status_changed",
        "roadmap.created",
        "roadmap.updated",
        "roadmap.deleted",
        "subscriber.added",
      ])
    )
    .min(1, "At least one event is required"),
})

/**
 * GET /api/v1/webhooks - List webhooks for a workspace
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
    const workspaceId = searchParams.get("workspaceId")

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 })
    }

    const webhooks = await webhookService.findByWorkspace(workspaceId)

    // Don't expose secrets in list view
    const safeWebhooks = webhooks.map((w) => ({
      ...w,
      secret: undefined,
    }))

    return NextResponse.json({ webhooks: safeWebhooks })
  } catch (error) {
    logger.error("Error fetching webhooks", error as Error)
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 })
  }
}

/**
 * POST /api/v1/webhooks - Create a new webhook
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permission
    if (!hasPermission(session.user.role, "admin:access")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const result = CreateWebhookSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: result.error.issues,
        },
        { status: 400 }
      )
    }

    const webhook = await webhookService.create({
      workspaceId: result.data.workspaceId,
      name: result.data.name,
      url: result.data.url,
      events: result.data.events as WebhookEventType[],
    })

    return NextResponse.json({ webhook }, { status: 201 })
  } catch (error) {
    logger.error("Error creating webhook", error as Error)
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 })
  }
}
