import { FieldValue, QueryDocumentSnapshot, DocumentData } from "firebase-admin/firestore"
import { adminDb } from "@/lib/firebase-admin"
import { BaseRepository } from "./base.repository"
import type { Workspace, WorkspaceSettings } from "@/types"
import { logger } from "@/lib/logger"

/**
 * Input for creating a workspace
 */
export interface CreateWorkspaceInput {
  name: string
  slug: string
  description?: string
  ownerId: string
  settings?: Partial<WorkspaceSettings>
}

/**
 * Input for updating a workspace
 */
export interface UpdateWorkspaceInput {
  name?: string
  slug?: string
  description?: string
  settings?: Partial<WorkspaceSettings>
}

const DEFAULT_SETTINGS: WorkspaceSettings = {
  isPublic: false,
  allowPublicRoadmaps: true,
}

/**
 * Repository for Workspace entity operations
 */
export class WorkspaceRepository extends BaseRepository<Workspace> {
  constructor() {
    super("workspaces")
  }

  /**
   * Transform Firestore document to Workspace entity
   */
  protected fromFirestore(doc: QueryDocumentSnapshot<DocumentData>): Workspace {
    const data = doc.data()
    return {
      id: doc.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      ownerId: data.ownerId,
      memberIds: data.memberIds || [],
      settings: data.settings || DEFAULT_SETTINGS,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    }
  }

  /**
   * Find workspace by slug
   */
  async findBySlug(slug: string): Promise<Workspace | null> {
    try {
      const snapshot = await adminDb
        .collection(this.collectionName)
        .where("slug", "==", slug)
        .limit(1)
        .get()

      if (snapshot.empty) {
        return null
      }

      const doc = snapshot.docs[0]
      return this.fromFirestore(doc as QueryDocumentSnapshot<DocumentData>)
    } catch (error) {
      logger.error("Error finding workspace by slug", error as Error, { slug })
      throw error
    }
  }

  /**
   * Find workspaces by owner
   */
  async findByOwner(ownerId: string): Promise<Workspace[]> {
    try {
      const snapshot = await adminDb
        .collection(this.collectionName)
        .where("ownerId", "==", ownerId)
        .orderBy("createdAt", "desc")
        .get()

      return snapshot.docs.map((doc) =>
        this.fromFirestore(doc as QueryDocumentSnapshot<DocumentData>)
      )
    } catch (error) {
      logger.error("Error finding workspaces by owner", error as Error, {
        ownerId,
      })
      throw error
    }
  }

  /**
   * Find workspaces where user is a member
   */
  async findByMember(userId: string): Promise<Workspace[]> {
    try {
      const snapshot = await adminDb
        .collection(this.collectionName)
        .where("memberIds", "array-contains", userId)
        .orderBy("createdAt", "desc")
        .get()

      return snapshot.docs.map((doc) =>
        this.fromFirestore(doc as QueryDocumentSnapshot<DocumentData>)
      )
    } catch (error) {
      logger.error("Error finding workspaces by member", error as Error, {
        userId,
      })
      throw error
    }
  }

