import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { workspaceRepository } from "@/lib/db/workspace.repository"
import { logger } from "@/lib/logger"
import { z } from "zod"

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug too long")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(500, "Description too long").optional(),
})

/**
 * GET /api/v1/workspaces - List user's workspaces
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workspaces = await workspaceRepository.findByUser(session.user.id)

    return NextResponse.json({ workspaces })
  } catch (error) {
    logger.error("Error fetching workspaces", error as Error)
    return NextResponse.json({ error: "Failed to fetch workspaces" }, { status: 500 })
  }
}

/**
 * POST /api/v1/workspaces - Create a new workspace
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const result = CreateWorkspaceSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: result.error.issues,
        },
        { status: 400 }
      )
    }

    const { name, slug, description } = result.data

    // Check slug availability
    const isAvailable = await workspaceRepository.isSlugAvailable(slug)
    if (!isAvailable) {
      return NextResponse.json({ error: "Workspace slug is already taken" }, { status: 409 })
    }

    const workspace = await workspaceRepository.create({
      name,
      slug,
      description,
      ownerId: session.user.id,
    })

    return NextResponse.json({ workspace }, { status: 201 })
  } catch (error) {
    logger.error("Error creating workspace", error as Error)
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 })
  }
}
