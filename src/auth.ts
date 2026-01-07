import NextAuth from "next-auth"
import { FirestoreAdapter } from "@auth/firebase-adapter"
import { adminDb } from "@/lib/firebase-admin"
import authConfig from "./auth.config"
import type { UserRole } from "@/types"

// Extend the User type to include role
declare module "next-auth" {
  interface User {
    role?: UserRole
  }

  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: UserRole
    }
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role?: UserRole
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: FirestoreAdapter(adminDb),
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id

        // Fetch user role from Firestore
        try {
          const userDoc = await adminDb.collection("users").doc(user.id).get()
          const userData = userDoc.data()
          session.user.role = (userData?.role as UserRole) || "viewer"

          // If this is the first user or no role set, make them admin
          if (!userData?.role) {
            const usersCount = await adminDb.collection("users").count().get()
            const isFirstUser = usersCount.data().count <= 1

            const role: UserRole = isFirstUser ? "admin" : "viewer"
            await adminDb.collection("users").doc(user.id).update({ role })
            session.user.role = role
          }
        } catch (error) {
          console.error("Error fetching user role:", error)
          session.user.role = "viewer"
        }
      }
      return session
    },
  },
})
