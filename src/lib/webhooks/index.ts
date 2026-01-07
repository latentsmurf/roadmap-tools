import { FieldValue } from "firebase-admin/firestore"
import { adminDb } from "@/lib/firebase-admin"
import { logger } from "@/lib/logger"
import crypto from "crypto"

/**
 * Webhook event types that can trigger notifications
 */
export type WebhookEventType =
  | "item.created"
  | "item.updated"
  | "item.deleted"
  | "item.voted"
  | "item.status_changed"
  | "roadmap.created"
  | "roadmap.updated"
  | "roadmap.deleted"
  | "subscriber.added"

/**
 * Webhook configuration
 */
export interface Webhook {
  id: string
  workspaceId: string
  name: string
  url: string
  secret: string
  events: WebhookEventType[]
  active: boolean
  createdAt: Date
  updatedAt: Date
  lastTriggeredAt?: Date
  failureCount: number
}

/**
 * Webhook payload structure
 */
export interface WebhookPayload {
  event: WebhookEventType
  timestamp: string
  data: Record<string, unknown>
  webhookId: string
}

/**
 * Webhook delivery log entry
 */
export interface WebhookDelivery {
  id: string
  webhookId: string
  event: WebhookEventType
  payload: WebhookPayload
  status: "pending" | "success" | "failed"
  statusCode?: number
  response?: string
  error?: string
  attempts: number
  createdAt: Date
  deliveredAt?: Date
}

/**
 * Input for creating a webhook
 */
export interface CreateWebhookInput {
  workspaceId: string
  name: string
  url: string
  events: WebhookEventType[]
}

/**
 * Input for updating a webhook
 */
export interface UpdateWebhookInput {
  name?: string
  url?: string
  events?: WebhookEventType[]
  active?: boolean
}

const WEBHOOKS_COLLECTION = "webhooks"
const DELIVERIES_COLLECTION = "webhook_deliveries"
const MAX_RETRY_ATTEMPTS = 3
const WEBHOOK_TIMEOUT_MS = 10000

/**
 * Webhook service for managing and delivering webhooks
 */
class WebhookService {
  /**
   * Create a new webhook
   */
  async create(input: CreateWebhookInput): Promise<Webhook> {
    try {
      const docRef = adminDb.collection(WEBHOOKS_COLLECTION).doc()
      const secret = this.generateSecret()
      const now = FieldValue.serverTimestamp()

      const data = {
        workspaceId: input.workspaceId,
        name: input.name,
        url: input.url,
        secret,
        events: input.events,
        active: true,
        createdAt: now,
        updatedAt: now,
        failureCount: 0,
      }

      await docRef.set(data)

      const created = await this.findById(docRef.id)
      if (!created) {
        throw new Error("Failed to create webhook")
      }

      logger.info("Webhook created", {
        webhookId: docRef.id,
        workspaceId: input.workspaceId,
      })

      return created
    } catch (error) {
      logger.error("Error creating webhook", error as Error, { input })
      throw error
    }
  }

  /**
   * Find webhook by ID
   */
  async findById(id: string): Promise<Webhook | null> {
    try {
      const doc = await adminDb.collection(WEBHOOKS_COLLECTION).doc(id).get()
      if (!doc.exists) return null

      const data = doc.data()!
      return {
        id: doc.id,
        workspaceId: data.workspaceId,
        name: data.name,
        url: data.url,
        secret: data.secret,
        events: data.events,
        active: data.active,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastTriggeredAt: data.lastTriggeredAt?.toDate(),
        failureCount: data.failureCount || 0,
      }
    } catch (error) {
      logger.error("Error finding webhook", error as Error, { id })
      throw error
    }
  }