  /**
   * Find all workspaces a user has access to (owner or member)
   */
  async findByUser(userId: string): Promise<Workspace[]> {
    try {
      // Get workspaces owned by user
      const ownedPromise = this.findByOwner(userId)

      // Get workspaces where user is a member
      const memberPromise = this.findByMember(userId)

      const [owned, member] = await Promise.all([ownedPromise, memberPromise])

      // Merge and deduplicate
      const workspaceMap = new Map<string, Workspace>()
      ;[...owned, ...member].forEach((ws) => {
        workspaceMap.set(ws.id, ws)
      })

      return Array.from(workspaceMap.values()).sort(
        (a, b) => new Date(b.createdAt as Date).getTime() - new Date(a.createdAt as Date).getTime()
      )
    } catch (error) {
      logger.error("Error finding workspaces by user", error as Error, {
        userId,
      })
      throw error
    }
  }

  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    try {
      const existing = await this.findBySlug(slug)
      if (!existing) return true
      if (excludeId && existing.id === excludeId) return true
      return false
    } catch (error) {
      logger.error("Error checking slug availability", error as Error, { slug })
      throw error
    }
  }

  /**
   * Create a new workspace
   */
  async create(input: CreateWorkspaceInput): Promise<Workspace> {
    try {
      // Check slug availability
      const isAvailable = await this.isSlugAvailable(input.slug)
      if (!isAvailable) {
        throw new Error(`Workspace slug "${input.slug}" is already taken`)
      }

      const now = FieldValue.serverTimestamp()
      const docRef = adminDb.collection(this.collectionName).doc()

      const data = {
        name: input.name,
        slug: input.slug,
        description: input.description || null,
        ownerId: input.ownerId,
        memberIds: [input.ownerId], // Owner is automatically a member
        settings: { ...DEFAULT_SETTINGS, ...input.settings },
        createdAt: now,
        updatedAt: now,
      }

      await docRef.set(data)

      logger.audit({
        action: "workspace:create",
        resource: "workspace",
        resourceId: docRef.id,
        userId: input.ownerId,
        result: "success",
        details: { name: input.name, slug: input.slug },
      })

      // Fetch and return the created document
      const created = await this.findById(docRef.id)
      if (!created) {
        throw new Error("Failed to create workspace")
      }

      return created
    } catch (error) {
      logger.error("Error creating workspace", error as Error, { input })
      throw error
    }
  }

  /**
   * Update a workspace
   */
  async update(id: string, input: UpdateWorkspaceInput): Promise<Workspace> {
    try {
      // If updating slug, check availability
      if (input.slug) {
        const isAvailable = await this.isSlugAvailable(input.slug, id)
        if (!isAvailable) {
          throw new Error(`Workspace slug "${input.slug}" is already taken`)
        }
      }

      const docRef = adminDb.collection(this.collectionName).doc(id)
      const doc = await docRef.get()

      if (!doc.exists) {
        throw new Error(`Workspace not found: ${id}`)
      }

      const updateData: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
      }

      if (input.name !== undefined) updateData.name = input.name
      if (input.slug !== undefined) updateData.slug = input.slug
      if (input.description !== undefined) updateData.description = input.description
      if (input.settings) {
        const currentSettings = doc.data()?.settings || {}
        updateData.settings = { ...currentSettings, ...input.settings }
      }

      await docRef.update(updateData)

      logger.audit({
        action: "workspace:update",
        resource: "workspace",
        resourceId: id,
        userId: "system", // TODO: Pass userId from caller
        result: "success",
        details: { updates: Object.keys(input) },
      })

      const updated = await this.findById(id)
      if (!updated) {
        throw new Error("Failed to update workspace")
      }

      return updated
    } catch (error) {
      logger.error("Error updating workspace", error as Error, { id, input })
      throw error
    }
  }

  /**
   * Add a member to workspace
   */
  async addMember(workspaceId: string, userId: string): Promise<void> {
    try {
      const docRef = adminDb.collection(this.collectionName).doc(workspaceId)

      await docRef.update({
        memberIds: FieldValue.arrayUnion(userId),
        updatedAt: FieldValue.serverTimestamp(),
      })

      logger.audit({
        action: "workspace:add_member",
        resource: "workspace",
        resourceId: workspaceId,
        userId: "system", // TODO: Pass actorId from caller
        result: "success",
        details: { memberId: userId },
      })
    } catch (error) {
      logger.error("Error adding member to workspace", error as Error, {
        workspaceId,
        userId,
      })
      throw error
    }
  }

  /**
   * Remove a member from workspace
   */
  async removeMember(workspaceId: string, userId: string): Promise<void> {
    try {
      const workspace = await this.findById(workspaceId)
      if (!workspace) {
        throw new Error(`Workspace not found: ${workspaceId}`)
      }

      // Cannot remove the owner
      if (workspace.ownerId === userId) {
        throw new Error("Cannot remove workspace owner")
      }

      const docRef = adminDb.collection(this.collectionName).doc(workspaceId)

      await docRef.update({
        memberIds: FieldValue.arrayRemove(userId),
        updatedAt: FieldValue.serverTimestamp(),
      })

      logger.audit({
        action: "workspace:remove_member",
        resource: "workspace",
        resourceId: workspaceId,
        userId: "system", // TODO: Pass actorId from caller
        result: "success",
        details: { memberId: userId },
      })
    } catch (error) {
      logger.error("Error removing member from workspace", error as Error, {
        workspaceId,
        userId,
      })
      throw error
    }
  }

  /**
   * Check if user has access to workspace
   */
  async hasAccess(workspaceId: string, userId: string): Promise<boolean> {
    try {
      const workspace = await this.findById(workspaceId)
      if (!workspace) return false

      // Owner always has access
      if (workspace.ownerId === userId) return true

      // Check membership
      return workspace.memberIds.includes(userId)
    } catch (error) {
      logger.error("Error checking workspace access", error as Error, {
        workspaceId,
        userId,
      })
      return false
    }
  }

  /**
   * Get or create default workspace for user
   */
  async getOrCreateDefault(userId: string, userEmail: string): Promise<Workspace> {
    try {
      // Check if user already has workspaces
      const existing = await this.findByOwner(userId)
      if (existing.length > 0) {
        return existing[0]
      }

      // Create default workspace
      const slug = userEmail
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
      const uniqueSlug = await this.generateUniqueSlug(slug)

      return await this.create({
        name: "My Workspace",
        slug: uniqueSlug,
        ownerId: userId,
        settings: {
          isPublic: false,
          allowPublicRoadmaps: true,
        },
      })
    } catch (error) {
      logger.error("Error getting/creating default workspace", error as Error, {
        userId,
      })
      throw error
    }
  }

  /**
   * Generate a unique slug by appending numbers if needed
   */
  private async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug
    let counter = 1

    while (!(await this.isSlugAvailable(slug))) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    return slug
  }
}

// Export singleton instance
export const workspaceRepository = new WorkspaceRepository()
