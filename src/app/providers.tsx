"use client"

import { useState } from "react"
import { SessionProvider } from "next-auth/react"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { createQueryClient } from "@/lib/query-client"

interface ProvidersProps {
  children: React.ReactNode
}

/**
 * Root providers wrapper for the application
 * Creates a new QueryClient instance per session to avoid sharing state
 * Wraps with SessionProvider for client-side auth access
 */
export function Providers({ children }: ProvidersProps) {
  // Create QueryClient once per component lifecycle
  const [queryClient] = useState(() => createQueryClient())

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </SessionProvider>
  )
}
