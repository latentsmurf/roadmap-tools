import type { Timestamp } from "firebase-admin/firestore"

// === ENUMS ===

export type ItemStatus = "EXPLORING" | "BUILDING" | "TESTING" | "SHIPPED" | "CANCELLED"

export type ItemConfidence = "TENTATIVE" | "LIKELY" | "CONFIDENT" | "H" | "M" | "L"

export type ZoomLevel = "snapshot" | "standard" | "deep"

export type ViewType = "list" | "board" | "timeline" | "changelog"

export type UserRole = "admin" | "editor" | "viewer"

// === CORE ENTITIES ===

/**
 * Roadmap entity - container for items and groups
 */
export interface Roadmap {
  id: string
  title: string
  slug: string
  publicTitle?: string
  description?: string
  workspaceId: string
  ownerId?: string
  itemCount: number
  themeConfig: ThemeConfig
  viewConfig: ViewConfig
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

/**
 * Roadmap item - a feature, bug, or initiative
 */
export interface Item {
  id: string
  title: string
  description?: string
  contentHtml?: string
  status: ItemStatus
  confidence?: ItemConfidence
  roadmapId: string
  groupId?: string
  votes: number
  featured: boolean
  externalId?: string
  tags?: string[]
  categories?: string[]
  featuredImageUrl?: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

/**
 * Group - category/organization for items
 */
export interface Group {
  id: string
  name: string
  order?: number
  createdAt: Timestamp | Date
}

/**
 * Subscriber - email subscription to item updates
 */
export interface Subscriber {
  email: string
  createdAt: Timestamp | Date
}

/**
 * User entity (managed by NextAuth)
 */
export interface User {
  id: string
  name?: string
  email: string
  image?: string
  role?: UserRole
}

/**
 * Workspace entity - container for roadmaps and team members
 */
export interface Workspace {
  id: string
  name: string
  slug: string
  description?: string
  ownerId: string
  memberIds: string[]
  settings: WorkspaceSettings
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
}

/**
 * Workspace settings
 */
export interface WorkspaceSettings {
  isPublic: boolean
  allowPublicRoadmaps: boolean
  defaultTheme?: ThemeConfig
}

/**
 * Workspace member with role
 */
export interface WorkspaceMember {
  userId: string
  role: WorkspaceRole
  joinedAt: Timestamp | Date
}

/**
 * Workspace-specific roles
 */
export type WorkspaceRole = "owner" | "admin" | "member" | "viewer"

// === CONFIGURATION ===

export interface ThemeConfig {
  primaryColor?: string
  backgroundColor?: string
  fontFamily?: string
  borderRadius?: string
}

export interface ViewConfig {
  defaultZoom: ZoomLevel
  availableViews: ViewType[]
  defaultView?: ViewType
}

// === API TYPES ===

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[]
  nextCursor?: string
  hasMore: boolean
  total?: number
}

/**
 * Server action result
 */
export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; errors?: ValidationError[] }

/**
 * Validation error detail
 */
export interface ValidationError {
  field: string
  message: string
}

// === COMPONENT PROPS ===

/**
 * Props for ItemCard component
 */
export interface ItemCardProps {
  item: Item
  zoom: ZoomLevel
  onClick?: (item: Item) => void
}

/**
 * Props for RoadmapView component
 */
export interface RoadmapViewProps {
  items: Item[]
  groups: Group[]
  roadmap?: Roadmap
  initialZoom?: ZoomLevel
  initialView?: ViewType
}

/**
 * Props for FilterBar component
 */
export interface FilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  statusFilters: ItemStatus[]
  onStatusFiltersChange: (filters: ItemStatus[]) => void
  categoryFilters: string[]
  onCategoryFiltersChange: (filters: string[]) => void
  availableCategories: string[]
}

/**
 * Props for ItemDetailDrawer component
 */
export interface ItemDetailDrawerProps {
  item: Item | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// === FIRESTORE DOCUMENT TYPES ===

/**
 * Roadmap document as stored in Firestore
 */
export interface RoadmapDocument {
  title: string
  slug: string
  publicTitle?: string
  description?: string
  workspaceId: string
  ownerId?: string
  itemCount: number
  themeConfig: ThemeConfig
  viewConfig: ViewConfig
  createdAt: Timestamp
  updatedAt: Timestamp
}

/**
 * Item document as stored in Firestore
 */
export interface ItemDocument {
  title: string
  description?: string
  contentHtml?: string
  status: ItemStatus
  confidence?: ItemConfidence
  roadmapId: string
  groupId?: string
  votes: number
  featured: boolean
  externalId?: string
  tags?: string[]
  categories?: string[]
  featuredImageUrl?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

/**
 * Group document as stored in Firestore
 */
export interface GroupDocument {
  name: string
  order?: number
  createdAt: Timestamp
}

// === UTILITY TYPES ===

/**
 * Make all properties optional except specified keys
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

/**
 * Create input type (omit id and timestamps)
 */
export type CreateInput<T> = Omit<T, "id" | "createdAt" | "updatedAt">

/**
 * Update input type (make all fields partial, keep id required)
 */
export type UpdateInput<T extends { id: string }> = Partial<
  Omit<T, "id" | "createdAt" | "updatedAt">
> &
  Pick<T, "id">
