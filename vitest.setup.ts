import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}))

// Mock Next.js cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// Mock environment variables for tests
vi.stubEnv("NODE_ENV", "test")
vi.stubEnv("FIREBASE_PROJECT_ID", "test-project")
vi.stubEnv("FIREBASE_CLIENT_EMAIL", "test@test.iam.gserviceaccount.com")
vi.stubEnv("FIREBASE_PRIVATE_KEY", "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----")
vi.stubEnv("NEXTAUTH_SECRET", "test-secret-at-least-32-characters-long")
vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000")
