# Perspectiva Evei — Full Platform Build

## TL;DR

> **Quick Summary**: Build a complete Next.js + PostgreSQL platform for Eva Popescu's consciousness manifestation coaching business, replacing the current Webflow + Memberstack + Vimeo + Stripe + Make stack. The platform centralizes cohort-based courses, secure video delivery, digital guides with reader/audiobook, 1:1 session scheduling, Revolut payments, SmartBill invoicing, and full admin management.
> 
> **Deliverables**:
> - Public marketing pages (Home, About, Course, Guides, Sessions, Blog, Case Studies, Contact)
> - Auth system (NextAuth.js) with device locking (max 2 devices)
> - Course module: cohort management, enrollment, secure HLS video player, time-limited access
> - Guide reader: in-platform reading with watermark, audiobook player
> - Checkout: Revolut Payment Gateway with 2-rate installment system
> - Invoicing: SmartBill API integration with TVA 21% (e-Factura compliant)
> - Admin panel: full CRUD for courses, guides, users, orders, sessions, blog, products
> - 1:1 session scheduling with availability management
> - Email transactional via Resend
> - Jute bags physical product checkout
> - User migration tooling from Memberstack
> 
> **Estimated Effort**: XL (40-50 tasks across 6+ waves)
> **Parallel Execution**: YES — 6 waves, 5-8 tasks per wave
> **Critical Path**: Scaffolding → DB Schema → Auth → Revolut Checkout → Course Module → Video Player → Final QA

---

## Context

### Original Request
Eva Popescu needs a custom platform to replace her current stack of Webflow + Memberstack + Vimeo + Stripe + Make. The primary pain points are: video content piracy (Vimeo embeds can be extracted), manual invoicing, no device locking, and fragmented tooling. She specified Next.js + PostgreSQL and Revolut Payment Gateway (lower fees than Stripe).

### Interview Summary
**Key Discussions**:
- **Stack**: Next.js on Vercel + Supabase (PostgreSQL) + Prisma ORM + NextAuth.js
- **Video**: S3 + CloudFront with signed cookies and HLS via MediaConvert (user chose most complex/cheapest option)
- **Payments**: Revolut Payment Gateway (mandatory — not Stripe). Installments via 2 separate orders.
- **Invoicing**: SmartBill API with auto e-Factura. SPV certificate already configured.
- **Design**: Keep dark purple/pink gradient brand, improve UX for platform pages
- **Email**: Resend (React Email templates)
- **Scope**: ALL features in v1 — no phasing
- **Tests**: TDD (RED → GREEN → REFACTOR)

**Research Findings**:
- Revolut: 4 webhook attempts over 30 min, need polling fallback, `expire_pending_after` on orders, `Idempotency-Key` on mutations
- SmartBill: HTTP 200 can contain errors (check `errorText`), use `isTaxIncluded: true`, B2C vatCode `0000000000000`, 30 req/10sec rate limit
- CloudFront: OAC (not OAI), signed cookies with 2h TTL + 90-min refresh, ECDSA P-256 keys, include `Origin` in cache key policy
- Cost: ~$55-80/month for 15 students (current cohort size), scales to ~$360/month at 100 concurrent

### Metis Review (2 rounds)
**Round 1 — Identified Gaps** (addressed):
- TVA rate corrected to 21% (Law 141/2025) — RESOLVED: prices include TVA
- e-Factura mandatory — RESOLVED: SPV already configured
- Revolut no recurring payments — RESOLVED: 2 separate orders for installments
- Video source files — RESOLVED: originals available

**Round 2 — Critical Corrections** (addressed):
- Revolut webhook retries: 3 not 2 (4 total, 30-min window)
- Revolut order TTL: 30-day default, MUST set `expire_pending_after`
- SmartBill: HTTP 200 with `errorText` gotcha, 500 for malformed payloads
- CloudFront costs: ~$55-80/mo realistic for MVP cohort size
- Signed cookie revocation: no native support, use 2h TTL + 90-min refresh
- CORS cache key must include `Origin` header
- FX disclosure needed for installments (EUR→RON varies)
- Screen capture prevention impossible — skip

---

## Work Objectives

### Core Objective
Build a production-ready, self-hosted platform that replaces Eva's 6-tool stack with a single Next.js application, with emphasis on content security (anti-piracy), payment automation (Revolut + SmartBill), and cohort-based course management.

### Concrete Deliverables
- Next.js 14+ App Router application deployed on Vercel
- Supabase PostgreSQL database with Prisma schema
- 8+ public marketing pages (Romanian UI)
- Auth system with device fingerprinting and 2-device lock
- Secure HLS video player with CloudFront signed cookies
- In-platform guide reader with watermark + audiobook player
- Revolut checkout flow with 2-rate installment system
- SmartBill automatic invoicing (TVA 21% inclusive, e-Factura compliant)
- 1:1 session scheduling with calendar integration
- Admin dashboard for all entities
- Blog management system
- Email transactional flows via Resend
- User migration script from Memberstack

### Definition of Done
- [ ] All public pages render correctly in Romanian
- [ ] User can register, login, and manage 2 devices
- [ ] Course purchase completes via Revolut with invoice generated in SmartBill
- [ ] 2-rate installment flow works end-to-end (order 1 → email → order 2)
- [ ] Video plays securely via HLS with signed cookies (no public URL access)
- [ ] Guide reader displays content with watermark, audiobook plays
- [ ] Admin can CRUD all entities
- [ ] All tests pass (`bun test` or `vitest`)
- [ ] Deployed on Vercel with Supabase, accessible at custom domain

### Must Have
- Revolut Payment Gateway (not Stripe) for ALL payments
- SmartBill invoicing with `isTaxIncluded: true` and B2C vatCode `0000000000000`
- TVA 21% on all invoices (Law 141/2025)
- Device locking (max 2 devices per user)
- Signed cookies for video (2h TTL, 90-min refresh)
- `expire_pending_after` on every Revolut order
- `Idempotency-Key` on all Revolut mutating requests
- SmartBill `errorText` checking on every response (not just HTTP status)
- `Origin` in CloudFront cache key policy
- FX rate disclosure on installment checkout
- Romanian UI only

### Must NOT Have (Guardrails)
- ❌ Stripe integration (Revolut only)
- ❌ Screen capture prevention (technically impossible)
- ❌ Forensic video watermarking (enterprise cost, overkill)
- ❌ Multi-language support (Romanian only in v1)
- ❌ Mobile app
- ❌ Recurring subscriptions (Revolut doesn't support)
- ❌ PDF download of guides
- ❌ Over-abstraction or premature framework patterns
- ❌ Relying on HTTP status codes alone for SmartBill errors
- ❌ CloudFront OAI (deprecated — use OAC)
- ❌ Elastic Transcoder (discontinued — use MediaConvert)
- ❌ Vimeo or any third-party video hosting

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (greenfield project)
- **Automated tests**: TDD (RED → GREEN → REFACTOR)
- **Framework**: Vitest (best Next.js integration with App Router)
- **If TDD**: Each task follows RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl) — Send requests, assert status + response fields
- **Video Player**: Use Playwright — Navigate to video, assert playback, screenshot
- **Admin Panel**: Use Playwright — Login as admin, CRUD operations, verify data

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — 8 tasks, all parallel):
├── Task 1: Project scaffolding + config (Next.js, Tailwind, Vitest, ESLint)
├── Task 2: Prisma schema + Supabase setup (all models)
├── Task 3: Design system tokens + base components (colors, typography, layout)
├── Task 4: NextAuth.js setup (email/password, session, middleware)
├── Task 5: Resend email service + React Email templates
├── Task 6: Revolut Payment Gateway service module
├── Task 7: SmartBill invoicing service module
├── Task 8: AWS infrastructure setup (S3 bucket, CloudFront, MediaConvert job template)

Wave 2 (Core Modules — 8 tasks, after Wave 1):
├── Task 9: Device fingerprinting + locking system (depends: 2, 4)
├── Task 10: Course/cohort management module (depends: 2)
├── Task 11: Checkout flow — single product (depends: 2, 6, 7)
├── Task 12: Checkout flow — 2-rate installments (depends: 5, 6, 7, 11)
├── Task 13: Promo code + bundle engine (depends: 2)
├── Task 14: Guide reader + watermark system (depends: 2)
├── Task 15: Audiobook player module (depends: 2)
├── Task 16: Secure video player (HLS + signed cookies + refresh loop) (depends: 8)

Wave 3 (Public Pages + Admin Foundation — 8 tasks, after Wave 2):
├── Task 17: Public pages — Home + About + Contact (depends: 3)
├── Task 18: Public pages — Course (ADO) + pricing (depends: 3, 10)
├── Task 19: Public pages — Guides listing + detail (depends: 3, 14)
├── Task 20: Public pages — 1:1 Sessions + Blog + Case Studies (depends: 3)
├── Task 21: Admin layout + dashboard + auth guard (depends: 3, 4)
├── Task 22: Admin — Course/cohort CRUD (depends: 10, 21)
├── Task 23: Admin — Guide/product CRUD (depends: 14, 21)
├── Task 24: Admin — User management + device admin (depends: 9, 21)

Wave 4 (User Platform + Scheduling — 7 tasks, after Wave 3):
├── Task 25: User dashboard — Profilul meu (depends: 4, 9)
├── Task 26: User — Course access + video lessons page (depends: 10, 16)
├── Task 27: User — Guide library + reader page (depends: 14, 15)
├── Task 28: 1:1 Session scheduling system (depends: 2, 5)
├── Task 29: Admin — Orders/invoices management (depends: 11, 12, 21)
├── Task 30: Admin — Blog editor + Case studies editor (depends: 20, 21)
├── Task 31: Jute bags product page + physical product checkout (depends: 11)

Wave 5 (Integration + Migration — 6 tasks, after Wave 4):
├── Task 32: Revolut webhook handler + polling fallback (depends: 11, 12)
├── Task 33: SmartBill async invoice pipeline (depends: 7, 11)
├── Task 34: Memberstack user migration script (depends: 2, 4)
├── Task 35: Google Analytics integration (depends: 17)
├── Task 36: Admin — Promo codes + bundles management (depends: 13, 21)
├── Task 37: Admin — Scheduling + availability management (depends: 28, 21)

Wave 6 (Polish + Security — 5 tasks, after Wave 5):
├── Task 38: Course access expiry + paid extension flow (depends: 10, 26)
├── Task 39: Installment reminder cron job (depends: 12, 5)
├── Task 40: SEO + Open Graph + Sitemap (depends: 17-20)
├── Task 41: Rate limiting + security hardening (depends: all API routes)
├── Task 42: Responsive design pass + mobile QA (depends: 17-31)

Wave FINAL (Verification — 4 parallel reviewers, after ALL tasks):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA — full E2E (unspecified-high + playwright)
├── Task F4: Scope fidelity check (deep)

Critical Path: T1 → T2 → T10 → T11 → T12 → T26 → T32 → T38 → F1-F4
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 8 (Waves 1-3)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 2-8 | 1 |
| 2 | 1 | 9-16, 28, 34 | 1 |
| 3 | 1 | 17-24 | 1 |
| 4 | 1 | 9, 21, 25, 34 | 1 |
| 5 | 1 | 12, 28, 39 | 1 |
| 6 | 1 | 11, 12 | 1 |
| 7 | 1 | 11, 33 | 1 |
| 8 | 1 | 16 | 1 |
| 9 | 2, 4 | 24, 25 | 2 |
| 10 | 2 | 18, 22, 26, 38 | 2 |
| 11 | 2, 6, 7 | 12, 29, 31, 32, 33 | 2 |
| 12 | 5, 6, 7, 11 | 29, 32, 39 | 2 |
| 13 | 2 | 36 | 2 |
| 14 | 2 | 19, 23, 27 | 2 |
| 15 | 2 | 27 | 2 |
| 16 | 8 | 26 | 2 |
| 17 | 3 | 35, 40 | 3 |
| 18 | 3, 10 | 40 | 3 |
| 19 | 3, 14 | 40 | 3 |
| 20 | 3 | 30, 40 | 3 |
| 21 | 3, 4 | 22-24, 29, 30, 36, 37 | 3 |
| 22 | 10, 21 | — | 3 |
| 23 | 14, 21 | — | 3 |
| 24 | 9, 21 | — | 3 |
| 25 | 4, 9 | — | 4 |
| 26 | 10, 16 | 38 | 4 |
| 27 | 14, 15 | — | 4 |
| 28 | 2, 5 | 37 | 4 |
| 29 | 11, 12, 21 | — | 4 |
| 30 | 20, 21 | — | 4 |
| 31 | 11 | — | 4 |
| 32 | 11, 12 | — | 5 |
| 33 | 7, 11 | — | 5 |
| 34 | 2, 4 | — | 5 |
| 35 | 17 | — | 5 |
| 36 | 13, 21 | — | 5 |
| 37 | 28, 21 | — | 5 |
| 38 | 10, 26 | — | 6 |
| 39 | 12, 5 | — | 6 |
| 40 | 17-20 | — | 6 |
| 41 | all API routes | — | 6 |
| 42 | 17-31 | — | 6 |

### Agent Dispatch Summary

| Wave | Tasks | Categories |
|------|-------|-----------|
| 1 | 8 | T1→quick, T2→quick, T3→visual-engineering, T4→unspecified-high, T5→quick, T6→deep, T7→deep, T8→unspecified-high |
| 2 | 8 | T9→deep, T10→unspecified-high, T11→deep, T12→deep, T13→unspecified-high, T14→deep, T15→unspecified-high, T16→deep |
| 3 | 8 | T17→visual-engineering, T18→visual-engineering, T19→visual-engineering, T20→visual-engineering, T21→visual-engineering, T22→unspecified-high, T23→unspecified-high, T24→unspecified-high |
| 4 | 7 | T25→visual-engineering, T26→deep, T27→visual-engineering, T28→deep, T29→unspecified-high, T30→visual-engineering, T31→visual-engineering |
| 5 | 6 | T32→deep, T33→deep, T34→unspecified-high, T35→quick, T36→unspecified-high, T37→unspecified-high |
| 6 | 5 | T38→unspecified-high, T39→unspecified-high, T40→quick, T41→deep, T42→visual-engineering |
| FINAL | 4 | F1→oracle, F2→unspecified-high, F3→unspecified-high, F4→deep |

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info + QA Scenarios.
> TDD: Each task follows RED (failing test) → GREEN (minimal impl) → REFACTOR.


- [x] 1. Project Scaffolding + Configuration

  **What to do**:
  - Initialize Next.js 14+ project with App Router (`create-next-app` with TypeScript)
  - Configure Tailwind CSS v3 with custom theme (dark purple/pink brand colors from Webflow)
  - Set up Vitest with React Testing Library for component and API route testing
  - Configure ESLint + Prettier with Next.js recommended rules
  - Set up project directory structure: `src/app/`, `src/components/`, `src/lib/`, `src/services/`, `src/types/`
  - Create `.env.local.example` with all required env vars (Supabase, Revolut, SmartBill, Resend, AWS, NextAuth)
  - Configure `next.config.ts` with image domains, security headers
  - TDD: Write a smoke test that verifies the app renders and `/api/health` returns 200

  **Must NOT do**:
  - Do NOT install Stripe or any payment library except `@revolut/checkout`
  - Do NOT add i18n configuration (Romanian only)
  - Do NOT add authentication yet (Task 4)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard scaffolding with well-known tools, no complex logic
  - **Skills**: [`superpowers/test-driven-development`]
    - `superpowers/test-driven-development`: Ensures Vitest is properly configured from the start
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not relevant — no visual components in scaffolding

  **Parallelization**:
  - **Can Run In Parallel**: NO (foundation for all other tasks)
  - **Parallel Group**: Wave 1 — runs first
  - **Blocks**: Tasks 2-8 (all Wave 1 tasks depend on project existing)
  - **Blocked By**: None (starting task)

  **References**:
  **Pattern References**:
  - Webflow CSS: `eva-popescu-coach-de-manifestare-consti.webflow/css/eva-popescu-coach-de-manifestare-consti.webflow.css` — Extract exact hex colors for Tailwind config (dark purple backgrounds, pink/rose gradients, desert hero tones)

  **External References**:
  - Next.js App Router docs: https://nextjs.org/docs/app
  - Vitest with Next.js: https://nextjs.org/docs/app/building-your-application/testing/vitest
  - Tailwind CSS config: https://tailwindcss.com/docs/configuration

  **Acceptance Criteria**:
  - [ ] `vitest run` → PASS (smoke test for app render + health endpoint)
  - [ ] `npx next build` → succeeds without errors
  - [ ] `npx next lint` → no warnings or errors
  - [ ] `.env.local.example` contains all 12+ env vars with descriptions
  - [ ] Tailwind config includes brand colors (purple, pink, rose gradient stops)

  **QA Scenarios:**
  ```
  Scenario: App renders successfully
    Tool: Bash (curl)
    Preconditions: `npm run dev` running on port 3000
    Steps:
      1. curl -s http://localhost:3000 → HTTP 200
      2. curl -s http://localhost:3000/api/health → HTTP 200, body contains {"status":"ok"}
    Expected Result: Both endpoints return 200
    Failure Indicators: Non-200 status code, connection refused, build errors
    Evidence: .sisyphus/evidence/task-1-app-renders.txt

  Scenario: Build succeeds in production mode
    Tool: Bash
    Preconditions: None
    Steps:
      1. npx next build 2>&1 → exit code 0
      2. Check output contains "Generating static pages"
    Expected Result: Build completes without errors
    Failure Indicators: TypeScript errors, missing modules
    Evidence: .sisyphus/evidence/task-1-build-succeeds.txt
  ```

  **Commit**: YES
  - Message: `chore(init): scaffold Next.js project with Tailwind, Vitest, ESLint, Prisma`
  - Files: `package.json, tsconfig.json, next.config.ts, tailwind.config.ts, vitest.config.ts, .eslintrc.json, .env.local.example, src/app/layout.tsx, src/app/page.tsx, src/app/api/health/route.ts`
  - Pre-commit: `vitest run`

