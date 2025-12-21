import { adminDb } from "@/lib/firebase-admin"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ItemForm } from "@/components/admin/item-form"

interface PageProps {
    searchParams: Promise<{ roadmapId?: string }>
}

export default async function NewItemPage({ searchParams }: PageProps) {
    const { roadmapId } = await searchParams

    if (!roadmapId) return <div className="p-10 text-center">Missing roadmapId</div>

    // Fetch Groups for this roadmap
    let groups: { id: string, name: string }[] = []
    try {
        const groupsSnap = await adminDb.collection("roadmaps").doc(roadmapId).collection("groups").get()
        groups = groupsSnap.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name || "Untitled Group"
        }))
    } catch (e) {
        console.error("Failed to fetch groups:", e)
    }

    return (
        <div className="max-w-xl mx-auto py-12 px-4">
            <Card className="shadow-xl border-t-4 border-t-primary">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">New Roadmap Item</CardTitle>
                    <CardDescription>
                        Add a new feature or improvement to your public roadmap.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ItemForm roadmapId={roadmapId} groups={groups} />
                </CardContent>
            </Card>
        </div>
    )
}
