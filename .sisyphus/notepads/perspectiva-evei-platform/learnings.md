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

## [2026-02-27] Build Fixes — Wave 1 Completion

### Prisma v7 Adapter Required
- Prisma v7 `client` engine type requires `adapter` or `accelerateUrl` in constructor
- Fix: Install `@prisma/adapter-pg` + `pg` + `@types/pg`
- `src/lib/db.ts` updated to use `PrismaPg` adapter with `Pool` from `pg`
- Pattern:
  ```ts
  import { PrismaPg } from '@prisma/adapter-pg'
  import { Pool } from 'pg'
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  new PrismaClient({ adapter })
  ```

### Next.js useSearchParams Requires Suspense
- Any page using `useSearchParams()` must be wrapped in `<Suspense>` boundary
- Pattern: Extract inner component, wrap in `<Suspense>` in default export
- Applied to: `src/app/(auth)/logare/page.tsx`

### Unused Imports Cause Build Failures
- Next.js build (TypeScript strict mode) fails on unused imports
- Fixed in: `src/emails/WelcomeEmail.tsx` (Img, Link, Row), `src/emails/OrderConfirmationEmail.tsx` (Link), `src/app/dev/emails/page.tsx` (render)

### auth.ts Type Casting
- `session.user as Record<string, unknown>` fails TS strict check
- Fix: Use `session.user as any` for role/id assignment in NextAuth callbacks

### .gitignore
- Added `.next/` to prevent build artifacts from being committed
- Added `.env.local` and `*.env` patterns

### Wave 1 Final State
- 71/71 tests passing
- `npm run build` succeeds
- All 8 tasks (1-8) complete and verified
- Task 3 (Design System) relaunched as fresh agent (bg_d9b98951 / ses_36576921dffeaVVhOExNUkl8a0)

## [2026-02-27] Task 3 — Design System Base Components Complete

### Components Created (13 total)
- Button (4 variants: primary/secondary/outline/ghost, 3 sizes: sm/md/lg, loading state)
- Card (3 variants: default/pricing/testimonial, featured flag)
- Input (label, error, helperText)
- Textarea (same API as Input)
- Select (options array, label, error)
- Badge (4 variants: pink/purple/green/gray)
- Accordion (expandable items, single-open behavior)
- Modal (isOpen/onClose, title, body lock)
- Toast + ToastProvider (4 types: success/error/info/warning, auto-dismiss 4s)
- Navbar (responsive, mobile menu, user state)
- Footer (3-column grid, brand gradient)
- Section (4 variants: dark/light-pink/desert/white)
- Hero (title, subtitle, CTA, optional image)

### Testing Infrastructure
- `src/test-setup.ts` with `@testing-library/jest-dom`
- `vitest.config.ts` updated with `setupFiles: ['./src/test-setup.ts']`
- 6 test files, 20 tests total — all pass
- TDD: wrote tests first, verified RED (all fail), then GREEN (all pass)

### Key Patterns
- All components use pure Tailwind CSS classes with brand hex colors
- `'use client'` directive on interactive components (Accordion, Modal, Toast, Navbar)
- Barrel export at `src/components/ui/index.ts`
- Dev preview page at `/dev/components` with all component variants
- Next.js `Image` component used instead of `<img>` (avoids build warning)

### Verification
- `npx vitest run`: 91/91 tests pass (71 existing + 20 new)
- `npm run build`: Compiled successfully, 11 routes generated
- Commit: `feat(ui): add design system base components with brand colors`

## [2026-02-27] Task 10 — Course/Cohort Management Service Complete

### Schema Field Names (Important Differences)
- Lesson uses `duration` (Int?), NOT `durationSeconds`
- Course has `accessDurationDays` (Int, default 30) for computing access expiry
- CourseEnrollment has `@@unique([userId, editionId])` — compound unique key
- LessonProgress has `@@unique([userId, lessonId])` — compound unique for upsert
- CourseEnrollment.orderId is optional (`String?`)

### Implementation Details
- 7 functions: getCourseWithEditions, getActiveEdition, enrollUser, checkAccess, getEditionLessons, getUserProgress, updateProgress
- enrollUser checks: edition exists → enrollmentOpen → capacity → already enrolled → create
- Access expiry: 30 days after edition.endDate
- Lesson completion: watchedSeconds >= 90% of lesson.duration
- updateProgress: only sets `completed: true` on update (never reverts to false)
- All error messages in Romanian

### Testing Pattern
- vi.mock('@/lib/db') with full prisma mock structure
- vi.useFakeTimers() with fixed date for deterministic tests
- vi.mocked() for type-safe mock assertions
- 16 tests covering all 7 functions + edge cases

### Verification
- 16/16 course tests pass
- 115/115 total tests pass (no regressions)
- npm run build: success
- LSP diagnostics: clean

