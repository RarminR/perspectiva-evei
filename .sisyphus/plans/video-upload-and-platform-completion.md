# Video Upload Pipeline & Platform Completion

## TL;DR

> **Quick Summary**: Add admin video/PDF upload capability via S3 presigned URLs (single + multipart), integrate MediaConvert transcoding with status polling, fix the broken password reset flow, and address remaining platform gaps (admin settings, audio progress, Prisma stale types).
> 
> **Deliverables**:
> - Admin upload UI for videos (with progress bar, multipart for large files) and PDFs
> - Transcoding trigger + status polling UI in lesson manager
> - Working password reset flow (POST + PUT API endpoints)
> - Admin settings page
> - Audio progress tracking schema fix
> - Clean build with zero LSP errors
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Task 1 → Task 3 → Task 6 → Task 8 → Task 10 → Task 13

---

## Context

### Original Request
User asked to plan the next steps for adding video upload capability and completing the platform. The platform already has full video PLAYBACK infrastructure (SecureVideoPlayer, CloudFront signed cookies, HLS.js, aws-video.ts with transcoding), but the UPLOAD side is missing — admins must manually paste S3 keys.

### Interview Summary
**Key Discussions**:
- User explicitly said "nu ma intreba" — make autonomous decisions, don't ask questions
- All design decisions follow existing codebase patterns (purple gradient theme, Romanian UI, English code)
- No test framework exists — verification via Agent QA only

**Research Findings**:
- `aws-video.ts` already has `createTranscodeJob()` with 720p/480p/360p HLS renditions and `getTranscodeJobStatus()`
- `SecureVideoPlayer.tsx` already works with HLS via hls.js
- `LessonManager.tsx` uses manual text input for videoKey/pdfKeys — needs upload UI
- Password reset pages exist (`/resetare-parola` and `/resetare-parola/[token]`) but call `/api/auth/reset-password` which DOES NOT EXIST
- Bundle checkout, email system (Resend), all admin CRUD, device fingerprinting — all working
- AdminMessagesClient import error is pre-existing

### Metis Review
**Identified Gaps** (addressed):
- **Multipart upload required**: Videos are 100MB-2GB, single PUT won't work — plan includes multipart presigned upload with 10MB chunks
- **XHR required for progress**: `fetch()` can't track upload progress — plan specifies `XMLHttpRequest` for S3 PUT calls
- **CORS ETag exposure**: S3 CORS must include `ExposeHeaders: ["ETag"]` for multipart — plan includes infra note
- **Incomplete multipart cleanup**: Abandoned uploads waste S3 storage — plan includes client-side abort + lifecycle rule note
- **UUID-based S3 keys**: Never use user-supplied filenames as S3 keys (path traversal risk) — plan uses UUID keys
- **Progressive polling backoff**: Transcoding can take 10-30 min — plan uses `[2s, 3s, 5s, 10s, 15s, 30s]` intervals

---

## Work Objectives

### Core Objective
Enable admins to upload videos and PDFs directly from the lesson management UI, trigger HLS transcoding for videos, monitor transcoding progress, and fix the remaining platform gaps to bring the platform to feature-complete status.

### Concrete Deliverables
- `POST /api/admin/upload/presign` — presigned URL for single PUT (PDFs, small files)
- `POST /api/admin/upload/multipart/init` — initiate multipart upload
- `POST /api/admin/upload/multipart/complete` — complete multipart upload
- `POST /api/admin/upload/multipart/abort` — abort multipart upload
- `POST /api/admin/transcode` — trigger MediaConvert job
- `GET /api/admin/transcode/[jobId]` — poll transcoding status
- Updated `LessonManager.tsx` with file upload UI (drag & drop, progress bar)
- `POST /api/auth/reset-password` — request password reset (send email)
- `PUT /api/auth/reset-password` — confirm password reset (validate token, update password)
- `/admin/setari/page.tsx` — admin settings page
- Updated Prisma schema with `audioPosition` on GuideAccess and `resetToken`/`resetTokenExpiry` on User

### Definition of Done
- [ ] Admin can upload a video file via drag & drop in LessonManager → file appears in S3
- [ ] Admin can trigger transcoding → HLS renditions are created → videoKey is auto-set
- [ ] Admin can upload PDF files → pdfKeys are auto-set
- [ ] User can request password reset → receives email → resets password via link
- [ ] `next build` produces zero errors
- [ ] All evidence files exist in `.sisyphus/evidence/`

### Must Have
- Multipart upload for videos > 100MB with progress tracking via XHR
- UUID-based S3 keys (never user-supplied filenames)
- Abort mechanism for cancelled uploads (client-side + API)
- Progressive backoff polling for transcoding status
- Password reset with secure random token, 1-hour expiry
- All UI in Romanian

### Must NOT Have (Guardrails)
- DO NOT add watermarking for videos (out of scope)
- DO NOT configure Revolut payment settings (out of scope)
- DO NOT provision AWS infrastructure (S3 bucket, CloudFront distribution, MediaConvert) — assume it exists
- DO NOT add CI/CD pipeline
- DO NOT create test framework setup (no jest/vitest/bun test)
- DO NOT add unnecessary comments in code
- DO NOT over-abstract — keep upload logic in the API routes, not in 5 layers of service files
- DO NOT add a file browser / S3 explorer UI (admin uploads per-lesson, doesn't browse S3)
- DO NOT touch checkout, enrollment, or payment flows — they work

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None
- **Framework**: None
- **Agent QA only**: Every task verified by the executing agent via Bash, curl, or Playwright

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **API endpoints**: Use Bash (curl) — Send requests, assert status + response fields
- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **Schema changes**: Use Bash (npx prisma generate + npx prisma db push) — Verify zero errors
- **Build verification**: Use Bash (next build) — Zero errors in output

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — schema + dependencies + simple fixes):
├── Task 1: Prisma schema updates (resetToken, audioPosition) + prisma generate [quick]
├── Task 2: Install @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner [quick]
├── Task 3: Password reset API endpoint (POST + PUT) [unspecified-high]
├── Task 4: Admin settings page (stub with site info) [quick]
├── Task 5: Fix AdminMessagesClient missing import [quick]

Wave 2 (Upload APIs — all independent once deps are installed):
├── Task 6: Single-file presigned URL API (for PDFs / small files) [unspecified-high]
├── Task 7: Multipart upload APIs (init / complete / abort) [deep]
├── Task 8: Transcode trigger API [unspecified-high]
├── Task 9: Transcode status polling API [unspecified-high]

Wave 3 (Upload UI — depends on Wave 2 APIs):
├── Task 10: Video upload component (XHR + progress bar + multipart) [visual-engineering]
├── Task 11: PDF upload component (single presign + drag & drop) [visual-engineering]
├── Task 12: Transcoding status UI (progress indicator + auto-set videoKey) [visual-engineering]

Wave 4 (Integration — wire everything together):
├── Task 13: Integrate upload components into LessonManager [deep]
├── Task 14: Audio progress tracking — uncomment + wire up [quick]
├── Task 15: Full build verification + Prisma stale errors cleanup [quick]

