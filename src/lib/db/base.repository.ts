import type {
  Firestore,
  CollectionReference,
  DocumentReference,
  Query,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore"
import { adminDb } from "@/lib/firebase-admin"

/**
 * Base repository class with common Firestore operations
 */
export abstract class BaseRepository<T extends { id: string }> {
  protected db: Firestore
  protected collectionName: string

  constructor(collectionName: string) {
    this.db = adminDb
    this.collectionName = collectionName
  }

  /**
   * Get collection reference
   */
  protected get collection(): CollectionReference {
    return this.db.collection(this.collectionName)
  }

  /**
   * Get document reference by ID
   */
  protected docRef(id: string): DocumentReference {
    return this.collection.doc(id)
  }

  /**
   * Transform Firestore document to entity
   */
  protected abstract fromFirestore(doc: QueryDocumentSnapshot<DocumentData>): T

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<T | null> {
    const doc = await this.docRef(id).get()
    if (!doc.exists) return null
    return this.fromFirestore(doc as QueryDocumentSnapshot<DocumentData>)
  }

  /**
   * Find all entities with optional limit
   */
  async findAll(limit?: number): Promise<T[]> {
    let query: Query = this.collection
    if (limit) {
      query = query.limit(limit)
    }
    const snapshot = await query.get()
    return snapshot.docs.map((doc) =>
      this.fromFirestore(doc as QueryDocumentSnapshot<DocumentData>)
    )
  }

  /**
   * Delete entity by ID
   */
  async delete(id: string): Promise<void> {
    await this.docRef(id).delete()
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    const doc = await this.docRef(id).get()
    return doc.exists
  }
}
