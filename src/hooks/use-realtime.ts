"use client"

import { useState, useEffect } from "react"
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  QueryConstraint,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Item, Roadmap, Group, ItemStatus } from "@/types"

interface UseRealtimeOptions {
  enabled?: boolean
}

interface RealtimeState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

/**
 * Hook for real-time roadmap data subscription
 */
export function useRealtimeRoadmap(
  workspaceId: string,
  slug: string,
  options: UseRealtimeOptions = {}
) {
  const { enabled = true } = options
  const [state, setState] = useState<RealtimeState<Roadmap>>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!enabled || !workspaceId || !slug) {
      setState((prev) => ({ ...prev, loading: false }))
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    // Query for roadmap by slug and workspaceId
    const roadmapsRef = collection(db, "roadmaps")
    const q = query(roadmapsRef, where("slug", "==", slug), where("workspaceId", "==", workspaceId))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setState({
            data: null,
            loading: false,
            error: new Error("Roadmap not found"),
          })
          return
        }

        const roadmapDoc = snapshot.docs[0]
        const roadmap = {
          id: roadmapDoc.id,
          ...roadmapDoc.data(),
        } as Roadmap

        setState({
          data: roadmap,
          loading: false,
          error: null,
        })
      },
      (error) => {
        console.error("Realtime roadmap error:", error)
        setState({
          data: null,
          loading: false,
          error: error as Error,
        })
      }
    )

    return () => unsubscribe()
  }, [workspaceId, slug, enabled])

  return state
}

/**
 * Hook for real-time items subscription
 */
export function useRealtimeItems(
  roadmapId: string | undefined,
  options: UseRealtimeOptions & {
    statusFilter?: ItemStatus[]
  } = {}
) {
  const { enabled = true, statusFilter } = options
  const [state, setState] = useState<RealtimeState<Item[]>>({
    data: null,
    loading: true,
    error: null,
  })

  // Extract to a stable dependency value
  const statusFilterKey = statusFilter?.join(",")

  useEffect(() => {
    if (!enabled || !roadmapId) {
      setState({ data: [], loading: false, error: null })
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    // Build query with optional filters
    const itemsRef = collection(db, "items")
    const constraints: QueryConstraint[] = [
      where("roadmapId", "==", roadmapId),
      orderBy("createdAt", "desc"),
    ]

    // Add status filter if provided
    if (statusFilter && statusFilter.length > 0) {
      constraints.push(where("status", "in", statusFilter))
    }

    const q = query(itemsRef, ...constraints)

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Item[]

        setState({
          data: items,
          loading: false,
          error: null,
        })
      },
      (error) => {
        console.error("Realtime items error:", error)
        setState({
          data: [],
          loading: false,
          error: error as Error,
        })
      }
    )

    return () => unsubscribe()
  }, [roadmapId, enabled, statusFilter, statusFilterKey])

  return state
}

/**
 * Hook for real-time groups subscription
 */
export function useRealtimeGroups(roadmapId: string | undefined, options: UseRealtimeOptions = {}) {
  const { enabled = true } = options
  const [state, setState] = useState<RealtimeState<Group[]>>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!enabled || !roadmapId) {
      setState({ data: [], loading: false, error: null })
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    // Groups are stored as a subcollection under roadmaps
    const groupsRef = collection(db, "roadmaps", roadmapId, "groups")
    const q = query(groupsRef, orderBy("order", "asc"))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const groups = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Group[]

        setState({
          data: groups,
          loading: false,
          error: null,
        })
      },
      (error) => {
        console.error("Realtime groups error:", error)
        setState({
          data: [],
          loading: false,
          error: error as Error,
        })
      }
    )

    return () => unsubscribe()
  }, [roadmapId, enabled])

  return state
}

/**
 * Hook for real-time single item subscription (for detail view)
 */
export function useRealtimeItem(itemId: string | undefined, options: UseRealtimeOptions = {}) {
  const { enabled = true } = options
  const [state, setState] = useState<RealtimeState<Item>>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!enabled || !itemId) {
      setState((prev) => ({ ...prev, loading: false }))
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    const itemRef = doc(db, "items", itemId)

    const unsubscribe = onSnapshot(
      itemRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setState({
            data: null,
            loading: false,
            error: new Error("Item not found"),
          })
          return
        }

        const item = {
          id: snapshot.id,
          ...snapshot.data(),
        } as Item

        setState({
          data: item,
          loading: false,
          error: null,
        })
      },
      (error) => {
        console.error("Realtime item error:", error)
        setState({
          data: null,
          loading: false,
          error: error as Error,
        })
      }
    )

    return () => unsubscribe()
  }, [itemId, enabled])

  return state
}

/**
 * Hook for real-time vote count subscription
 * Optimized for just the vote count to minimize data transfer
 */
export function useRealtimeVotes(itemId: string | undefined, options: UseRealtimeOptions = {}) {
  const { enabled = true } = options
  const [votes, setVotes] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled || !itemId) {
      setLoading(false)
      return
    }

    setLoading(true)

    const itemRef = doc(db, "items", itemId)

    const unsubscribe = onSnapshot(
      itemRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setVotes(snapshot.data()?.votes || 0)
        }
        setLoading(false)
      },
      (error) => {
        console.error("Realtime votes error:", error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [itemId, enabled])

  return { votes, loading }
}
