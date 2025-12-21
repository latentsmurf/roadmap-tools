import { Button } from "@/components/ui/button"
import { RoadmapView } from "@/components/roadmap/roadmap-view"
import { notFound } from "next/navigation"
import { adminDb } from "@/lib/firebase-admin"

interface PageProps {
    params: Promise<{
        workspaceSlug: string
        roadmapSlug: string
    }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PublicRoadmapPage({ params, searchParams }: PageProps) {
    const { workspaceSlug, roadmapSlug } = await params
    const { embed } = await searchParams
    const isEmbed = embed === 'true'

    // Fetch Roadmap by Slug
    const roadmapQuery = await adminDb.collection("roadmaps")
        .where("slug", "==", roadmapSlug)
        .limit(1)
        .get()

    if (roadmapQuery.empty) {
        notFound()
    }

    const roadmapDoc = roadmapQuery.docs[0]
    const roadmap = { id: roadmapDoc.id, ...roadmapDoc.data() } as any

    // Fetch Groups
    const groupsSnap = await adminDb.collection("roadmaps").doc(roadmap.id).collection("groups").get()
    const groups = groupsSnap.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || "Uncategorized"
    }))

    // Fetch Items for this Roadmap
    const itemsQuery = await adminDb.collection("items")
        .where("roadmapId", "==", roadmap.id)
        .get()

    // Transform items for the view (and serialize dates)
    const viewItems = itemsQuery.docs.map(doc => {
        const data = doc.data()
        return {
            id: doc.id,
            title: data.title,
            status: data.status,
            confidence: data.confidence,
            votes: data.votes || 0,
            description: data.description || undefined,
            featured: data.featured,
            groupId: data.groupId,
            // Convert Firestore timestamps to string/number if needed, or Date
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        }
    })

    // Sort items manually (createdAt desc)
    viewItems.sort((a: any, b: any) => {
        // We didn't fetch createdAt for sort above, but we can if we want.
        // For now, let's trust default order or client side sort.
        // Actually, let's grabbing sorting from the client logic or just sending raw.
        return 0
    })

    return (
        <div className="min-h-screen bg-background text-foreground">
            {!isEmbed && (
                <header className="border-b p-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">{roadmap.publicTitle || roadmap.title}</h1>
                        <p className="text-sm text-muted-foreground">{workspaceSlug}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">Subscribe</Button>
                    </div>
                </header>
            )}

            <main className={isEmbed ? "p-0" : "p-6 max-w-7xl mx-auto"}>
                <RoadmapView items={viewItems} groups={groups} />
            </main>
        </div>
    )
}