Wave FINAL (Independent review, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
├── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 3 (password reset) | Task 2 → Task 6/7 → Task 10 → Task 13 → Task 15
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 5 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | — | 3, 14 |
| 2 | — | 6, 7, 8, 9 |
| 3 | 1 | — |
| 4 | — | — |
| 5 | — | — |
| 6 | 2 | 10, 11 |
| 7 | 2 | 10 |
| 8 | 2 | 12 |
| 9 | 2 | 12 |
| 10 | 6, 7 | 13 |
| 11 | 6 | 13 |
| 12 | 8, 9 | 13 |
| 13 | 10, 11, 12 | 15 |
| 14 | 1 | 15 |
| 15 | 13, 14 | F1-F4 |
| F1-F4 | 15 | — |

### Agent Dispatch Summary

- **Wave 1**: **5 tasks** — T1 → `quick`, T2 → `quick`, T3 → `unspecified-high`, T4 → `quick`, T5 → `quick`
- **Wave 2**: **4 tasks** — T6 → `unspecified-high`, T7 → `deep`, T8 → `unspecified-high`, T9 → `unspecified-high`
- **Wave 3**: **3 tasks** — T10 → `visual-engineering`, T11 → `visual-engineering`, T12 → `visual-engineering`
- **Wave 4**: **3 tasks** — T13 → `deep`, T14 → `quick`, T15 → `quick`
- **FINAL**: **4 tasks** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. Prisma Schema Updates (resetToken, audioPosition, stale type fixes)

  **What to do**:
  - Add `resetToken String?` and `resetTokenExpiry DateTime?` fields to the `User` model in `prisma/schema.prisma`
  - Add `audioPosition Float? @default(0)` field to the `GuideAccess` model
  - Run `npx prisma generate` to regenerate the Prisma client
  - Run `npx prisma db push` to sync the database
  - Verify that the stale LSP errors in `scheduling.ts`, `login-activity.ts`, `activitate/page.tsx`, `availability/route.ts` resolve after regeneration (these are caused by stale Prisma client types for `loginActivity` model and `date` field on Availability)

  **Must NOT do**:
  - DO NOT use Prisma migrations (`prisma migrate`) — this project uses `prisma db push`
  - DO NOT modify any existing fields, only ADD new ones
  - DO NOT add comments to the schema

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple schema additions + CLI commands, no complex logic
  - **Skills**: []
    - No domain-specific skills needed for schema changes
  - **Skills Evaluated but Omitted**:
    - `playwright`: No UI involved
    - `frontend-ui-ux`: No UI involved

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5)
  - **Blocks**: Tasks 3, 14
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `prisma/schema.prisma` — Full schema file. Find the `User` model (add resetToken/resetTokenExpiry after the existing password field) and `GuideAccess` model (add audioPosition)
  - `prisma/schema.prisma` — Check existing `Availability` model (should already have `date DateTime` field) and `LoginActivity` model to understand why LSP errors occur (stale generated client)

  **API/Type References**:
  - None — this is schema-only work

  **External References**:
  - Prisma docs: `prisma db push` syncs schema without migrations

  **WHY Each Reference Matters**:
  - The schema file is the ONLY file to edit. The executor must find the exact models and add fields in the right position
  - The stale errors are NOT code bugs — they resolve after `prisma generate` regenerates types

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Schema generation succeeds
    Tool: Bash
    Preconditions: Schema file has been edited with new fields
    Steps:
      1. Run `npx prisma generate` — expect exit code 0, output contains "Generated Prisma Client"
      2. Run `npx prisma db push` — expect exit code 0, output contains "Your database is now in sync"
      3. Run `npx tsc --noEmit 2>&1 | grep -c "error TS"` — expect count to be significantly lower than before (ideally 0)
    Expected Result: Both commands succeed, TypeScript errors related to Prisma types are resolved
    Failure Indicators: prisma generate fails, db push fails, or TS errors persist for loginActivity/date fields
    Evidence: .sisyphus/evidence/task-1-schema-generation.txt

  Scenario: New fields exist in database
    Tool: Bash
    Preconditions: prisma db push completed
    Steps:
      1. Run `npx prisma studio` briefly OR use `npx prisma db execute --stdin <<< "SELECT column_name FROM information_schema.columns WHERE table_name='User' AND column_name IN ('resetToken','resetTokenExpiry');"` to verify columns exist
    Expected Result: resetToken and resetTokenExpiry columns exist in User table, audioPosition exists in GuideAccess
    Failure Indicators: Columns not found
    Evidence: .sisyphus/evidence/task-1-db-columns.txt
  ```

  **Commit**: YES (group with Task 5)
  - Message: `feat(schema): add resetToken, resetTokenExpiry, audioPosition fields`
  - Files: `prisma/schema.prisma`
  - Pre-commit: `npx prisma generate`

- [ ] 2. Install AWS S3 SDK Dependencies

  **What to do**:
  - Run `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
  - Verify the packages are added to `package.json` dependencies
  - Note: `@aws-sdk/cloudfront-signer` is already installed (used by `aws-video.ts`)

  **Must NOT do**:
  - DO NOT install as devDependencies — these are runtime dependencies
  - DO NOT modify any source files

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single npm install command
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - All skills: Not applicable for dependency installation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5)
  - **Blocks**: Tasks 6, 7, 8, 9
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `package.json` — Check existing `@aws-sdk/cloudfront-signer` dependency to confirm AWS SDK v3 is already in use
  - `src/services/aws-video.ts` — Already imports from `@aws-sdk/cloudfront-signer`, confirming SDK v3 pattern

  **WHY Each Reference Matters**:
  - Confirms we're using AWS SDK v3 (not v2), so the package names are correct

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Dependencies installed correctly
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
      2. Run `cat package.json | grep -E "@aws-sdk/client-s3|@aws-sdk/s3-request-presigner"` — expect 2 matches
      3. Run `node -e "require('@aws-sdk/client-s3'); require('@aws-sdk/s3-request-presigner'); console.log('OK')"` — expect "OK"
    Expected Result: Both packages in package.json and importable
    Failure Indicators: npm install fails, packages not found in package.json
    Evidence: .sisyphus/evidence/task-2-deps-installed.txt
  ```

  **Commit**: YES (group with Task 1)
  - Message: `chore(deps): add @aws-sdk/client-s3 and s3-request-presigner`
  - Files: `package.json`, `package-lock.json`
  - Pre-commit: `node -e "require('@aws-sdk/client-s3')"`

- [ ] 3. Password Reset API Endpoint

  **What to do**:
  - Create `src/app/api/auth/reset-password/route.ts` with two handlers:
    - **POST**: Accept `{ email: string }`, find user by email, generate a `crypto.randomUUID()` token, store it as `resetToken` + `resetTokenExpiry` (1 hour from now) on the User record, call `sendPasswordResetEmail()` from `src/services/email.ts` with the reset link (`/resetare-parola/${token}`), return 200. If email not found, still return 200 (prevent email enumeration).
    - **PUT**: Accept `{ token: string, password: string }`, find user by `resetToken` where `resetTokenExpiry > now`, hash the new password with `bcrypt.hashSync(password, 10)`, update user's password, clear `resetToken` and `resetTokenExpiry`, return 200. If token invalid/expired, return 400 with `{ error: "Token invalid sau expirat" }`.
  - Validate inputs (email format for POST, password min length 6 for PUT)
  - Use existing `prisma` import pattern from other API routes

  **Must NOT do**:
  - DO NOT expose whether an email exists in the system (always return 200 for POST)
  - DO NOT use SHA-256 for password hashing — use bcrypt (matching existing auth)
  - DO NOT add rate limiting here — the middleware already handles `/api/auth` rate limiting (50/min)
  - DO NOT add comments

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Security-sensitive authentication code requiring careful implementation
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: No UI work — this is API only
    - `frontend-ui-ux`: No UI work

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5)
  - **Blocks**: None (password reset pages already exist and call this endpoint)
  - **Blocked By**: Task 1 (needs resetToken/resetTokenExpiry fields in schema)

  **References**:

  **Pattern References**:
  - `src/app/api/auth/register/route.ts` — Pattern for auth API routes: how to import prisma, hash passwords with bcrypt, return NextResponse
  - `src/app/api/auth/[...nextauth]/route.ts` OR `src/lib/auth.ts` — How passwords are verified with bcrypt.compare (ensure consistency in hashing)
  - `src/services/email.ts` — Contains `sendPasswordResetEmail()` function — check its signature (it likely accepts email + resetUrl)

  **API/Type References**:
  - `src/app/(auth)/resetare-parola/page.tsx` — The request page that calls `POST /api/auth/reset-password` with `{ email }` — match the expected request/response format
  - `src/app/(auth)/resetare-parola/[token]/page.tsx` — The confirmation page that calls `PUT /api/auth/reset-password` with `{ token, password }` — match the expected request/response format

  **External References**:
  - bcrypt npm: `bcrypt.hashSync(password, 10)` for hashing

  **WHY Each Reference Matters**:
  - The register route shows the exact import pattern and response format used across auth APIs
  - The email service already has the send function — just need to call it correctly
  - The two frontend pages already make the API calls — the endpoint must match their expected request/response shapes exactly

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Request password reset with valid email
    Tool: Bash (curl)
    Preconditions: Dev server running, test@example.com user exists in DB
    Steps:
      1. curl -s -X POST http://localhost:3000/api/auth/reset-password -H "Content-Type: application/json" -d '{"email":"test@example.com"}' -w "\n%{http_code}"
      2. Assert HTTP status is 200
      3. Check DB: npx prisma db execute --stdin <<< "SELECT \"resetToken\", \"resetTokenExpiry\" FROM \"User\" WHERE email='test@example.com';" — expect non-null values
    Expected Result: 200 response, resetToken stored in DB, resetTokenExpiry ~1 hour from now
    Failure Indicators: Non-200 status, resetToken is null
    Evidence: .sisyphus/evidence/task-3-reset-request.txt

  Scenario: Request password reset with non-existent email (no enumeration)
    Tool: Bash (curl)
    Preconditions: Dev server running
    Steps:
      1. curl -s -X POST http://localhost:3000/api/auth/reset-password -H "Content-Type: application/json" -d '{"email":"nonexistent@example.com"}' -w "\n%{http_code}"
      2. Assert HTTP status is 200 (same as valid email — prevents enumeration)
    Expected Result: 200 response (identical to valid email response)
    Failure Indicators: Different status code or error message revealing email doesn't exist
    Evidence: .sisyphus/evidence/task-3-reset-enumeration.txt

  Scenario: Confirm password reset with valid token
    Tool: Bash (curl)
    Preconditions: Previous scenario completed, resetToken exists in DB
    Steps:
      1. Extract token: RESET_TOKEN=$(npx prisma db execute --stdin <<< "SELECT \"resetToken\" FROM \"User\" WHERE email='test@example.com';" | grep -oP '[a-f0-9-]{36}')
      2. curl -s -X PUT http://localhost:3000/api/auth/reset-password -H "Content-Type: application/json" -d "{\"token\":\"$RESET_TOKEN\",\"password\":\"newpassword123\"}" -w "\n%{http_code}"
      3. Assert HTTP status is 200
      4. Verify token cleared: npx prisma db execute --stdin <<< "SELECT \"resetToken\" FROM \"User\" WHERE email='test@example.com';" — expect null
    Expected Result: 200 response, password updated, token cleared
    Failure Indicators: Non-200 status, token not cleared
    Evidence: .sisyphus/evidence/task-3-reset-confirm.txt

  Scenario: Confirm password reset with expired/invalid token
    Tool: Bash (curl)
    Preconditions: Dev server running
    Steps:
      1. curl -s -X PUT http://localhost:3000/api/auth/reset-password -H "Content-Type: application/json" -d '{"token":"invalid-token-12345","password":"newpassword123"}' -w "\n%{http_code}"
      2. Assert HTTP status is 400
      3. Assert response body contains "invalid" or "expirat"
    Expected Result: 400 with error message
    Failure Indicators: 200 status, or 500 server error
    Evidence: .sisyphus/evidence/task-3-reset-invalid-token.txt
  ```

  **Commit**: YES
  - Message: `fix(auth): implement password reset API endpoint`
  - Files: `src/app/api/auth/reset-password/route.ts`
  - Pre-commit: `npx tsc --noEmit`

