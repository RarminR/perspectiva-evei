# Decisions — Perspectiva Evei Platform

## [2026-02-26] Session ses_365bedce9ffeGIoUTQ1XASGCIB

### Resolved Decisions
- TVA: Prices INCLUDE TVA (21%) — all displayed prices are TVA-inclusive
- Installments: Two separate Revolut orders (rata 1 immediate, rata 2 at 30 days)
- e-Factura: SPV already configured in SmartBill — no action needed
- Video files: Original MP4/MOV available — no Vimeo download needed
- Email: Resend chosen (modern DX, React Email templates)
- Test strategy: TDD (RED → GREEN → REFACTOR)
- Rich text editor: Tiptap (for blog/guides admin)
- Cron jobs: Vercel Cron API routes
- Image storage: S3 (consistent with video storage)
- Session cancellation policy: 24 hours before
- Zoom integration: Manual (admin adds link, no API)
- Cookie consent: Simple banner before GA loads

### Scope: IN
- Course module (Cursul ADO) with cohort management
- Secure video player (HLS + signed cookies + device lock)
- Guide reader (in-platform, no PDF download, watermarked)
- Audiobook player for guides
- 1:1 session scheduling with availability management
- Checkout via Revolut Payment Gateway
- Installment support (2 separate orders for ADO course)
- SmartBill automatic invoicing (TVA 21% inclusive)
- Promo codes (%, fixed, time-limited)
- Product bundles
- Admin panel (CRUD for all entities)
- Blog (admin-managed)
- Case studies page
- Jute bags (physical product with shipping)
- User migration from Memberstack
- Email transactional (Resend)
- Device locking (max 2 devices, Netflix-style)
- Google Analytics integration

### Scope: OUT
- Stripe integration (Revolut only)
- Screen capture prevention (technically impossible)
- Forensic video watermarking (enterprise cost, overkill)
- Multi-language support (Romanian only in v1)
- Mobile app
- Recurring subscriptions (Revolut doesn't support)
- PDF download of guides
- Klaviyo migration (start fresh with Resend)
