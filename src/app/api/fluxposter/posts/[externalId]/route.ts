import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

const FLUXPOSTER_API_KEY = process.env.FLUXPOSTER_API_KEY

async function authenticate(req: NextRequest) {
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.replace(/^Bearer\s+/i, "").trim()
    return FLUXPOSTER_API_KEY && token === FLUXPOSTER_API_KEY
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ externalId: string }> }
) {
    const { externalId } = await params

    if (!await authenticate(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: any
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    try {
        const itemsQuery = await adminDb.collection("items")
            .where("externalId", "==", externalId)
            .limit(1)
            .get()

        if (itemsQuery.empty) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 })
        }

        const itemRef = itemsQuery.docs[0].ref
        const { title, bodyHtml, summary, images, tags, categories } = body

        const featuredImageUrl = images?.find((img: any) => img.role === "featured")?.url ?? images?.[0]?.url ?? null

        await itemRef.update({
            title,
            description: summary || bodyHtml.replace(/<[^>]*>?/gm, '').slice(0, 200) + "...",
            contentHtml: bodyHtml,
            featuredImageUrl,
            tags: tags || [],
            categories: categories || [],
            updatedAt: new Date(),
        })

        return NextResponse.json({
            postId: itemRef.id,
            message: "Updated successfully"
        })

    } catch (error) {
        console.error("FluxPoster Update Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ externalId: string }> }
) {
    const { externalId } = await params

    if (!await authenticate(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const itemsQuery = await adminDb.collection("items")
            .where("externalId", "==", externalId)
            .limit(1)
            .get()

        if (itemsQuery.empty) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 })
        }

        const itemRef = itemsQuery.docs[0].ref
        const roadmapId = itemsQuery.docs[0].data().roadmapId

        await itemRef.delete()

        // Decrement roadmap item count
        if (roadmapId) {
            await adminDb.collection("roadmaps").doc(roadmapId).update({
                itemCount: FieldValue.increment(-1)
            })
        }

        return new NextResponse(null, { status: 204 })

    } catch (error) {
        console.error("FluxPoster Delete Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
