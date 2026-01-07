import { FieldValue } from "firebase-admin/firestore"
import { adminDb } from "@/lib/firebase-admin"
import { logger } from "@/lib/logger"

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  id?: string
  timestamp: Date
  action: AuditAction
  actor: AuditActor
  resource: AuditResource
  result: "success" | "failure"
  reason?: string
  metadata?: Record<string, unknown>
  requestInfo?: RequestInfo
}

/**
 * Actions that can be audited
 */
export type AuditAction =
  // Auth actions
  | "auth:login"
  | "auth:logout"
  | "auth:login_failed"
  // Workspace actions
  | "workspace:create"
  | "workspace:update"
  | "workspace:delete"
  | "workspace:add_member"
  | "workspace:remove_member"
  // Roadmap actions
  | "roadmap:create"
  | "roadmap:update"
  | "roadmap:delete"
  | "roadmap:publish"
  | "roadmap:unpublish"
  // Item actions
  | "item:create"
  | "item:update"
  | "item:delete"
  | "item:vote"
  | "item:subscribe"
  // Admin actions
  | "admin:user_role_change"
  | "admin:settings_update"
  // API actions
  | "api:fluxposter_webhook"
  | "api:rate_limit_exceeded"
  // Generic
  | string

/**
 * Actor who performed the action
 */
export interface AuditActor {
  id: string
  email?: string
  type: "user" | "system" | "api"
  ip?: string
  userAgent?: string
}

/**
 * Resource affected by the action
 */
export interface AuditResource {
  type: "workspace" | "roadmap" | "item" | "group" | "user" | "settings"
  id?: string
  name?: string
}

/**
 * Request information for traceability
 */
export interface RequestInfo {
  ip?: string
  userAgent?: string
  path?: string
  method?: string
  requestId?: string
}

/**
 * Audit log service for recording and querying audit events
 */
class AuditLogService {
  private collectionName = "audit_logs"

  /**
   * Record an audit log entry
   */
  async log(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<string> {
    try {
      const docRef = adminDb.collection(this.collectionName).doc()

      const logEntry = {
        ...entry,
        timestamp: FieldValue.serverTimestamp(),
      }

      await docRef.set(logEntry)

      // Also log to standard logger for real-time monitoring
      logger.audit({
        action: entry.action,
        userId: entry.actor.id,
        resource: entry.resource.type,
        resourceId: entry.resource.id,
        result: entry.result,
        reason: entry.reason,
        ip: entry.requestInfo?.ip,
        userAgent: entry.requestInfo?.userAgent,
        details: entry.metadata,
      })

      return docRef.id
    } catch (error) {
      // Don't throw - audit logging should not break the main flow
      logger.error("Failed to write audit log", error as Error, {
        action: entry.action,
        actorId: entry.actor.id,
      })
      return ""
    }
  }

  /**
   * Convenience method for logging successful actions
   */
  async logSuccess(
    action: AuditAction,
    actor: AuditActor,
    resource: AuditResource,
    metadata?: Record<string, unknown>,
    requestInfo?: RequestInfo
  ): Promise<string> {
    return this.log({
      action,
      actor,
      resource,
      result: "success",
      metadata,
      requestInfo,
    })
  }

  /**
   * Convenience method for logging failed actions
   */
  async logFailure(
    action: AuditAction,
    actor: AuditActor,
    resource: AuditResource,
    reason: string,
    metadata?: Record<string, unknown>,
    requestInfo?: RequestInfo
  ): Promise<string> {
    return this.log({
      action,
      actor,
      resource,
      result: "failure",
      reason,
      metadata,
      requestInfo,
    })
  }

  /**
   * Query audit logs by actor
   */
  async findByActor(actorId: string, limit = 100): Promise<AuditLogEntry[]> {
    try {
      const snapshot = await adminDb
        .collection(this.collectionName)
        .where("actor.id", "==", actorId)
        .orderBy("timestamp", "desc")
        .limit(limit)
        .get()

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      })) as AuditLogEntry[]
    } catch (error) {
      logger.error("Error querying audit logs by actor", error as Error, {
        actorId,
      })
      return []
    }
  }

  /**
   * Query audit logs by resource
   */
  async findByResource(
    resourceType: AuditResource["type"],
    resourceId: string,
    limit = 100
  ): Promise<AuditLogEntry[]> {
    try {
      const snapshot = await adminDb
        .collection(this.collectionName)
        .where("resource.type", "==", resourceType)
        .where("resource.id", "==", resourceId)
        .orderBy("timestamp", "desc")
        .limit(limit)
        .get()

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      })) as AuditLogEntry[]
    } catch (error) {
      logger.error("Error querying audit logs by resource", error as Error, {
        resourceType,
        resourceId,
      })
      return []
    }
  }

  /**
   * Query audit logs by action type
   */
  async findByAction(action: AuditAction, limit = 100): Promise<AuditLogEntry[]> {
    try {
      const snapshot = await adminDb
        .collection(this.collectionName)
        .where("action", "==", action)
        .orderBy("timestamp", "desc")
        .limit(limit)
        .get()

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      })) as AuditLogEntry[]
    } catch (error) {
      logger.error("Error querying audit logs by action", error as Error, {
        action,
      })
      return []
    }
  }

  /**
   * Query audit logs within a time range
   */
  async findByTimeRange(startTime: Date, endTime: Date, limit = 1000): Promise<AuditLogEntry[]> {
    try {
      const snapshot = await adminDb
        .collection(this.collectionName)
        .where("timestamp", ">=", startTime)
        .where("timestamp", "<=", endTime)
        .orderBy("timestamp", "desc")
        .limit(limit)
        .get()

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      })) as AuditLogEntry[]
    } catch (error) {
      logger.error("Error querying audit logs by time range", error as Error, {
        startTime,
        endTime,
      })
      return []
    }
  }

  /**
   * Get recent failed actions (for security monitoring)
   */
  async getRecentFailures(limit = 50): Promise<AuditLogEntry[]> {
    try {
      const snapshot = await adminDb
        .collection(this.collectionName)
        .where("result", "==", "failure")
        .orderBy("timestamp", "desc")
        .limit(limit)
        .get()

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      })) as AuditLogEntry[]
    } catch (error) {
      logger.error("Error querying recent failures", error as Error)
      return []
    }
  }
}

// Export singleton instance
export const auditLog = new AuditLogService()

/**
 * Helper to create system actor
 */
export function systemActor(): AuditActor {
  return {
    id: "system",
    type: "system",
  }
}

/**
 * Helper to create user actor from session
 */
export function userActor(
  userId: string,
  email?: string,
  requestInfo?: { ip?: string; userAgent?: string }
): AuditActor {
  return {
    id: userId,
    email,
    type: "user",
    ip: requestInfo?.ip,
    userAgent: requestInfo?.userAgent,
  }
}

/**
 * Helper to create API actor
 */
export function apiActor(
  apiKeyId: string,
  requestInfo?: { ip?: string; userAgent?: string }
): AuditActor {
  return {
    id: apiKeyId,
    type: "api",
    ip: requestInfo?.ip,
    userAgent: requestInfo?.userAgent,
  }
}