- [x] 2. Prisma Schema + Supabase Database Setup

  **What to do**:
  - Install Prisma and configure for Supabase PostgreSQL (`prisma init --datasource-provider postgresql`)
  - Design complete data model covering ALL entities:
    - `User` (id, email, name, hashedPassword, role: ADMIN|USER, createdAt, updatedAt)
    - `Device` (id, userId, fingerprint, name, lastSeen, createdAt) — max 2 per user
    - `Course` (id, title, slug, description, price, installmentPrice, maxParticipants, accessDurationDays)
    - `CourseEdition` (id, courseId, editionNumber, startDate, endDate, enrollmentOpen, maxParticipants)
    - `CourseEnrollment` (id, userId, editionId, orderId, status: ACTIVE|EXPIRED|EXTENDED, accessExpiresAt)
    - `Lesson` (id, editionId, title, order, videoKey, duration, availableFrom)
    - `LessonProgress` (id, userId, lessonId, watchedSeconds, completed)
    - `Guide` (id, title, slug, description, price, coverImage, contentJson, audioKey, audioDuration)
    - `GuideAccess` (id, userId, guideId, orderId, grantedAt)
    - `Bundle` (id, title, slug, price, originalPrice, active)
    - `BundleItem` (id, bundleId, guideId)
    - `Product` (id, title, slug, description, price, type: DIGITAL|PHYSICAL, stock, images)
    - `Order` (id, userId, revolutOrderId, revolutCheckoutUrl, status: PENDING|COMPLETED|FAILED|CANCELLED, totalAmount, currency, installmentNumber, parentOrderId, expiresPendingAfter, createdAt)
    - `OrderItem` (id, orderId, productType: COURSE|GUIDE|BUNDLE|PRODUCT|SESSION, productId, quantity, unitPrice)
    - `Invoice` (id, orderId, smartbillSeries, smartbillNumber, smartbillUrl, status: PENDING|CREATED|FAILED|STORNO, errorText, createdAt)
    - `PromoCode` (id, code, type: PERCENTAGE|FIXED, value, validFrom, validUntil, maxUses, currentUses, active)
    - `Session1on1` (id, userId, scheduledAt, duration, status: BOOKED|COMPLETED|CANCELLED, zoomLink, notes)
    - `Availability` (id, dayOfWeek, startTime, endTime, active) — admin-managed slots
    - `BlogPost` (id, title, slug, content, coverImage, published, publishedAt, createdAt)
    - `CaseStudy` (id, title, slug, content, coverImage, testimonialQuote, clientName, published)
  - Create initial Prisma migration
  - Seed script with test data (1 course, 1 edition, 3 guides, 1 bundle, 1 admin user)
  - TDD: Write tests for seed script + schema validation

  **Must NOT do**:
  - Do NOT add Stripe-related fields
  - Do NOT create user-facing API routes (just schema + seed)
  - Do NOT add complex query logic yet (raw Prisma client only)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Schema design is declarative, no complex runtime logic
  - **Skills**: [`superpowers/test-driven-development`]
    - `superpowers/test-driven-development`: Verify seed script and schema constraints with tests

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 3-8, after Task 1)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 9, 10, 11, 13, 14, 15, 28, 34
  - **Blocked By**: Task 1 (project must exist)

  **References**:
  **Pattern References**:
  - Product catalog from Webflow: `eva-popescu-coach-de-manifestare-consti.webflow/ghiduri.html` — Guide titles, prices, bundle structure
  - Course details: `eva-popescu-coach-de-manifestare-consti.webflow/cursul-ado.html` — Pricing tabs (full/installments), edition structure
  - User profile: `eva-popescu-coach-de-manifestare-consti.webflow/profilul-meu.html` — What user data is collected (name, email, phone)

  **External References**:
  - Prisma schema reference: https://www.prisma.io/docs/orm/reference/prisma-schema-reference
  - Supabase + Prisma: https://supabase.com/partners/integrations/prisma

  **Acceptance Criteria**:
  - [ ] `npx prisma validate` → schema is valid
  - [ ] `npx prisma migrate dev` → migration applies cleanly
  - [ ] `npx prisma db seed` → seed data creates all test entities
  - [ ] All 20+ models present in schema with correct relations
  - [ ] Device model has `@@unique([userId, fingerprint])` constraint
  - [ ] Order model includes `installmentNumber` and `parentOrderId` for 2-rate system
  - [ ] vitest run → seed tests pass

  **QA Scenarios:**
  ```
  Scenario: Schema validates and migrates
    Tool: Bash
    Preconditions: Supabase database running, DATABASE_URL set
    Steps:
      1. npx prisma validate → exit code 0
      2. npx prisma migrate dev --name init → exit code 0, migration created
      3. npx prisma db seed → exit code 0, seed output shows created entities
    Expected Result: All 3 commands succeed
    Failure Indicators: Validation errors, migration conflicts, seed failures
    Evidence: .sisyphus/evidence/task-2-schema-migrates.txt

  Scenario: Seed data integrity
    Tool: Bash
    Preconditions: Migration applied, seed run
    Steps:
      1. npx prisma studio → open, verify tables have data (or use psql query)
      2. Query: SELECT count(*) FROM "Guide" → 3
      3. Query: SELECT count(*) FROM "Bundle" → 1
      4. Query: SELECT count(*) FROM "CourseEdition" → 1
    Expected Result: Correct entity counts
    Failure Indicators: Zero rows, relation errors
    Evidence: .sisyphus/evidence/task-2-seed-integrity.txt
  ```

  **Commit**: YES
  - Message: `feat(db): add Prisma schema with 20+ models and Supabase migration`
  - Files: `prisma/schema.prisma, prisma/migrations/*, prisma/seed.ts`
  - Pre-commit: `npx prisma validate && vitest run`

- [x] 3. Design System Tokens + Base Components

  **What to do**:
  - Extract exact brand colors from Webflow CSS into Tailwind theme:
    - Dark purple backgrounds (primary)
    - Pink/rose gradient stops (accent)
    - Light pink section backgrounds
    - Desert/sand hero tones
    - White/light text colors
  - Create CSS custom properties for gradients (Webflow `heading-text-pink` gradient)
  - Build base UI components (all with Tailwind, no component library):
    - `Button` (primary, secondary, outline, ghost — with icon support)
    - `Card` (guide card, pricing card, testimonial card)
    - `Input`, `Textarea`, `Select` (form elements with Romanian labels)
    - `Badge` (pill badges like "Peste 100 de cursanți mulțumiți")
    - `Accordion` (FAQ style, from Webflow pattern)
    - `Modal` (confirmation dialogs)
    - `Toast` (success/error notifications)
    - `Navbar` (responsive, with dropdown for Servicii)
    - `Footer` (matching Webflow layout)
    - `Section` (dark, light-pink, desert variants)
    - `Hero` (half-text/half-image layout from Webflow)
  - Create Storybook-like visual test page at `/dev/components` (dev-only)
  - TDD: Write component render tests for each base component

  **Must NOT do**:
  - Do NOT install a component library (shadcn, MUI, etc.) — custom Tailwind only
  - Do NOT build page-specific components (those come in Wave 3)
  - Do NOT add animations or transitions yet

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component creation with precise color matching from brand
  - **Skills**: [`frontend-ui-ux`, `superpowers/test-driven-development`]
    - `frontend-ui-ux`: Craft visually accurate brand components
    - `superpowers/test-driven-development`: Component render tests
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed — components tested via Vitest + RTL, not browser

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2, 4-8)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 17-24 (all page-building tasks)
  - **Blocked By**: Task 1 (Tailwind config must exist)

  **References**:
  **Pattern References**:
  - Webflow CSS: `eva-popescu-coach-de-manifestare-consti.webflow/css/eva-popescu-coach-de-manifestare-consti.webflow.css` — Extract exact hex values, font stacks, gradient definitions, spacing
  - Webflow homepage: `eva-popescu-coach-de-manifestare-consti.webflow/index.html` — Hero layout, section patterns, navbar structure, footer
  - Guide cards: `eva-popescu-coach-de-manifestare-consti.webflow/ghiduri.html` — Card layout with image + content + price
  - FAQ accordion: `eva-popescu-coach-de-manifestare-consti.webflow/cursul-ado.html` — Accordion component pattern
  - Brand images: `eva-popescu-coach-de-manifestare-consti.webflow/images/` — Logo files, guide covers for reference

  **External References**:
  - Tailwind custom colors: https://tailwindcss.com/docs/customizing-colors

  **Acceptance Criteria**:
  - [ ] All 12+ base components render without errors
  - [ ] `/dev/components` page shows all components in various states
  - [ ] Brand colors match Webflow within ±5% color accuracy
  - [ ] Gradient text effect matches Webflow `heading-text-pink` class
  - [ ] vitest run → all component tests pass

  **QA Scenarios:**
  ```
  Scenario: Component gallery renders all components
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to http://localhost:3000/dev/components
      2. Assert page contains text "Button" (section heading)
      3. Assert page contains at least 12 component sections
      4. Screenshot full page
    Expected Result: All components visible, no broken layouts
    Failure Indicators: Missing components, broken CSS, hydration errors
    Evidence: .sisyphus/evidence/task-3-component-gallery.png

  Scenario: Brand colors match Webflow design
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to http://localhost:3000/dev/components
      2. Find element with class containing 'bg-primary' or similar dark purple class
      3. Verify computed background-color is within range of Webflow purple
      4. Find gradient text element, screenshot for visual comparison
    Expected Result: Colors visually match Webflow brand
    Failure Indicators: Vastly different colors, missing gradients
    Evidence: .sisyphus/evidence/task-3-brand-colors.png
  ```

  **Commit**: YES
  - Message: `feat(ui): add design system tokens and 12+ base components`
  - Files: `src/components/ui/*, tailwind.config.ts (updated), src/app/dev/components/page.tsx`
  - Pre-commit: `vitest run`


- [x] 4. NextAuth.js Authentication Setup

  **What to do**:
  - Install and configure NextAuth.js v5 (Auth.js) with Prisma adapter
  - Implement email/password credentials provider (bcrypt hashing)
  - Set up session strategy (JWT for stateless, database sessions for device tracking)
  - Create auth middleware protecting `/curs/*`, `/ghiduri/*`, `/profilul-meu`, `/admin/*` routes
  - Build auth pages (all in Romanian):
    - `/logare` — Login form (email + password)
    - `/inregistrare` — Registration form (name, email, password, confirm password)
    - `/resetare-parola` — Password reset request
    - `/resetare-parola/[token]` — Password reset form
  - Implement role-based access: USER and ADMIN roles
  - Admin middleware: `/admin/*` routes only accessible to ADMIN role users
  - TDD: Write tests for login, registration, password reset, role guard, middleware

  **Must NOT do**:
  - Do NOT add social OAuth providers (email/password only)
  - Do NOT implement device fingerprinting yet (Task 9)
  - Do NOT add "remember me" checkbox (JWT expiry handles this)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Auth setup requires careful security considerations and middleware configuration
  - **Skills**: [`superpowers/test-driven-development`]
    - `superpowers/test-driven-development`: Auth flows are critical — must be thoroughly tested
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Auth pages are functional forms, not design-heavy

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2, 3, 5-8)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 9, 21, 25, 34
  - **Blocked By**: Task 1

  **References**:
  **Pattern References**:
  - Auth page patterns: `eva-popescu-coach-de-manifestare-consti.webflow/profilul-meu.html` — Memberstack login/register form fields and Romanian labels
  - Navigation auth state: `eva-popescu-coach-de-manifestare-consti.webflow/index.html` — How navbar shows Logare/Înregistrare vs Profilul meu/Delogheașă-te

  **External References**:
  - NextAuth.js v5: https://authjs.dev/getting-started
  - Prisma adapter: https://authjs.dev/getting-started/adapters/prisma

  **Acceptance Criteria**:
  - [ ] User can register with email/password at `/inregistrare`
  - [ ] User can login at `/logare` and receives JWT session
  - [ ] Protected routes redirect to `/logare` for unauthenticated users
  - [ ] Admin routes return 403 for non-admin users
  - [ ] Password reset flow sends email (via Resend mock) and resets password
  - [ ] vitest run → auth tests pass (login, register, reset, role guard)

  **QA Scenarios:**
  ```
  Scenario: Registration and login flow
    Tool: Playwright
    Preconditions: Dev server running, database seeded
    Steps:
      1. Navigate to http://localhost:3000/inregistrare
      2. Fill input[name="name"] with "Test User"
      3. Fill input[name="email"] with "test@example.com"
      4. Fill input[name="password"] with "SecurePass123!"
      5. Fill input[name="confirmPassword"] with "SecurePass123!"
      6. Click button[type="submit"]
      7. Assert URL changes to /logare or /profilul-meu
      8. If redirected to /logare, fill email and password, click submit
      9. Assert URL contains /profilul-meu or /
      10. Assert page contains text "Test User" or user greeting
    Expected Result: User registered and logged in successfully
    Failure Indicators: Form validation errors, 500 error, redirect loop
    Evidence: .sisyphus/evidence/task-4-auth-flow.png

  Scenario: Protected route redirect
    Tool: Playwright
    Preconditions: Dev server running, NOT logged in
    Steps:
      1. Navigate to http://localhost:3000/profilul-meu
      2. Assert URL redirected to /logare
      3. Assert page contains login form
    Expected Result: Unauthenticated user redirected to login
    Failure Indicators: Page loads without redirect, 500 error
    Evidence: .sisyphus/evidence/task-4-protected-redirect.png

  Scenario: Admin role guard
    Tool: Playwright
    Preconditions: Logged in as regular USER
    Steps:
      1. Navigate to http://localhost:3000/admin
      2. Assert page shows 403 or redirects away
    Expected Result: Non-admin cannot access admin routes
    Failure Indicators: Admin page renders for regular user
    Evidence: .sisyphus/evidence/task-4-admin-guard.png
  ```

  **Commit**: YES
  - Message: `feat(auth): add NextAuth.js with email/password, role-based access, Romanian auth pages`
  - Files: `src/app/api/auth/[...nextauth]/route.ts, src/lib/auth.ts, src/middleware.ts, src/app/(auth)/logare/page.tsx, src/app/(auth)/inregistrare/page.tsx, src/app/(auth)/resetare-parola/*, prisma/schema.prisma (Account/Session models)`
  - Pre-commit: `vitest run`