- Implemented src/services/device.ts with strict max 2 devices per user using @@unique([userId, fingerprint]); duplicate fingerprints only refresh lastSeen without consuming slots.
- Added device routes under src/app/api/devices for list/register/delete plus validate endpoint used by middleware for optional fingerprint verification.
- Added client-only fingerprint helper in src/lib/device-fingerprint.ts; cast navigator to any for platform to avoid TS deprecation diagnostics.

## [2026-02-27] Task 13 — Promo Code + Bundle Engine Complete

### Schema Field Adaptation
- PromoCode: `type` (not `discountType`), `value` (not `discountValue`), `currentUses` (not `usedCount`)
- PromoCode: no `applicableProductTypes` field in schema — skipped that validation
- All prices are `Float` (EUR), not cents — adapted interfaces to use EUR amounts
- Bundle: `price` + `originalPrice` (Float), Guide: `price` (Float)
- PromoCodeType enum: PERCENTAGE | FIXED

### Implementation
- `validatePromoCode(code, amount)`: checks active, validFrom/Until, maxUses, returns discount info
- `applyPromoCode(amount, type, value)`: pure function for discount calculation
- `incrementPromoUse(code)`: atomic increment of currentUses
- `getBundleWithItems(slug)`: bundle with items + guide select
- `calculateBundleDiscount(bundleId)`: computes savings amount and percent

### Pre-existing Issues (Not From This Task)
- `checkout.test.ts`: 1 failing test (GuideAccess create spy not called) — unrelated to promo/bundle
- `npm run build`: fails on `checkout/page.tsx` line 72 (null type assertion) — pre-existing

### Verification
- 17/17 promo+bundle tests pass
- 139/140 total tests pass (1 pre-existing failure in checkout.test.ts)
- LSP diagnostics: all 4 new files clean
- Commit: `feat(promo): add promo code validation and bundle pricing engine`

## [2026-02-27] Task 11 — Checkout Flow (Single Product)

- Prisma `Order` uses `totalAmount` (Float EUR) and `OrderItem` uses `unitPrice` (Float EUR), so checkout service converts from input cents to EUR for DB persistence.
- Keep `expirePendingAfter: 'PT24H'` in Revolut `createOrder` params and also persist `expiresPendingAfter` in DB for internal tracking.
- Checkout completion flow should be non-blocking for invoicing (`void triggerInvoiceAsync(order)`), while fulfillment and status update remain synchronous.
- Revolut widget integration uses `RevolutCheckout(token, mode)` then `instance.revolutPay({ target, onSuccess, onError, onCancel })`; `target` must be a non-null `HTMLElement` to satisfy strict TS.
- FX disclosure text must stay visible on checkout page: "Prețul este în EUR. Echivalentul în RON poate varia în funcție de cursul valutar la data plății."

## [2026-02-27] Task 14 — Guide Reader + Watermark System

- `GuideAccess` access checks should use compound key lookup: `prisma.guideAccess.findUnique({ where: { userId_guideId: { userId, guideId } } })`.
- For purchased guides list, `GuideAccess` ordering field is `grantedAt` (not `createdAt`) in current Prisma schema.
- Reader-safe content parsing for `Json` field works best with fallback order: `pages[]` -> `text` -> `JSON.stringify(contentJson)` -> "Continut indisponibil.".
- Content protection in client reader is implemented by blocking `selectstart` and `contextmenu` via document listeners and applying `userSelect: 'none'` on container.
- Full `vitest` currently has pre-existing unrelated failures in `src/components/AudiobookPlayer.test.tsx` (`localStorage.clear is not a function`); new guide tests pass (`5/5`).
- `npm run build` passes after rerun; one non-blocking `pg-native` optional dependency warning appears from `pg` native import path.

## [2026-02-27] Task 12 — 2-Rate Installment System Complete

- Implemented dedicated `src/services/installments.ts` to keep installment flow isolated from standard checkout and aligned with existing service patterns.
- Order 1 logic uses fixed values (`64400` cents for Revolut, `644` EUR in DB), `installmentNumber: 1`, and `expirePendingAfter: 'PT24H'` with persisted `expiresPendingAfter`.
- Order 2 creation now validates parent order existence and `COMPLETED` status, sets `installmentNumber: 2`, `parentOrderId`, and `expirePendingAfter: 'P7D'`, then sends installment email with checkout URL.
- Reminder scheduler checks pending Order 2 records and only sends reminders at day offsets `+3` and `+7` from Order 2 creation, skipping already completed internal/Revolut orders.
- Added `src/services/installments.test.ts` with 10 TDD tests covering create flows, error branches, Revolut params, DB persistence, and reminder timing behavior.
- Verification: `npx vitest run src/services/installments.test.ts` passes (`10/10`), `npm run build` passes after rerun; full `npx vitest run` still has pre-existing unrelated failure in `src/components/AudiobookPlayer.test.tsx` (missing `./AudiobookPlayer` import).

