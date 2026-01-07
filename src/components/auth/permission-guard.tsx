"use client"

import type { ReactNode } from "react"
import { usePermission, useAnyPermission, useAllPermissions } from "@/hooks/use-permissions"
import type { Action } from "@/lib/auth/permissions"

interface PermissionGuardProps {
  children: ReactNode
  /**
   * Single permission to check
   */
  permission?: Action
  /**
   * Multiple permissions - user needs at least one (OR)
   */
  anyOf?: Action[]
  /**
   * Multiple permissions - user needs all (AND)
   */
  allOf?: Action[]
  /**
   * Fallback to render when permission is denied
   */
  fallback?: ReactNode
}

/**
 * Component that conditionally renders children based on user permissions
 *
 * @example
 * // Single permission
 * <PermissionGuard permission="admin:access">
 *   <AdminPanel />
 * </PermissionGuard>
 *
 * @example
 * // Any of multiple permissions
 * <PermissionGuard anyOf={["item:create", "roadmap:create"]}>
 *   <CreateButton />
 * </PermissionGuard>
 *
 * @example
 * // All permissions required
 * <PermissionGuard allOf={["admin:access", "admin:users"]}>
 *   <UserManagement />
 * </PermissionGuard>
 *
 * @example
 * // With fallback
 * <PermissionGuard permission="admin:access" fallback={<UpgradePrompt />}>
 *   <AdminPanel />
 * </PermissionGuard>
 */
export function PermissionGuard({
  children,
  permission,
  anyOf,
  allOf,
  fallback = null,
}: PermissionGuardProps) {
  const hasSinglePermission = usePermission(permission ?? "roadmap:read")
  const hasAny = useAnyPermission(anyOf ?? [])
  const hasAll = useAllPermissions(allOf ?? [])

  let allowed = false

  if (permission) {
    allowed = hasSinglePermission
  } else if (anyOf && anyOf.length > 0) {
    allowed = hasAny
  } else if (allOf && allOf.length > 0) {
    allowed = hasAll
  } else {
    // No permission specified, allow by default
    allowed = true
  }

  if (!allowed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Component that shows children only to admins
 */
export function AdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <PermissionGuard permission="admin:access" fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

/**
 * Component that shows children only to users who can create content
 */
export function CreatorOnly({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <PermissionGuard anyOf={["item:create", "roadmap:create"]} fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}
