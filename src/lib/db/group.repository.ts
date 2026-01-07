import type { DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore"
import { FieldValue } from "firebase-admin/firestore"
import { adminDb } from "@/lib/firebase-admin"
import type { Group, GroupDocument } from "@/types"

export interface CreateGroupInput {
  name: string
  order?: number
}

/**
 * Repository for Group entity operations
 * Groups are subcollections of Roadmaps
 */
export class GroupRepository {
  /**
   * Get groups collection for a roadmap
   */
  private collection(roadmapId: string) {
    return adminDb.collection("roadmaps").doc(roadmapId).collection("groups")
  }

  /**
   * Transform Firestore document to Group entity
   */
  private fromFirestore(doc: QueryDocumentSnapshot<DocumentData>): Group {
    const data = doc.data() as GroupDocument
    return {
      id: doc.id,
      name: data.name,
      order: data.order,
      createdAt: data.createdAt,
    }
  }

  /**
   * Find group by ID
   */
  async findById(roadmapId: string, groupId: string): Promise<Group | null> {
    const doc = await this.collection(roadmapId).doc(groupId).get()
    if (!doc.exists) return null
    return this.fromFirestore(doc as QueryDocumentSnapshot<DocumentData>)
  }

  /**
   * Find all groups for a roadmap
   */
  async findByRoadmapId(roadmapId: string): Promise<Group[]> {
    const snapshot = await this.collection(roadmapId).orderBy("order", "asc").get()

    return snapshot.docs.map((doc) => this.fromFirestore(doc))
  }

  /**
   * Create a new group
   */
  async create(roadmapId: string, input: CreateGroupInput): Promise<Group> {
    const docRef = this.collection(roadmapId).doc()

    const data = {
      name: input.name,
      order: input.order ?? 0,
      createdAt: FieldValue.serverTimestamp(),
    }

    await docRef.set(data)

    const created = await this.findById(roadmapId, docRef.id)
    if (!created) throw new Error("Failed to create group")

    return created
  }

  /**
   * Update a group
   */
  async update(
    roadmapId: string,
    groupId: string,
    input: Partial<CreateGroupInput>
  ): Promise<Group> {
    const updateData: Record<string, unknown> = {}

    if (input.name !== undefined) updateData.name = input.name
    if (input.order !== undefined) updateData.order = input.order

    await this.collection(roadmapId).doc(groupId).update(updateData)

    const updated = await this.findById(roadmapId, groupId)
    if (!updated) throw new Error("Group not found after update")

    return updated
  }

  /**
   * Delete a group
   */
  async delete(roadmapId: string, groupId: string): Promise<void> {
    await this.collection(roadmapId).doc(groupId).delete()
  }

  /**
   * Reorder groups
   */
  async reorder(roadmapId: string, groupIds: string[]): Promise<void> {
    const batch = adminDb.batch()

    groupIds.forEach((groupId, index) => {
      const ref = this.collection(roadmapId).doc(groupId)
      batch.update(ref, { order: index })
    })

    await batch.commit()
  }
}

// Singleton instance
export const groupRepository = new GroupRepository()
