import { auth } from "@/lib/auth-edge"
import { checkRateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

const AUTH_LIMIT = { limit: 50, windowMs: 60 * 1000 }
const CHECKOUT_LIMIT = { limit: 5, windowMs: 60 * 1000 }
const CONTACT_LIMIT = { limit: 3, windowMs: 60 * 1000 }

type AuthRequest = {
  nextUrl: URL
  auth: { user?: { id?: string; role?: string } } | null
  url: string
  headers?: Headers
}

/**
 * Middleware callback — exported separately for unit testing.
 * In production, this is wrapped by NextAuth's `auth()`.
 */
export async function middlewareCallback(req: AuthRequest) {
  const { nextUrl, auth: session } = req

  const forwardedFor = req.headers?.get("x-forwarded-for")
  const realIp = req.headers?.get("x-real-ip")
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown"
  const pathname = nextUrl.pathname

  if (pathname.startsWith("/api/auth")) {
    const result = checkRateLimit(`auth:${ip}`, AUTH_LIMIT)
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Prea multe incercari. Incearca din nou mai tarziu." },
        {
          status: 429,
          headers: { "Retry-After": String(result.retryAfter ?? 0) },
        }
      )
    }
  }

  if (pathname.startsWith("/api/checkout")) {
    const result = checkRateLimit(`checkout:${ip}`, CHECKOUT_LIMIT)
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Prea multe cereri. Incearca din nou mai tarziu." },
        {
          status: 429,
          headers: { "Retry-After": String(result.retryAfter ?? 0) },
        }
      )
    }
  }

  if (pathname === "/api/contact") {
    const result = checkRateLimit(`contact:${ip}`, CONTACT_LIMIT)
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Prea multe mesaje. Incearca din nou mai tarziu." },
        {
          status: 429,
          headers: { "Retry-After": String(result.retryAfter ?? 0) },
        }
      )
    }
  }

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

  if (nextUrl.pathname === "/dashboard" && isAdmin) {
    return NextResponse.redirect(new URL("/admin", nextUrl))
  }

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(
      new URL(`/logare?callbackUrl=${nextUrl.pathname}`, nextUrl)
    )
  }

  const fingerprint = req.headers?.get('x-device-fingerprint')
  if (isLoggedIn && isProtected && fingerprint && session?.user?.id) {
    const response = await fetch(`${nextUrl.origin}/api/devices/validate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: req.headers?.get('cookie') || '',
      },
      body: JSON.stringify({ fingerprint }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Dispozitiv neautorizat' }, { status: 403 })
    }
  }

  return NextResponse.next()
}

export default auth((req) => {
  return middlewareCallback(req as unknown as AuthRequest)
})

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
    "/api/auth/:path*",
    "/api/checkout/:path*",
    "/api/contact",
  ],
}
