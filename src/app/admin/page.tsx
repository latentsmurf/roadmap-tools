import { adminDb } from "@/lib/firebase-admin"
import { auth } from "@/auth"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
    const session = await auth()
    const roadmapsSnap = await adminDb.collection("roadmaps").get()
    const roadmaps = roadmapsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as any[]

    return <AdminDashboard roadmaps={roadmaps} userEmail={session?.user?.email} />
}
