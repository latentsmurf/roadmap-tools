import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import { z } from "zod"
import { sanitizeHtml, createSafeDescription, sanitizeUrl } from "@/lib/sanitize"

const FLUXPOSTER_API_KEY = process.env.FLUXPOSTER_API_KEY

/**
 * Schema for PUT request body
 */
const UpdatePayloadSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  bodyHtml: z.string().max(100000).optional(),
  summary: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  categories: z.array(z.string().max(50)).max(10).optional(),
  images: z
    .array(
      z.object({
        role: z.string().optional(),
        url: z.string().url(),
      })
    )
    .max(20)
    .optional(),
})

/**
 * Authenticates the request using Bearer token
 */
function authenticate(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization") || ""
  const token = authHeader.replace(/^Bearer\s+/i, "").trim()
  return Boolean(FLUXPOSTER_API_KEY && token === FLUXPOSTER_API_KEY)
}

/**
 * Updates an existing FluxPoster item
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ externalId: string }> }
) {
  const { externalId } = await params

  // 1. Authentication
  if (!authenticate(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 2. Validate externalId
  if (!externalId || typeof externalId !== "string") {
    return NextResponse.json({ error: "Invalid external ID" }, { status: 400 })
  }

  // 3. Parse and validate body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const validationResult = UpdatePayloadSchema.safeParse(body)

  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues[0]?.message || "Invalid payload"
    return NextResponse.json(
      {
        error: errorMessage,
        details: validationResult.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    )
  }

  const { title, bodyHtml, summary, images, tags, categories } = validationResult.data

  try {
    // 4. Find the item by external ID
    const itemsQuery = await adminDb
      .collection("items")
      .where("externalId", "==", externalId)
      .limit(1)
      .get()

    if (itemsQuery.empty) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const itemRef = itemsQuery.docs[0].ref

    // 5. Build update object with sanitized data
    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (title !== undefined) {
      updateData.title = title.trim()
    }

    if (bodyHtml !== undefined) {
      updateData.contentHtml = sanitizeHtml(bodyHtml)
      updateData.description = summary || createSafeDescription(bodyHtml, 200)
    } else if (summary !== undefined) {
      updateData.description = summary
    }

    if (tags !== undefined) {
      updateData.tags = tags
    }

    if (categories !== undefined) {
      updateData.categories = categories
    }

    if (images !== undefined) {
      const featuredImageUrl =
        sanitizeUrl(images?.find((img) => img.role === "featured")?.url) ??
        sanitizeUrl(images?.[0]?.url) ??
        null
      updateData.featuredImageUrl = featuredImageUrl
    }

    // 6. Update the item
    await itemRef.update(updateData)

    return NextResponse.json({
      postId: itemRef.id,
      message: "Updated successfully",
    })
  } catch (error) {
    console.error("FluxPoster Update Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * Deletes a FluxPoster item
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ externalId: string }> }
) {
  const { externalId } = await params

  // 1. Authentication
  if (!authenticate(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 2. Validate externalId
  if (!externalId || typeof externalId !== "string") {
    return NextResponse.json({ error: "Invalid external ID" }, { status: 400 })
  }

  try {
    // 3. Find the item by external ID
    const itemsQuery = await adminDb
      .collection("items")
      .where("externalId", "==", externalId)
      .limit(1)
      .get()

    if (itemsQuery.empty) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const itemRef = itemsQuery.docs[0].ref
    const roadmapId = itemsQuery.docs[0].data().roadmapId

    // 4. Delete the item
    await itemRef.delete()

    // 5. Decrement roadmap item count
    if (roadmapId) {
      await adminDb
        .collection("roadmaps")
        .doc(roadmapId)
        .update({
          itemCount: FieldValue.increment(-1),
        })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("FluxPoster Delete Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