- [x] 5. Resend Email Service + React Email Templates

  **What to do**:
  - Install `resend` and `@react-email/components`
  - Create email service module at `src/services/email.ts` with typed send functions
  - Build React Email templates (all in Romanian):
    - `WelcomeEmail` — Registration confirmation
    - `OrderConfirmationEmail` — Purchase receipt with order details
    - `InstallmentReminderEmail` — Rata 2 payment link
    - `PasswordResetEmail` — Reset link with token
    - `SessionBookedEmail` — 1:1 session confirmation
    - `SessionReminderEmail` — 24h before session reminder
  - Use Eva's brand colors (dark purple/pink) in email templates
  - Create email preview route at `/dev/emails` (dev-only)
  - TDD: Write tests for each email template render + send function mock

  **Must NOT do**:
  - Do NOT integrate with Klaviyo (fresh start with Resend)
  - Do NOT send real emails in tests (mock Resend API)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Straightforward template creation with well-documented library
  - **Skills**: [`superpowers/test-driven-development`]
    - `superpowers/test-driven-development`: Ensure templates render correctly

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2, 3, 4, 6-8)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 12, 28, 39
  - **Blocked By**: Task 1

  **References**:
  **Pattern References**:
  - Brand styling: `eva-popescu-coach-de-manifestare-consti.webflow/css/eva-popescu-coach-de-manifestare-consti.webflow.css` — Colors and fonts for email templates
  - Logo: `eva-popescu-coach-de-manifestare-consti.webflow/images/` — Logo files for email header

  **External References**:
  - Resend docs: https://resend.com/docs/send-with-nextjs
  - React Email: https://react.email/docs/introduction

  **Acceptance Criteria**:
  - [ ] 6 email templates render without errors
  - [ ] `/dev/emails` preview route shows all templates
  - [ ] Email service has typed functions: `sendWelcome()`, `sendOrderConfirmation()`, etc.
  - [ ] vitest run → email tests pass

  **QA Scenarios:**
  ```
  Scenario: Email preview renders all templates
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to http://localhost:3000/dev/emails
      2. Assert page contains 6 template links/sections
      3. Click first template link
      4. Assert rendered email contains brand purple color
      5. Screenshot email preview
    Expected Result: All email templates render with brand styling
    Failure Indicators: Broken renders, missing templates
    Evidence: .sisyphus/evidence/task-5-email-preview.png

  Scenario: Email send function works (mocked)
    Tool: Bash (vitest)
    Preconditions: None
    Steps:
      1. vitest run src/services/email.test.ts → PASS
      2. Verify mock assertions: Resend.send called with correct params
    Expected Result: All email send functions tested
    Failure Indicators: Test failures, incorrect template data
    Evidence: .sisyphus/evidence/task-5-email-tests.txt
  ```

  **Commit**: YES
  - Message: `feat(email): add Resend email service with 6 Romanian React Email templates`
  - Files: `src/services/email.ts, src/emails/*, src/app/dev/emails/page.tsx`
  - Pre-commit: `vitest run`

- [x] 6. Revolut Payment Gateway Service Module

  **What to do**:
  - Create Revolut service module at `src/services/revolut.ts` with typed functions:
    - `createOrder({ amount, currency, customerEmail, description, redirectUrl, expirePendingAfter })` — POST /orders
    - `getOrder(orderId)` — GET /orders/{id}
    - `refundOrder(orderId, { amount, description })` — POST /orders/{id}/refund
    - `cancelOrder(orderId)` — POST /orders/{id}/cancel
    - `verifyWebhookSignature(body, signature, secret)` — HMAC-SHA256 verification
  - **CRITICAL implementation details**:
    - Set `Revolut-Api-Version: 2025-12-04` header on ALL requests
    - Include `Idempotency-Key` (UUID v4) on all POST requests
    - Set `expire_pending_after` on every order (ISO 8601 duration)
    - Use `req.text()` not `req.json()` for webhook body before signature verification
    - Handle both sandbox (`sandbox-merchant.revolut.com`) and production (`merchant.revolut.com`) URLs via env var
  - Create TypeScript types matching Revolut API responses (Order, WebhookEvent, RefundResponse)
  - Install `@revolut/checkout` for frontend widget integration
  - TDD: Write comprehensive tests for each function with mocked HTTP responses

  **Must NOT do**:
  - Do NOT create API routes yet (just the service module)
  - Do NOT process webhooks yet (Task 32)
  - Do NOT handle installment logic yet (Task 12)
  - Do NOT install Stripe

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Payment integration requires precise API compliance and security
  - **Skills**: [`superpowers/test-driven-development`]
    - `superpowers/test-driven-development`: Payment code must be thoroughly tested
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed — this is a backend service module

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2-5, 7-8)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 11, 12
  - **Blocked By**: Task 1

  **References**:
  **External References**:
  - Revolut Merchant API: https://developer.revolut.com/docs/merchant/merchant-api
  - Revolut Next.js example: https://github.com/revolut-engineering/revolut-merchant-api-example-next-js
  - `@revolut/checkout` npm: https://www.npmjs.com/package/@revolut/checkout
  - API version header: `Revolut-Api-Version: 2025-12-04`
  - Webhook signature format: `v1.{timestamp}.{body}` then HMAC-SHA256
  - Order TTL: Use ISO 8601 durations for `expire_pending_after` (e.g., `PT24H`, `P7D`)

  **Acceptance Criteria**:
  - [ ] `createOrder()` sets `Revolut-Api-Version`, `Idempotency-Key`, and `expire_pending_after`
  - [ ] `verifyWebhookSignature()` correctly validates HMAC-SHA256 with `v1.timestamp.body` format
  - [ ] `verifyWebhookSignature()` uses raw text body, not parsed JSON
  - [ ] All functions have TypeScript return types matching Revolut API
  - [ ] Sandbox vs production URL switching via `REVOLUT_ENVIRONMENT` env var
  - [ ] vitest run → all Revolut service tests pass

  **QA Scenarios:**
  ```
  Scenario: Create order with correct headers
    Tool: Bash (vitest)
    Preconditions: None (mocked HTTP)
    Steps:
      1. vitest run src/services/revolut.test.ts
      2. Verify test: createOrder sends Revolut-Api-Version header = "2025-12-04"
      3. Verify test: createOrder sends Idempotency-Key header (UUID format)
      4. Verify test: createOrder includes expire_pending_after in body
    Expected Result: All header/body requirements met
    Failure Indicators: Missing headers, wrong API version
    Evidence: .sisyphus/evidence/task-6-revolut-tests.txt

  Scenario: Webhook signature verification
    Tool: Bash (vitest)
    Preconditions: None
    Steps:
      1. vitest run — webhook signature test
      2. Test with valid signature → returns true
      3. Test with tampered body → returns false
      4. Test with wrong timestamp → returns false
    Expected Result: Signature verification passes valid, rejects invalid
    Failure Indicators: False positives (accepts tampered), false negatives
    Evidence: .sisyphus/evidence/task-6-webhook-sig.txt
  ```

  **Commit**: YES
  - Message: `feat(payments): add Revolut Payment Gateway service module with typed API client`
  - Files: `src/services/revolut.ts, src/services/revolut.test.ts, src/types/revolut.ts`
  - Pre-commit: `vitest run`


- [x] 7. SmartBill Invoicing Service Module

  **What to do**:
  - Create SmartBill service module at `src/services/smartbill.ts` with typed functions:
    - `createInvoice({ companyVatCode, client, seriesName, products, payment, issueDate })` — POST /invoice
    - `getInvoicePdf({ companyVatCode, seriesName, number })` — GET /invoice/pdf
    - `stornoInvoice({ companyVatCode, seriesName, number })` — DELETE /invoice (storno)
    - `getInvoiceStatus({ companyVatCode, seriesName, number })` — GET /invoice/status
  - **CRITICAL implementation details**:
    - Auth: HTTP Basic Auth `base64(SMARTBILL_EMAIL:SMARTBILL_TOKEN)`
    - ALWAYS use `isTaxIncluded: true` with gross prices (SmartBill extracts TVA 21% internally)
    - B2C customers: `vatCode: "0000000000000"`, `isTaxPayer: false`
    - ALWAYS check `response.errorText` field (HTTP 200 can contain errors!)
    - Handle HTTP 500 for malformed payloads (SmartBill returns 500 instead of 400)
    - Implement rate limiting: max 30 req/10sec with exponential backoff
    - Retry logic: 3 retries with 10s, 30s, 60s delays for transient failures
    - Queue invoices asynchronously — NEVER call SmartBill synchronously in checkout flow
  - Create TypeScript types: `SmartBillInvoice`, `SmartBillClient`, `SmartBillProduct`, `SmartBillResponse`
  - TDD: Test each function with mocked responses including error edge cases

  **Must NOT do**:
  - Do NOT call SmartBill synchronously from checkout/webhook handlers
  - Do NOT rely on HTTP status codes alone (check `errorText`)
  - Do NOT create API routes yet (just the service module)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex error handling, rate limiting, and async queue design
  - **Skills**: [`superpowers/test-driven-development`]
    - `superpowers/test-driven-development`: Error edge cases require thorough testing

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2-6, 8)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 11, 33
  - **Blocked By**: Task 1

  **References**:
  **External References**:
  - SmartBill API: `https://ws.smartbill.ro/SBORO/api/`
  - SmartBill Swagger: https://api.smartbill.ro/data/swagger.json
  - SmartBill TypeScript SDK (reference): https://github.com/paulgeorge35/smartbill
  - Auth format: `Authorization: Basic base64(email:apiToken)`
  - B2C vatCode: `0000000000000` (all zeros, ANAF-approved for anonymous customers)
  - `isTaxIncluded: true` — send gross price, SmartBill extracts TVA
  - Rate limit: 30 req/10sec, 10-minute hard block on exceed

  **Acceptance Criteria**:
  - [ ] `createInvoice()` uses `isTaxIncluded: true` and B2C vatCode `0000000000000`
  - [ ] All functions check `response.errorText` in addition to HTTP status
  - [ ] Rate limiter prevents more than 30 requests per 10 seconds
  - [ ] Retry logic handles transient HTTP 500 errors with backoff
  - [ ] vitest run → all SmartBill tests pass including error edge cases

  **QA Scenarios:**
  ```
  Scenario: Create invoice with correct TVA handling
    Tool: Bash (vitest)
    Preconditions: None (mocked HTTP)
    Steps:
      1. vitest run src/services/smartbill.test.ts
      2. Verify test: createInvoice sends isTaxIncluded=true
      3. Verify test: B2C client uses vatCode "0000000000000"
      4. Verify test: taxPercentage is 21 (not 19)
    Expected Result: Invoice creation follows TVA 21% rules
    Failure Indicators: Wrong vatCode, isTaxIncluded=false, taxPercentage=19
    Evidence: .sisyphus/evidence/task-7-smartbill-invoice.txt

  Scenario: Error handling for HTTP 200 with errorText
    Tool: Bash (vitest)
    Preconditions: None
    Steps:
      1. vitest run — mock SmartBill returns HTTP 200 with {errorText: "Seria nu exista"}
      2. Assert service throws/rejects with meaningful error
      3. Assert service does NOT treat this as success
    Expected Result: HTTP 200 with errorText is treated as error
    Failure Indicators: Service treats it as success, errorText ignored
    Evidence: .sisyphus/evidence/task-7-smartbill-error-handling.txt

  Scenario: Rate limiter prevents burst
    Tool: Bash (vitest)
    Preconditions: None
    Steps:
      1. vitest run — simulate 35 rapid calls
      2. Assert first 30 calls proceed
      3. Assert calls 31-35 are queued/delayed
      4. Assert no 429 or 10-minute block triggered
    Expected Result: Rate limiter throttles beyond 30 req/10sec
    Failure Indicators: All 35 calls fire immediately, rate limit exceeded
    Evidence: .sisyphus/evidence/task-7-rate-limiter.txt
  ```

  **Commit**: YES
  - Message: `feat(invoicing): add SmartBill service module with rate limiting and TVA 21% handling`
  - Files: `src/services/smartbill.ts, src/services/smartbill.test.ts, src/types/smartbill.ts`
  - Pre-commit: `vitest run`

- [x] 8. AWS Infrastructure Setup (S3 + CloudFront + MediaConvert)

  **What to do**:
  - Create AWS service module at `src/services/aws-video.ts` with typed functions:
    - `generateSignedCookies(userId, editionId)` — Generate CloudFront signed cookies (2h TTL)
    - `refreshSignedCookies(userId, editionId)` — Refresh endpoint for 90-min loop
    - `createTranscodeJob(s3InputKey)` — Submit MediaConvert HLS job
    - `getTranscodeJobStatus(jobId)` — Poll job status
  - Create CloudFront key pair generation utility (ECDSA P-256)
  - **CRITICAL configuration**:
    - CloudFront OAC (Origin Access Control, NOT deprecated OAI)
    - Signed cookies (NOT signed URLs) for HLS .m3u8 and .ts segments
    - Cookie `Domain=.perspectivaevei.com` (leading dot for cross-subdomain)
    - Cookie TTL: 2 hours with 90-minute frontend refresh
    - CloudFront cache key policy MUST include `Origin` header (CORS bug prevention)
    - `Vary: Origin` on all responses
    - CORS: explicit `AllowedOrigins: ["https://perspectivaevei.com", "https://www.perspectivaevei.com"]`
    - Use CloudFront key groups (not root account key pairs)
  - Create Infrastructure-as-Code documentation (Terraform/CDK instructions, NOT execution):
    - S3 bucket with versioning
    - CloudFront distribution with OAC
    - MediaConvert job template (HLS output: 720p + 480p + 360p)
    - IAM roles and policies
  - TDD: Write tests for signed cookie generation and validation

  **Must NOT do**:
  - Do NOT use CloudFront OAI (deprecated)
  - Do NOT use Elastic Transcoder (discontinued Nov 2025)
  - Do NOT use signed URLs for HLS (cookies are required for multi-segment)
  - Do NOT actually provision AWS resources (just the code + docs)
  - Do NOT implement screen capture prevention (technically impossible)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Complex AWS configuration requiring precise security setup
  - **Skills**: [`superpowers/test-driven-development`]
    - `superpowers/test-driven-development`: Signed cookie crypto must be tested
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed — backend service module

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2-7)
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 16
  - **Blocked By**: Task 1

  **References**:
  **External References**:
  - CloudFront signed cookies: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-signed-cookies.html
  - CloudFront OAC: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-origin-access-control.html
  - AWS MediaConvert: https://docs.aws.amazon.com/mediaconvert/latest/ug/what-is.html
  - hls.js CORS issue #2620: https://github.com/video-dev/hls.js/issues/2620
  - ECDSA P-256 for CloudFront: faster signing than RSA-2048
  - Cookie domain format: `.perspectivaevei.com` (leading dot)

  **Acceptance Criteria**:
  - [ ] `generateSignedCookies()` produces 3 cookies: CloudFront-Policy, CloudFront-Signature, CloudFront-Key-Pair-Id
  - [ ] Cookie TTL is 2 hours (7200 seconds)
  - [ ] Cookie Domain is `.perspectivaevei.com`
  - [ ] CloudFront config docs specify OAC (not OAI)
  - [ ] Cache key policy includes `Origin` header
  - [ ] MediaConvert job template outputs 720p + 480p + 360p HLS
  - [ ] vitest run → signed cookie tests pass

  **QA Scenarios:**
  ```
  Scenario: Signed cookie generation
    Tool: Bash (vitest)
    Preconditions: Test ECDSA P-256 key pair generated
    Steps:
      1. vitest run src/services/aws-video.test.ts
      2. Verify: generateSignedCookies returns 3 named cookies
      3. Verify: cookie maxAge is 7200
      4. Verify: cookie domain is .perspectivaevei.com
      5. Verify: cookie path restricts to /video/*
    Expected Result: Correct cookies with proper attributes
    Failure Indicators: Missing cookies, wrong domain, wrong TTL
    Evidence: .sisyphus/evidence/task-8-signed-cookies.txt

  Scenario: MediaConvert job template validation
    Tool: Bash
    Preconditions: None
    Steps:
      1. Read infrastructure docs, verify MediaConvert config
      2. Assert job template specifies HLS output group
      3. Assert output includes 720p, 480p, 360p renditions
      4. Assert segment duration is 6 seconds
    Expected Result: Job template covers all quality levels
    Failure Indicators: Missing rendition, wrong codec settings
    Evidence: .sisyphus/evidence/task-8-mediaconvert-template.txt
  ```

  **Commit**: YES
  - Message: `feat(video): add AWS video service with CloudFront signed cookies and MediaConvert config`
  - Files: `src/services/aws-video.ts, src/services/aws-video.test.ts, src/types/aws-video.ts, docs/infrastructure/aws-video-setup.md`
  - Pre-commit: `vitest run`


