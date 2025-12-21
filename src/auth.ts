import NextAuth from "next-auth"
import { FirestoreAdapter } from "@auth/firebase-adapter"
import { adminDb } from "@/lib/firebase-admin"
import authConfig from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    adapter: FirestoreAdapter(adminDb),
    callbacks: {
        ...authConfig.callbacks,
        async session({ session, user }) {
            if (session.user) {
                session.user.id = user.id
            }
            return session
        }
    },
})
