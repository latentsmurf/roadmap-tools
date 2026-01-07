import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import { FluxPosterPayloadSchema } from "@/lib/validation"
import { sanitizeHtml, createSafeDescription, sanitizeUrl } from "@/lib/sanitize"

const FLUXPOSTER_API_KEY = process.env.FLUXPOSTER_API_KEY

/**
 * Authenticates the request using Bearer token
 */
function authenticate(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization") || ""
  const token = authHeader.replace(/^Bearer\s+/i, "").trim()
  return Boolean(FLUXPOSTER_API_KEY && token === FLUXPOSTER_API_KEY)
}

export async function POST(req: NextRequest) {
  // 1. Authentication
  if (!authenticate(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 2. Parse and validate payload
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const validationResult = FluxPosterPayloadSchema.safeParse(body)

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

  const {
    id: externalId,
    title,
    bodyHtml,
    summary,
    tags,
    categories,
    images,
  } = validationResult.data

  try {
    // 3. Find target roadmap (assuming 'default' or first available)
    const roadmapsSnap = await adminDb.collection("roadmaps").limit(1).get()
    if (roadmapsSnap.empty) {
      return NextResponse.json({ error: "No roadmap configured" }, { status: 404 })
    }
    const roadmapDoc = roadmapsSnap.docs[0]
    const roadmapId = roadmapDoc.id

    // 4. Handle Idempotency / Upsert
    const itemsQuery = await adminDb
      .collection("items")
      .where("externalId", "==", externalId)
      .limit(1)
      .get()

    let itemRef
    let isUpdate = false

    if (!itemsQuery.empty) {
      itemRef = itemsQuery.docs[0].ref
      isUpdate = true
    } else {
      itemRef = adminDb.collection("items").doc()
    }

    // 5. Sanitize HTML content to prevent XSS
    const sanitizedHtml = sanitizeHtml(bodyHtml)
    const safeDescription = summary || createSafeDescription(bodyHtml, 200)

    // 6. Sanitize and validate image URL
    const featuredImageUrl =
      sanitizeUrl(images?.find((img) => img.role === "featured")?.url) ??
      sanitizeUrl(images?.[0]?.url) ??
      null

    // 7. Prepare item data
    const itemData = {
      externalId,
      title: title.trim(),
      description: safeDescription,
      contentHtml: sanitizedHtml,
      status: "SHIPPED", // FluxPoster posts are treated as shipped changelog items
      confidence: "H",
      roadmapId,
      tags: tags || [],
      categories: categories || [],
      featuredImageUrl,
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (!isUpdate) {
      // New item - set creation fields
      const newItemData = {
        ...itemData,
        createdAt: FieldValue.serverTimestamp(),
        votes: 0,
        featured: true, // AI posts are often featured
      }

      await itemRef.set(newItemData)

      // Increment item count on roadmap
      await roadmapDoc.ref.update({
        itemCount: FieldValue.increment(1),
      })
    } else {
      await itemRef.update(itemData)
    }

    // 8. Generate Response
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.roadmap.tools"
    const publicUrl = `${siteUrl}/r/default/${roadmapDoc.data().slug}`

    return NextResponse.json(
      {
        postId: itemRef.id,
        url: publicUrl,
      },
      { status: isUpdate ? 200 : 201 }
    )
  } catch (error) {
    console.error("FluxPoster Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
