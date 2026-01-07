import type { DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore"
import { FieldValue } from "firebase-admin/firestore"
import { BaseRepository } from "./base.repository"
import type { Roadmap, RoadmapDocument, PaginatedResponse, ThemeConfig, ViewConfig } from "@/types"

export interface CreateRoadmapInput {
  title: string
  slug: string
  publicTitle?: string
  description?: string
  workspaceId?: string
  ownerId?: string
  themeConfig?: ThemeConfig
  viewConfig?: ViewConfig
}

export interface UpdateRoadmapInput {
  title?: string
  publicTitle?: string
  description?: string
  themeConfig?: ThemeConfig
  viewConfig?: ViewConfig
}

/**
 * Repository for Roadmap entity operations
 */
export class RoadmapRepository extends BaseRepository<Roadmap> {
  constructor() {
    super("roadmaps")
  }

  protected fromFirestore(doc: QueryDocumentSnapshot<DocumentData>): Roadmap {
    const data = doc.data() as RoadmapDocument
    return {
      id: doc.id,
      title: data.title,
      slug: data.slug,
      publicTitle: data.publicTitle,
      description: data.description,
      workspaceId: data.workspaceId,
      ownerId: data.ownerId,
      itemCount: data.itemCount || 0,
      themeConfig: data.themeConfig || {},
      viewConfig: data.viewConfig || { defaultZoom: "standard", availableViews: [] },
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  }

  /**
   * Find roadmap by slug
   */
  async findBySlug(slug: string): Promise<Roadmap | null> {
    const snapshot = await this.collection.where("slug", "==", slug).limit(1).get()

    if (snapshot.empty) return null
    return this.fromFirestore(snapshot.docs[0])
  }

  /**
   * Find roadmaps by workspace
   */
  async findByWorkspace(workspaceId: string): Promise<Roadmap[]> {
    const snapshot = await this.collection
      .where("workspaceId", "==", workspaceId)
      .orderBy("createdAt", "desc")
      .get()

    return snapshot.docs.map((doc) => this.fromFirestore(doc))
  }

  /**
   * Find roadmaps with pagination
   */
  async findPaginated(limit: number = 20, cursor?: string): Promise<PaginatedResponse<Roadmap>> {
    let query = this.collection.orderBy("createdAt", "desc").limit(limit + 1)

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
   * Create a new roadmap
   */
  async create(input: CreateRoadmapInput): Promise<Roadmap> {
    const docRef = this.collection.doc()

    const data: Omit<RoadmapDocument, "createdAt" | "updatedAt"> & {
      createdAt: FieldValue
      updatedAt: FieldValue
    } = {
      title: input.title,
      slug: input.slug,
      publicTitle: input.publicTitle || input.title,
      description: input.description,
      workspaceId: input.workspaceId || "default",
      ownerId: input.ownerId,
      itemCount: 0,
      themeConfig: input.themeConfig || {},
      viewConfig: input.viewConfig || { defaultZoom: "standard", availableViews: [] },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    await docRef.set(data)

    // Fetch the created document to get server timestamp
    const created = await this.findById(docRef.id)
    if (!created) throw new Error("Failed to create roadmap")

    return created
  }

  /**
   * Update a roadmap
   */
  async update(id: string, input: UpdateRoadmapInput): Promise<Roadmap> {
    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (input.title !== undefined) updateData.title = input.title
    if (input.publicTitle !== undefined) updateData.publicTitle = input.publicTitle
    if (input.description !== undefined) updateData.description = input.description
    if (input.themeConfig !== undefined) updateData.themeConfig = input.themeConfig
    if (input.viewConfig !== undefined) updateData.viewConfig = input.viewConfig

    await this.docRef(id).update(updateData)

    const updated = await this.findById(id)
    if (!updated) throw new Error("Roadmap not found after update")

    return updated
  }

  /**
   * Increment item count
   */
  async incrementItemCount(id: string, delta: number = 1): Promise<void> {
    await this.docRef(id).update({
      itemCount: FieldValue.increment(delta),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    const existing = await this.findBySlug(slug)
    if (!existing) return true
    return excludeId ? existing.id === excludeId : false
  }
}

// Singleton instance
export const roadmapRepository = new RoadmapRepository()