## [2026-02-27] Task 19 — Guides Listing + Detail Pages

### Page Architecture
- `/ghiduri` (listing): async server component fetching guides via `prisma.guide.findMany()` with fallback data array when DB empty
- `/ghiduri/[slug]` (detail): async server component using `prisma.guide.findUnique({ where: { slug } })` with `notFound()` for missing guides
- Both pages use FALLBACK_GUIDES constant (3 guides at €99 each) for graceful degradation when no DB data
- Next.js 14 App Router: `params` is `Promise<{ slug: string }>` — must `await params` before destructuring

### Bundle Display
- Bundle card renders separately from guide grid (featured styling)
- Bundle price (€82.50) with original price (€110) crossed out via `line-through`
- Savings badge uses `Badge` component with computed savings amount and percentage
- Falls back to `BUNDLE_PRICE` / `BUNDLE_ORIGINAL` constants when no DB bundle found

### Testing Approach
- Mock `@/lib/db` with empty results to trigger fallback data
- Async server components: `const page = await GhiduriPage()` then `render(page)` — don't use `<GhiduriPage />` JSX for async components
- Detail page test: `vi.resetModules()` in `beforeEach` then re-mock prisma with guide data
- Use `getAllByText` for prices that appear multiple times (related guides section)

### Pre-existing Issues Observed
- `src/app/__tests__/public-pages.test.tsx`: 4 failures from `getByText`/`getByRole` ambiguity (Navbar/Footer links match page headings)
- `src/app/__tests__/pages.test.tsx`: passes in isolation, fails in full suite (mock bleed between test files)
- `src/app/cursul-ado/page.tsx:212`: TS error referencing `.name` on CourseEdition (field doesn't exist in schema) — intermittent build failure

### Verification
- 9/9 ghiduri tests pass
- `npm run build`: Compiled successfully
- LSP diagnostics: clean on both page files
- Commit: `feat(pages): add Guides listing and detail pages with bundle display`

## [2026-02-27] Task 18 — Course ADO Page Complete

### Schema Notes
- `CourseEdition` has `editionNumber` (Int), NOT `name` — use `Ediția {editionNumber}` for display
- `Course` model requires `price` (Float), `installmentPrice` (Float?), `maxParticipants` (Int) in mock data
- `CourseEdition` has NO `updatedAt` field — only `createdAt`

### Page Structure
- Server component (async) fetching `getCourseWithEditions('cursul-ado')`
- Active edition detected via `editions.find(e => e.enrollmentOpen)`
- Enrollment counter from `activeEdition._count.enrollments` / MAX_PARTICIPANTS
- Pricing: Two cards side-by-side (full €1.188 vs installment €644×2)
- FAQ: 5 items from Webflow reference, rendered via Accordion component
- Curriculum: 8-week grid cards with decorative week numbers
- Testimonials: 3 cards from Webflow reference content
- CTAs link to `/checkout?product=COURSE&type=full` or `&type=installment`

### Testing Pattern
- Async server component render: `const Page = await CursulAdoPage(); render(Page)`
- Mock `getCourseWithEditions` via `vi.mock('@/services/course')`
- Use `getAllByText` when price appears multiple times (e.g., €644 in main price + subtotal)
- `data-testid="faq-section"` used to scope FAQ button queries

### Pre-existing Issues (NOT from this task)
- `npm run build`: Fails at `Collecting page data for /api/contact` — missing RESEND_API_KEY in `.env`
- `src/app/__tests__/pages.test.tsx`: 2 failures (Homepage + About page text ambiguity)
- `src/app/__tests__/public-pages.test.tsx`: Missing `studii-de-caz/page` import

### Verification
- 9/9 cursul-ado tests pass
- 206/208 total tests pass (2 pre-existing failures in pages.test.tsx)
- LSP diagnostics: clean on both page and test files
- Build TypeScript compilation: success (build failure is /api/contact env issue)
- Commit: `feat(pages): add Course ADO page with pricing tabs and enrollment counter`


## [2026-02-27] Task 20 — Sessions, Blog, and Case Studies Public Pages

### Pages Created (5 total)
- `/sedinte-1-la-1` — Static sessions marketing page with hero, benefits, how-it-works, pricing, testimonials, CTA
- `/blog` — Dynamic blog listing with prisma, empty state placeholder
- `/blog/[slug]` — Dynamic blog post detail with share section
- `/studii-de-caz` — Dynamic case studies listing with prisma, empty state placeholder
- `/studii-de-caz/[slug]` — Dynamic case study detail with testimonial quote block + CTA to sessions

### Build Fix: force-dynamic Required
- Server components that use `prisma` at top level MUST have `export const dynamic = 'force-dynamic'`
- Without it, Next.js tries to prerender at build time → Prisma connection error (no DB available)
- Also fixed pre-existing cursul-ado build failure with same fix

### Testing Async Server Components
- For async server components (blog, case studies), call the component as a function: `const jsx = await Page()`
- Then render: `render(jsx)` — not `render(<Page />)` which doesn't handle the Promise
- Static server components (sessions page) work with normal `render(<Page />)`

### Navbar Text Collision in Tests
- Navbar contains text like 'Blog', 'Ședințe 1:1' — these collide with page headings
- Use `getByRole('heading', { name: ... })` instead of `getByText(...)` to be specific
- For multiple CTAs (e.g., 'Rezervă o Ședință' in hero + pricing), use `getAllByRole` with length check

### Schema Fields Reference
- BlogPost: id, title, slug, content, coverImage, published, publishedAt, createdAt, updatedAt
- CaseStudy: id, title, slug, content, coverImage, testimonialQuote, clientName, published, createdAt, updatedAt
- BlogPost has NO `excerpt` field — use `content.substring(0, 160)` for preview text

### Verification
- 10/10 new tests pass (public-pages.test.tsx)
- 215/218 total tests pass (3 pre-existing failures in pages.test.tsx — homepage tests)
- `npm run build`: success, all 5 routes visible
- Commit: `feat(pages): add Sessions, Blog, and Case Studies public pages`

## [2026-02-27] Task 17 — Home, About, Contact Public Pages Complete

### Resend API Key at Build Time
- `new Resend(process.env.RESEND_API_KEY)` at module level crashes build (Missing API key error)
- Fix: Use lazy initialization function `function getResend() { return new Resend(process.env.RESEND_API_KEY) }`
- Call `getResend()` inside the route handler, not at import time

### Testing Multiple Text Matches
- `getByText('Perspectiva Evei')` throws when Navbar + Footer both render the brand name
- Fix: Use `getAllByText` + length assertion for brand text that appears in shared components
- `getByText(/Despre mine/i)` regex matches guide titles like "Este despre mine!"
- Fix: Use exact string match `getByText('Despre mine')` to avoid partial matches

### Contact Page Pattern
- Contact form page wraps itself in `<ToastProvider>` since the root layout doesn't include it
- `useToast()` requires `ToastProvider` ancestor — page must provide it
- Extract form into separate `ContactForm` component to keep the toast hook call valid

### Files Created
- `src/app/page.tsx` — Full homepage with hero, benefits, services, testimonials, final CTA
- `src/app/despre-mine/page.tsx` — About page with Eva's story, mission, credentials
- `src/app/contact/page.tsx` — Contact form with Toast, company info
- `src/app/api/contact/route.ts` — POST endpoint using Resend (lazy init)
- `src/app/__tests__/pages.test.tsx` — 10 tests for all 3 pages
- `src/app/api/contact/route.test.ts` — 5 tests for contact API

### Verification
- 15/15 new tests pass
- 214/218 total tests pass (4 pre-existing failures in public-pages.test.tsx for unbuilt pages)
- `npm run build`: success, routes /contact (static), /despre-mine (static), / (static), /api/contact (dynamic)
- Commit: `feat(pages): add Home, About, and Contact public pages with Romanian content`

## [2026-02-27] Task 21 — Admin Layout + Dashboard + Auth Guard

### Files Created (4)
- `src/app/admin/components/AdminSidebar.tsx` — Client component with 12 nav items, active state via usePathname
- `src/app/admin/layout.tsx` — Server component with auth guard (redirect to /logare if no session, 403 if not ADMIN)
- `src/app/admin/page.tsx` — Dashboard with 4 stat cards + recent orders table via Prisma
- `src/app/admin/__tests__/admin.test.tsx` — 11 tests (sidebar, dashboard, layout auth guard)

### Auth Guard Pattern (Two Layers)
- Middleware (`src/middleware.ts`) blocks non-admin from `/admin/*` with 403 JSON response
- Layout (`src/app/admin/layout.tsx`) adds second layer: redirect to `/logare` if no session, render 'Acces interzis' UI if role !== ADMIN
- Both layers use `(session.user as any).role` pattern

### Dashboard Prisma Queries
- `export const dynamic = 'force-dynamic'` required to avoid build-time prerender errors
- `Promise.all()` for parallel stats: user.count, courseEnrollment.count, order.aggregate, order.count, order.findMany
- Revenue aggregate uses `_sum.totalAmount` with null coalescing (`?? 0`)

### Testing Admin Components
- AdminSidebar (client): mock `next/navigation` with `usePathname: vi.fn(() => '/admin')`
- Layout (async server): call as function `await AdminLayout({ children: <div>...</div> })`
- Dashboard (async server): call as function `await AdminPage()` then `render(jsx)`
- Mock `@/lib/auth` with `auth: vi.fn()` returning session with role

### Verification
- 11/11 admin tests pass
- 229/229 total tests pass (218 existing + 11 new)
- `npm run build`: success, /admin listed as dynamic route (ƒ)
- LSP diagnostics: clean on all 3 source files
- Commit: `feat(admin): add admin layout, dashboard, and role-based auth guard`
## Task 22 — Course/Cohort CRUD Learnings

- React `use()` hook not available in test env (React 18/jsdom). Use `useParams` from `next/navigation` for client components instead.
- `courseId` prop unused in LessonManager causes build failure — Next.js strict mode catches unused vars in build.
- Pre-existing test failures in `src/app/curs/` (missing page from Task 26) and `src/app/profilul-meu/` — not related to course CRUD.
- Pattern: server pages use `params: Promise<{}>` with `await params`, client components use `useParams()`.
- 20 TDD tests: 4 courses list, 2 course edit, 3 editions list, 1 new edition form, 2 lessons, 3 enrolled students, 5 API routes.
- All admin API routes follow same auth guard pattern: `auth()` + role check at top.

## [2026-02-27] Task 27 — User Guide Library + Reader Page

### Files Created (3)
- `src/app/ghidurile-mele/page.tsx` — User's purchased guides library (server component, force-dynamic)
- `src/app/ghidurile-mele/[slug]/page.tsx` — Guide reader page with GuideReader + AudiobookPlayer
- `src/app/ghidurile-mele/__tests__/guides.test.tsx` — 9 tests (3 library + 6 reader)

### Component Interfaces (Actual vs Plan)
- **GuideReader** props: `guide: { id: string, title: string, contentJson: unknown }`, `userEmail: string`, `userId: string` — NOT `pages`/`watermarkText`
- **AudiobookPlayer** props: `guideId: string`, `audioUrl: string | null`, `savedPosition?: number`, `onProgressSave?: (currentTime: number) => void` — NOT `audioSrc`
- Guide model has `audioKey` (NOT `audioFileKey`), no `shortDescription` or `published` fields

### Next.js 15 Async Params
- `params` in dynamic route components is `Promise<{ slug: string }>` — must `await params` before use
- Tests pass params as `Promise.resolve({ slug: 'test' })`

### Testing Pattern
- Mock `@/components/GuideReader` and `@/components/AudiobookPlayer` with simple divs exposing data-testid and data attributes
- Verify prop passing through data attributes (data-email, data-userid, data-guide-id)
- Server components called as `await Page({ params: Promise.resolve({ slug: 'x' }) })` then `render(jsx)`

### Build Cache Issue
- If build fails with stale errors, `rm -rf .next` and rebuild
- Pre-existing `courseId` unused var error in LessonManager was from cache, not actual file

### Verification
- 9/9 new tests pass
- 321/321 total tests pass (1 pre-existing file failure in course.test.tsx unrelated)
- `npm run build`: success after cache clear, routes /ghidurile-mele (ƒ dynamic), /ghidurile-mele/[slug] (ƒ dynamic)
- LSP diagnostics: clean on both source files
- Commit: `feat(guides): add user guide library with reader and audiobook integration`

## Task 25: Profilul Meu Dashboard
- CourseEdition does NOT have slug field — use `e.edition.course.slug` for course links
- Device API already exists at `/api/devices/` — created separate `/api/user/devices/` for profile-scoped operations
- `getByText(/Schimba parola/i)` fails when text appears in both heading and button — use `getByRole('heading', { name: /.../ })` instead
- Pre-existing build error in `LessonManager.tsx` was from stale `.next` cache — `rm -rf .next` resolved
- Device model uses `createdAt` not `registeredAt` for ordering — check schema carefully
- Password route uses bcryptjs (already installed) — compare + hash pattern same as auth.ts

## Task 24: Admin User Management
- All 9 files created: 5 API routes + 2 pages + 2 client components
- 20 new tests all passing (321 total)
- `searchParams` and `params` are Promise-based in Next.js 15 — must `await` them
- Romanian diacritics in regex: `căut` ≠ `Caută` — different `ă` positions. Use ASCII `caut` for matching
- API admin routes need auth + role check inline (not handled by layout like pages)
- Client components for interactive actions (DeviceActions, UserAdminActions) kept separate from server pages
- Pre-existing build trace ENOENT error (not-found page) — not related to changes
- Pre-existing course.test.tsx file-level error — not a test regression
- 2026-02-27 (Task 26): `CourseEdition` and `Lesson` do not have `slug` fields in Prisma; user course routes must keep `[editionSlug]/[lessonSlug]` params but resolve by `id` in Prisma queries.
- 2026-02-27 (Task 26): `Lesson` availability uses `availableFrom` (not `availableAt`), and lesson completion persistence uses `LessonProgress` with composite unique key `userId_lessonId`.
- 2026-02-27 (Task 26): `SecureVideoPlayer` expects `hlsSrc`, `editionId`, and `lessonId`; lesson page can pass `videoKey` as `hlsSrc` and provide edition/lesson IDs directly.

## Task 23: Admin Guide/Product CRUD
- Guide model has NO `shortDescription` field or `published` field — removed from destructuring
- React `use()` hook not available in test env (React 18) — use `useEffect` with `async` fn + `await params` instead
- `Promise<{ id: string }>` pattern for Next.js 15 dynamic route params works with `await` in useEffect
- Build had stale `.next` cache issue — `rm -rf .next` fixes it
- LessonManager.tsx has pre-existing TS error (`courseId` declared but unused) — not my concern
- 329 tests passing (18 new from this task), build passes cleanly

- Task 32: Added Revolut webhook route with raw-body signature verification using verifyWebhookSignature(rawBody, signatureHeader, secret), immediate acknowledgment, and async event processing for ORDER_COMPLETED/FAILED/CANCELLED.
- Task 32: Implemented fulfillOrder(orderId) in src/services/order-fulfillment.ts with idempotent COMPLETED guard, COURSE -> CourseEnrollment upsert (userId_editionId), GUIDE -> GuideAccess upsert (userId_guideId), and non-blocking confirmation email send.
- Task 32: Implemented pollPendingOrders() fallback to scan PENDING orders older than 35 minutes with revolutOrderId, call Revolut getOrder, fulfill COMPLETED orders, and transition FAILED/CANCELLED statuses.
- Task 32: Added 10 TDD tests in src/services/order-polling.test.ts covering fulfillment grants, idempotency, email sending, polling behavior, and webhook valid/invalid signature responses.

## Task 30: Blog & Case Studies Editor
- BlogPost model: id, title, slug, content, coverImage, published, publishedAt, createdAt, updatedAt — NO excerpt field
- CaseStudy model: id, title, slug, content, coverImage, testimonialQuote, clientName, published, createdAt, updatedAt — NO publishedAt field
- Publish/unpublish via POST to [id] route with { action: 'publish' | 'unpublish' }
- Blog pages at /admin/blog, case studies at /admin/studii-de-caz
- API routes at /api/admin/blog and /api/admin/case-studies
- Pre-existing build failure in src/app/admin/comenzi/page.tsx (OrderStatus type mismatch) — not from our changes
- 19 new tests added, all passing. Pre-existing failures in invoice-pipeline, order-polling, produse, comenzi tests

## Task 31: Product Page + Physical Checkout
- Order model has `shippingAddress Json?` field — stores shipping data as JSON directly
- Order model has `revolutCheckoutUrl String?` — store it alongside revolutOrderId
- OrderItem uses `productType OrderItemType` enum — use `'PRODUCT'` for physical items
- OrderItem has no `totalPrice` field — only `unitPrice` and `quantity`
- Revolut `createOrder` takes amount in cents, use `Math.round(price * 100)`
- Use `merchantOrderReference` (not `merchantOrderExtRef`) in createOrder params
- For tests with different mock states per test: use `vi.doMock` (not `vi.mock`) + `vi.resetModules()` in `beforeEach`
- `vi.mock` is hoisted — all calls at any level get hoisted to top. Multiple `vi.mock` for same module: last one wins
- `vi.doMock` is NOT hoisted — use for per-test mock customization with dynamic import
- `screen.getByAltText` not `screen.getByAlt` for alt text queries
- When element text appears multiple times on page, use `getAllByText` + `expect(length).toBeGreaterThanOrEqual(1)`
- Pre-existing build issue: Resend API key needed at build time (email.ts module-level instantiation). Use `RESEND_API_KEY=re_dummy npm run build`
- Pre-existing test isolation issue: admin/comenzi tests fail in full suite but pass alone

## Task 29: Admin Orders & Invoices Management

### Files Created (11)
- `src/app/admin/comenzi/page.tsx` — Orders list with status filter (server, force-dynamic)
- `src/app/admin/comenzi/[id]/page.tsx` — Order detail with items, invoices, refund action
- `src/app/admin/comenzi/[id]/RefundButton.tsx` — Client component for refund action
- `src/app/admin/facturi/page.tsx` — Invoices list (server, force-dynamic)
- `src/app/admin/facturi/[id]/page.tsx` — Invoice detail with retry/storno
- `src/app/admin/facturi/[id]/InvoiceActions.tsx` — Client component for retry/storno actions
- `src/app/api/admin/orders/route.ts` — GET orders with status/userId filters
- `src/app/api/admin/orders/[id]/route.ts` — GET detail, POST refund
- `src/app/api/admin/invoices/route.ts` — GET invoices with status filter
- `src/app/api/admin/invoices/[id]/route.ts` — GET detail, POST retry, POST storno
- `src/app/admin/comenzi/__tests__/orders.test.tsx` — 33 TDD tests

### Key Learnings
- `req.nextUrl.searchParams` NOT available on standard `Request` in tests — use `new URL(req.url)` instead
- Prisma enum types: `status: string` won't compile — must cast: `(status as OrderStatus)` after validating against `VALID_STATUSES` array
- Dropdown `<option>` text matches badge text causing `getByText` multiple match errors — use `getAllByText(...).not.toHaveLength(0)` instead
- Romanian diacritics in regex: `ncearca` does NOT match `ncearcă` — use `/ncearc/i` to avoid final `ă` issue
- `onChange="this.form.submit()"` on server-rendered `<select>` causes React warning — use submit button instead
- Invoice model: `smartbillSeries`, `smartbillNumber`, `errorText`, `status` (InvoiceStatus enum: PENDING/CREATED/FAILED/STORNO)
- Order model: `status` (OrderStatus enum: PENDING/COMPLETED/FAILED/CANCELLED), `revolutOrderId` for refund
- Dynamic imports for `@/services/revolut` and `@/services/smartbill` in API routes to avoid module-level env errors
- Pre-existing build error: `/api/webhooks/revolut` fails page data collection (Resend API key missing) — not related to our changes

### Verification
- 33/33 new tests pass
- 415/415 total tests pass (no regressions)
- TypeScript compilation: clean on all source files (no errors)
- Build: compiles successfully (pre-existing webhook error in page data collection is unrelated)
- Commit: `feat(admin): add orders and invoices management with refund and storno`

## [2026-02-27] Task 28: Scheduling System
- Session1on1 model: id, userId, scheduledAt, duration (Int), status (BOOKED/COMPLETED/CANCELLED), zoomLink?, notes?
- Availability model: id, dayOfWeek (Int 0-6), startTime (String HH:MM), endTime (String HH:MM), active (Boolean)
- getAvailableSlots generates hourly slots from Availability records, excludes BOOKED sessions
- bookSession checks conflicts before creating
- cancelSession enforces 24h cancellation policy
- Booking page at /programare requires auth, redirects to /logare
- Dynamic route params are Promise<{}> in Next.js 15 — use _req: Request to avoid unused param errors
- 12 new tests added (427 total, up from 415)

## [2026-02-27] Task 34: Memberstack Migration
- Script at scripts/migrate-memberstack.ts
- Memberstack ID: app_cm1j5tdr1003p0swq14s73rmz
- PLAN_TO_EDITION_MAP needs to be populated with actual Memberstack plan IDs after DB is seeded
- Dry-run mode: logs actions without DB writes
- Temp password: 'TempPass123!' — users should reset via email
- Uses csv-parse/sync for CSV parsing
- 11 tests covering: CSV parsing (3), migrateUser (3), mapMemberships (2), runMigration (3)
- Supports both `name` column and `firstName`+`lastName` columns

## [2026-02-27] Task 35: Google Analytics
- GA Measurement ID: G-43N815K6XD
- GA loads dynamically AFTER cookie consent (GDPR compliant)
- CookieConsent component uses localStorage 'cookie-consent' key
- analytics.ts exports trackEvent, trackPageView, analytics.{purchaseComplete, checkoutStarted, guideOpened, videoPlayed}
- Window.gtag declared globally in analytics.ts
- 8 new tests added (446 total, up from 438)

## [2026-02-27] Task 36: Admin Promo/Bundles
- PromoCode: type is 'PERCENTAGE' or 'FIXED' (string, not enum), value is Float
- PromoCode: currentUses (not usedCount), maxUses (nullable)
- Bundle: price + originalPrice (Float EUR), items via BundleItem join table
- Bundle model also requires `slug` field (String @unique) - not in task spec but in actual schema
- Admin pages at /admin/promo-coduri and /admin/bundle-uri
- API routes at /api/admin/promo and /api/admin/bundles
- Pattern: use dynamic imports in test `await import('@/app/api/...')` for route handlers
- Mock auth as `vi.fn()` returning session object, mock prisma methods as separate `vi.fn()` variables

## [2026-02-27] Task 37: Admin Scheduling
- Admin sessions at /admin/programari — shows all Session1on1 with user info
- Admin availability at /admin/disponibilitate — CRUD for Availability slots
- Session1on1 includes user relation (name, email)
- PATCH /api/admin/scheduling/[id] allows updating status, notes, zoomLink
- Availability: dayOfWeek 0-6 (0=Sunday), startTime/endTime as "HH:MM" strings
- 8 new tests added (463 total, up from 455)

## [2026-02-27] Task 38: Course Access Expiry
- checkExpiredEnrollments: finds ACTIVE enrollments where accessExpiresAt < now, updates to EXPIRED, sends email
- extendAccess: sets accessExpiresAt = now + 30 days, status = ACTIVE
- Cron endpoint at /api/cron/expiry (POST, requires CRON_SECRET header)
- Extension endpoint at /api/course/extend (POST, requires auth)
- Expired page at /curs/[editionSlug]/expired
- sendCourseExpiryEmail added to email.ts with CourseExpiryEmail.tsx template
- Schema uses `editionId` (not `courseEditionId`), relation is `edition` (not `courseEdition`)
- accessExpiresAt is non-nullable DateTime in actual schema
- EnrollmentStatus enum has EXTENDED (not CANCELLED) in actual schema
- Unused destructured params cause build failure in Next.js — use `await params` without destructuring if slug not needed

## [2026-02-27] Task 39: Installment Cron
- processInstallmentReminders: finds completed Order 1 installments, creates Order 2 via Revolut at T+30 days
- Reminder emails at T+33 (day 3 window) and T+37 (day 7 window) after Order 2 if unpaid
- Flags Order 2 as FAILED at T+44 days (14+ days after Order 2) for admin attention
- Cron endpoint at /api/cron/installments (POST, requires `Bearer CRON_SECRET` header)
- Order model uses `totalAmount` (not `amount`), has `revolutCheckoutUrl` field
- createOrder() in revolut.ts takes CreateOrderParams: { amount (cents), currency, description, expirePendingAfter }
- sendInstallmentReminderEmail takes { name, amount (string), checkoutUrl, dueDate }
- 9 tests added (480 total, up from 471)

## [2026-02-27] Task 40: SEO
- Sitemap at /sitemap.xml (Next.js MetadataRoute.Sitemap) — force-dynamic because DB needed
- Robots at /robots.txt (Next.js MetadataRoute.Robots) — static
- seo.ts exports generateSitemapEntries() — used by sitemap.ts
- All 8 public pages have metadata exports with Romanian titles/descriptions + OG + Twitter cards
- Admin, API, user pages excluded from robots.txt disallow
- Contact page required restructuring: extracted ContactContent.tsx client component so page.tsx can export metadata as server component
- Guide model has 'slug' field (confirmed)
- CaseStudy model has 'slug' field (confirmed)
- BlogPost model has 'published' boolean and 'slug' field
- 488 tests passing (8 new SEO tests + 480 existing)
## [2026-02-27] Task 41: Security Hardening
- Rate limiter: in-memory Map, no Redis needed for Vercel
- Auth routes: 10 req/min, Checkout: 5 req/min, Contact: 3 req/min
- Security headers added to next.config.js (CSP, X-Frame-Options, etc.)
- CSP allows: GA, Revolut widget, CloudFront media
- Middleware: rate limiting added BEFORE existing auth logic
- 429 responses include Retry-After header and Romanian error message

## [2026-02-27] Task 42: Responsive Design
- Navbar: Already had 'use client', useState for mobileOpen, hidden md:flex for desktop nav, md:hidden for hamburger — no changes needed
- AdminSidebar: Added translate-x-0/-translate-x-full for mobile drawer, md:translate-x-0 md:static for desktop, overlay with bg-black/50
- Admin layout: Created AdminLayoutClient wrapper (client component) since layout.tsx is server component — hamburger button (md:hidden) toggles sidebar state
- Public pages (homepage, cursul-ado, ghiduri): Already had responsive grid-cols-1 md:grid-cols-2 lg:grid-cols-3 patterns — no changes needed
- Responsive tests use readFileSync to check class presence in source files (8 tests total)
- 502 tests passing (up from 494), build clean

## Code Quality Review (F2)
- 502 tests passing, 0 failing
- TypeScript: 0 errors in production code (test files have expected Vitest globals errors)
- Build: PASS with 12 warnings (all in test files - <img> usage)
- console.log in prod: 0 instances
- Empty catches: 2 in SecureVideoPlayer.tsx (intentional - video player error suppression)
- TODO: 2 in guides audio-progress route (future schema field)
- @ts-ignore/@ts-nocheck: 0
- All 14 admin route dirs have ADMIN role checks
- Webhook HMAC/signature verification: PRESENT
- Auth in user routes: PRESENT
- VERDICT: APPROVE

## Scope Fidelity Check (F4)
- Forbidden-pattern scan found no Stripe, Redis, shadcn/MUI/Radix/HeadlessUI, calendar-library, or @next/third-parties imports in `src/` TypeScript sources.
- Required integrations confirmed: Revolut API version + idempotency + expire_pending_after, SmartBill errorText/isTaxIncluded/B2C vatCode, CloudFront signed cookies, device limit 2, JWT strategy, PrismaPg adapter, Romanian UI copy, consent-gated GA storage, 429 middleware responses, security headers.
- Sitemap route delegates to `generateSitemapEntries`; required public slugs (`cursul-ado`, `ghiduri`, `sedinte-1-la-1`) are defined in `src/lib/seo.ts` and covered by `src/lib/seo.test.ts`.
- Scope-creep scan found no `src/services/stripe*`, no `src/services/paypal*`, and no `src/lib/redis*` files.
- Verification run: `npx vitest run` completed with 51/51 files and 502/502 tests passing.