- [x] 9. Device Fingerprinting + Locking System

  **What to do**:
  - Create device fingerprint library at `src/lib/device-fingerprint.ts`:
    - Collect browser fingerprint (User-Agent, screen resolution, timezone, canvas hash, WebGL renderer)
    - Generate stable hash from collected signals
    - Store in localStorage as fallback identifier
  - Create device management service at `src/services/device.ts`:
    - `registerDevice(userId, fingerprint, deviceName)` — Register new device (max 2)
    - `validateDevice(userId, fingerprint)` — Check if device is registered
    - `removeDevice(userId, deviceId)` — Remove a device to free a slot
    - `listDevices(userId)` — List user's registered devices
  - Integrate into auth middleware: on every authenticated request, validate device
  - Create API routes:
    - `POST /api/devices/register` — Register current device
    - `DELETE /api/devices/[id]` — Remove device
    - `GET /api/devices` — List user's devices
  - UX flow: if user hits 2-device limit, show modal "Ai atins limita de 2 dispozitive. Șterge un dispozitiv pentru a continua." with device list and remove buttons
  - TDD: Test device registration, limit enforcement, fingerprint stability

  **Must NOT do**:
  - Do NOT use native device APIs (stay browser-only)
  - Do NOT track IP addresses for fingerprinting (GDPR concerns)
  - Do NOT allow more than 2 registered devices per user

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Browser fingerprinting is nuanced, needs careful hashing and stability
  - **Skills**: [`superpowers/test-driven-development`]
    - `superpowers/test-driven-development`: Device limits are critical business logic

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 10-16)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 24, 25
  - **Blocked By**: Tasks 2, 4

  **References**:
  **API/Type References**:
  - `prisma/schema.prisma:Device` — Device model with userId, fingerprint, name, lastSeen
  - `src/lib/auth.ts` — NextAuth session/middleware to integrate device check

  **External References**:
  - FingerprintJS open-source: https://github.com/nicedoc/fingerprint (or custom implementation)

  **Acceptance Criteria**:
  - [ ] Device fingerprint generates consistent hash for same browser
  - [ ] User can register up to 2 devices
  - [ ] 3rd device registration is rejected with 403 and Romanian error message
  - [ ] User can remove a device to free a slot
  - [ ] vitest run → device tests pass

  **QA Scenarios:**
  ```
  Scenario: Device limit enforcement
    Tool: Bash (curl)
    Preconditions: User registered, logged in, 2 devices already registered
    Steps:
      1. POST /api/devices/register with fingerprint="device-3-hash"
      2. Assert response status 403
      3. Assert response body contains "limita de 2 dispozitive"
    Expected Result: Third device rejected
    Failure Indicators: 200 response, device registered beyond limit
    Evidence: .sisyphus/evidence/task-9-device-limit.txt

  Scenario: Device removal frees slot
    Tool: Bash (curl)
    Preconditions: User has 2 devices, knows device ID
    Steps:
      1. DELETE /api/devices/{deviceId} → 200
      2. POST /api/devices/register with new fingerprint → 200
      3. GET /api/devices → returns 2 devices (new one replaces old)
    Expected Result: After removal, new device can register
    Failure Indicators: Still 403 after removal
    Evidence: .sisyphus/evidence/task-9-device-removal.txt
  ```

  **Commit**: YES
  - Message: `feat(security): add device fingerprinting and 2-device locking system`
  - Files: `src/lib/device-fingerprint.ts, src/services/device.ts, src/app/api/devices/*, src/components/DeviceLimitModal.tsx`
  - Pre-commit: `vitest run`

- [x] 10. Course/Cohort Management Module

  **What to do**:
  - Create course management service at `src/services/course.ts`:
    - `getCourseWithEditions(courseSlug)` — Get course with all editions
    - `getActiveEdition(courseId)` — Get current open-enrollment edition
    - `enrollUser(userId, editionId, orderId)` — Create enrollment + set access expiry
    - `checkAccess(userId, editionId)` — Verify user has active access
    - `getEditionLessons(editionId)` — List lessons with availability dates
    - `getUserProgress(userId, editionId)` — Get lesson progress for user
    - `updateProgress(userId, lessonId, watchedSeconds)` — Update watch progress
  - Implement enrollment limit: max 15 participants per edition
  - Access expiry: 30 days after edition `endDate` (configurable per course)
  - Lesson availability: lessons unlock based on `availableFrom` date
  - TDD: Test enrollment limits, access expiry, lesson availability, progress tracking

  **Must NOT do**:
  - Do NOT build the video player (Task 16)
  - Do NOT create user-facing pages (Task 26)
  - Do NOT handle payments (Task 11)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Cohort business logic with time-based access and capacity limits
  - **Skills**: [`superpowers/test-driven-development`]
    - `superpowers/test-driven-development`: Enrollment limits and expiry are critical business rules

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 9, 11-16)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 18, 22, 26, 38
  - **Blocked By**: Task 2

  **References**:
  **Pattern References**:
  - Course page: `eva-popescu-coach-de-manifestare-consti.webflow/cursul-ado.html` — Edition structure, pricing, 15-participant limit, access duration
  - Course content: `eva-popescu-coach-de-manifestare-consti.webflow/cursul-ado.html` — "Acces la înregistrări 30 de zile de la finalizarea cursului"

  **API/Type References**:
  - `prisma/schema.prisma:Course, CourseEdition, CourseEnrollment, Lesson, LessonProgress` — All course-related models

  **Acceptance Criteria**:
  - [ ] 16th enrollment attempt on 15-max edition returns error
  - [ ] Access check returns false after expiry date
  - [ ] Lessons respect `availableFrom` gate
  - [ ] Progress tracking stores watchedSeconds and completed flag
  - [ ] vitest run → course tests pass

  **QA Scenarios:**
  ```
  Scenario: Enrollment capacity limit
    Tool: Bash (vitest)
    Preconditions: Edition with maxParticipants=15, 14 enrolled
    Steps:
      1. Enroll user 15 → success
      2. Enroll user 16 → error "Ediția este completă"
    Expected Result: 15th enrollment succeeds, 16th fails
    Evidence: .sisyphus/evidence/task-10-enrollment-limit.txt

  Scenario: Access expiry enforcement
    Tool: Bash (vitest)
    Preconditions: Enrollment with accessExpiresAt = yesterday
    Steps:
      1. checkAccess(userId, editionId) → returns false
      2. Assert error message mentions "Accesul a expirat"
    Expected Result: Expired access is denied
    Evidence: .sisyphus/evidence/task-10-access-expiry.txt
  ```

  **Commit**: YES
  - Message: `feat(course): add cohort management with enrollment limits, access expiry, and progress tracking`
  - Files: `src/services/course.ts, src/services/course.test.ts`
  - Pre-commit: `vitest run`

- [x] 11. Checkout Flow — Single Product Purchase

  **What to do**:
  - Create checkout service at `src/services/checkout.ts`:
    - `createCheckout({ userId, items, promoCode? })` — Calculate totals, create Revolut order, save to DB
    - `handleOrderComplete(revolutOrderId)` — Fulfill order (grant access, trigger invoice)
    - `getOrderStatus(orderId)` — Check order status
  - Create API routes:
    - `POST /api/checkout` — Create new checkout (returns Revolut checkout URL or widget token)
    - `GET /api/orders/[id]` — Order status check
    - `GET /api/checkout/success` — Post-payment redirect page
  - Build checkout page at `/checkout`:
    - Cart summary with product details and price
    - Promo code input field
    - Revolut checkout widget embed (using `@revolut/checkout`)
    - FX disclosure: "Prețul este în EUR. Echivalentul în RON poate varia."
  - Fulfillment logic:
    - COURSE: Create CourseEnrollment with access expiry
    - GUIDE: Create GuideAccess record
    - BUNDLE: Create GuideAccess for each bundled guide
    - PRODUCT (physical): Create order with shipping status PENDING
    - SESSION: Create Session1on1 placeholder
  - Set `expire_pending_after: "PT24H"` on all single-purchase orders
  - SmartBill invoice creation triggered asynchronously (via `setTimeout` or queue)
  - TDD: Test checkout flow, fulfillment per product type, error handling

  **Must NOT do**:
  - Do NOT implement installment logic (Task 12)
  - Do NOT process webhooks in this task (Task 32)
  - Do NOT call SmartBill synchronously during checkout

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Checkout integrates Revolut + DB + fulfillment logic — payment flows must be bulletproof
  - **Skills**: [`superpowers/test-driven-development`, `playwright`]
    - `superpowers/test-driven-development`: Payment flows need comprehensive tests
    - `playwright`: Checkout page UI needs browser verification

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 9, 10, 13-16)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 12, 29, 31, 32, 33
  - **Blocked By**: Tasks 2, 6, 7

  **References**:
  **Pattern References**:
  - Revolut service: `src/services/revolut.ts` — createOrder(), order types
  - SmartBill service: `src/services/smartbill.ts` — createInvoice() for async trigger
  - Course service: `src/services/course.ts` — enrollUser() for course fulfillment

  **API/Type References**:
  - `prisma/schema.prisma:Order, OrderItem, Invoice` — Order data model
  - `src/types/revolut.ts` — Revolut order/response types

  **External References**:
  - Revolut checkout widget: https://developer.revolut.com/docs/merchant/accept-payments-with-checkout-widget
  - `@revolut/checkout` npm: embedded widget integration

  **Acceptance Criteria**:
  - [ ] POST /api/checkout creates Revolut order with correct amount and `expire_pending_after`
  - [ ] Revolut widget loads on checkout page
  - [ ] FX disclosure text visible on checkout page
  - [ ] Fulfillment grants correct access per product type (course, guide, bundle)
  - [ ] SmartBill invoice is triggered asynchronously (not blocking checkout)
  - [ ] vitest run → checkout tests pass

  **QA Scenarios:**
  ```
  Scenario: Guide purchase checkout flow
    Tool: Playwright
    Preconditions: User logged in, guide "Cine Manifestă?!" exists
    Steps:
      1. Navigate to guide page
      2. Click "Cumpără" button
      3. Assert URL contains /checkout
      4. Assert page shows guide title and price "€99"
      5. Assert page contains FX disclosure text
      6. Assert Revolut widget container is present (div#revolut-checkout or similar)
    Expected Result: Checkout page renders with correct product and Revolut widget
    Failure Indicators: Wrong price, missing widget, missing FX text
    Evidence: .sisyphus/evidence/task-11-checkout-page.png

  Scenario: Fulfillment creates access after order completion
    Tool: Bash (vitest)
    Preconditions: Order created and marked COMPLETED in test
    Steps:
      1. Call handleOrderComplete(revolutOrderId)
      2. Assert GuideAccess record created for user + guide
      3. Assert Invoice record created with status PENDING
    Expected Result: Access granted and invoice queued
    Failure Indicators: No access record, no invoice record
    Evidence: .sisyphus/evidence/task-11-fulfillment.txt
  ```

  **Commit**: YES
  - Message: `feat(checkout): add single product checkout with Revolut widget, fulfillment, and async invoicing`
  - Files: `src/services/checkout.ts, src/app/api/checkout/route.ts, src/app/api/orders/[id]/route.ts, src/app/checkout/page.tsx, src/app/checkout/success/page.tsx`
  - Pre-commit: `vitest run`

- [x] 12. Checkout Flow — 2-Rate Installment System

  **What to do**:
  - Extend checkout service with installment logic:
    - `createInstallmentCheckout(userId, editionId)` — Create Order 1 (rata 1, €644, `expire_pending_after: PT24H`)
    - On Order 1 completion: schedule Order 2 creation for T+30 days
    - `createInstallmentOrder2(parentOrderId)` — Create Order 2 (rata 2, €644, `expire_pending_after: P7D`)
    - Email Order 2 payment link to user via Resend
  - Installment tracking:
    - Order.installmentNumber: 1 or 2
    - Order.parentOrderId: links rata 2 to rata 1
    - Enrollment status: ACTIVE after rata 1, access NOT revoked if rata 2 pending (grace period)
  - Rata 2 reminder flow:
    - At T+30 days: Create Order 2, send email with Revolut checkout link
    - At T+33 days: Reminder email if unpaid
    - At T+37 days: Final reminder email
    - At T+44 days (Order 2 expires at P7D+7 buffer): Flag to admin for manual follow-up
  - FX rate disclosure on installment checkout: "Prețul este de €644 per rată. Echivalentul în RON poate varia în funcție de cursul valutar."
  - TDD: Test installment creation, Order 2 scheduling, email triggers, expiry handling

  **Must NOT do**:
  - Do NOT revoke course access if rata 2 is late (grace period, admin handles manually)
  - Do NOT implement recurring billing (two separate one-time orders)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex payment flow with time-based scheduling and email triggers
  - **Skills**: [`superpowers/test-driven-development`]
    - `superpowers/test-driven-development`: Installment timing logic needs precise tests

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 9, 10, 13-16 — after Task 11)
  - **Parallel Group**: Wave 2 (late start, after Task 11)
  - **Blocks**: Tasks 29, 32, 39
  - **Blocked By**: Tasks 5, 6, 7, 11

  **References**:
  **Pattern References**:
  - Checkout service: `src/services/checkout.ts` — Base checkout flow to extend
  - Revolut service: `src/services/revolut.ts` — createOrder with expire_pending_after
  - Email service: `src/services/email.ts` — InstallmentReminderEmail template

  **API/Type References**:
  - `prisma/schema.prisma:Order` — installmentNumber, parentOrderId fields
  - Course pricing: €1,188 full / €644×2 installments (from Webflow)

  **External References**:
  - Revolut order TTL: ISO 8601 duration format for `expire_pending_after`
  - Revolut FX behavior: merchant receives EUR, customer sees RON equivalent

  **Acceptance Criteria**:
  - [ ] Rata 1 order created with installmentNumber=1, expire_pending_after=PT24H
  - [ ] Order 2 auto-created 30 days after Order 1 completion
  - [ ] Order 2 has installmentNumber=2, parentOrderId pointing to Order 1
  - [ ] Email with Revolut checkout link sent for Order 2
  - [ ] FX disclosure visible on installment checkout
  - [ ] Reminder emails sent at T+33 and T+37 days
  - [ ] vitest run → installment tests pass

  **QA Scenarios:**
  ```
  Scenario: Installment order creation
    Tool: Bash (vitest)
    Preconditions: None (mocked)
    Steps:
      1. createInstallmentCheckout(userId, editionId)
      2. Assert Order 1 created with amount=64400 (cents), installmentNumber=1
      3. Assert expire_pending_after="PT24H"
      4. Simulate Order 1 COMPLETED
      5. Assert scheduled job for Order 2 at T+30 days
    Expected Result: Installment flow initiates correctly
    Evidence: .sisyphus/evidence/task-12-installment-creation.txt

  Scenario: Rata 2 email reminder
    Tool: Bash (vitest)
    Preconditions: Order 1 completed 30 days ago
    Steps:
      1. Trigger createInstallmentOrder2(parentOrderId)
      2. Assert Order 2 created with installmentNumber=2, expire_pending_after=P7D
      3. Assert email sent with checkout URL
    Expected Result: Order 2 created and email sent
    Evidence: .sisyphus/evidence/task-12-rata2-email.txt
  ```

  **Commit**: YES
  - Message: `feat(checkout): add 2-rate installment system with scheduled Order 2 and email reminders`
  - Files: `src/services/checkout.ts (updated), src/services/installments.ts, src/services/installments.test.ts`
  - Pre-commit: `vitest run`


