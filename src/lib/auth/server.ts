import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { hasPermission, canAccessAdmin, type Action } from "./permissions"

/**
 * Get the current session with typed user
 */
export async function getSession() {
  return await auth()
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }
  return session
}

/**
 * Require admin access - redirects if not authorized
 */
export async function requireAdminAccess() {
  const session = await requireAuth()
  if (!canAccessAdmin(session.user.role)) {
    redirect("/unauthorized")
  }
  return session
}

/**
 * Require a specific permission - redirects if not authorized
 */
export async function requirePermission(action: Action) {
  const session = await requireAuth()
  if (!hasPermission(session.user.role, action)) {
    redirect("/unauthorized")
  }
  return session
}

/**
 * Check if current user has a permission (non-throwing)
 */
export async function checkUserPermission(action: Action): Promise<boolean> {
  const session = await auth()
  if (!session?.user) return false
  return hasPermission(session.user.role, action)
}

/**
 * Get current user's role
 */
export async function getUserRole() {
  const session = await auth()
  return session?.user?.role
}
