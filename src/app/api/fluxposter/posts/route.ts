import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

const FLUXPOSTER_API_KEY = process.env.FLUXPOSTER_API_KEY

export async function POST(req: NextRequest) {
    // 1. Authentication
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.replace(/^Bearer\s+/i, "").trim()

    if (!FLUXPOSTER_API_KEY || token !== FLUXPOSTER_API_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Parse Payload
    let body: any
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const { id: externalId, title, bodyHtml, summary, status, publishedAt, tags, categories, images } = body

    if (!externalId || !title || !bodyHtml) {
        return NextResponse.json(
            { error: "Missing required fields: id, title, bodyHtml" },
            { status: 400 }
        )
    }

    try {
        // 3. Find target roadmap (assuming 'default' or first available)
        const roadmapsSnap = await adminDb.collection("roadmaps").limit(1).get()
        if (roadmapsSnap.empty) {
            return NextResponse.json({ error: "No roadmap configured" }, { status: 404 })
        }
        const roadmapDoc = roadmapsSnap.docs[0]
        const roadmapId = roadmapDoc.id

        // 4. Handle Idempotency / Upsert
        const itemsQuery = await adminDb.collection("items")
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

        const featuredImageUrl = images?.find((img: any) => img.role === "featured")?.url ?? images?.[0]?.url ?? null

        const itemData = {
            externalId,
            title,
            description: summary || bodyHtml.replace(/<[^>]*>?/gm, '').slice(0, 200) + "...",
            contentHtml: bodyHtml, // Store full HTML for detail view
            status: "SHIPPED", // FluxPoster posts are treated as shipped changelog items
            confidence: "H",
            roadmapId,
            tags: tags || [],
            categories: categories || [],
            featuredImageUrl,
            updatedAt: FieldValue.serverTimestamp(),
        }

        if (!isUpdate) {
            // @ts-ignore
            itemData.createdAt = FieldValue.serverTimestamp()
            // @ts-ignore
            itemData.votes = 0
            // @ts-ignore
            itemData.featured = true // AI posts are often featured

            await itemRef.set(itemData)

            // Increment item count on roadmap
            await roadmapDoc.ref.update({
                itemCount: FieldValue.increment(1)
            })
        } else {
            await itemRef.update(itemData)
        }

        // 5. Generate Response
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.roadmap.tools"
        const publicUrl = `${siteUrl}/r/default/${roadmapDoc.data().slug}`

        return NextResponse.json({
            postId: itemRef.id,
            url: publicUrl
        }, { status: isUpdate ? 200 : 201 })

    } catch (error) {
        console.error("FluxPoster Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

// Note: Next.js App Router uses separate folders for dynamic routes. 
// I will create /api/fluxposter/posts/[externalId]/route.ts for PUT/DELETE.
