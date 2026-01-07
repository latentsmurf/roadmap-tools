import Google from "next-auth/providers/google"
import type { NextAuthConfig } from "next-auth"

export default {
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnAdmin = nextUrl.pathname.startsWith("/admin")
      const isOnLogin = nextUrl.pathname === "/login"

      // Allow access to login page always
      if (isOnLogin) {
        // Redirect to admin if already logged in
        if (isLoggedIn) {
          return Response.redirect(new URL("/admin", nextUrl))
        }
        return true
      }

      // Admin routes require authentication
      if (isOnAdmin) {
        if (!isLoggedIn) {
          return false // Redirect to login
        }
        // Role check is done at the page level for now
        // since middleware doesn't have access to full session
        return true
      }

      // Public routes
      return true
    },
  },
} satisfies NextAuthConfig
