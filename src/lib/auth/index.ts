// Re-export from main auth module
export { auth, signIn, signOut } from "@/auth"

// Export permissions
export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissions,
  canAccessAdmin,
  canManageRoadmaps,
  canCreateContent,
  isAdmin,
  checkPermission,
} from "./permissions"

export type { Action, Resource, PermissionCheckResult } from "./permissions"

// Export server utilities
export {
  getSession,
  requireAuth,
  requireAdminAccess,
  requirePermission,
  checkUserPermission,
  getUserRole,
} from "./server"