- [x] 13. Promo Code + Bundle Engine

  **What to do**:
  - Create promo code service at `src/services/promo.ts`:
    - `validatePromoCode(code, productType?)` — Validate code, check dates/uses/product applicability
    - `applyPromoCode(code, amount)` — Calculate discounted amount (percentage or fixed)
    - `incrementPromoUse(code)` — Increment usage counter after successful order
  - Create bundle service at `src/services/bundle.ts`:
    - `getBundleWithItems(bundleSlug)` — Get bundle with included guides
    - `calculateBundleDiscount(bundleId)` — Calculate savings vs individual purchase
  - Promo code types: PERCENTAGE (e.g., 20% off), FIXED (e.g., €10 off)
  - Promo constraints: validFrom, validUntil, maxUses, specific product types
  - TDD: Test validation (expired, max uses reached, invalid code), discount calculation, bundle pricing

  **Must NOT do**:
  - Do NOT create admin CRUD for promo codes yet (Task 36)
  - Do NOT integrate into checkout yet (checkout calls these services)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Business logic with multiple validation rules
  - **Skills**: [`superpowers/test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 9-12, 14-16)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 36
  - **Blocked By**: Task 2

  **References**:
  **API/Type References**:
  - `prisma/schema.prisma:PromoCode, Bundle, BundleItem` — Promo and bundle models
  - Bundle pricing: `eva-popescu-coach-de-manifestare-consti.webflow/ghiduri.html` — Bundle €82.5 (was €110)

  **Acceptance Criteria**:
  - [ ] Expired promo code returns error "Codul promoțional a expirat"
  - [ ] Max-uses promo code returns error "Codul a fost folosit de numărul maxim de ori"
  - [ ] Percentage discount calculates correctly (e.g., 20% off €99 = €79.20)
  - [ ] Bundle price shows savings vs individual purchase
  - [ ] vitest run → promo/bundle tests pass

  **QA Scenarios:**
  ```
  Scenario: Promo code validation edge cases
    Tool: Bash (vitest)
    Steps:
      1. Test valid code → returns discount
      2. Test expired code → returns error
      3. Test maxUses=5 code used 5 times → returns error
      4. Test code not yet valid (validFrom in future) → returns error
    Expected Result: All validation rules enforced
    Evidence: .sisyphus/evidence/task-13-promo-validation.txt
  ```

  **Commit**: YES
  - Message: `feat(promo): add promo code validation and bundle pricing engine`
  - Files: `src/services/promo.ts, src/services/bundle.ts, src/services/promo.test.ts, src/services/bundle.test.ts`
  - Pre-commit: `vitest run`

- [x] 14. Guide Reader + Watermark System

  **What to do**:
  - Create guide content service at `src/services/guide.ts`:
    - `getGuideContent(guideId, userId)` — Return guide content with user-specific watermark
    - `getUserGuides(userId)` — List guides user has access to
  - Build in-platform guide reader component `src/components/GuideReader.tsx`:
    - Paginated content display (not full-scroll)
    - Text content rendered from JSON (stored in DB, not files)
    - CSS-based watermark overlay: user email + ID displayed diagonally, semi-transparent
    - Disable text selection (CSS `user-select: none` + JS event prevention)
    - Disable right-click context menu on reader content
    - No PDF download button or export functionality
  - Content storage: Guide content as structured JSON in `Guide.contentJson` field
  - TDD: Test watermark generation, access control, content rendering

  **Must NOT do**:
  - Do NOT allow PDF download or export
  - Do NOT store guide content as files (use DB JSON field)
  - Do NOT build the audiobook player (Task 15)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Content security (watermark, selection prevention) requires careful implementation
  - **Skills**: [`superpowers/test-driven-development`, `frontend-ui-ux`]
    - `superpowers/test-driven-development`: Access control tests
    - `frontend-ui-ux`: Reader UX must be pleasant despite security measures

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 9-13, 15-16)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 19, 23, 27
  - **Blocked By**: Task 2

  **References**:
  **Pattern References**:
  - Guide details: `eva-popescu-coach-de-manifestare-consti.webflow/ghiduri.html` — Guide titles, descriptions, cover images

  **API/Type References**:
  - `prisma/schema.prisma:Guide, GuideAccess` — Guide model with contentJson field

  **Acceptance Criteria**:
  - [ ] Guide reader displays paginated content
  - [ ] Watermark shows user email diagonally across content
  - [ ] Text selection disabled on guide content
  - [ ] Right-click disabled on reader
  - [ ] No PDF download/export functionality present
  - [ ] vitest run → guide tests pass

  **QA Scenarios:**
  ```
  Scenario: Guide reader with watermark
    Tool: Playwright
    Preconditions: User logged in, has guide access
    Steps:
      1. Navigate to guide reader page
      2. Assert guide content is visible
      3. Assert watermark element exists with user email text
      4. Try to select text → assert selection is empty
      5. Screenshot page showing watermark
    Expected Result: Content visible with watermark, text not selectable
    Evidence: .sisyphus/evidence/task-14-guide-reader.png

  Scenario: Unauthorized guide access denied
    Tool: Bash (curl)
    Preconditions: User logged in, does NOT have access to guide ID 99
    Steps:
      1. GET /api/guides/99/content → 403
      2. Assert body contains access denied message
    Expected Result: Access denied for unpurchased guide
    Evidence: .sisyphus/evidence/task-14-access-denied.txt
  ```

  **Commit**: YES
  - Message: `feat(guides): add in-platform guide reader with watermark and content protection`
  - Files: `src/services/guide.ts, src/components/GuideReader.tsx, src/components/Watermark.tsx`
  - Pre-commit: `vitest run`

- [x] 15. Audiobook Player Module

  **What to do**:
  - Build audiobook player component at `src/components/AudiobookPlayer.tsx`:
    - Play/pause, seek bar, playback speed (0.5x, 1x, 1.5x, 2x)
    - Chapter navigation (if guide has chapters)
    - Progress persistence (save current position in DB via `LessonProgress` or new model)
    - "Remember position" — resume from where user left off
    - Background audio — player persists in sticky bottom bar while browsing
  - Audio delivery: S3 signed URLs (short-lived, 1h) for audio files
  - Audio format: MP3 (single file per guide, stored in `Guide.audioKey`)
  - TDD: Test player controls, progress persistence, seek behavior

  **Must NOT do**:
  - Do NOT use signed cookies for audio (signed URLs are fine for single files)
  - Do NOT build a streaming audio service (direct S3 signed URL download + HTML5 audio)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Audio player UX with progress persistence
  - **Skills**: [`frontend-ui-ux`, `superpowers/test-driven-development`]
    - `frontend-ui-ux`: Player controls must be intuitive and match brand
    - `superpowers/test-driven-development`: Progress persistence tests

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 9-14, 16)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 27
  - **Blocked By**: Task 2

  **References**:
  **API/Type References**:
  - `prisma/schema.prisma:Guide` — audioKey, audioDuration fields
  - AWS video service: `src/services/aws-video.ts` — Pattern for generating signed URLs (adapt for audio)

  **Acceptance Criteria**:
  - [ ] Player renders with play/pause, seek, speed controls
  - [ ] Speed options: 0.5x, 1x, 1.5x, 2x
  - [ ] Progress saved to DB on pause and periodic interval (30s)
  - [ ] Resuming plays from saved position
  - [ ] Player stays in sticky bar during navigation
  - [ ] vitest run → player tests pass

  **QA Scenarios:**
  ```
  Scenario: Audiobook playback and persistence
    Tool: Playwright
    Preconditions: User logged in, has guide with audio
    Steps:
      1. Navigate to guide with audiobook
      2. Click play button
      3. Wait 5 seconds, assert currentTime > 0
      4. Click pause, note current time T1
      5. Navigate away, then return to guide
      6. Assert player shows time ≈ T1 (resumed position)
    Expected Result: Playback works and position persists
    Evidence: .sisyphus/evidence/task-15-audiobook-playback.png
  ```

  **Commit**: YES
  - Message: `feat(audio): add audiobook player with progress persistence and speed controls`
  - Files: `src/components/AudiobookPlayer.tsx, src/components/AudiobookPlayer.test.tsx`
  - Pre-commit: `vitest run`

- [x] 16. Secure Video Player (HLS + Signed Cookies + Refresh Loop)

  **What to do**:
  - Build secure video player component at `src/components/SecureVideoPlayer.tsx`:
    - Integrate hls.js with `withCredentials: true` for signed cookie passthrough
    - Quality selector (720p, 480p, 360p)
    - Play/pause, seek, volume, fullscreen controls
    - Progress tracking (save to `LessonProgress` table)
    - Loading states and error handling
  - Create API route `GET /api/video/cookies` — Issues CloudFront signed cookies:
    - Verify user has access to requested edition/lesson
    - Verify device is registered
    - Set 3 cookies: CloudFront-Policy, CloudFront-Signature, CloudFront-Key-Pair-Id
    - Cookie TTL: 2 hours, Domain: .perspectivaevei.com
  - **Cookie refresh loop** (CRITICAL):
    - Frontend: `setInterval` every 90 minutes calls `GET /api/video/cookies/refresh`
    - Refresh endpoint checks user still has access, issues new cookies
    - If access revoked (e.g., rata 2 not paid, access expired), return 403
    - hls.js stops on next segment request when cookies expire
  - Custom player chrome (controls) matching brand dark purple theme
  - TDD: Test cookie issuance, access verification, refresh logic, error states

  **Must NOT do**:
  - Do NOT use signed URLs (cookies are required for HLS multi-segment)
  - Do NOT implement screen capture prevention (impossible)
  - Do NOT add forensic watermarking to video
  - Do NOT use Vimeo or any third-party player

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex integration of hls.js + CloudFront cookies + CORS + security
  - **Skills**: [`superpowers/test-driven-development`, `playwright`]
    - `superpowers/test-driven-development`: Cookie security tests
    - `playwright`: Video playback verification in browser

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 9-15)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 26
  - **Blocked By**: Task 8

  **References**:
  **Pattern References**:
  - AWS video service: `src/services/aws-video.ts` — generateSignedCookies(), refreshSignedCookies()
  - Device service: `src/services/device.ts` — validateDevice() for access check

  **External References**:
  - hls.js docs: https://github.com/video-dev/hls.js/blob/master/docs/API.md
  - hls.js `xhrSetup`: Set `withCredentials: true` for cookie passthrough
  - hls.js CORS issue: https://github.com/video-dev/hls.js/issues/2620
  - CloudFront signed cookies: 3 cookies (Policy, Signature, Key-Pair-Id)

  **Acceptance Criteria**:
  - [ ] hls.js loads and plays HLS stream with signed cookies
  - [ ] Quality selector shows 720p, 480p, 360p options
  - [ ] Cookie refresh fires every 90 minutes
  - [ ] Access denied (403) stops playback gracefully with Romanian error message
  - [ ] Progress saved to LessonProgress table
  - [ ] vitest run → video player tests pass

  **QA Scenarios:**
  ```
  Scenario: Video playback with signed cookies
    Tool: Playwright
    Preconditions: User logged in, enrolled in course, lesson video available
    Steps:
      1. Navigate to lesson page
      2. Assert video player element exists
      3. Click play button
      4. Wait 3 seconds, assert video currentTime > 0
      5. Verify cookies set: CloudFront-Policy, CloudFront-Signature, CloudFront-Key-Pair-Id
      6. Screenshot player during playback
    Expected Result: Video plays securely with HLS
    Failure Indicators: CORS errors, cookie missing, playback stuck
    Evidence: .sisyphus/evidence/task-16-video-playback.png

  Scenario: Access revocation stops playback
    Tool: Bash (vitest)
    Preconditions: User has expired access
    Steps:
      1. Call GET /api/video/cookies with expired user
      2. Assert response 403
      3. Assert body contains access denied message
    Expected Result: Expired users cannot get new cookies
    Evidence: .sisyphus/evidence/task-16-access-revoked.txt
  ```

  **Commit**: YES
  - Message: `feat(video): add secure HLS video player with signed cookies and 90-min refresh loop`
  - Files: `src/components/SecureVideoPlayer.tsx, src/app/api/video/cookies/route.ts, src/app/api/video/cookies/refresh/route.ts`
  - Pre-commit: `vitest run`


- [x] 17. Public Pages — Home + About + Contact

  **What to do**:
  - Build 3 public marketing pages matching Webflow brand:
    - `/` (Acasă) — Hero with Eva’s photo, testimonial slider, social proof badges, CTAs
    - `/despre-mine` (About) — Eva's story, credentials, mission statement
    - `/contact` — Contact form (name, email, message) + company info (DECOR-IUTA SRL)
  - Use base components from Task 3 (Hero, Section, Card, Badge, Button, Navbar, Footer)
  - Contact form sends email via Resend to estedespremine@gmail.com
  - Romanian text throughout
  - TDD: Component render tests + contact form submission test

  **Must NOT do**:
  - Do NOT add multi-language support
  - Do NOT use Webflow JavaScript (rewrite interactions in React)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `superpowers/test-driven-development`, `playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 18-24)
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 35, 40
  - **Blocked By**: Task 3

  **References**:
  - `eva-popescu-coach-de-manifestare-consti.webflow/index.html` — Homepage layout, hero, testimonials, sections
  - `eva-popescu-coach-de-manifestare-consti.webflow/images/` — Photos and brand assets
  - `src/components/ui/*` — Base components library

  **Acceptance Criteria**:
  - [ ] 3 pages render with brand colors and Romanian text
  - [ ] Contact form submits and sends email
  - [ ] Navbar and footer consistent across pages
  - [ ] vitest run → page tests pass

  **QA Scenarios:**
  ```
  Scenario: Homepage renders with brand identity
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:3000/
      2. Assert page title contains "Perspectiva Evei"
      3. Assert hero section exists with Eva's photo or text
      4. Assert testimonial section exists
      5. Assert CTA button "Cursul A.D.O." or similar exists
      6. Screenshot full page
    Expected Result: Homepage matches brand, all sections present
    Evidence: .sisyphus/evidence/task-17-homepage.png

  Scenario: Contact form submission
    Tool: Playwright
    Steps:
      1. Navigate to /contact
      2. Fill input[name="name"] with "Test"
      3. Fill input[name="email"] with "test@test.com"
      4. Fill textarea[name="message"] with "Mesaj test"
      5. Click submit button
      6. Assert success toast/message appears
    Expected Result: Form submits successfully
    Evidence: .sisyphus/evidence/task-17-contact-form.png
  ```

  **Commit**: YES
  - Message: `feat(pages): add Home, About, and Contact public pages with Romanian content`
  - Files: `src/app/page.tsx, src/app/despre-mine/page.tsx, src/app/contact/page.tsx, src/app/api/contact/route.ts`
  - Pre-commit: `vitest run`

- [x] 18. Public Pages — Course (ADO) + Pricing

  **What to do**:
  - Build course marketing page `/cursul-ado`:
    - Hero section with course title, description, edition badge
    - Week-by-week curriculum overview (8 weeks)
    - Pricing tabs: Full payment (€1,188) vs 2 Rate (€644×2 = €1,288)
    - "Locuri disponibile: X/15" live counter
    - FAQ accordion section
    - Testimonial section
    - CTA button linking to checkout
  - Dynamic data from course/edition service (not hardcoded)
  - Show enrollment status (open/closed) based on active edition
  - TDD: Test pricing display, enrollment counter, FAQ rendering

  **Must NOT do**:
  - Do NOT hardcode pricing (fetch from DB)
  - Do NOT build the actual checkout (Task 11)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `superpowers/test-driven-development`, `playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 17, 19-24)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 40
  - **Blocked By**: Tasks 3, 10

  **References**:
  - `eva-popescu-coach-de-manifestare-consti.webflow/cursul-ado.html` — Complete course page layout with pricing tabs, FAQ, curriculum
  - `src/services/course.ts` — getActiveEdition(), enrollment count

  **Acceptance Criteria**:
  - [ ] Pricing tabs switch between full and installment views
  - [ ] Enrollment counter shows real data
  - [ ] FAQ accordion expands/collapses
  - [ ] CTA links to checkout with correct product
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: Course page with pricing tabs
    Tool: Playwright
    Steps:
      1. Navigate to /cursul-ado
      2. Assert page contains "€1.188" (full payment)
      3. Click installment tab
      4. Assert page contains "€644" and "2 rate"
      5. Assert enrollment counter shows "X/15 locuri"
      6. Screenshot pricing section
    Expected Result: Both pricing options displayed with live counter
    Evidence: .sisyphus/evidence/task-18-course-pricing.png
  ```

  **Commit**: YES
  - Message: `feat(pages): add Course ADO page with pricing tabs and enrollment counter`
  - Files: `src/app/cursul-ado/page.tsx`
  - Pre-commit: `vitest run`

- [x] 19. Public Pages — Guides Listing + Detail

  **What to do**:
  - Build guides listing page `/ghiduri`:
    - Guide cards with cover image, title, description, price
    - Bundle card with savings badge ("Economisești €27.50!")
    - CTA buttons linking to checkout
  - Build individual guide pages `/ghiduri/[slug]`:
    - Full description, table of contents preview
    - Price with CTA to checkout
    - Related guides section
  - Dynamic data from Prisma queries
  - TDD: Test guide card rendering, bundle pricing, routing

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `superpowers/test-driven-development`, `playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 17-18, 20-24)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 40
  - **Blocked By**: Tasks 3, 14

  **References**:
  - `eva-popescu-coach-de-manifestare-consti.webflow/ghiduri.html` — Guide cards layout, bundle display
  - `src/services/guide.ts` — getUserGuides()
  - `src/services/bundle.ts` — getBundleWithItems(), calculateBundleDiscount()

  **Acceptance Criteria**:
  - [ ] 3 guide cards + 1 bundle card render on listing page
  - [ ] Bundle card shows original price crossed out and savings
  - [ ] Individual guide page renders with description and CTA
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: Guides listing with bundle
    Tool: Playwright
    Steps:
      1. Navigate to /ghiduri
      2. Assert 3 individual guide cards present
      3. Assert bundle card shows "€82,50" and savings text
      4. Click first guide card
      5. Assert URL changes to /ghiduri/[slug]
      6. Screenshot listing page
    Expected Result: All guides and bundle displayed correctly
    Evidence: .sisyphus/evidence/task-19-guides-listing.png
  ```

  **Commit**: YES
  - Message: `feat(pages): add Guides listing and detail pages with bundle display`
  - Files: `src/app/ghiduri/page.tsx, src/app/ghiduri/[slug]/page.tsx`
  - Pre-commit: `vitest run`