  /**
   * Find webhooks by workspace
   */
  async findByWorkspace(workspaceId: string): Promise<Webhook[]> {
    try {
      const snapshot = await adminDb
        .collection(WEBHOOKS_COLLECTION)
        .where("workspaceId", "==", workspaceId)
        .orderBy("createdAt", "desc")
        .get()

      return snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          workspaceId: data.workspaceId,
          name: data.name,
          url: data.url,
          secret: data.secret,
          events: data.events,
          active: data.active,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastTriggeredAt: data.lastTriggeredAt?.toDate(),
          failureCount: data.failureCount || 0,
        }
      })
    } catch (error) {
      logger.error("Error finding webhooks", error as Error, { workspaceId })
      throw error
    }
  }

  /**
   * Update a webhook
   */
  async update(id: string, input: UpdateWebhookInput): Promise<Webhook> {
    try {
      const docRef = adminDb.collection(WEBHOOKS_COLLECTION).doc(id)
      const updateData: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
      }

      if (input.name !== undefined) updateData.name = input.name
      if (input.url !== undefined) updateData.url = input.url
      if (input.events !== undefined) updateData.events = input.events
      if (input.active !== undefined) updateData.active = input.active

      await docRef.update(updateData)

      const updated = await this.findById(id)
      if (!updated) {
        throw new Error("Webhook not found after update")
      }

      return updated
    } catch (error) {
      logger.error("Error updating webhook", error as Error, { id, input })
      throw error
    }
  }

  /**
   * Delete a webhook
   */
  async delete(id: string): Promise<void> {
    try {
      await adminDb.collection(WEBHOOKS_COLLECTION).doc(id).delete()
      logger.info("Webhook deleted", { webhookId: id })
    } catch (error) {
      logger.error("Error deleting webhook", error as Error, { id })
      throw error
    }
  }

  /**
   * Regenerate webhook secret
   */
  async regenerateSecret(id: string): Promise<string> {
    try {
      const secret = this.generateSecret()
      await adminDb.collection(WEBHOOKS_COLLECTION).doc(id).update({
        secret,
        updatedAt: FieldValue.serverTimestamp(),
      })
      return secret
    } catch (error) {
      logger.error("Error regenerating secret", error as Error, { id })
      throw error
    }
  }

  /**
   * Trigger webhooks for an event
   */
  async trigger(
    workspaceId: string,
    event: WebhookEventType,
    data: Record<string, unknown>
  ): Promise<void> {
    try {
      // Find all active webhooks for this workspace that subscribe to this event
      const webhooks = await this.findByWorkspace(workspaceId)
      const activeWebhooks = webhooks.filter((w) => w.active && w.events.includes(event))

      if (activeWebhooks.length === 0) {
        return
      }

      // Queue deliveries for each webhook
      const deliveryPromises = activeWebhooks.map((webhook) =>
        this.queueDelivery(webhook, event, data)
      )

      await Promise.all(deliveryPromises)
    } catch (error) {
      logger.error("Error triggering webhooks", error as Error, {
        workspaceId,
        event,
      })
      // Don't throw - webhook failures shouldn't break the main flow
    }
  }

  /**
   * Queue a webhook delivery
   */
  private async queueDelivery(
    webhook: Webhook,
    event: WebhookEventType,
    data: Record<string, unknown>
  ): Promise<void> {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      webhookId: webhook.id,
    }

    // Create delivery record
    const deliveryRef = adminDb.collection(DELIVERIES_COLLECTION).doc()
    await deliveryRef.set({
      webhookId: webhook.id,
      event,
      payload,
      status: "pending",
      attempts: 0,
      createdAt: FieldValue.serverTimestamp(),
    })

    // Attempt delivery
    await this.deliverWebhook(deliveryRef.id, webhook, payload)
  }

  /**
   * Deliver a webhook
   */
  private async deliverWebhook(
    deliveryId: string,
    webhook: Webhook,
    payload: WebhookPayload
  ): Promise<void> {
    const deliveryRef = adminDb.collection(DELIVERIES_COLLECTION).doc(deliveryId)
    const webhookRef = adminDb.collection(WEBHOOKS_COLLECTION).doc(webhook.id)

    try {
      // Generate signature
      const signature = this.generateSignature(JSON.stringify(payload), webhook.secret)

      // Make HTTP request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS)

      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": payload.event,
          "X-Webhook-Delivery": deliveryId,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Update delivery status
      if (response.ok) {
        await deliveryRef.update({
          status: "success",
          statusCode: response.status,
          deliveredAt: FieldValue.serverTimestamp(),
          attempts: FieldValue.increment(1),
        })

        // Update webhook last triggered
        await webhookRef.update({
          lastTriggeredAt: FieldValue.serverTimestamp(),
          failureCount: 0,
        })

        logger.info("Webhook delivered successfully", {
          webhookId: webhook.id,
          deliveryId,
          event: payload.event,
        })
      } else {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }
    } catch (error) {
      const errorMessage = (error as Error).message

      // Update delivery with failure
      const doc = await deliveryRef.get()
      const attempts = (doc.data()?.attempts || 0) + 1

      await deliveryRef.update({
        status: attempts >= MAX_RETRY_ATTEMPTS ? "failed" : "pending",
        error: errorMessage,
        attempts,
      })

      // Update webhook failure count
      await webhookRef.update({
        failureCount: FieldValue.increment(1),
      })

      logger.error("Webhook delivery failed", error as Error, {
        webhookId: webhook.id,
        deliveryId,
        attempts,
      })

      // Disable webhook if too many failures
      const webhookDoc = await webhookRef.get()
      if ((webhookDoc.data()?.failureCount || 0) >= 10) {
        await webhookRef.update({ active: false })
        logger.warn("Webhook disabled due to repeated failures", {
          webhookId: webhook.id,
        })
      }
    }
  }

  /**
   * Get delivery history for a webhook
   */
  async getDeliveryHistory(webhookId: string, limit = 50): Promise<WebhookDelivery[]> {
    try {
      const snapshot = await adminDb
        .collection(DELIVERIES_COLLECTION)
        .where("webhookId", "==", webhookId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get()

      return snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          webhookId: data.webhookId,
          event: data.event,
          payload: data.payload,
          status: data.status,
          statusCode: data.statusCode,
          response: data.response,
          error: data.error,
          attempts: data.attempts,
          createdAt: data.createdAt?.toDate() || new Date(),
          deliveredAt: data.deliveredAt?.toDate(),
        }
      })
    } catch (error) {
      logger.error("Error getting delivery history", error as Error, {
        webhookId,
      })
      return []
    }
  }

  /**
   * Generate a random webhook secret
   */
  private generateSecret(): string {
    return `whsec_${crypto.randomBytes(32).toString("hex")}`
  }

  /**
   * Generate HMAC signature for payload
   */
  private generateSignature(payload: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(payload).digest("hex")
  }

  /**
   * Verify webhook signature (for incoming webhooks)
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expected = this.generateSignature(payload, secret)
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  }
}

// Export singleton instance
export const webhookService = new WebhookService()

// Export event trigger helpers
export async function triggerItemCreated(
  workspaceId: string,
  item: Record<string, unknown>
): Promise<void> {
  await webhookService.trigger(workspaceId, "item.created", { item })
}

export async function triggerItemUpdated(
  workspaceId: string,
  item: Record<string, unknown>,
  changes: Record<string, unknown>
): Promise<void> {
  await webhookService.trigger(workspaceId, "item.updated", { item, changes })
}

export async function triggerItemStatusChanged(
  workspaceId: string,
  item: Record<string, unknown>,
  previousStatus: string,
  newStatus: string
): Promise<void> {
  await webhookService.trigger(workspaceId, "item.status_changed", {
    item,
    previousStatus,
    newStatus,
  })
}

export async function triggerItemVoted(
  workspaceId: string,
  item: Record<string, unknown>,
  votes: number
): Promise<void> {
  await webhookService.trigger(workspaceId, "item.voted", { item, votes })
}
