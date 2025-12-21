"use server"

import { revalidatePath } from "next/cache"
import { adminDb } from "@/lib/firebase-admin"

export async function createGroup(roadmapId: string, name: string) {
    if (!name || !roadmapId) throw new Error("Missing name or roadmapId")

    await adminDb.collection("roadmaps").doc(roadmapId).collection("groups").add({
        name,
        createdAt: new Date()
    })

    revalidatePath("/admin")
}
