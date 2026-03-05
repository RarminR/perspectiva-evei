// Lightweight auth config for Edge middleware — no pg/Prisma imports
import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"

const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  providers: [], // providers only needed in full auth.ts
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: "/logare",
  },
}

export const { auth } = NextAuth(authConfig)
