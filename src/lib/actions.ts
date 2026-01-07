"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import {
  CreateRoadmapSchema,
  CreateItemSchema,
  EmailSchema,
  type ActionResult,
} from "@/lib/validation"

/**
 * Creates a new roadmap
 */
export async function createRoadmap(formData: FormData): Promise<void> {
  const rawData = {
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
  }

  // Validate input
  const result = CreateRoadmapSchema.safeParse(rawData)

  if (!result.success) {
    const errorMessage = result.error.issues[0]?.message || "Invalid input"
    throw new Error(errorMessage)
  }

  const { title, slug, description } = result.data

  // Check if slug already exists
  const existingRoadmap = await adminDb
    .collection("roadmaps")
    .where("slug", "==", slug)
    .limit(1)
    .get()

  if (!existingRoadmap.empty) {
    throw new Error("A roadmap with this slug already exists")
  }

  // TODO: Add real workspace ID in Auth phase. Using "default" for now.
  const workspaceId = "default"

  // Create Roadmap Doc
  const roadmapRef = adminDb.collection("roadmaps").doc()
  await roadmapRef.set({
    title,
    slug,
    description: description || null,
    workspaceId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    publicTitle: title, // Default to same title
    viewConfig: {},
    themeConfig: {},
    itemCount: 0, // De-normalized counter
  })

  revalidatePath("/admin")
  redirect("/admin")
}

/**
 * Creates a new roadmap item
 */
export async function createItem(formData: FormData): Promise<void> {
  const rawData = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    status: formData.get("status") || "EXPLORING",
    confidence: formData.get("confidence") || undefined,
    roadmapId: formData.get("roadmapId"),
    groupId: formData.get("groupId") || null,
  }

  // Validate input
  const result = CreateItemSchema.safeParse(rawData)

  if (!result.success) {
    const errorMessage = result.error.issues[0]?.message || "Invalid input"
    throw new Error(errorMessage)
  }

  const { title, description, status, confidence, roadmapId, groupId } = result.data

  // Verify roadmap exists
  const roadmapDoc = await adminDb.collection("roadmaps").doc(roadmapId).get()

  if (!roadmapDoc.exists) {
    throw new Error("Roadmap not found")
  }

  // Create Item Doc
  const itemRef = adminDb.collection("items").doc()
  await itemRef.set({
    title,
    description: description || null,
    status,
    confidence: confidence || null,
    roadmapId,
    groupId: groupId || null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    votes: 0,
    featured: false,
  })

  // Update Roadmap Item Count
  await adminDb
    .collection("roadmaps")
    .doc(roadmapId)
    .update({
      itemCount: FieldValue.increment(1),
    })

  revalidatePath("/admin")
  redirect("/admin")
}

/**
 * Toggle vote on an item (simple increment for MVP)
 */
export async function toggleVote(itemId: string): Promise<ActionResult> {
  if (!itemId || typeof itemId !== "string") {
    return { success: false, error: "Invalid item ID" }
  }

  try {
    const itemRef = adminDb.collection("items").doc(itemId)
    const itemDoc = await itemRef.get()

    if (!itemDoc.exists) {
      return { success: false, error: "Item not found" }
    }

    await itemRef.update({
      votes: FieldValue.increment(1),
    })

    revalidatePath("/r/[workspaceSlug]/[roadmapSlug]")

    return { success: true }
  } catch (error) {
    console.error("Vote error:", error)
    return { success: false, error: "Failed to record vote" }
  }
}

/**
 * Subscribe to item updates via email
 */
export async function subscribeToItem(itemId: string, email: string): Promise<ActionResult> {
  // Validate inputs
  if (!itemId || typeof itemId !== "string") {
    return { success: false, error: "Invalid item ID" }
  }

  const emailResult = EmailSchema.safeParse(email)

  if (!emailResult.success) {
    return {
      success: false,
      error: emailResult.error.issues[0]?.message || "Invalid email",
    }
  }

  try {
    // Verify item exists
    const itemDoc = await adminDb.collection("items").doc(itemId).get()

    if (!itemDoc.exists) {
      return { success: false, error: "Item not found" }
    }

    // Add subscriber
    await adminDb
      .collection("items")
      .doc(itemId)
      .collection("subscribers")
      .doc(emailResult.data)
      .set({
        email: emailResult.data,
        createdAt: FieldValue.serverTimestamp(),
      })

    return { success: true }
  } catch (error) {
    console.error("Subscribe error:", error)
    return { success: false, error: "Failed to subscribe" }
  }
}
