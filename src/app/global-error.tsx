"use client"

import { useEffect } from "react"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Global error boundary for root layout errors
 * This catches errors that error.tsx cannot catch
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log to error reporting service
    console.error("Global error:", error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "system-ui, sans-serif",
            backgroundColor: "#fafafa",
          }}
        >
          <div
            style={{
              maxWidth: "400px",
              padding: "32px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                margin: "0 auto 16px",
                borderRadius: "50%",
                backgroundColor: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                marginBottom: "8px",
                color: "#111",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                color: "#666",
                marginBottom: "24px",
              }}
            >
              A critical error occurred. Please refresh the page or try again later.
            </p>
            <button
              onClick={reset}
              style={{
                backgroundColor: "#111",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
