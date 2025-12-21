"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export async function createRoadmap(formData: FormData) {
    const title = formData.get("title") as string
    const slug = formData.get("slug") as string

    // Simple slug validation
    if (!slug || slug.length < 3) {
        throw new Error("Slug must be at least 3 characters")
    }

    // TODO: Add real workspace ID in Auth phase. Using "default" for now.
    const workspaceId = "default"

    // Create Roadmap Doc
    const roadmapRef = adminDb.collection("roadmaps").doc()
    await roadmapRef.set({
        title,
        slug,
        workspaceId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        publicTitle: title, // Default to same title
        viewConfig: {},
        themeConfig: {},
        itemCount: 0 // De-normalized counter
    })

    // Also create a "slug mapping" if we want fast lookup, but for now simple query is fine

    revalidatePath("/admin")
    redirect("/admin")
}

export async function createItem(formData: FormData) {
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const status = formData.get("status") as string
    const confidence = formData.get("confidence") as string
    const roadmapId = formData.get("roadmapId") as string
    const groupId = formData.get("groupId") as string

    if (!roadmapId) throw new Error("Roadmap ID is required")

    // Create Item Doc
    const itemRef = adminDb.collection("items").doc()
    await itemRef.set({
        title,
        description,
        status,
        confidence,
        roadmapId,
        groupId: groupId || null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        votes: 0,
        featured: false,
    })

    // Update Roadmap Item Count
    await adminDb.collection("roadmaps").doc(roadmapId).update({
        itemCount: FieldValue.increment(1)
    })

    // We need to fetch the workspace/slug to redirect correctly... 
    // For MVP speed, let's just go back to admin root or use a parameter if available.
    // Ideally we pass the return URL in hidden field.

    revalidatePath("/admin")
    redirect("/admin")
}

export async function toggleVote(itemId: string) {
    // simple increment for MVP/Demo
    const itemRef = adminDb.collection("items").doc(itemId)
    await itemRef.update({
        votes: FieldValue.increment(1)
    })
    revalidatePath("/r/[workspaceSlug]/[roadmapSlug]")
}

export async function subscribeToItem(itemId: string, email: string) {
    if (!email || !email.includes("@")) return { error: "Invalid email" }

    await adminDb.collection("items").doc(itemId).collection("subscribers").doc(email).set({
        email,
        createdAt: FieldValue.serverTimestamp()
    })

    return { success: true }
}