- [ ] 4. Admin Settings Page

  **What to do**:
  - Create `src/app/admin/setari/page.tsx` — a server component displaying basic site settings
  - Show read-only info: site name ("Perspectiva Evei"), admin email, database connection status (prisma.$queryRaw`SELECT 1`), environment (process.env.NODE_ENV), payment bypass status (process.env.BYPASS_PAYMENT)
  - Add "Setări" to `AdminSidebar.tsx` navigation at the bottom (after existing items) with a gear/cog icon
  - Style with existing card pattern: white cards, rounded corners (20px), purple headings

  **Must NOT do**:
  - DO NOT make settings editable (just display — editing env vars from UI is an anti-pattern)
  - DO NOT expose sensitive values (mask DB connection string, show only host)
  - DO NOT add comments

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple read-only page with existing design patterns
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Simple enough to follow existing patterns
    - `playwright`: Verification handled by QA scenario below

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 5)
  - **Blocks**: None
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `src/app/admin/activitate/page.tsx` — Example of a simple admin page with server-side data fetching + card layout
  - `src/app/admin/components/AdminSidebar.tsx` — Where to add the nav item, follow existing icon + label pattern

  **WHY Each Reference Matters**:
  - The activitate page shows the exact layout pattern (page title, card grid, data display) to replicate
  - AdminSidebar shows the nav item format (icon + label + href)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Settings page loads with site info
    Tool: Bash (curl)
    Preconditions: Dev server running, admin session cookie available
    Steps:
      1. curl -s http://localhost:3000/admin/setari -H "Cookie: <admin-session>" -w "\n%{http_code}"
      2. Assert HTTP status is 200
      3. Assert response contains "Perspectiva Evei" and "Setări"
    Expected Result: Page renders with site info cards
    Failure Indicators: 404, 500, or missing content
    Evidence: .sisyphus/evidence/task-4-settings-page.txt

  Scenario: Settings nav item appears in sidebar
    Tool: Bash (grep)
    Preconditions: None
    Steps:
      1. grep -n "Setări" src/app/admin/components/AdminSidebar.tsx
      2. Assert match found with href="/admin/setari"
    Expected Result: Nav item exists in sidebar
    Failure Indicators: No match found
    Evidence: .sisyphus/evidence/task-4-settings-nav.txt
  ```

  **Commit**: YES (group with Task 5)
  - Message: `feat(admin): add settings page with site info`
  - Files: `src/app/admin/setari/page.tsx`, `src/app/admin/components/AdminSidebar.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [ ] 5. Fix AdminMessagesClient Missing Import

  **What to do**:
  - Check `src/app/admin/mesaje/page.tsx` — it imports `./AdminMessagesClient` which doesn't exist
  - Two options (choose the simpler one):
    - **Option A**: If the page has substantial functionality beyond the import, create a minimal `AdminMessagesClient.tsx` component that renders the existing page content as a client component
    - **Option B**: If the page is mostly a stub, refactor `page.tsx` to be a self-contained server component without the client import (inline the UI)
  - The messages feature is low priority — the nav item was already removed from the sidebar. The fix just needs to prevent build errors.

  **Must NOT do**:
  - DO NOT build a full messaging system — just fix the import error
  - DO NOT re-add "Mesaje" to the sidebar navigation
  - DO NOT add comments

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Fix a single missing import — minimal change
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4)
  - **Blocks**: None
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `src/app/admin/mesaje/page.tsx` — The file with the broken import. Read it to understand what `AdminMessagesClient` was supposed to render, then decide on Option A vs B
  - `src/app/admin/programari/page.tsx` — Example of a working admin page for reference on how to structure the fix

  **WHY Each Reference Matters**:
  - Must read the broken file to understand the intended functionality before deciding on fix approach
  - The programari page shows a working pattern to follow if refactoring is needed

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Import error resolved
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run `npx tsc --noEmit 2>&1 | grep "AdminMessagesClient"`
      2. Assert zero matches (error is gone)
    Expected Result: No TypeScript errors related to AdminMessagesClient
    Failure Indicators: Error still appears
    Evidence: .sisyphus/evidence/task-5-messages-fix.txt
  ```

  **Commit**: YES (group with Tasks 1, 4)
  - Message: `fix(admin): resolve AdminMessagesClient missing import`
  - Files: `src/app/admin/mesaje/`
  - Pre-commit: `npx tsc --noEmit`

- [ ] 6. Single-File Presigned URL API (for PDFs and Small Files)

  **What to do**:
  - Create `src/app/api/admin/upload/presign/route.ts` with a POST handler:
    - Accept `{ filename: string, contentType: string, folder: "materials" | "video" }` in request body
    - Validate that the user is an admin (check session)
    - Generate a UUID-based S3 key: `{folder}/{uuid}.{extension}` (extract extension from filename, NEVER use the filename as the key — path traversal risk)
    - Store original filename as S3 object metadata (`x-amz-meta-original-name`)
    - Use `@aws-sdk/s3-request-presigner` to create a presigned PUT URL with 15-minute expiry
    - Return `{ presignedUrl: string, key: string }` — the `key` is what gets stored in the DB (videoKey or pdfKeys)
  - Create the S3 client utility: `src/lib/s3.ts` — instantiate `S3Client` with credentials from env vars (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`). Export the client and bucket name.

  **Must NOT do**:
  - DO NOT use user-supplied filename as S3 key (UUID only)
  - DO NOT allow uploads without admin authentication
  - DO NOT add comments
  - DO NOT handle multipart here — that's Task 7

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Security-sensitive S3 integration, needs correct presigning setup
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: API only, no UI

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 8, 9)
  - **Blocks**: Tasks 10, 11
  - **Blocked By**: Task 2 (needs @aws-sdk/client-s3 installed)

  **References**:

  **Pattern References**:
  - `src/services/aws-video.ts` — Shows how AWS credentials are used in this project (look for CloudFront signer setup, env var names)
  - `src/app/api/admin/lessons/route.ts` — Pattern for admin-authenticated API routes (how to check admin session)
  - `.env.local.example` — Contains `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, etc. — use these exact env var names

  **External References**:
  - AWS SDK v3: `PutObjectCommand` + `getSignedUrl` from `@aws-sdk/s3-request-presigner`

  **WHY Each Reference Matters**:
  - aws-video.ts shows the existing AWS credential pattern — reuse, don't reinvent
  - The lessons route shows the admin auth check pattern used in all admin APIs
  - The env example confirms the exact env var names to use

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Generate presigned URL for PDF upload
    Tool: Bash (curl)
    Preconditions: Dev server running, admin logged in with session cookie
    Steps:
      1. curl -s -X POST http://localhost:3000/api/admin/upload/presign -H "Content-Type: application/json" -H "Cookie: <admin-session>" -d '{"filename":"ghid-nutritie.pdf","contentType":"application/pdf","folder":"materials"}' -w "\n%{http_code}"
      2. Assert HTTP status is 200
      3. Assert response JSON has `presignedUrl` field starting with "https://"
      4. Assert response JSON has `key` field matching pattern `materials/{uuid}.pdf`
      5. Assert `key` does NOT contain "ghid-nutritie" (UUID-based, not filename-based)
    Expected Result: 200 with presigned URL and UUID-based key
    Failure Indicators: Non-200 status, key contains original filename, missing presignedUrl
    Evidence: .sisyphus/evidence/task-6-presign-pdf.txt

  Scenario: Reject non-admin request
    Tool: Bash (curl)
    Preconditions: Dev server running, no session cookie or user session cookie
    Steps:
      1. curl -s -X POST http://localhost:3000/api/admin/upload/presign -H "Content-Type: application/json" -d '{"filename":"test.pdf","contentType":"application/pdf","folder":"materials"}' -w "\n%{http_code}"
      2. Assert HTTP status is 401 or 403
    Expected Result: Unauthorized response
    Failure Indicators: 200 status (security hole)
    Evidence: .sisyphus/evidence/task-6-presign-auth.txt
  ```

  **Commit**: YES (group with Task 7)
  - Message: `feat(upload): add S3 presigned URL API for single-file uploads`
  - Files: `src/lib/s3.ts`, `src/app/api/admin/upload/presign/route.ts`
  - Pre-commit: `npx tsc --noEmit`

