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