- [x] 20. Public Pages — 1:1 Sessions + Blog + Case Studies

  **What to do**:
  - Build `/sedinte-1-la-1` page:
    - Description of 1:1 coaching sessions
    - Benefits section, testimonials
    - CTA button to book (links to scheduling system, Task 28)
  - Build `/blog` listing page:
    - Blog post cards with cover image, title, excerpt, date
    - Pagination
  - Build `/blog/[slug]` detail page:
    - Full blog post content
    - Share buttons
  - Build `/studii-de-caz` listing page:
    - Case study cards with client name, testimonial quote, image
  - Build `/studii-de-caz/[slug]` detail page:
    - Full case study content
  - All pages use base components and brand design
  - TDD: Test page rendering, pagination, routing

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `superpowers/test-driven-development`, `playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 17-19, 21-24)
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 30, 40
  - **Blocked By**: Task 3

  **References**:
  - `eva-popescu-coach-de-manifestare-consti.webflow/sedinte-1-la-1.html` — 1:1 sessions page layout
  - `eva-popescu-coach-de-manifestare-consti.webflow/index.html` — Blog section patterns

  **Acceptance Criteria**:
  - [ ] All 5 pages render with Romanian content
  - [ ] Blog listing has pagination
  - [ ] Blog posts render markdown/rich content
  - [ ] Case studies show testimonial quotes
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: Blog listing with pagination
    Tool: Playwright
    Steps:
      1. Navigate to /blog
      2. Assert blog post cards present
      3. If pagination exists, click page 2
      4. Assert new posts loaded
      5. Screenshot blog page
    Expected Result: Blog listing renders with pagination
    Evidence: .sisyphus/evidence/task-20-blog-listing.png
  ```

  **Commit**: YES
  - Message: `feat(pages): add 1:1 Sessions, Blog, and Case Studies public pages`
  - Files: `src/app/sedinte-1-la-1/page.tsx, src/app/blog/*, src/app/studii-de-caz/*`
  - Pre-commit: `vitest run`


- [x] 21. Admin Layout + Dashboard + Auth Guard

  **What to do**:
  - Build admin layout at `src/app/admin/layout.tsx`:
    - Sidebar navigation with sections: Dashboard, Cursuri, Ghiduri, Produse, Utilizatori, Comenzi, Facturi, Blog, Studii de caz, Promo coduri, Programări, Setări
    - Admin header with Eva's name and logout button
    - Responsive sidebar (collapse on mobile)
  - Build admin dashboard at `src/app/admin/page.tsx`:
    - Overview cards: Total users, Active enrollments, Revenue (month), Pending orders
    - Recent orders list (last 10)
    - Upcoming 1:1 sessions
  - Admin auth guard middleware: only ADMIN role can access `/admin/*`
  - TDD: Test dashboard data fetching, auth guard, layout rendering

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `superpowers/test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 17-20, 22-24)
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 22-24, 29, 30, 36, 37
  - **Blocked By**: Tasks 3, 4

  **References**:
  - `src/lib/auth.ts` — NextAuth session and role checking
  - `prisma/schema.prisma` — All models for dashboard queries

  **Acceptance Criteria**:
  - [ ] Admin sidebar renders with all 12 navigation items
  - [ ] Dashboard shows 4 overview cards with live data
  - [ ] Non-admin users see 403 on /admin
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: Admin dashboard access
    Tool: Playwright
    Preconditions: Logged in as ADMIN user
    Steps:
      1. Navigate to /admin
      2. Assert sidebar navigation exists with 12+ items
      3. Assert dashboard cards show numeric values
      4. Assert recent orders section exists
      5. Screenshot admin dashboard
    Expected Result: Full admin dashboard renders
    Evidence: .sisyphus/evidence/task-21-admin-dashboard.png

  Scenario: Admin guard blocks regular user
    Tool: Playwright
    Preconditions: Logged in as regular USER
    Steps:
      1. Navigate to /admin
      2. Assert page shows 403 or redirects to /
    Expected Result: Access denied
    Evidence: .sisyphus/evidence/task-21-admin-guard.png
  ```

  **Commit**: YES
  - Message: `feat(admin): add admin layout, dashboard, and role-based auth guard`
  - Files: `src/app/admin/layout.tsx, src/app/admin/page.tsx, src/app/admin/components/*`
  - Pre-commit: `vitest run`

- [x] 22. Admin — Course/Cohort CRUD

  **What to do**:
  - Build admin course management pages:
    - `/admin/cursuri` — List all courses
    - `/admin/cursuri/[id]` — Edit course details
    - `/admin/cursuri/[id]/editii` — List editions for course
    - `/admin/cursuri/[id]/editii/new` — Create new edition
    - `/admin/cursuri/[id]/editii/[editionId]` — Edit edition (dates, max participants, enrollment open/close)
    - `/admin/cursuri/[id]/editii/[editionId]/lectii` — Manage lessons (add, reorder, set video key, availability date)
    - `/admin/cursuri/[id]/editii/[editionId]/cursanti` — View enrolled students with progress
  - API routes: CRUD for courses, editions, lessons, enrollments
  - Video upload: Admin uploads MP4 to S3, trigger MediaConvert job (or provide S3 key)
  - TDD: Test CRUD operations, lesson ordering, enrollment list

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`superpowers/test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 17-21, 23-24)
  - **Parallel Group**: Wave 3
  - **Blocked By**: Tasks 10, 21

  **References**:
  - `src/services/course.ts` — Course service functions
  - `src/services/aws-video.ts` — createTranscodeJob() for video upload
  - `prisma/schema.prisma:Course, CourseEdition, Lesson, CourseEnrollment`

  **Acceptance Criteria**:
  - [ ] Admin can create/edit courses and editions
  - [ ] Admin can add/reorder lessons with video keys
  - [ ] Admin can view enrolled students per edition
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: Create new course edition
    Tool: Playwright
    Preconditions: Admin logged in, course exists
    Steps:
      1. Navigate to /admin/cursuri/[id]/editii/new
      2. Fill edition number, start date, end date, max participants
      3. Submit form
      4. Assert redirect to editions list
      5. Assert new edition appears in list
    Expected Result: Edition created successfully
    Evidence: .sisyphus/evidence/task-22-create-edition.png
  ```

  **Commit**: YES
  - Message: `feat(admin): add course and cohort management CRUD`
  - Files: `src/app/admin/cursuri/*, src/app/api/admin/courses/*, src/app/api/admin/editions/*`
  - Pre-commit: `vitest run`

- [x] 23. Admin — Guide/Product CRUD

  **What to do**:
  - Build admin guide management:
    - `/admin/ghiduri` — List all guides
    - `/admin/ghiduri/[id]` — Edit guide (title, description, price, content JSON, cover image, audio file)
    - `/admin/ghiduri/new` — Create new guide
  - Build admin product management:
    - `/admin/produse` — List all products (jute bags etc.)
    - `/admin/produse/[id]` — Edit product (title, price, stock, images)
    - `/admin/produse/new` — Create new product
  - Content editor for guides: rich text editor that saves as JSON structure
  - Audio file upload: S3 upload for audiobook files
  - Image upload: S3 or Vercel blob for cover images and product photos
  - TDD: Test CRUD operations, content saving, file uploads

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`superpowers/test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 17-22, 24)
  - **Parallel Group**: Wave 3
  - **Blocked By**: Tasks 14, 21

  **References**:
  - `src/services/guide.ts` — Guide service functions
  - `prisma/schema.prisma:Guide, Product`

  **Acceptance Criteria**:
  - [ ] Admin can create/edit/delete guides with content editor
  - [ ] Guide content saves as JSON and renders in reader
  - [ ] Audio file upload works to S3
  - [ ] Product CRUD works for jute bags
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: Create new guide with content
    Tool: Playwright
    Preconditions: Admin logged in
    Steps:
      1. Navigate to /admin/ghiduri/new
      2. Fill title, description, price
      3. Write content in rich text editor
      4. Submit form
      5. Assert redirect to guide list
      6. Assert new guide appears
    Expected Result: Guide created with content
    Evidence: .sisyphus/evidence/task-23-create-guide.png
  ```

  **Commit**: YES
  - Message: `feat(admin): add guide and product management CRUD with content editor`
  - Files: `src/app/admin/ghiduri/*, src/app/admin/produse/*, src/app/api/admin/guides/*, src/app/api/admin/products/*`
  - Pre-commit: `vitest run`

- [x] 24. Admin — User Management + Device Admin

  **What to do**:
  - Build admin user management:
    - `/admin/utilizatori` — List all users with search, filter by role
    - `/admin/utilizatori/[id]` — User detail: profile, orders, enrollments, guide access, devices
    - Admin can: change role, reset password, grant/revoke access, remove devices
  - Device admin: view user's devices, remotely remove a device
  - Access management: manually grant course enrollment or guide access
  - TDD: Test user listing, search, device removal, access granting

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`superpowers/test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 17-23)
  - **Parallel Group**: Wave 3
  - **Blocked By**: Tasks 9, 21

  **References**:
  - `src/services/device.ts` — listDevices(), removeDevice()
  - `src/services/course.ts` — enrollUser()
  - `prisma/schema.prisma:User, Device, CourseEnrollment, GuideAccess`

  **Acceptance Criteria**:
  - [ ] Admin can search users by name/email
  - [ ] Admin can view user’s devices and remove one
  - [ ] Admin can manually grant course/guide access
  - [ ] Admin can change user role
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: Admin removes user device
    Tool: Playwright
    Preconditions: Admin logged in, user with 2 devices exists
    Steps:
      1. Navigate to /admin/utilizatori/[userId]
      2. Find devices section showing 2 devices
      3. Click remove button on first device
      4. Confirm deletion
      5. Assert only 1 device remains
    Expected Result: Device removed successfully
    Evidence: .sisyphus/evidence/task-24-remove-device.png
  ```

  **Commit**: YES
  - Message: `feat(admin): add user management with device admin and access control`
  - Files: `src/app/admin/utilizatori/*, src/app/api/admin/users/*`
  - Pre-commit: `vitest run`


- [x] 25. User Dashboard — Profilul Meu

  **What to do**:
  - Build user profile/dashboard at `/profilul-meu`:
    - Personal info section: name, email, phone (editable)
    - Password change form
    - Devices section: list registered devices with "Elimină dispozitiv" button
    - Purchased guides: list with links to reader
    - Active course enrollments: list with links to course page
    - Order history: list with status, amount, invoice download link
    - Upcoming 1:1 sessions
  - API routes: update profile, change password, list orders, download invoice PDF
  - TDD: Test profile update, password change, order listing

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `superpowers/test-driven-development`, `playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 26-31)
  - **Parallel Group**: Wave 4
  - **Blocked By**: Tasks 4, 9

  **References**:
  - `eva-popescu-coach-de-manifestare-consti.webflow/profilul-meu.html` — User profile layout from Memberstack
  - `src/services/device.ts` — listDevices(), removeDevice()

  **Acceptance Criteria**:
  - [ ] User can edit name and phone
  - [ ] User can change password
  - [ ] Device list shows with remove buttons
  - [ ] Order history with invoice PDF download links
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: User profile page
    Tool: Playwright
    Preconditions: User logged in with purchases
    Steps:
      1. Navigate to /profilul-meu
      2. Assert profile form shows user name and email
      3. Assert devices section shows registered devices
      4. Assert order history shows previous orders
      5. Screenshot profile page
    Expected Result: Full user dashboard renders
    Evidence: .sisyphus/evidence/task-25-profile.png
  ```

  **Commit**: YES
  - Message: `feat(user): add Profilul Meu dashboard with orders, devices, and profile management`
  - Files: `src/app/profilul-meu/*, src/app/api/user/*`
  - Pre-commit: `vitest run`

- [x] 26. User — Course Access + Video Lessons Page

  **What to do**:
  - Build course access pages:
    - `/curs/[editionSlug]` — Course overview: edition info, lesson list with progress bars
    - `/curs/[editionSlug]/lectia/[lessonSlug]` — Lesson page with SecureVideoPlayer
  - Lesson list shows:
    - Lesson title, duration, availability date
    - Progress indicator (watched/unwatched/completed)
    - Lock icon for lessons not yet available
  - Lesson page:
    - SecureVideoPlayer (from Task 16) with the lesson's HLS stream
    - Lesson title and notes
    - Previous/next lesson navigation
  - Access control: verify enrollment + check access expiry + verify device
  - TDD: Test access control, lesson navigation, progress display

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`superpowers/test-driven-development`, `playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 25, 27-31)
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 38
  - **Blocked By**: Tasks 10, 16

  **References**:
  - `src/components/SecureVideoPlayer.tsx` — Video player component
  - `src/services/course.ts` — checkAccess(), getEditionLessons(), getUserProgress()
  - `src/services/device.ts` — validateDevice()

  **Acceptance Criteria**:
  - [ ] Lesson list shows progress indicators per lesson
  - [ ] Locked lessons show lock icon with availability date
  - [ ] Video player loads and plays lesson content
  - [ ] Previous/next navigation works
  - [ ] Unenrolled user sees access denied
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: Course lesson page with video
    Tool: Playwright
    Preconditions: User enrolled, lessons available
    Steps:
      1. Navigate to /curs/[edition]/lectia/[lesson]
      2. Assert video player element exists
      3. Assert lesson title visible
      4. Assert prev/next navigation buttons present
      5. Screenshot lesson page
    Expected Result: Lesson page renders with video player
    Evidence: .sisyphus/evidence/task-26-lesson-page.png

  Scenario: Unenrolled user denied
    Tool: Playwright
    Preconditions: User logged in but NOT enrolled
    Steps:
      1. Navigate to /curs/[edition]
      2. Assert access denied message in Romanian
    Expected Result: Access denied for unenrolled user
    Evidence: .sisyphus/evidence/task-26-access-denied.png
  ```

  **Commit**: YES
  - Message: `feat(course): add user course access pages with video lessons and progress tracking`
  - Files: `src/app/curs/[editionSlug]/*, src/app/api/lessons/*`
  - Pre-commit: `vitest run`

- [x] 27. User — Guide Library + Reader Page

  **What to do**:
  - Build user guide library at `/ghidurile-mele`:
    - List purchased guides with cover images
    - Link to guide reader for each
    - Link to audiobook player for guides with audio
  - Build guide reader page at `/ghidurile-mele/[slug]`:
    - Integrate GuideReader component (Task 14) with watermark
    - Integrate AudiobookPlayer component (Task 15) in sticky bar
    - Navigation: table of contents sidebar, page navigation
  - Access control: verify GuideAccess exists for user + guide
  - TDD: Test access control, reader rendering, audio integration

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `superpowers/test-driven-development`, `playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 25-26, 28-31)
  - **Parallel Group**: Wave 4
  - **Blocked By**: Tasks 14, 15

  **References**:
  - `src/components/GuideReader.tsx` — Reader with watermark from Task 14
  - `src/components/AudiobookPlayer.tsx` — Player from Task 15
  - `src/services/guide.ts` — getGuideContent(), getUserGuides()

  **Acceptance Criteria**:
  - [ ] User’s purchased guides listed on /ghidurile-mele
  - [ ] Guide reader shows content with watermark
  - [ ] Audiobook player visible in sticky bar
  - [ ] Unpurchased guide access denied
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: Guide reading experience
    Tool: Playwright
    Preconditions: User logged in, guide purchased
    Steps:
      1. Navigate to /ghidurile-mele
      2. Assert purchased guide card visible
      3. Click guide to open reader
      4. Assert watermark with user email visible
      5. Assert audiobook play button present
      6. Screenshot reader page
    Expected Result: Full reading experience with security
    Evidence: .sisyphus/evidence/task-27-guide-reader.png
  ```

  **Commit**: YES
  - Message: `feat(guides): add user guide library with reader and audiobook integration`
  - Files: `src/app/ghidurile-mele/*, src/app/api/user/guides/*`
  - Pre-commit: `vitest run`