- [ ] 7. Multipart Upload APIs (Init / Complete / Abort)

  **What to do**:
  - Create three API routes for large file uploads (videos > 100MB):
  
  - **`src/app/api/admin/upload/multipart/init/route.ts`** (POST):
    - Accept `{ filename: string, contentType: string, folder: "video" }`
    - Generate UUID-based key: `video/{uuid}.{ext}`
    - Call `CreateMultipartUploadCommand` on S3
    - Return `{ uploadId: string, key: string }`
  
  - **`src/app/api/admin/upload/multipart/presign-part/route.ts`** (POST):
    - Accept `{ key: string, uploadId: string, partNumber: number }`
    - Call `UploadPartCommand` presigned URL generation
    - Return `{ presignedUrl: string }`
  
  - **`src/app/api/admin/upload/multipart/complete/route.ts`** (POST):
    - Accept `{ key: string, uploadId: string, parts: Array<{ ETag: string, PartNumber: number }> }`
    - Call `CompleteMultipartUploadCommand`
    - Return `{ key: string, location: string }`
  
  - **`src/app/api/admin/upload/multipart/abort/route.ts`** (POST):
    - Accept `{ key: string, uploadId: string }`
    - Call `AbortMultipartUploadCommand`
    - Return 200

  - All routes must validate admin session
  - Use the S3 client from `src/lib/s3.ts` (created in Task 6)
  - IMPORTANT: Document in a code comment at top of init/route.ts that the S3 bucket CORS config must include `ExposeHeaders: ["ETag"]` for multipart to work (this is the ONE comment that's acceptable — it's a critical infrastructure requirement)

  **Must NOT do**:
  - DO NOT store upload state in the database — S3 manages multipart state
  - DO NOT add chunk size logic server-side — the client decides chunk boundaries
  - DO NOT add unnecessary comments (except the CORS note)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex multi-endpoint API with S3 multipart protocol — needs careful implementation of the init/part/complete/abort lifecycle
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: API only, no UI

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 8, 9)
  - **Blocks**: Task 10
  - **Blocked By**: Task 2 (needs @aws-sdk/client-s3 installed)

  **References**:

  **Pattern References**:
  - `src/lib/s3.ts` — S3 client instance (created in Task 6) — import and reuse
  - `src/app/api/admin/upload/presign/route.ts` — Admin auth check pattern (created in Task 6) — follow same auth pattern
  - `src/services/aws-video.ts` — Shows AWS SDK usage patterns in the project

  **External References**:
  - AWS SDK v3: `CreateMultipartUploadCommand`, `UploadPartCommand`, `CompleteMultipartUploadCommand`, `AbortMultipartUploadCommand`
  - CRITICAL: S3 bucket CORS must include `ExposeHeaders: ["ETag"]` — without this, the browser can't read ETags from part uploads and CompleteMultipartUpload fails silently

  **WHY Each Reference Matters**:
  - The S3 client module centralizes credentials — don't create a second client
  - The presign route from Task 6 establishes the auth and response patterns
  - The CORS requirement is a non-obvious failure mode that Metis flagged

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Initiate multipart upload
    Tool: Bash (curl)
    Preconditions: Dev server running, admin session, AWS credentials configured
    Steps:
      1. curl -s -X POST http://localhost:3000/api/admin/upload/multipart/init -H "Content-Type: application/json" -H "Cookie: <admin-session>" -d '{"filename":"lectia-1.mp4","contentType":"video/mp4","folder":"video"}' -w "\n%{http_code}"
      2. Assert HTTP status is 200
      3. Assert response has `uploadId` (non-empty string) and `key` matching `video/{uuid}.mp4`
    Expected Result: 200 with uploadId and UUID-based key
    Failure Indicators: Non-200, missing uploadId, key contains original filename
    Evidence: .sisyphus/evidence/task-7-multipart-init.txt

  Scenario: Get presigned URL for a part
    Tool: Bash (curl)
    Preconditions: Multipart upload initiated (have uploadId and key from init)
    Steps:
      1. curl -s -X POST http://localhost:3000/api/admin/upload/multipart/presign-part -H "Content-Type: application/json" -H "Cookie: <admin-session>" -d '{"key":"<key-from-init>","uploadId":"<uploadId>","partNumber":1}' -w "\n%{http_code}"
      2. Assert HTTP status is 200
      3. Assert response has `presignedUrl` starting with "https://"
    Expected Result: 200 with presigned URL for part 1
    Failure Indicators: Non-200, missing presignedUrl
    Evidence: .sisyphus/evidence/task-7-multipart-presign-part.txt

  Scenario: Abort multipart upload (cleanup)
    Tool: Bash (curl)
    Preconditions: Multipart upload initiated
    Steps:
      1. curl -s -X POST http://localhost:3000/api/admin/upload/multipart/abort -H "Content-Type: application/json" -H "Cookie: <admin-session>" -d '{"key":"<key>","uploadId":"<uploadId>"}' -w "\n%{http_code}"
      2. Assert HTTP status is 200
    Expected Result: Upload aborted, 200 response
    Failure Indicators: Non-200 status
    Evidence: .sisyphus/evidence/task-7-multipart-abort.txt
  ```

  **Commit**: YES (group with Task 6)
  - Message: `feat(upload): add multipart upload APIs for large video files`
  - Files: `src/app/api/admin/upload/multipart/init/route.ts`, `src/app/api/admin/upload/multipart/presign-part/route.ts`, `src/app/api/admin/upload/multipart/complete/route.ts`, `src/app/api/admin/upload/multipart/abort/route.ts`
  - Pre-commit: `npx tsc --noEmit`

- [ ] 8. Transcode Trigger API

  **What to do**:
  - Create `src/app/api/admin/transcode/route.ts` with a POST handler:
    - Accept `{ s3Key: string, lessonId: string }` — the raw video S3 key (e.g., `video/{uuid}.mp4`)
    - Validate admin session
    - Call `createTranscodeJob(params)` from `src/services/aws-video.ts` (already implemented) — NOTE: read the function signature carefully, it takes a params object not just a string. Inspect `createTranscodeJob` to understand its parameter shape and construct the call correctly
    - The function returns a job ID from MediaConvert
    - Derive the expected HLS output key from the input UUID (e.g., if input is `video/{uuid}.mp4`, the HLS output will be at `video/hls/{uuid}/master.m3u8`) — check `createTranscodeJob` to confirm the output path pattern
    - Return `{ jobId: string, status: "SUBMITTED", expectedOutputKey: string }` — the `expectedOutputKey` tells the client what videoKey to set on completion

  **Must NOT do**:
  - DO NOT reimplement transcoding logic — `createTranscodeJob()` already handles HLS output with 720p/480p/360p renditions
  - DO NOT add comments
  - DO NOT wait for transcoding to complete — it's async (10-30 min)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integrating with existing AWS service code, needs to understand the aws-video.ts API
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 9)
  - **Blocks**: Task 12
  - **Blocked By**: Task 2 (needs AWS SDK)

  **References**:

  **Pattern References**:
  - `src/services/aws-video.ts:createTranscodeJob()` — CRITICAL: Read this function to understand its signature, what it accepts (S3 input key), what it returns (job ID), and where HLS output goes (likely `video/hls/{uuid}/` prefix)
  - `src/services/aws-video.ts:getTranscodeJobStatus()` — Returns job status — understand the return type for Task 9
  - `src/app/api/admin/lessons/[id]/route.ts` — PUT handler pattern — may need to update lesson's videoKey after transcoding completes

  **WHY Each Reference Matters**:
  - `createTranscodeJob` is ALREADY WRITTEN — the executor must call it correctly, not rewrite it
  - Understanding the output path is crucial — the HLS master.m3u8 location becomes the videoKey
  - The lessons PUT endpoint may need to be called to update videoKey after transcoding

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Submit transcoding job
    Tool: Bash (curl)
    Preconditions: Dev server running, admin session, AWS MediaConvert configured, a video file exists at the specified S3 key
    Steps:
      1. curl -s -X POST http://localhost:3000/api/admin/transcode -H "Content-Type: application/json" -H "Cookie: <admin-session>" -d '{"s3Key":"video/test-uuid.mp4","lessonId":"<lesson-id>"}' -w "\n%{http_code}"
      2. Assert HTTP status is 200
      3. Assert response has `jobId` (non-empty string) and `status` equal to "SUBMITTED"
    Expected Result: 200 with jobId and SUBMITTED status
    Failure Indicators: Non-200 status, missing jobId (note: if AWS credentials aren't configured in dev, a descriptive error is acceptable)
    Evidence: .sisyphus/evidence/task-8-transcode-trigger.txt

  Scenario: Reject non-admin transcode request
    Tool: Bash (curl)
    Preconditions: Dev server running
    Steps:
      1. curl -s -X POST http://localhost:3000/api/admin/transcode -H "Content-Type: application/json" -d '{"s3Key":"video/test.mp4","lessonId":"123"}' -w "\n%{http_code}"
      2. Assert HTTP status is 401 or 403
    Expected Result: Unauthorized
    Failure Indicators: 200 status
    Evidence: .sisyphus/evidence/task-8-transcode-auth.txt
  ```

  **Commit**: YES (group with Task 9)
  - Message: `feat(transcode): add MediaConvert transcoding trigger API`
  - Files: `src/app/api/admin/transcode/route.ts`
  - Pre-commit: `npx tsc --noEmit`

