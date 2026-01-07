import type { UserRole } from "@/types"

/**
 * Available actions in the system
 */
export type Action =
  // Roadmap actions
  | "roadmap:create"
  | "roadmap:read"
  | "roadmap:update"
  | "roadmap:delete"
  | "roadmap:manage"
  // Item actions
  | "item:create"
  | "item:read"
  | "item:update"
  | "item:delete"
  | "item:vote"
  // Group actions
  | "group:create"
  | "group:read"
  | "group:update"
  | "group:delete"
  // Admin actions
  | "admin:access"
  | "admin:users"
  | "admin:settings"

/**
 * Resource types
 */
export type Resource = "roadmap" | "item" | "group" | "user" | "admin"

/**
 * Permission definition
 */
export interface Permission {
  action: Action
  resource: Resource
}

/**
 * Role-based permissions mapping
 */
const rolePermissions: Record<UserRole, Action[]> = {
  admin: [
    // Full access to everything
    "roadmap:create",
    "roadmap:read",
    "roadmap:update",
    "roadmap:delete",
    "roadmap:manage",
    "item:create",
    "item:read",
    "item:update",
    "item:delete",
    "item:vote",
    "group:create",
    "group:read",
    "group:update",
    "group:delete",
    "admin:access",
    "admin:users",
    "admin:settings",
  ],
  editor: [
    // Can manage content but not users/settings
    "roadmap:create",
    "roadmap:read",
    "roadmap:update",
    "roadmap:manage",
    "item:create",
    "item:read",
    "item:update",
    "item:delete",
    "item:vote",
    "group:create",
    "group:read",
    "group:update",
    "group:delete",
    "admin:access",
  ],
  viewer: [
    // Read-only access + voting
    "roadmap:read",
    "item:read",
    "item:vote",
    "group:read",
  ],
}

/**
 * Check if a role has permission for an action
 */
export function hasPermission(role: UserRole | undefined, action: Action): boolean {
  if (!role) return false
  return rolePermissions[role]?.includes(action) ?? false
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole | undefined, actions: Action[]): boolean {
  if (!role) return false
  return actions.some((action) => hasPermission(role, action))
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole | undefined, actions: Action[]): boolean {
  if (!role) return false
  return actions.every((action) => hasPermission(role, action))
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Action[] {
  return rolePermissions[role] ?? []
}

/**
 * Check if user can access admin panel
 */
export function canAccessAdmin(role: UserRole | undefined): boolean {
  return hasPermission(role, "admin:access")
}

/**
 * Check if user can manage roadmaps
 */
export function canManageRoadmaps(role: UserRole | undefined): boolean {
  return hasPermission(role, "roadmap:manage")
}

/**
 * Check if user can create content
 */
export function canCreateContent(role: UserRole | undefined): boolean {
  return hasAnyPermission(role, ["item:create", "roadmap:create"])
}

/**
 * Check if user is admin
 */
export function isAdmin(role: UserRole | undefined): boolean {
  return role === "admin"
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
}

/**
 * Comprehensive permission check with ownership
 */
export function checkPermission(
  role: UserRole | undefined,
  action: Action,
  resource?: { ownerId?: string },
  userId?: string
): PermissionCheckResult {
  // No role means no access
  if (!role) {
    return { allowed: false, reason: "Not authenticated" }
  }

  // Admins have full access
  if (role === "admin") {
    return { allowed: true }
  }

  // Check base permission
  if (!hasPermission(role, action)) {
    return { allowed: false, reason: "Insufficient permissions" }
  }

  // For write operations, check ownership if applicable
  const writeActions: Action[] = ["roadmap:update", "roadmap:delete", "item:update", "item:delete"]

  if (writeActions.includes(action) && resource?.ownerId && userId) {
    // At this point, role is not "admin" (admins return early above)
    if (resource.ownerId !== userId) {
      return { allowed: false, reason: "Not the owner of this resource" }
    }
  }

  return { allowed: true }
}
