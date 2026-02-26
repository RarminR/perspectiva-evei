export interface SignedCookies {
  "CloudFront-Policy": string
  "CloudFront-Signature": string
  "CloudFront-Key-Pair-Id": string
}

export interface CookieOptions {
  domain: string
  path: string
  secure: boolean
  httpOnly: boolean
  sameSite: "strict" | "lax" | "none"
  maxAge: number // seconds
}

export interface SignedCookiesResult {
  cookies: SignedCookies
  cookieOptions: CookieOptions
}

export interface TranscodeJobParams {
  s3InputKey: string
  outputPrefix: string
  jobTemplateName?: string
}

export interface TranscodeJobResult {
  jobId: string
  status: string
  createdAt: string
}
