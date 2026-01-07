"use client"

import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { useSession } from "next-auth/react"
import type { Workspace } from "@/types"

interface WorkspaceContextValue {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  isLoading: boolean
  error: Error | null
  setCurrentWorkspace: (workspace: Workspace) => void
  refreshWorkspaces: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

/**
 * Hook to access workspace context
 */
export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider")
  }
  return context
}

/**
 * Hook to fetch workspaces for current user
 */
export function useUserWorkspaces() {
  const { data: session, status } = useSession()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchWorkspaces = useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.id) {
      setWorkspaces([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/v1/workspaces")
      if (!response.ok) {
        throw new Error("Failed to fetch workspaces")
      }
      const data = await response.json()
      setWorkspaces(data.workspaces || [])
    } catch (err) {
      setError(err as Error)
      setWorkspaces([])
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, status])

  useEffect(() => {
    fetchWorkspaces()
  }, [fetchWorkspaces])

  return {
    workspaces,
    isLoading,
    error,
    refetch: fetchWorkspaces,
  }
}

/**
 * Hook to manage current workspace selection
 */
export function useCurrentWorkspace() {
  const STORAGE_KEY = "roadmap-tools-current-workspace"

  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem(STORAGE_KEY)
  })

  const setCurrentWorkspace = useCallback((workspace: Workspace | null) => {
    if (workspace) {
      localStorage.setItem(STORAGE_KEY, workspace.id)
      setCurrentWorkspaceId(workspace.id)
    } else {
      localStorage.removeItem(STORAGE_KEY)
      setCurrentWorkspaceId(null)
    }
  }, [])

  return {
    currentWorkspaceId,
    setCurrentWorkspace,
  }
}

export { WorkspaceContext }
export type { WorkspaceContextValue }
