/**
 * Legacy AWS video service - migrated to Bunny.net
 * Functions kept for backwards compatibility with existing imports.
 */

import type { SignedCookiesResult } from "@/types/aws-video"

const COOKIE_TTL_SECONDS = 7200
const COOKIE_DOMAIN = ".perspectivaevei.com"

/**
 * @deprecated Bunny Stream uses token-based auth, not cookies.
 * Kept for backwards compatibility.
 */
export async function generateSignedCookies(
  _userId: string,
  _resourcePath: string = "/video/*"
): Promise<SignedCookiesResult> {
  return {
    cookies: {
      "CloudFront-Policy": "deprecated",
      "CloudFront-Signature": "deprecated",
      "CloudFront-Key-Pair-Id": "deprecated",
    },
    cookieOptions: {
      domain: COOKIE_DOMAIN,
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "none",
      maxAge: COOKIE_TTL_SECONDS,
    },
  }
}

/**
 * @deprecated
 */
export async function refreshSignedCookies(
  userId: string,
  resourcePath: string = "/video/*"
): Promise<SignedCookiesResult> {
  return generateSignedCookies(userId, resourcePath)
}