- [ ] 9. Transcode Status Polling API

  **What to do**:
  - Create `src/app/api/admin/transcode/[jobId]/route.ts` with a GET handler:
    - Accept jobId from URL params
    - Validate admin session
    - Call `getTranscodeJobStatus(jobId)` from `src/services/aws-video.ts` (already implemented) — NOTE: this currently returns `{ jobId, status, createdAt }`. Read the function to confirm exact shape
    - Return `{ jobId: string, status: string, progress?: number, outputKey?: string }`
    - When status is "COMPLETE", use the `expectedOutputKey` from the transcode trigger response (Task 8) or derive the HLS master.m3u8 path from the input UUID pattern — this is what becomes the lesson's `videoKey`
    - When status is "ERROR", include the error message from the MediaConvert response

  **Must NOT do**:
  - DO NOT implement server-side polling — the client polls this endpoint
  - DO NOT reimplement status checking — `getTranscodeJobStatus()` already exists
  - DO NOT add comments

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Needs to correctly parse MediaConvert job status and derive HLS output path
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8)
  - **Blocks**: Task 12
  - **Blocked By**: Task 2 (needs AWS SDK)

  **References**:

  **Pattern References**:
  - `src/services/aws-video.ts:getTranscodeJobStatus()` — CRITICAL: Read this function to understand what status values it returns and how to determine the HLS output path
  - `src/types/aws-video.ts` — TypeScript types for job status responses
  - `src/services/aws-video.ts:createTranscodeJob()` — Understand the output path pattern to know where master.m3u8 will be (e.g., `video/hls/{uuid}/master.m3u8`)

  **WHY Each Reference Matters**:
  - `getTranscodeJobStatus` returns the raw status — executor needs to map it to a client-friendly format
  - The output path pattern determines how `outputKey` is constructed when job completes
  - Types ensure type safety in the response

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Poll transcoding status
    Tool: Bash (curl)
    Preconditions: Dev server running, admin session, a transcode job was previously submitted (jobId known)
    Steps:
      1. curl -s http://localhost:3000/api/admin/transcode/<jobId> -H "Cookie: <admin-session>" -w "\n%{http_code}"
      2. Assert HTTP status is 200
      3. Assert response has `jobId` and `status` fields
      4. If status is "COMPLETE", assert `outputKey` is present and ends with "master.m3u8"
    Expected Result: 200 with status information
    Failure Indicators: Non-200, missing status field
    Evidence: .sisyphus/evidence/task-9-transcode-status.txt

  Scenario: Poll with invalid jobId
    Tool: Bash (curl)
    Preconditions: Dev server running, admin session
    Steps:
      1. curl -s http://localhost:3000/api/admin/transcode/invalid-job-id -H "Cookie: <admin-session>" -w "\n%{http_code}"
      2. Assert HTTP status is 404 or response contains error status
    Expected Result: Error response for invalid job
    Failure Indicators: 200 with valid-looking data
    Evidence: .sisyphus/evidence/task-9-transcode-invalid.txt
  ```

  **Commit**: YES (group with Task 8)
  - Message: `feat(transcode): add transcoding status polling API`
  - Files: `src/app/api/admin/transcode/[jobId]/route.ts`
  - Pre-commit: `npx tsc --noEmit`

- [ ] 10. Video Upload Component (XHR + Progress Bar + Multipart)

  **What to do**:
  - Create `src/components/admin/VideoUpload.tsx` — a client component ("use client") for uploading video files:
    - **Drag & drop zone** OR file input accepting video/* (mp4, mov, webm, avi)
    - **File size detection**: If file > 100MB → use multipart upload, else → use single presigned PUT
    - **Single upload flow**: Call `/api/admin/upload/presign` → PUT to presigned URL via XHR (NOT fetch — fetch can't track upload progress)
    - **Multipart upload flow**:
      1. Call `/api/admin/upload/multipart/init` to get uploadId + key
      2. Split file into 10MB chunks
      3. For each chunk: call `/api/admin/upload/multipart/presign-part` → PUT chunk via XHR → collect ETag from response header
      4. Call `/api/admin/upload/multipart/complete` with all ETags
    - **Progress bar**: Calculate total progress from XHR `upload.onprogress` (single) or chunk completion percentage (multipart)
    - **Cancel button**: Abort XHR + call `/api/admin/upload/multipart/abort` (for multipart) if user navigates away or clicks cancel
    - **On complete**: Call `onUploadComplete(s3Key)` callback prop — parent component uses this to set videoKey or trigger transcoding
    - **States**: idle → uploading (progress %) → complete (show green check + key) → error (show retry)
    - **UI**: Romanian labels ("Încarcă video", "Se încarcă...", "Încărcare completă", "Anulează"), purple accent color

  **Must NOT do**:
  - DO NOT use `fetch()` for the actual S3 PUT — MUST use `XMLHttpRequest` for progress tracking (Metis flagged this)
  - DO NOT use the original filename as display after upload — show the UUID key
  - DO NOT add comments
  - DO NOT handle transcoding here — that's Task 12's component

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex client-side UI component with drag & drop, progress bar, state management
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Drag & drop interaction, progress visualization, error states
  - **Skills Evaluated but Omitted**:
    - `playwright`: Verification in QA, not implementation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 11, 12)
  - **Blocks**: Task 13
  - **Blocked By**: Tasks 6, 7 (needs presign + multipart APIs to exist)

  **References**:

  **Pattern References**:
  - `src/app/admin/cursuri/[id]/editii/[editionId]/lectii/LessonManager.tsx` — The parent component that will integrate this. Understand its state management and how `videoKey` is currently handled (text input)
  - `src/app/admin/bundle-uri/new/page.tsx` — Example of a complex admin form with state management (guide picker with checkboxes) — follow similar UX patterns
  - `src/components/SecureVideoPlayer.tsx` — Example of a complex client component with dynamic loading and state — follow similar "use client" patterns

  **External References**:
  - XMLHttpRequest upload.onprogress: `xhr.upload.addEventListener('progress', (e) => { percent = (e.loaded / e.total) * 100 })`
  - File.slice() for chunking: `file.slice(start, end)`

  **WHY Each Reference Matters**:
  - LessonManager is where this component will be integrated — understand its props and state to design the right callback interface
  - The bundle page shows admin form UX patterns (loading states, error handling, Romanian labels)
  - XHR is REQUIRED (not fetch) because fetch doesn't support upload progress events

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Component renders with drag & drop zone
    Tool: Bash (grep)
    Preconditions: File created
    Steps:
      1. Verify file exists: ls src/components/admin/VideoUpload.tsx
      2. grep -c "XMLHttpRequest" src/components/admin/VideoUpload.tsx — expect >= 1 (using XHR, not fetch)
      3. grep -c "upload.onprogress\|upload.addEventListener" src/components/admin/VideoUpload.tsx — expect >= 1 (progress tracking)
      4. grep -c "onUploadComplete" src/components/admin/VideoUpload.tsx — expect >= 1 (callback prop)
      5. grep -c "Încarcă\|încarcă" src/components/admin/VideoUpload.tsx — expect >= 1 (Romanian labels)
    Expected Result: Component uses XHR with progress tracking, Romanian labels, and callback prop
    Failure Indicators: Uses fetch instead of XHR, no progress tracking, English labels
    Evidence: .sisyphus/evidence/task-10-video-upload-component.txt

  Scenario: Multipart chunking logic exists
    Tool: Bash (grep)
    Preconditions: File created
    Steps:
      1. grep -c "slice\|chunk" src/components/admin/VideoUpload.tsx — expect >= 1
      2. grep -c "multipart" src/components/admin/VideoUpload.tsx — expect >= 1
      3. grep -c "abort\|Anulează" src/components/admin/VideoUpload.tsx — expect >= 1
    Expected Result: Chunking, multipart, and abort logic present
    Failure Indicators: Missing chunking or abort
    Evidence: .sisyphus/evidence/task-10-video-upload-multipart.txt
  ```

  **Commit**: YES (group with Tasks 11, 12)
  - Message: `feat(admin): add video upload component with multipart support`
  - Files: `src/components/admin/VideoUpload.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [ ] 11. PDF Upload Component

  **What to do**:
  - Create `src/components/admin/PdfUpload.tsx` — a client component for uploading PDF files:
    - **File input** accepting application/pdf (multiple files supported)
    - **Upload flow**: For each PDF, call `/api/admin/upload/presign` with `folder: "materials"` → PUT to presigned URL via XHR
    - **Progress**: Show individual progress per file
    - **On complete**: Call `onUploadComplete(s3Keys: string[])` callback prop with array of uploaded keys
    - **Display**: Show list of uploaded PDFs with filename + key, ability to remove individual PDFs from the list
    - **States**: idle → uploading → complete (list of uploaded keys)
    - **UI**: Romanian labels ("Încarcă PDF-uri", "Adaugă PDF"), purple accent, drag & drop zone

  **Must NOT do**:
  - DO NOT use multipart for PDFs — they're typically < 50MB, single presigned PUT is fine
  - DO NOT add comments
  - DO NOT handle video files here — that's Task 10

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component with multiple file handling, per-file progress
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Multi-file upload UX, progress states
  - **Skills Evaluated but Omitted**:
    - `playwright`: Verification in QA

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 10, 12)
  - **Blocks**: Task 13
  - **Blocked By**: Task 6 (needs presign API)

  **References**:

  **Pattern References**:
  - `src/components/admin/VideoUpload.tsx` (Task 10) — Follow same XHR upload pattern, similar state management, consistent UI style
  - `src/app/admin/cursuri/[id]/editii/[editionId]/lectii/LessonManager.tsx` — Currently handles pdfKeys as textarea (one per line) — understand how the parent expects pdfKeys to be passed

  **WHY Each Reference Matters**:
  - VideoUpload establishes the upload pattern — PdfUpload should feel visually and architecturally consistent
  - LessonManager currently uses a textarea for pdfKeys — the new component replaces this with drag & drop

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Component handles multiple PDF uploads
    Tool: Bash (grep)
    Preconditions: File created
    Steps:
      1. Verify file exists: ls src/components/admin/PdfUpload.tsx
      2. grep -c "application/pdf" src/components/admin/PdfUpload.tsx — expect >= 1
      3. grep -c "onUploadComplete" src/components/admin/PdfUpload.tsx — expect >= 1
      4. grep -c "XMLHttpRequest\|xhr" src/components/admin/PdfUpload.tsx — expect >= 1 (XHR for progress)
    Expected Result: Component exists with PDF handling, callback, and XHR upload
    Failure Indicators: Missing PDF filter, uses fetch instead of XHR
    Evidence: .sisyphus/evidence/task-11-pdf-upload.txt
  ```

  **Commit**: YES (group with Tasks 10, 12)
  - Message: `feat(admin): add PDF upload component`
  - Files: `src/components/admin/PdfUpload.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [ ] 12. Transcoding Status UI Component

  **What to do**:
  - Create `src/components/admin/TranscodeStatus.tsx` — a client component for monitoring transcoding:
    - **Props**: `jobId: string | null`, `onComplete: (hlsKey: string) => void`
    - **Polling**: When `jobId` is provided, poll `GET /api/admin/transcode/{jobId}` with progressive backoff intervals: `[2s, 3s, 5s, 10s, 15s, 30s]` then stay at 30s
    - **States**:
      - No jobId → hidden / not rendered
      - SUBMITTED → "Se procesează..." with spinner
      - PROGRESSING → "Procesare: X%" with progress bar
      - COMPLETE → "Procesare completă ✓" in green, auto-call `onComplete(outputKey)` to set the lesson's videoKey
      - ERROR → "Eroare la procesare" in red with error details and retry button
    - **Auto-stop**: Stop polling when status is COMPLETE or ERROR
    - **Cleanup**: Clear interval on unmount

  **Must NOT do**:
  - DO NOT poll more frequently than 2s (initial) — wastes API calls
  - DO NOT show the raw job ID to the admin — show human-friendly status
  - DO NOT add comments

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Client component with polling, progress visualization, state transitions
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Progress indicator design, status transitions
  - **Skills Evaluated but Omitted**:
    - `playwright`: Verification in QA

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 10, 11)
  - **Blocks**: Task 13
  - **Blocked By**: Tasks 8, 9 (needs transcode APIs)

  **References**:

  **Pattern References**:
  - `src/components/SecureVideoPlayer.tsx` — Example of a client component with interval-based refresh (cookie refresh every 90 min) — follow similar useEffect cleanup pattern
  - `src/app/admin/disponibilitate/AvailabilityCalendar.tsx` — Example of client component with fetch + state management + loading/error states

  **WHY Each Reference Matters**:
  - SecureVideoPlayer shows the interval + cleanup pattern (setInterval in useEffect with return cleanup)
  - AvailabilityCalendar shows fetch + loading/error state management patterns used in admin components

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Component implements polling with backoff
    Tool: Bash (grep)
    Preconditions: File created
    Steps:
      1. Verify file exists: ls src/components/admin/TranscodeStatus.tsx
      2. grep -c "setInterval\|setTimeout" src/components/admin/TranscodeStatus.tsx — expect >= 1
      3. grep -c "onComplete\|COMPLETE\|completă" src/components/admin/TranscodeStatus.tsx — expect >= 1
      4. grep -c "clearInterval\|clearTimeout" src/components/admin/TranscodeStatus.tsx — expect >= 1 (cleanup)
      5. grep -c "Se procesează\|Procesare\|Eroare" src/components/admin/TranscodeStatus.tsx — expect >= 1 (Romanian)
    Expected Result: Polling with cleanup and Romanian status labels
    Failure Indicators: No polling logic, no cleanup, English labels
    Evidence: .sisyphus/evidence/task-12-transcode-status.txt
  ```

  **Commit**: YES (group with Tasks 10, 11)
  - Message: `feat(admin): add transcoding status component with progressive polling`
  - Files: `src/components/admin/TranscodeStatus.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [ ] 13. Integrate Upload Components into LessonManager

  **What to do**:
  - Modify `src/app/admin/cursuri/[id]/editii/[editionId]/lectii/LessonManager.tsx`:
    - **Replace** the `videoKey` text input with the `VideoUpload` component (Task 10)
      - When video upload completes (`onUploadComplete(s3Key)`), automatically trigger transcoding by calling `POST /api/admin/transcode` with the S3 key and lesson ID
      - Show `TranscodeStatus` component (Task 12) below the upload area
      - When transcoding completes (`onComplete(hlsKey)`), set the lesson's `videoKey` to the HLS master.m3u8 path
    - **Replace** the `pdfKeys` textarea with the `PdfUpload` component (Task 11)
      - When PDF upload completes (`onUploadComplete(keys)`), update the lesson's pdfKeys array
    - **Keep** the existing text inputs as a fallback "Introducere manuală" (manual entry) toggle — some admins may need to paste an existing S3 key
    - **Preserve** all other lesson fields (title, order, duration, zoomLink, availableFrom) unchanged
    - **Flow**: Upload video → auto-transcode → auto-set videoKey → save lesson
    - The existing POST/PUT lesson API endpoints already accept videoKey and pdfKeys — no API changes needed

  **Must NOT do**:
  - DO NOT remove the ability to manually enter S3 keys (toggle between upload UI and text input)
  - DO NOT modify the lesson API endpoints — they already handle videoKey/pdfKeys
  - DO NOT change other lesson form fields
  - DO NOT add comments

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex integration — wiring 3 components + APIs + auto-transcoding flow + maintaining existing functionality
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Complex form with multiple input modes (upload vs manual), state coordination
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed for implementation

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (sequential — needs all Wave 3 components)
  - **Blocks**: Task 15
  - **Blocked By**: Tasks 10, 11, 12 (needs all upload components)

  **References**:

  **Pattern References**:
  - `src/app/admin/cursuri/[id]/editii/[editionId]/lectii/LessonManager.tsx` — THE file to modify. Read it completely: understand the form state, how videoKey/pdfKeys are handled, submit flow, add/edit/delete lesson functions
  - `src/components/admin/VideoUpload.tsx` (Task 10) — Import and use, understand its props: `onUploadComplete(s3Key: string)`
  - `src/components/admin/PdfUpload.tsx` (Task 11) — Import and use, understand its props: `onUploadComplete(s3Keys: string[])`
  - `src/components/admin/TranscodeStatus.tsx` (Task 12) — Import and use, understand its props: `jobId`, `onComplete(hlsKey: string)`

  **API/Type References**:
  - `src/app/api/admin/lessons/route.ts` — POST handler: what fields it accepts (verify videoKey and pdfKeys are accepted as-is)
  - `src/app/api/admin/lessons/[id]/route.ts` — PUT handler: what fields it accepts for updates
  - `POST /api/admin/transcode` (Task 8) — `{ s3Key, lessonId }` → `{ jobId, status }`

  **WHY Each Reference Matters**:
  - LessonManager is the integration target — must understand its complete state to avoid breaking existing functionality
  - The three components are imported and wired together here — their prop interfaces must be matched exactly
  - The lesson API endpoints confirm no backend changes needed — just pass the right data

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Video upload component renders in lesson form
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, logged in as admin
    Steps:
      1. Navigate to /admin/cursuri/<courseId>/editii/<editionId>/lectii
      2. Click "Adaugă lecție" or edit an existing lesson
      3. Assert VideoUpload component is visible (look for "Încarcă video" text or drag & drop zone)
      4. Assert PdfUpload component is visible (look for "Încarcă PDF" text)
      5. Assert there's a toggle or tab to switch to manual entry mode
      6. Screenshot the form
    Expected Result: Upload components visible in lesson form with manual entry fallback
    Failure Indicators: Old text inputs shown, upload components missing
    Evidence: .sisyphus/evidence/task-13-lesson-form-upload.png

  Scenario: Manual entry toggle still works
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, logged in as admin, on lesson form
    Steps:
      1. Find and click the manual entry toggle/tab
      2. Assert text input for videoKey appears with placeholder
      3. Assert textarea for pdfKeys appears
      4. Type a test videoKey value
      5. Switch back to upload mode
      6. Assert upload component is shown again
    Expected Result: Can toggle between upload and manual entry modes
    Failure Indicators: Toggle missing, manual inputs removed
    Evidence: .sisyphus/evidence/task-13-manual-entry-toggle.png
  ```

  **Commit**: YES
  - Message: `feat(admin): integrate upload pipeline into lesson manager`
  - Files: `src/app/admin/cursuri/[id]/editii/[editionId]/lectii/LessonManager.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [ ] 14. Audio Progress Tracking — Uncomment and Wire Up

  **What to do**:
  - Open `src/app/api/guides/[id]/audio-progress/route.ts`
  - The file has TODO comments indicating `audioPosition` field is not yet in the schema — but Task 1 added it
  - Uncomment/implement the actual Prisma queries that read and write `audioPosition` on `GuideAccess`
  - The GET handler should return `{ audioPosition: number }` for the current user's guide access
  - The POST handler should accept `{ audioPosition: number }` and update the user's guide access record
  - Verify the field name matches exactly what was added to the schema in Task 1

  **Must NOT do**:
  - DO NOT create the audio player UI — just wire up the API
  - DO NOT add comments (remove the existing TODO comments)
  - DO NOT modify the schema — Task 1 already did that

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small change — uncomment/implement 2 queries in an existing file
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (can run alongside Task 13)
  - **Blocks**: Task 15
  - **Blocked By**: Task 1 (needs audioPosition in schema)

  **References**:

  **Pattern References**:
  - `src/app/api/guides/[id]/audio-progress/route.ts` — THE file to modify. Read the TODO comments to understand what needs to be implemented
  - `prisma/schema.prisma:GuideAccess` — Verify `audioPosition Float? @default(0)` exists (added by Task 1)

  **WHY Each Reference Matters**:
  - The file already has the structure — just needs the Prisma queries to be implemented where TODO markers are

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Audio progress API works
    Tool: Bash (curl)
    Preconditions: Dev server running, user logged in with guide access
    Steps:
      1. curl -s -X POST http://localhost:3000/api/guides/<guideId>/audio-progress -H "Content-Type: application/json" -H "Cookie: <session>" -d '{"audioPosition":42.5}' -w "\n%{http_code}"
      2. Assert HTTP status is 200
      3. curl -s http://localhost:3000/api/guides/<guideId>/audio-progress -H "Cookie: <session>" -w "\n%{http_code}"
      4. Assert response contains "audioPosition":42.5
    Expected Result: Audio position saved and retrievable
    Failure Indicators: Non-200 status, wrong audioPosition value
    Evidence: .sisyphus/evidence/task-14-audio-progress.txt

  Scenario: No TODO comments remain
    Tool: Bash (grep)
    Preconditions: None
    Steps:
      1. grep -c "TODO" src/app/api/guides/[id]/audio-progress/route.ts — expect 0
    Expected Result: Zero TODO comments
    Failure Indicators: TODO comments still present
    Evidence: .sisyphus/evidence/task-14-no-todos.txt
  ```

  **Commit**: YES (group with Task 13)
  - Message: `feat(guides): implement audio progress tracking API`
  - Files: `src/app/api/guides/[id]/audio-progress/route.ts`
  - Pre-commit: `npx tsc --noEmit`