- [x] 28. 1:1 Session Scheduling System

  **What to do**:
  - Create scheduling service at `src/services/scheduling.ts`:
    - `getAvailableSlots(dateRange)` — Get open slots based on admin availability
    - `bookSession(userId, slotDate, duration)` — Book a session
    - `cancelSession(sessionId, userId)` — Cancel with 24h policy
    - `getUserSessions(userId)` — List user's booked sessions
  - Build booking page at `/programare`:
    - Calendar view showing available dates
    - Time slot picker for selected date
    - Booking confirmation with payment (via Revolut checkout)
  - Build API routes:
    - `GET /api/scheduling/slots` — Available slots
    - `POST /api/scheduling/book` — Book session + create order
    - `DELETE /api/scheduling/[id]` — Cancel session
  - Availability model: admin sets recurring weekly slots (day + time range)
  - Emails: booking confirmation + 24h reminder via Resend
  - TDD: Test slot availability, booking, cancellation, conflict detection

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`superpowers/test-driven-development`, `playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 25-27, 29-31)
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 37
  - **Blocked By**: Tasks 2, 5

  **References**:
  - `prisma/schema.prisma:Session1on1, Availability` — Scheduling models
  - `src/services/email.ts` — SessionBookedEmail, SessionReminderEmail
  - `src/services/checkout.ts` — For session payment
  - `eva-popescu-coach-de-manifestare-consti.webflow/sedinte-1-la-1.html` — Current session info

  **Acceptance Criteria**:
  - [ ] Calendar shows available dates
  - [ ] User can select slot and book session
  - [ ] Double-booking prevented (same slot)
  - [ ] Cancellation within 24h policy enforced
  - [ ] Booking confirmation email sent
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: Book a 1:1 session
    Tool: Playwright
    Preconditions: Admin has set availability, user logged in
    Steps:
      1. Navigate to /programare
      2. Select a date with available slots
      3. Click an available time slot
      4. Confirm booking
      5. Assert success message
      6. Assert session appears in /profilul-meu
    Expected Result: Session booked successfully
    Evidence: .sisyphus/evidence/task-28-book-session.png

  Scenario: Double booking prevented
    Tool: Bash (vitest)
    Steps:
      1. Book slot at 2025-03-15 10:00
      2. Try booking same slot for another user
      3. Assert error "Slotul nu mai este disponibil"
    Expected Result: Conflict detected and rejected
    Evidence: .sisyphus/evidence/task-28-double-booking.txt
  ```

  **Commit**: YES
  - Message: `feat(scheduling): add 1:1 session booking with calendar, availability, and email notifications`
  - Files: `src/services/scheduling.ts, src/app/programare/*, src/app/api/scheduling/*`
  - Pre-commit: `vitest run`

- [x] 29. Admin — Orders/Invoices Management

  **What to do**:
  - Build admin orders page `/admin/comenzi`:
    - Orders list: filter by status (PENDING, COMPLETED, FAILED), date range, user
    - Order detail: items, payment status, Revolut order ID, installment info
    - Action: refund order (triggers Revolut refund + SmartBill storno)
  - Build admin invoices page `/admin/facturi`:
    - Invoice list: filter by status, date, series
    - Invoice detail: SmartBill series/number, PDF download, status
    - Action: retry failed invoice, storno invoice
  - TDD: Test order listing, filtering, refund flow, invoice management

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`superpowers/test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 25-28, 30-31)
  - **Parallel Group**: Wave 4
  - **Blocked By**: Tasks 11, 12, 21

  **References**:
  - `src/services/revolut.ts` — refundOrder()
  - `src/services/smartbill.ts` — stornoInvoice(), getInvoicePdf()
  - `prisma/schema.prisma:Order, OrderItem, Invoice`

  **Acceptance Criteria**:
  - [ ] Admin can view all orders with filters
  - [ ] Admin can initiate refund
  - [ ] Admin can download invoice PDF
  - [ ] Admin can retry failed invoices
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: Admin views orders with filters
    Tool: Playwright
    Preconditions: Admin logged in, orders exist
    Steps:
      1. Navigate to /admin/comenzi
      2. Assert orders table shows data
      3. Select filter status=COMPLETED
      4. Assert only completed orders shown
      5. Screenshot orders page
    Expected Result: Filtered orders list works
    Evidence: .sisyphus/evidence/task-29-orders-admin.png
  ```

  **Commit**: YES
  - Message: `feat(admin): add orders and invoices management with refund and storno`
  - Files: `src/app/admin/comenzi/*, src/app/admin/facturi/*, src/app/api/admin/orders/*, src/app/api/admin/invoices/*`
  - Pre-commit: `vitest run`

- [x] 30. Admin — Blog Editor + Case Studies Editor

  **What to do**:
  - Build blog editor at `/admin/blog`:
    - List posts (published/draft)
    - Rich text editor for post content (Tiptap or similar)
    - Cover image upload
    - Publish/unpublish toggle
    - Slug auto-generation from title
  - Build case studies editor at `/admin/studii-de-caz`:
    - Same pattern as blog with additional fields: client name, testimonial quote
  - TDD: Test editor rendering, publish/unpublish, slug generation

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `superpowers/test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 25-29, 31)
  - **Parallel Group**: Wave 4
  - **Blocked By**: Tasks 20, 21

  **References**:
  - `prisma/schema.prisma:BlogPost, CaseStudy`

  **Acceptance Criteria**:
  - [ ] Admin can create/edit/publish blog posts
  - [ ] Rich text editor with image support
  - [ ] Slug auto-generates from title
  - [ ] Case studies include testimonial fields
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: Create and publish blog post
    Tool: Playwright
    Preconditions: Admin logged in
    Steps:
      1. Navigate to /admin/blog/new
      2. Fill title "Testare Blog"
      3. Write content in rich text editor
      4. Upload cover image
      5. Toggle publish
      6. Submit
      7. Navigate to /blog → assert new post visible
    Expected Result: Blog post created and visible on public page
    Evidence: .sisyphus/evidence/task-30-blog-editor.png
  ```

  **Commit**: YES
  - Message: `feat(admin): add blog and case studies editor with rich text and publishing`
  - Files: `src/app/admin/blog/*, src/app/admin/studii-de-caz/*, src/app/api/admin/blog/*, src/app/api/admin/case-studies/*`
  - Pre-commit: `vitest run`

- [x] 31. Jute Bags Product Page + Physical Product Checkout

  **What to do**:
  - Build product page `/produse/[slug]`:
    - Product images gallery
    - Title, description, price
    - Size/quantity selector
    - "Adaugă în coș" button
    - Shipping address form (Romanian address fields: județ, localitate, stradă, cod poștal)
  - Extend checkout for physical products:
    - Add shipping address collection step before payment
    - Order includes shipping status: PENDING → SHIPPED → DELIVERED
    - Admin manually updates shipping status
  - SmartBill invoice includes shipping (if applicable)
  - TDD: Test product display, address validation, shipping flow

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `superpowers/test-driven-development`, `playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 25-30)
  - **Parallel Group**: Wave 4
  - **Blocked By**: Task 11

  **References**:
  - `src/services/checkout.ts` — Extend for physical product type
  - `prisma/schema.prisma:Product, Order`
  - `eva-popescu-coach-de-manifestare-consti.webflow/` — Jute bag product reference (if available)

  **Acceptance Criteria**:
  - [ ] Product page renders with images, price, quantity
  - [ ] Shipping address form with Romanian fields
  - [ ] Order created with shipping status PENDING
  - [ ] SmartBill invoice generated for physical product
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: Purchase jute bag with shipping
    Tool: Playwright
    Preconditions: User logged in, jute bag product exists
    Steps:
      1. Navigate to /produse/sacosa-iuta
      2. Select quantity 2
      3. Click "Adaugă în coș"
      4. Fill shipping address (București, Sector 1, etc.)
      5. Proceed to Revolut checkout
      6. Assert checkout shows product + shipping info
    Expected Result: Physical product checkout with address
    Evidence: .sisyphus/evidence/task-31-jute-bag.png
  ```

  **Commit**: YES
  - Message: `feat(products): add jute bag product page with shipping address and physical product checkout`
  - Files: `src/app/produse/[slug]/page.tsx, src/app/checkout/page.tsx (updated for shipping)`
  - Pre-commit: `vitest run`


- [x] 32. Revolut Webhook Handler + Polling Fallback

  **What to do**:
  - Create webhook handler at `POST /api/webhooks/revolut`:
    - Verify HMAC-SHA256 signature using raw body (`req.text()`, NOT `req.json()`)
    - Handle events: ORDER_COMPLETED, ORDER_AUTHORISED, ORDER_CANCELLED, ORDER_FAILED
    - On ORDER_COMPLETED: trigger fulfillment + async SmartBill invoice
    - On ORDER_FAILED/CANCELLED: update order status in DB
    - Return 200 immediately, process asynchronously
  - Implement polling fallback:
    - Cron job: every 5 minutes, check all PENDING orders older than 35 minutes
    - For each: call `getOrder(id)` to check status, update if changed
    - Why 35 min: Revolut retries for 30 min, then polling takes over
  - Idempotent processing: if order already fulfilled, skip (check order status before processing)
  - TDD: Test signature verification, event handling, polling logic, idempotency

  **Must NOT do**:
  - Do NOT use `req.json()` before signature verification (invalidates signature)
  - Do NOT process webhook synchronously (acknowledge immediately, process async)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`superpowers/test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 33-37)
  - **Parallel Group**: Wave 5
  - **Blocked By**: Tasks 11, 12

  **References**:
  - `src/services/revolut.ts` — verifyWebhookSignature(), getOrder()
  - `src/services/checkout.ts` — handleOrderComplete()
  - Revolut webhook docs: https://developer.revolut.com/docs/merchant/webhooks
  - Signature format: `v1.{timestamp}.{body}` → HMAC-SHA256

  **Acceptance Criteria**:
  - [ ] Webhook validates signature correctly (rejects tampered)
  - [ ] ORDER_COMPLETED triggers fulfillment + invoice
  - [ ] Polling fallback catches orders not received via webhook
  - [ ] Idempotent: double-processing same event is a no-op
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: Webhook processes ORDER_COMPLETED
    Tool: Bash (curl)
    Steps:
      1. POST /api/webhooks/revolut with valid signature and ORDER_COMPLETED payload
      2. Assert response 200
      3. Verify order status updated to COMPLETED in DB
      4. Verify fulfillment triggered (GuideAccess or CourseEnrollment created)
    Expected Result: Webhook correctly processes payment completion
    Evidence: .sisyphus/evidence/task-32-webhook-complete.txt

  Scenario: Polling fallback catches stale order
    Tool: Bash (vitest)
    Steps:
      1. Create order in PENDING status, createdAt = 40 minutes ago
      2. Mock Revolut getOrder returns COMPLETED
      3. Run polling job
      4. Assert order updated to COMPLETED and fulfilled
    Expected Result: Polling catches missed webhook
    Evidence: .sisyphus/evidence/task-32-polling-fallback.txt
  ```

  **Commit**: YES
  - Message: `feat(webhooks): add Revolut webhook handler with signature verification and polling fallback`
  - Files: `src/app/api/webhooks/revolut/route.ts, src/services/order-polling.ts, src/services/order-polling.test.ts`
  - Pre-commit: `vitest run`

- [x] 33. SmartBill Async Invoice Pipeline

  **What to do**:
  - Create invoice pipeline at `src/services/invoice-pipeline.ts`:
    - `queueInvoice(orderId)` — Add invoice creation to async queue
    - `processInvoiceQueue()` — Process pending invoices (respecting rate limit)
    - `retryFailedInvoice(invoiceId)` — Retry a failed invoice
  - Invoice creation flow:
    1. Checkout completes → `queueInvoice(orderId)` called
    2. Queue processor creates SmartBill invoice with:
       - `isTaxIncluded: true` and gross price
       - B2C client: `vatCode: "0000000000000"`
       - Company: DECOR-IUTA SRL vatCode
       - TVA: 21%
    3. On success: save series/number to Invoice record, update status to CREATED
    4. On failure: save errorText, update status to FAILED, schedule retry
  - Rate limit compliance: process max 25/10sec (buffer below 30 limit)
  - Error handling: check `response.errorText` even on HTTP 200
  - Handle SmartBill HTTP 500 for malformed payloads with descriptive logging
  - TDD: Test queue processing, rate limiting, error handling, retry logic

  **Must NOT do**:
  - Do NOT call SmartBill synchronously from any request handler
  - Do NOT exceed 25 req/10sec (buffer below 30 hard limit)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`superpowers/test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 32, 34-37)
  - **Parallel Group**: Wave 5
  - **Blocked By**: Tasks 7, 11

  **References**:
  - `src/services/smartbill.ts` — createInvoice(), SmartBill types
  - `prisma/schema.prisma:Invoice` — Invoice record model

  **Acceptance Criteria**:
  - [ ] Invoices created asynchronously after checkout
  - [ ] Rate limiter keeps below 25 req/10sec
  - [ ] Failed invoices logged with errorText and retried
  - [ ] HTTP 200 with errorText treated as failure
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: Invoice creation after order
    Tool: Bash (vitest)
    Steps:
      1. Complete an order (mock Revolut)
      2. Assert queueInvoice called
      3. Process queue
      4. Assert SmartBill createInvoice called with isTaxIncluded=true, vatCode=0000000000000
      5. Assert Invoice record status = CREATED
    Expected Result: Invoice created correctly
    Evidence: .sisyphus/evidence/task-33-invoice-pipeline.txt
  ```

  **Commit**: YES
  - Message: `feat(invoicing): add async SmartBill invoice pipeline with rate limiting and retry`
  - Files: `src/services/invoice-pipeline.ts, src/services/invoice-pipeline.test.ts`
  - Pre-commit: `vitest run`

- [x] 34. Memberstack User Migration Script

  **What to do**:
  - Create migration script at `scripts/migrate-memberstack.ts`:
    - Import users from Memberstack export (CSV or API)
    - Map Memberstack user fields to Prisma User model
    - Hash temporary passwords (or send password reset emails)
    - Map existing purchases/memberships to CourseEnrollment/GuideAccess records
    - Dry-run mode: show what would be migrated without writing
    - Logging: track migrated/skipped/failed users
  - Handle edge cases: duplicate emails, missing fields, invalid data
  - TDD: Test mapping logic, duplicate detection, dry-run mode

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`superpowers/test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 32-33, 35-37)
  - **Parallel Group**: Wave 5
  - **Blocked By**: Tasks 2, 4

  **References**:
  - Memberstack ID: `app_cm1j5tdr1003p0swq14s73rmz` (from existing site)
  - `prisma/schema.prisma:User, CourseEnrollment, GuideAccess`
  - `src/services/email.ts` — Password reset email for migrated users

  **Acceptance Criteria**:
  - [ ] Dry-run shows migration plan without changes
  - [ ] Users migrated with correct email and name
  - [ ] Existing purchases mapped to access records
  - [ ] Duplicate emails handled gracefully
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: Dry-run migration
    Tool: Bash
    Steps:
      1. npx tsx scripts/migrate-memberstack.ts --dry-run --input=test-data.csv
      2. Assert output shows user count, purchase mappings
      3. Assert no database writes occurred
    Expected Result: Migration plan displayed without side effects
    Evidence: .sisyphus/evidence/task-34-migration-dry-run.txt
  ```

  **Commit**: YES
  - Message: `feat(migration): add Memberstack user migration script with dry-run mode`
  - Files: `scripts/migrate-memberstack.ts, scripts/migrate-memberstack.test.ts`
  - Pre-commit: `vitest run`

- [x] 35. Google Analytics Integration

  **What to do**:
  - Add Google Analytics 4 (GA4) to the application:
    - Install `@next/third-parties` or manual gtag.js injection
    - Measurement ID: G-43N815K6XD (from existing site)
    - Track page views automatically via Next.js router
    - Custom events: `purchase_complete`, `checkout_started`, `guide_opened`, `video_played`
  - Cookie consent banner (GDPR): show consent before loading GA
  - TDD: Test GA initialization, event firing, consent handling

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`superpowers/test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 32-34, 36-37)
  - **Parallel Group**: Wave 5
  - **Blocked By**: Task 17

  **References**:
  - GA Measurement ID: G-43N815K6XD (from existing Webflow site)
  - `eva-popescu-coach-de-manifestare-consti.webflow/index.html` — Existing GA snippet

  **Acceptance Criteria**:
  - [ ] GA4 loads with correct measurement ID
  - [ ] Page views tracked on navigation
  - [ ] Custom events fire on key actions
  - [ ] Cookie consent banner shown before GA
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: GA loads after consent
    Tool: Playwright
    Steps:
      1. Navigate to / (fresh session, no cookies)
      2. Assert cookie consent banner visible
      3. Accept cookies
      4. Assert gtag script loaded
      5. Navigate to /cursul-ado
      6. Assert page_view event fired (check network requests or dataLayer)
    Expected Result: GA tracks only after consent
    Evidence: .sisyphus/evidence/task-35-ga-consent.png
  ```

  **Commit**: YES
  - Message: `feat(analytics): add Google Analytics 4 with consent banner and custom events`
  - Files: `src/components/CookieConsent.tsx, src/lib/analytics.ts, src/app/layout.tsx (updated)`
  - Pre-commit: `vitest run`

