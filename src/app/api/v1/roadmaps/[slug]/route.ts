import { adminDb } from "@/lib/firebase-admin"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params

    try {
        // Fetch Roadmap
        const roadmapQuery = await adminDb.collection("roadmaps")
            .where("slug", "==", slug)
            .limit(1)
            .get()

        if (roadmapQuery.empty) {
            return Response.json({ error: "Roadmap not found" }, { status: 404 })
        }

        const roadmapDoc = roadmapQuery.docs[0]
        const roadmapData = roadmapDoc.data()

        // Fetch Items
        const itemsQuery = await adminDb.collection("items")
            .where("roadmapId", "==", roadmapDoc.id)
            .get()

        const items = itemsQuery.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        return Response.json({
            roadmap: {
                id: roadmapDoc.id,
                ...roadmapData
            },
            items
        })
    } catch (error) {
        console.error("API Error:", error)
        return Response.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