- [ ] 15. Full Build Verification + Prisma Stale Errors Cleanup

  **What to do**:
  - Run `npx prisma generate` to ensure all Prisma types are up to date
  - Run `npx tsc --noEmit` to check TypeScript compilation — fix ANY errors
  - Run `npm run build` (which runs `next build`) — fix ANY errors
  - If any stale Prisma errors remain (loginActivity, date fields, etc.), run `npx prisma generate` again and verify they resolve
  - Ensure zero build errors across the entire project
  - This task is the final quality gate before the verification wave

  **Must NOT do**:
  - DO NOT add `@ts-ignore` or `as any` to suppress errors — fix them properly
  - DO NOT modify test files or create test infrastructure
  - DO NOT add comments

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Run build commands, fix any remaining TS errors — straightforward
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (after Tasks 13, 14)
  - **Blocks**: F1-F4 (Final Verification Wave)
  - **Blocked By**: Tasks 13, 14 (needs all code changes complete)

  **References**:

  **Pattern References**:
  - All files modified in Tasks 1-14 — the build will surface any issues across all changes

  **WHY Each Reference Matters**:
  - This is a comprehensive quality gate — every file that was touched needs to compile cleanly

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Clean TypeScript compilation
    Tool: Bash
    Preconditions: All previous tasks completed
    Steps:
      1. Run `npx prisma generate` — expect exit code 0
      2. Run `npx tsc --noEmit 2>&1` — expect zero "error TS" lines
      3. Capture output
    Expected Result: Zero TypeScript errors
    Failure Indicators: Any "error TS" in output
    Evidence: .sisyphus/evidence/task-15-tsc-clean.txt

  Scenario: Clean Next.js build
    Tool: Bash
    Preconditions: TypeScript compilation passes
    Steps:
      1. Run `rm -rf .next` (clear stale cache)
      2. Run `npm run build 2>&1` — expect exit code 0, output contains "Compiled successfully"
      3. Capture full build output
    Expected Result: Build succeeds with zero errors
    Failure Indicators: Build fails, "Failed to compile", any error messages
    Evidence: .sisyphus/evidence/task-15-build-clean.txt
  ```

  **Commit**: YES
  - Message: `chore: clean build verification — zero errors`
  - Files: Any files that needed fixing
  - Pre-commit: `npm run build`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npx tsc --noEmit` + `next build`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp). Verify zero unnecessary comments per project convention.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill for UI)
  Start from clean state (`rm -rf .next && npm run dev`). Log in as admin (`admin@perspectivaevei.com` / `admin123`). Navigate to lesson manager → test upload UI (drag file, verify progress bar, verify S3 key populated). Navigate to password reset → test full flow. Test cross-task integration. Save screenshots to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **After Wave 1**: `feat(schema): add resetToken and audioPosition fields` — prisma/schema.prisma
