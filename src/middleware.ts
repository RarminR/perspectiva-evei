import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

type AuthRequest = {
  nextUrl: URL
  auth: { user?: { role?: string } } | null
  url: string
}

/**
 * Middleware callback — exported separately for unit testing.
 * In production, this is wrapped by NextAuth's `auth()`.
 */
export function middlewareCallback(req: AuthRequest) {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session
  const isAdmin = session?.user?.role === "ADMIN"

  // Protected user routes
  const protectedPaths = [
    "/profilul-meu",
    "/curs",
    "/ghiduri",
    "/programare",
  ]
  const isProtected = protectedPaths.some((p) =>
    nextUrl.pathname.startsWith(p)
  )

  // Admin routes
  const isAdminRoute = nextUrl.pathname.startsWith("/admin")

  if (isAdminRoute && !isAdmin) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/logare", nextUrl))
    }
    return NextResponse.json({ error: "Acces interzis" }, { status: 403 })
  }

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(
      new URL(`/logare?callbackUrl=${nextUrl.pathname}`, nextUrl)
    )
  }

  return NextResponse.next()
}

export default auth((req) => {
  return middlewareCallback(req as unknown as AuthRequest)
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