- [x] 36. Admin — Promo Codes + Bundles Management

  **What to do**:
  - Build admin promo codes page `/admin/promo-coduri`:
    - List all promo codes with status (active/expired/max-uses)
    - Create new: code, type (%), value, valid dates, max uses, product restrictions
    - Edit/deactivate existing codes
    - Usage stats: how many times used, by whom
  - Build admin bundles page `/admin/bundle-uri`:
    - List all bundles
    - Create/edit: title, price, included guides, active toggle
  - TDD: Test CRUD operations, validation

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`superpowers/test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 32-35, 37)
  - **Parallel Group**: Wave 5
  - **Blocked By**: Tasks 13, 21

  **References**:
  - `src/services/promo.ts` — Promo code service
  - `src/services/bundle.ts` — Bundle service
  - `prisma/schema.prisma:PromoCode, Bundle, BundleItem`

  **Acceptance Criteria**:
  - [ ] Admin can create/edit/deactivate promo codes
  - [ ] Usage stats shown per code
  - [ ] Admin can create/edit bundles with guide selection
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: Create promo code
    Tool: Playwright
    Preconditions: Admin logged in
    Steps:
      1. Navigate to /admin/promo-coduri/new
      2. Fill code "SUMMER20", type Percentage, value 20, valid dates
      3. Submit
      4. Assert code appears in list
    Expected Result: Promo code created
    Evidence: .sisyphus/evidence/task-36-create-promo.png
  ```

  **Commit**: YES
  - Message: `feat(admin): add promo code and bundle management CRUD`
  - Files: `src/app/admin/promo-coduri/*, src/app/admin/bundle-uri/*, src/app/api/admin/promo/*, src/app/api/admin/bundles/*`
  - Pre-commit: `vitest run`

- [x] 37. Admin — Scheduling + Availability Management

  **What to do**:
  - Build admin scheduling page `/admin/programari`:
    - View all booked sessions (calendar or list view)
    - Session details: client name, date/time, status, Zoom link
    - Mark session as completed, add notes
  - Build availability management `/admin/disponibilitate`:
    - Weekly recurring slots: set available hours per day
    - Block specific dates (vacation, holidays)
    - Time zone handling (EET/EEST for Romania)
  - TDD: Test availability CRUD, slot blocking, session management

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`superpowers/test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 32-36)
  - **Parallel Group**: Wave 5
  - **Blocked By**: Tasks 28, 21

  **References**:
  - `src/services/scheduling.ts` — Scheduling service
  - `prisma/schema.prisma:Session1on1, Availability`

  **Acceptance Criteria**:
  - [ ] Admin can set weekly availability slots
  - [ ] Admin can block specific dates
  - [ ] Admin can view/manage booked sessions
  - [ ] Admin can mark session completed and add notes
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: Set weekly availability
    Tool: Playwright
    Preconditions: Admin logged in
    Steps:
      1. Navigate to /admin/disponibilitate
      2. Set Monday 10:00-18:00, Wednesday 10:00-18:00
      3. Save
      4. Navigate to /programare (as user)
      5. Assert Monday and Wednesday show available slots
    Expected Result: Availability reflected in booking calendar
    Evidence: .sisyphus/evidence/task-37-availability.png
  ```

  **Commit**: YES
  - Message: `feat(admin): add scheduling and availability management`
  - Files: `src/app/admin/programari/*, src/app/admin/disponibilitate/*, src/app/api/admin/scheduling/*`
  - Pre-commit: `vitest run`


- [x] 38. Course Access Expiry + Paid Extension Flow

  **What to do**:
  - Implement course access expiry cron job:
    - Daily check: find enrollments where `accessExpiresAt < now()`
    - Update status to EXPIRED
    - Send email notification: "Accesul tău la Cursul ADO Ediția X a expirat"
  - Build paid extension flow:
    - On expired enrollment page, show "Prelungește accesul" CTA
    - Extension purchase: 30 more days at [admin-configurable price]
    - Payment via Revolut (reuse checkout flow)
    - On payment: update `accessExpiresAt` to +30 days, status back to ACTIVE
  - Admin config: set extension price per course
  - TDD: Test expiry detection, notification, extension purchase, access restoration

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`superpowers/test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 39-42)
  - **Parallel Group**: Wave 6
  - **Blocked By**: Tasks 10, 26

  **References**:
  - `src/services/course.ts` — checkAccess(), enrollment management
  - `src/services/checkout.ts` — Reuse for extension purchase
  - `src/services/email.ts` — Expiry notification email

  **Acceptance Criteria**:
  - [ ] Expired enrollments detected and status updated daily
  - [ ] User sees "Prelungește accesul" on expired course page
  - [ ] Extension purchase restores 30 days of access
  - [ ] Expiry notification email sent
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: Access expiry and extension
    Tool: Bash (vitest)
    Steps:
      1. Create enrollment with accessExpiresAt = yesterday
      2. Run expiry cron
      3. Assert enrollment status = EXPIRED
      4. Simulate extension purchase
      5. Assert accessExpiresAt = today + 30 days, status = ACTIVE
    Expected Result: Expiry detected and extension works
    Evidence: .sisyphus/evidence/task-38-expiry-extension.txt
  ```

  **Commit**: YES
  - Message: `feat(course): add access expiry detection and paid extension flow`
  - Files: `src/services/course-expiry.ts, src/app/curs/[editionSlug]/expired/page.tsx`
  - Pre-commit: `vitest run`

- [x] 39. Installment Reminder Cron Job

  **What to do**:
  - Create cron service at `src/services/installment-cron.ts`:
    - Daily job: check for orders needing rata 2 creation (30 days after rata 1)
    - Create Order 2 via Revolut if not already created
    - Send reminder emails at T+33 and T+37 days if unpaid
    - At T+44 days: flag order for admin attention
  - Integrate with Vercel cron (or API route with cron secret header)
  - Logging: track all scheduled actions for audit
  - TDD: Test scheduling logic, reminder timing, duplicate prevention

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`superpowers/test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 38, 40-42)
  - **Parallel Group**: Wave 6
  - **Blocked By**: Tasks 12, 5

  **References**:
  - `src/services/installments.ts` — createInstallmentOrder2()
  - `src/services/email.ts` — InstallmentReminderEmail
  - `src/services/revolut.ts` — createOrder()

  **Acceptance Criteria**:
  - [ ] Order 2 auto-created at T+30 days
  - [ ] Reminder emails at T+33 and T+37 days
  - [ ] Admin flag at T+44 days
  - [ ] No duplicate Order 2 creation
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: Installment reminders schedule
    Tool: Bash (vitest)
    Steps:
      1. Create Order 1 completed 30 days ago
      2. Run installment cron
      3. Assert Order 2 created
      4. Set clock to T+33 days, run cron
      5. Assert reminder email queued
    Expected Result: Correct timing for all installment actions
    Evidence: .sisyphus/evidence/task-39-installment-cron.txt
  ```

  **Commit**: YES
  - Message: `feat(payments): add installment reminder cron with auto Order 2 creation`
  - Files: `src/services/installment-cron.ts, src/app/api/cron/installments/route.ts`
  - Pre-commit: `vitest run`

- [x] 40. SEO + Open Graph + Sitemap

  **What to do**:
  - Add metadata to all public pages:
    - Page titles (Romanian), descriptions, canonical URLs
    - Open Graph tags: title, description, image, type
    - Twitter Card tags
  - Generate dynamic sitemap at `/sitemap.xml`:
    - All public pages
    - All published blog posts
    - All published case studies
    - All guide pages
  - Add `robots.txt` allowing all crawlers
  - Structured data (JSON-LD) for:
    - Organization (DECOR-IUTA SRL)
    - Course (Cursul ADO)
    - Products (guides)
  - TDD: Test metadata generation, sitemap output, structured data

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`superpowers/test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 38-39, 41-42)
  - **Parallel Group**: Wave 6
  - **Blocked By**: Tasks 17-20

  **References**:
  - Next.js metadata: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
  - All public page routes from Tasks 17-20

  **Acceptance Criteria**:
  - [ ] All public pages have unique title and description
  - [ ] Open Graph images set for key pages
  - [ ] `/sitemap.xml` returns valid XML with all public URLs
  - [ ] `robots.txt` present
  - [ ] JSON-LD structured data on course and guide pages
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: SEO metadata on course page
    Tool: Bash (curl)
    Steps:
      1. curl -s http://localhost:3000/cursul-ado | grep '<title>'
      2. Assert title contains "Cursul A.D.O." and "Perspectiva Evei"
      3. curl -s http://localhost:3000/cursul-ado | grep 'og:title'
      4. Assert og:title meta tag present
      5. curl -s http://localhost:3000/sitemap.xml
      6. Assert XML contains /cursul-ado URL
    Expected Result: Full SEO metadata present
    Evidence: .sisyphus/evidence/task-40-seo-metadata.txt
  ```

  **Commit**: YES
  - Message: `feat(seo): add metadata, Open Graph, sitemap, robots.txt, and structured data`
  - Files: `src/app/sitemap.ts, src/app/robots.ts, src/app/layout.tsx (updated), all page metadata`
  - Pre-commit: `vitest run`

- [x] 41. Rate Limiting + Security Hardening

  **What to do**:
  - Add rate limiting to sensitive API routes:
    - `/api/auth/*`: 10 req/min per IP (brute force prevention)
    - `/api/checkout`: 5 req/min per user (prevent duplicate orders)
    - `/api/webhooks/*`: IP whitelist for Revolut webhook IPs
    - `/api/contact`: 3 req/min per IP (spam prevention)
  - Security headers in `next.config.ts`:
    - Content-Security-Policy (strict, allow Revolut widget, hls.js, GA)
    - X-Frame-Options: DENY
    - X-Content-Type-Options: nosniff
    - Referrer-Policy: strict-origin-when-cross-origin
  - CSRF protection for mutation routes
  - Input sanitization on all form submissions
  - Helmet-style security middleware
  - TDD: Test rate limits, header presence, CSRF protection

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: [`superpowers/test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 38-40, 42)
  - **Parallel Group**: Wave 6
  - **Blocked By**: All API routes (Wave 1-5 must be complete)

  **References**:
  - Next.js security headers: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
  - Revolut webhook IPs: Check Revolut docs for IP allowlist

  **Acceptance Criteria**:
  - [ ] Auth endpoints rate-limited (11th request within 1 min returns 429)
  - [ ] Security headers present on all responses
  - [ ] CSP allows Revolut widget and hls.js
  - [ ] Webhook endpoint validates source IP
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: Auth rate limiting
    Tool: Bash (curl)
    Steps:
      1. Send 10 POST requests to /api/auth/callback/credentials rapidly
      2. Assert first 10 return 200/401
      3. Send 11th request
      4. Assert response 429 with "Prea multe încercări" message
    Expected Result: Rate limit kicks in after 10 requests
    Evidence: .sisyphus/evidence/task-41-rate-limiting.txt

  Scenario: Security headers present
    Tool: Bash (curl)
    Steps:
      1. curl -I http://localhost:3000/
      2. Assert X-Frame-Options: DENY
      3. Assert X-Content-Type-Options: nosniff
      4. Assert Content-Security-Policy header present
    Expected Result: All security headers present
    Evidence: .sisyphus/evidence/task-41-security-headers.txt
  ```

  **Commit**: YES
  - Message: `feat(security): add rate limiting, security headers, and CSRF protection`
  - Files: `src/middleware.ts (updated), src/lib/rate-limit.ts, next.config.ts (updated)`
  - Pre-commit: `vitest run`

- [x] 42. Responsive Design Pass + Mobile QA

  **What to do**:
  - Review ALL pages for mobile responsiveness (320px → 1920px):
    - Public pages: Home, About, Course, Guides, Sessions, Blog, Case Studies, Contact
    - Auth pages: Login, Register, Password Reset
    - User pages: Profile, Course Access, Guide Reader, Audiobook
    - Admin pages: Dashboard, all CRUD pages
    - Checkout page with Revolut widget
  - Fix responsive issues:
    - Navbar collapses to hamburger on mobile
    - Tables become cards/stacked on mobile
    - Video player responsive (fill container width)
    - Admin sidebar collapses to drawer on mobile
    - Guide reader adjusts font size for mobile
  - Test breakpoints: 320px (mobile S), 375px (mobile M), 768px (tablet), 1024px (laptop), 1920px (desktop)
  - TDD: Visual regression tests at each breakpoint

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`, `playwright`, `superpowers/test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 38-41)
  - **Parallel Group**: Wave 6
  - **Blocked By**: Tasks 17-31 (all pages must exist)

  **References**:
  - All page components from Tasks 17-31
  - Tailwind responsive utilities: https://tailwindcss.com/docs/responsive-design

  **Acceptance Criteria**:
  - [ ] All pages render correctly at 320px width
  - [ ] Navbar hamburger menu works on mobile
  - [ ] Admin sidebar becomes drawer on mobile
  - [ ] Video player fills container on mobile
  - [ ] No horizontal scroll on any page at any breakpoint
  - [ ] vitest run → pass

  **QA Scenarios:**
  ```
  Scenario: Mobile responsive check
    Tool: Playwright
    Steps:
      1. Set viewport to 375x812 (iPhone)
      2. Navigate to / → screenshot
      3. Navigate to /cursul-ado → screenshot
      4. Navigate to /ghiduri → screenshot
      5. Navigate to /profilul-meu (logged in) → screenshot
      6. Navigate to /admin (admin logged in) → screenshot
      7. Assert no horizontal overflow on any page
    Expected Result: All pages responsive on mobile
    Evidence: .sisyphus/evidence/task-42-mobile-home.png, task-42-mobile-course.png, etc.

  Scenario: Tablet responsive check
    Tool: Playwright
    Steps:
      1. Set viewport to 768x1024 (iPad)
      2. Navigate through 5 key pages
      3. Screenshot each
      4. Assert layouts adapt (2-column grids, etc.)
    Expected Result: Tablet layouts optimized
    Evidence: .sisyphus/evidence/task-42-tablet-*.png
  ```

  **Commit**: YES
  - Message: `feat(responsive): complete responsive design pass for all pages at all breakpoints`
  - Files: `Multiple component files updated for responsive CSS`
  - Pre-commit: `vitest run`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter + `vitest run`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (purchase → invoice → access → video playback). Test edge cases: empty state, invalid input, rapid actions, expired cookie, device limit reached. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Wave | Commit | Message | Pre-commit |
|------|--------|---------|-----------|
| 1 | After T1 | `chore(init): scaffold Next.js project with Tailwind, Vitest, ESLint, Prisma` | `vitest run` |
| 1 | After T2 | `feat(db): add Prisma schema with all models and Supabase migration` | `npx prisma validate` |
| 1 | After T3-T8 (grouped) | `feat(foundation): add design system, auth, email, payment, invoice, and AWS services` | `vitest run` |
| 2 | Per task | `feat(scope): description` per module | `vitest run` |
| 3 | Per task | `feat(pages): public page or admin module` | `vitest run` |
| 4 | Per task | `feat(platform): user-facing feature` | `vitest run` |
| 5 | Per task | `feat(integration): webhook/migration/analytics` | `vitest run` |
| 6 | Per task | `feat(polish): security/SEO/responsive` | `vitest run` |

---

## Success Criteria

### Verification Commands
```bash
vitest run                    # Expected: all tests pass
npx prisma validate           # Expected: schema valid
npx tsc --noEmit              # Expected: no type errors
npx next build                # Expected: build succeeds
npx next lint                 # Expected: no lint errors
```

### Final Checklist
- [ ] All "Must Have" present (Revolut, SmartBill, TVA 21%, device lock, signed cookies, etc.)
- [ ] All "Must NOT Have" absent (no Stripe, no screen capture prevention, no PDF download, etc.)
- [ ] All tests pass (vitest)
- [ ] Full E2E flow works: Register → Purchase → Invoice → Access Content → Video Plays
- [ ] Admin can manage all entities
- [ ] Site renders correctly on mobile (responsive)
- [ ] Deployed on Vercel with Supabase