- **After Wave 1**: `fix(auth): implement password reset API endpoint` — src/app/api/auth/reset-password/route.ts
- **After Wave 1**: `feat(admin): add settings page` — src/app/admin/setari/page.tsx
- **After Wave 1**: `fix(admin): resolve AdminMessagesClient import` — src/app/admin/mesaje/
- **After Wave 2**: `feat(upload): add S3 presigned URL and multipart upload APIs` — src/app/api/admin/upload/
- **After Wave 2**: `feat(transcode): add MediaConvert trigger and status APIs` — src/app/api/admin/transcode/
- **After Wave 3**: `feat(admin): add video and PDF upload UI components` — src/components/admin/
- **After Wave 4**: `feat(admin): integrate upload pipeline into lesson manager` — src/app/admin/cursuri/

---

## Success Criteria

### Verification Commands
```bash
npx prisma generate       # Expected: zero errors
npx prisma db push        # Expected: schema in sync
npm run build             # Expected: zero errors
curl -X POST localhost:3000/api/auth/reset-password -d '{"email":"test@example.com"}' # Expected: 200
curl -X POST localhost:3000/api/admin/upload/presign -H "Cookie: ..." -d '{"filename":"test.pdf","contentType":"application/pdf","folder":"materials"}' # Expected: 200 with presignedUrl
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] Admin can upload video → transcode → view in lesson
- [ ] Admin can upload PDF → view in lesson
- [ ] Password reset works end-to-end
- [ ] Zero build errors
- [ ] All evidence files in .sisyphus/evidence/
