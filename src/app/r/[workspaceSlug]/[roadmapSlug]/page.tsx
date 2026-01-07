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

interface RoadmapData {
  id: string
  title: string
  publicTitle?: string
  slug: string
}

export default async function PublicRoadmapPage({ params, searchParams }: PageProps) {
  const { workspaceSlug, roadmapSlug } = await params
  const { embed } = await searchParams
  const isEmbed = embed === "true"

  // Fetch Roadmap by Slug
  const roadmapQuery = await adminDb
    .collection("roadmaps")
    .where("slug", "==", roadmapSlug)
    .limit(1)
    .get()

  if (roadmapQuery.empty) {
    notFound()
  }

  const roadmapDoc = roadmapQuery.docs[0]
  const roadmapData = roadmapDoc.data()
  const roadmap: RoadmapData = {
    id: roadmapDoc.id,
    title: roadmapData.title || "",
    publicTitle: roadmapData.publicTitle,
    slug: roadmapData.slug || "",
  }

  // Fetch Groups
  const groupsSnap = await adminDb.collection("roadmaps").doc(roadmap.id).collection("groups").get()
  const groups = groupsSnap.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name || "Uncategorized",
  }))

  // Fetch Items for this Roadmap
  const itemsQuery = await adminDb.collection("items").where("roadmapId", "==", roadmap.id).get()

  // Transform items for the view (and serialize dates)
  const viewItems = itemsQuery.docs.map((doc) => {
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
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }
  })

  // Items are returned in Firestore default order
  // Client-side sorting can be applied in RoadmapView if needed

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isEmbed && (
        <header className="border-b p-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {roadmap.publicTitle || roadmap.title}
            </h1>
            <p className="text-sm text-muted-foreground">{workspaceSlug}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Subscribe
            </Button>
          </div>
        </header>
      )}

      <main className={isEmbed ? "p-0" : "p-6 max-w-7xl mx-auto"}>
        <RoadmapView items={viewItems} groups={groups} />
      </main>
    </div>
  )
}
