import type { DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore"
import { FieldValue } from "firebase-admin/firestore"
import { BaseRepository } from "./base.repository"
import type { Item, ItemDocument, ItemStatus, ItemConfidence, PaginatedResponse } from "@/types"

export interface CreateItemInput {
  title: string
  description?: string
  contentHtml?: string
  status: ItemStatus
  confidence?: ItemConfidence
  roadmapId: string
  groupId?: string
  externalId?: string
  tags?: string[]
  categories?: string[]
  featuredImageUrl?: string
  featured?: boolean
}

export interface UpdateItemInput {
  title?: string
  description?: string
  contentHtml?: string
  status?: ItemStatus
  confidence?: ItemConfidence
  groupId?: string | null
  tags?: string[]
  categories?: string[]
  featuredImageUrl?: string | null
  featured?: boolean
}

/**
 * Repository for Item entity operations
 */
export class ItemRepository extends BaseRepository<Item> {
  constructor() {
    super("items")
  }

  protected fromFirestore(doc: QueryDocumentSnapshot<DocumentData>): Item {
    const data = doc.data() as ItemDocument
    return {
      id: doc.id,
      title: data.title,
      description: data.description,
      contentHtml: data.contentHtml,
      status: data.status,
      confidence: data.confidence,
      roadmapId: data.roadmapId,
      groupId: data.groupId,
      votes: data.votes || 0,
      featured: data.featured || false,
      externalId: data.externalId,
      tags: data.tags || [],
      categories: data.categories || [],
      featuredImageUrl: data.featuredImageUrl,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  }

  /**
   * Find items by roadmap ID
   */
  async findByRoadmapId(roadmapId: string): Promise<Item[]> {
    const snapshot = await this.collection
      .where("roadmapId", "==", roadmapId)
      .orderBy("createdAt", "desc")
      .get()

    return snapshot.docs.map((doc) => this.fromFirestore(doc))
  }

  /**
   * Find items by roadmap with pagination
   */
  async findByRoadmapPaginated(
    roadmapId: string,
    limit: number = 20,
    cursor?: string
  ): Promise<PaginatedResponse<Item>> {
    let query = this.collection
      .where("roadmapId", "==", roadmapId)
      .orderBy("createdAt", "desc")
      .limit(limit + 1)

    if (cursor) {
      const cursorDoc = await this.docRef(cursor).get()
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc)
      }
    }

    const snapshot = await query.get()
    const docs = snapshot.docs.slice(0, limit)
    const hasMore = snapshot.docs.length > limit

    return {
      data: docs.map((doc) => this.fromFirestore(doc)),
      nextCursor: hasMore ? docs[docs.length - 1]?.id : undefined,
      hasMore,
    }
  }

  /**
   * Find item by external ID
   */
  async findByExternalId(externalId: string): Promise<Item | null> {
    const snapshot = await this.collection.where("externalId", "==", externalId).limit(1).get()

    if (snapshot.empty) return null
    return this.fromFirestore(snapshot.docs[0])
  }

  /**
   * Find items by status
   */
  async findByStatus(roadmapId: string, status: ItemStatus): Promise<Item[]> {
    const snapshot = await this.collection
      .where("roadmapId", "==", roadmapId)
      .where("status", "==", status)
      .orderBy("createdAt", "desc")
      .get()

    return snapshot.docs.map((doc) => this.fromFirestore(doc))
  }

  /**
   * Find featured items
   */
  async findFeatured(roadmapId: string): Promise<Item[]> {
    const snapshot = await this.collection
      .where("roadmapId", "==", roadmapId)
      .where("featured", "==", true)
      .orderBy("createdAt", "desc")
      .get()

    return snapshot.docs.map((doc) => this.fromFirestore(doc))
  }

  /**
   * Create a new item
   */
  async create(input: CreateItemInput): Promise<Item> {
    const docRef = this.collection.doc()

    const data = {
      title: input.title,
      description: input.description || null,
      contentHtml: input.contentHtml || null,
      status: input.status,
      confidence: input.confidence || null,
      roadmapId: input.roadmapId,
      groupId: input.groupId || null,
      externalId: input.externalId || null,
      tags: input.tags || [],
      categories: input.categories || [],
      featuredImageUrl: input.featuredImageUrl || null,
      featured: input.featured || false,
      votes: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    await docRef.set(data)

    const created = await this.findById(docRef.id)
    if (!created) throw new Error("Failed to create item")

    return created
  }

  /**
   * Update an item
   */
  async update(id: string, input: UpdateItemInput): Promise<Item> {
    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (input.title !== undefined) updateData.title = input.title
    if (input.description !== undefined) updateData.description = input.description
    if (input.contentHtml !== undefined) updateData.contentHtml = input.contentHtml
    if (input.status !== undefined) updateData.status = input.status
    if (input.confidence !== undefined) updateData.confidence = input.confidence
    if (input.groupId !== undefined) updateData.groupId = input.groupId
    if (input.tags !== undefined) updateData.tags = input.tags
    if (input.categories !== undefined) updateData.categories = input.categories
    if (input.featuredImageUrl !== undefined) updateData.featuredImageUrl = input.featuredImageUrl
    if (input.featured !== undefined) updateData.featured = input.featured

    await this.docRef(id).update(updateData)

    const updated = await this.findById(id)
    if (!updated) throw new Error("Item not found after update")

    return updated
  }

  /**
   * Increment vote count
   */
  async incrementVotes(id: string, delta: number = 1): Promise<void> {
    await this.docRef(id).update({
      votes: FieldValue.increment(delta),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  /**
   * Add subscriber to item
   */
  async addSubscriber(itemId: string, email: string): Promise<void> {
    await this.docRef(itemId).collection("subscribers").doc(email).set({
      email,
      createdAt: FieldValue.serverTimestamp(),
    })
  }

  /**
   * Remove subscriber from item
   */
  async removeSubscriber(itemId: string, email: string): Promise<void> {
    await this.docRef(itemId).collection("subscribers").doc(email).delete()
  }

  /**
   * Get subscribers for item
   */
  async getSubscribers(itemId: string): Promise<string[]> {
    const snapshot = await this.docRef(itemId).collection("subscribers").get()
    return snapshot.docs.map((doc) => doc.id)
  }
}

// Singleton instance
export const itemRepository = new ItemRepository()
