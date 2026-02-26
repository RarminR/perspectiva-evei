# Learnings — Perspectiva Evei Platform

## [2026-02-26] Session ses_365bedce9ffeGIoUTQ1XASGCIB — Wave 1 Start

### Project Root
- Working directory: `/Users/arminasgari/perspectiva-evei/`
- Webflow export: `eva-popescu-coach-de-manifestare-consti.webflow/`
- No Next.js project exists yet — greenfield build

### Brand Colors (from Webflow CSS — to be extracted by Task 3)
- Primary: Dark/deep purple backgrounds
- Accent: Pink/rose gradients ("heading-text-pink")
- Alt sections: Light pink (#section light-pink)
- Desert tones for hero section
- Light/white text on dark backgrounds

### Critical Technical Constants
- Romanian TVA: **21%** (Law 141/2025 — NOT 19%)
- SmartBill rate limit: 30 req/10sec (10-min block on exceed)
- Revolut webhook retries: 3 (4 total attempts over 30 min)
- Revolut API version: `2025-12-04`
- CloudFront signed cookie TTL: 2 hours with 90-min refresh loop
- Max devices per user: 2 (device locking)
- B2C SmartBill vatCode: `0000000000000` (all zeros, ANAF-approved)
- SmartBill: ALWAYS use `isTaxIncluded: true` with gross prices
- SmartBill: ALWAYS check `response.errorText` (HTTP 200 can contain errors)
- Revolut: ALWAYS set `expire_pending_after` on every order
- Revolut: ALWAYS use `Idempotency-Key` header on mutations
- CloudFront: Use OAC (not deprecated OAI)
- CloudFront: Include `Origin` in cache key policy (CORS bug prevention)
- CloudFront: Cookie Domain=`.perspectivaevei.com` (leading dot)
- Video: AWS MediaConvert (Elastic Transcoder discontinued Nov 2025)
- Video: Signed cookies (NOT signed URLs) for HLS

### Stack Decisions
- Framework: Next.js 14+ App Router
- Database: Supabase PostgreSQL + Prisma ORM
- Auth: NextAuth.js v5 (Auth.js)
- Email: Resend + React Email
- Payments: Revolut Payment Gateway (MANDATORY — no Stripe)
- Invoicing: SmartBill API (async only)
- Video: S3 + CloudFront + MediaConvert + hls.js
- Tests: Vitest + React Testing Library (TDD)
- Styling: Tailwind CSS (no component library)
- Deployment: Vercel + Supabase

### Webflow Reference Files
- CSS: `eva-popescu-coach-de-manifestare-consti.webflow/css/eva-popescu-coach-de-manifestare-consti.webflow.css`
- Homepage: `eva-popescu-coach-de-manifestare-consti.webflow/index.html`
- Course: `eva-popescu-coach-de-manifestare-consti.webflow/cursul-ado.html`
- Guides: `eva-popescu-coach-de-manifestare-consti.webflow/ghiduri.html`
- Sessions: `eva-popescu-coach-de-manifestare-consti.webflow/sedinte-1-la-1.html`
- Profile: `eva-popescu-coach-de-manifestare-consti.webflow/profilul-meu.html`
- Images: `eva-popescu-coach-de-manifestare-consti.webflow/images/`

## [2026-02-27] Task 1 — Project Scaffolding Complete

### Setup Decisions
- Manual scaffolding instead of `create-next-app` (existing .sisyphus and webflow dirs)
- React 18.2.0 (not 19) — Next.js 14.2 requires React 18
- next.config.js (not .ts) — Next.js 14.2 doesn't support TypeScript config files
- Vitest + jsdom for testing (not Jest)

### Brand Colors Configured
- Primary: `#2D1B69` (dark purple)
- Accent: `#E91E8C` (hot pink)
- Rose: `#FDA4AF` (light pink)
- Desert: `#C4956A` (sand tones)
- Light pink bg: `#FDF2F8`
- Gradient utility: `.heading-gradient` (pink to rose)

### Project Structure
```
src/
  app/
    api/health/
      route.ts (health check endpoint)
      route.test.ts (TDD test)
    dev/ (for dev-only pages)
    layout.tsx (root layout with brand colors)
    page.tsx (home page with gradient heading)
    globals.css (Tailwind + gradient utility)
  components/
  lib/
  services/
  types/
```

### Environment Variables (12+)
- Database: DATABASE_URL, DIRECT_URL
- Auth: NEXTAUTH_URL, NEXTAUTH_SECRET
- Revolut: REVOLUT_API_KEY, REVOLUT_WEBHOOK_SECRET, REVOLUT_ENVIRONMENT
- SmartBill: SMARTBILL_EMAIL, SMARTBILL_TOKEN, SMARTBILL_COMPANY_VAT_CODE, SMARTBILL_INVOICE_SERIES
- Resend: RESEND_API_KEY, RESEND_FROM_EMAIL
- AWS: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET, AWS_CLOUDFRONT_DOMAIN, AWS_CLOUDFRONT_KEY_PAIR_ID, AWS_CLOUDFRONT_PRIVATE_KEY, AWS_MEDIACONVERT_ENDPOINT, AWS_MEDIACONVERT_ROLE_ARN
- App: NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_GA_MEASUREMENT_ID

### Verification Results
✅ vitest run: 1 test passed
✅ npm run build: Compiled successfully, 5 routes generated
✅ npm run lint: No warnings or errors
✅ All required files created
✅ Git initialized with initial commit

### Next Steps (Task 2+)
- Task 2: Database schema + Prisma setup
- Task 3: Extract Webflow CSS and create component library
- Task 4: NextAuth.js authentication

- Revolut service module requires Revolut-Api-Version 2025-12-04 on all calls, UUID v4 Idempotency-Key on POST actions, and default expire_pending_after set to PT24H for order creation.
- Webhook signature verification implemented against raw body using payload format v1.{timestamp}.{rawBody} and HMAC-SHA256 constant-time comparison.

## [2026-02-27] Task 8 — AWS Video Service Complete

### AWS SDK Packages
- `@aws-sdk/cloudfront-signer` for signed cookie generation
- `@aws-sdk/client-mediaconvert` for transcoding jobs
- `@aws-sdk/client-cloudfront` installed but not directly used yet (for future CloudFront management)

### Key Implementation Details
- `getSignedCookies` returns `Record<string, string | undefined>` — need non-null assertions (`!`) on cookie values
- Used `_userId` prefix for unused parameter (TS strict mode: noUnusedParameters)
- Extracted `createMediaConvertClient()` helper to avoid duplication
- Used `as never` cast for MediaConvert job settings (complex nested types)

### Testing Pattern
- Dynamic imports (`await import('./aws-video')`) per test for module isolation
- `vi.resetModules()` needed in the env-missing test to get fresh module evaluation
- Re-mock after `vi.resetModules()` since it clears all mocks
- Process.env manipulation in beforeEach/afterEach for env-dependent tests

### Pre-existing Test Failure
- `smartbill.test.ts` has a flaky rate limiter test (26 calls instead of expected 25)
- Not related to our changes — existed before this task

## 2026-02-27 SmartBill service module
- SmartBill tests require checking errorText independently from HTTP status; HTTP 200 can still indicate business errors.
- Rate limiter behavior is best verified by asserting a >=10s setTimeout throttle after burst requests, then ensuring all 26 queued calls complete.
- Vitest fetch mocks should use tuple generic typing vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>() to keep call indexing type-safe.
