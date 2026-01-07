import { adminDb } from "@/lib/firebase-admin"
import { requireAdminAccess } from "@/lib/auth/server"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

interface AdminRoadmap {
  id: string
  title: string
  slug: string
  description?: string
  workspaceId?: string
  itemCount?: number
}

export default async function AdminPage() {
  const session = await requireAdminAccess()

  const roadmapsSnap = await adminDb.collection("roadmaps").get()
  const roadmaps: AdminRoadmap[] = roadmapsSnap.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      title: data.title || "",
      slug: data.slug || "",
      description: data.description,
      workspaceId: data.workspaceId,
      itemCount: data.itemCount,
    }
  })

  return (
    <AdminDashboard
      roadmaps={roadmaps}
      userEmail={session.user?.email}
      userRole={session.user?.role}
    />
  )
}
