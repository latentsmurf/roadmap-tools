"use client"

import { useSession } from "next-auth/react"
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessAdmin,
  canManageRoadmaps,
  canCreateContent,
  isAdmin,
  type Action,
} from "@/lib/auth/permissions"
import type { UserRole } from "@/types"

/**
 * Hook to access the current user's role
 */
export function useRole(): UserRole | undefined {
  const { data: session } = useSession()
  return session?.user?.role
}

/**
 * Hook to check permissions in client components
 */
export function usePermission(action: Action): boolean {
  const role = useRole()
  return hasPermission(role, action)
}

/**
 * Hook to check if user has any of the specified permissions
 */
export function useAnyPermission(actions: Action[]): boolean {
  const role = useRole()
  return hasAnyPermission(role, actions)
}

/**
 * Hook to check if user has all of the specified permissions
 */
export function useAllPermissions(actions: Action[]): boolean {
  const role = useRole()
  return hasAllPermissions(role, actions)
}

/**
 * Hook to check admin panel access
 */
export function useCanAccessAdmin(): boolean {
  const role = useRole()
  return canAccessAdmin(role)
}

/**
 * Hook to check roadmap management access
 */
export function useCanManageRoadmaps(): boolean {
  const role = useRole()
  return canManageRoadmaps(role)
}

/**
 * Hook to check content creation access
 */
export function useCanCreateContent(): boolean {
  const role = useRole()
  return canCreateContent(role)
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin(): boolean {
  const role = useRole()
  return isAdmin(role)
}

/**
 * Hook to get all permission utilities
 */
export function usePermissions() {
  const role = useRole()
  const { data: session, status } = useSession()

  return {
    role,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    user: session?.user,
    hasPermission: (action: Action) => hasPermission(role, action),
    hasAnyPermission: (actions: Action[]) => hasAnyPermission(role, actions),
    hasAllPermissions: (actions: Action[]) => hasAllPermissions(role, actions),
    canAccessAdmin: canAccessAdmin(role),
    canManageRoadmaps: canManageRoadmaps(role),
    canCreateContent: canCreateContent(role),
    isAdmin: isAdmin(role),
  }
}
