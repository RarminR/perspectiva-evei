# Homepage Sales Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite the homepage (`src/app/page.tsx`) from brand-showcase to conversion-focused sales page with Cursul A.D.O. as hero product.

**Architecture:** Single-file rewrite of `page.tsx` as an async server component. Fetches course edition data (spots) from Prisma via existing `getCourseWithEditions` service and guide data via existing `prisma.guide.findMany`. All styling uses inline styles matching the existing Webflow-ported design system. Reuses `<Navbar />` and `<Footer />` components.

**Tech Stack:** Next.js 14, React Server Components, Prisma, Tailwind CSS (minimal — most styling is inline), TypeScript

**Design Doc:** `docs/plans/2026-02-27-homepage-sales-redesign-design.md`

---

### Task 1: Extract Shared Pricing Constants

**Files:**
- Create: `src/lib/constants/pricing.ts`
- Modify: `src/app/cursul-ado/page.tsx` (import from new file instead of local constants)

**Step 1: Create the shared constants file**

```typescript
// src/lib/constants/pricing.ts
export const COURSE_PRICING = {
  FULL_PRICE: '€1.188',
  FULL_PRICE_CROSSED: '€1.288',
  INSTALLMENT_PRICE: '€644',
  INSTALLMENT_TOTAL: '€1.288',
  MAX_PARTICIPANTS: 15,
  SAVINGS_PERCENT: '7,76%',
} as const

export const PRICING_FEATURES = [
  'Acces nelimitat la întâlnirile live și la înregistrări',
  'Singurul curs de manifestare conștientă de care vei avea nevoie',
  'Garanția clarității',
] as const
```

**Step 2: Update cursul-ado/page.tsx imports**

Replace the local constants (lines 31-36 and 107-111) with:
```typescript
import { COURSE_PRICING, PRICING_FEATURES } from '@/lib/constants/pricing'
```

And update all references: `FULL_PRICE` → `COURSE_PRICING.FULL_PRICE`, etc.

**Step 3: Verify cursul-ado page still works**

Run: `npx next lint src/app/cursul-ado/page.tsx`
Open: `http://localhost:3000/cursul-ado` — verify pricing section renders correctly.

**Step 4: Commit**

```bash
git add src/lib/constants/pricing.ts src/app/cursul-ado/page.tsx
git commit -m "refactor: extract course pricing constants to shared module"
```

---

### Task 2: Rewrite Homepage — Sections 1-2 (Hero + Social Proof)

**Files:**
- Modify: `src/app/page.tsx` (full rewrite — keep metadata, replace everything else)

**Step 1: Rewrite page.tsx with imports, metadata, data fetching, and Sections 1-2**

Keep existing metadata export. Add data fetching. Replace the `Home` component with an async server component that renders sections 1-2 first (we'll add remaining sections in subsequent tasks).

```typescript
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { COURSE_PRICING } from '@/lib/constants/pricing'
import { getCourseWithEditions } from '@/services/course'

// Keep existing metadata export as-is

export default async function Home() {
  const course = await getCourseWithEditions('cursul-ado')
  const activeEdition = course?.editions?.find((e) => e.enrollmentOpen)
  const enrollmentCount = activeEdition?._count?.enrollments ?? 0
  const spotsLeft = COURSE_PRICING.MAX_PARTICIPANTS - enrollmentCount

  return (
    <main>
      <Navbar />
      {/* Section 1: Hero */}
      {/* Section 2: Social Proof Strip */}
      {/* Placeholder for remaining sections */}
      <Footer />
    </main>
  )
}
```

**Section 1 — Hero:** Full implementation with:
- Background image `IMG_7501.jpg` with gradient overlay (same pattern as current hero)
- Pills: "Locuri limitate" with ping dot animation + "Sesiuni live pe Zoom"
- Headline: "Transformă-ți viața în 8 săptămâni." — gradient text
- Sub-headline paragraph
- CTA row: Primary (white pill, links to checkout) + Secondary (outline, scrolls to #produs)
- Rate note below CTAs
- Left-aligned content in 50% width container
- Responsive: 100% width on mobile

**Section 2 — Social Proof Strip:**
- `bg-[#51087e]` horizontal bar
- 4 stats with numbers + labels, separated by vertical dividers
- Responsive: 2×2 grid on mobile

**Step 2: Verify rendering**

Open: `http://localhost:3000` — verify Hero + Social Proof render. Check mobile width.
Run: `npx next lint src/app/page.tsx`

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(homepage): rewrite hero + social proof strip for sales conversion"
```

---

### Task 3: Section 3 — Product Hero (Benefits + Pricing Card)

**Files:**
- Modify: `src/app/page.tsx` (add section 3 between social proof and footer)

**Step 1: Add Section 3 — Cursul A.D.O. product showcase**

Insert after the social proof strip, before `<Footer />`.

**Left column — Benefits:**
- Heading: "Ce primești în Cursul A.D.O." gradient text
- 4 benefit cards with icon circles + text (same pattern as current benefits section)
- Benefits data:
  1. "Înțelegi manifestarea conștientă" 
  2. "Te bucuri de atenție personalizată"
  3. "Deprinzi un nou mod de gândire"
  4. "Ajungi la cârma propriei vieți"

**Right column — Pricing Card:**
- Dark purple card (`bg-[#51087e]`) with glow orbs
- "Plată integrală" badge
- Price: €1.188 large + €1.288 crossed + savings badge
- Rate option: "sau 2 × €644 în rate"
- 3 feature checkmarks (from PRICING_FEATURES)
- CTA: "Cumpără acum →" linking to `/checkout?product=COURSE&type=full`
- Urgency: "Doar 15 locuri per ediție" with ping dot
- Use dynamic `spotsLeft` if active edition exists

**Layout:** 2-column CSS grid on desktop (`grid-template-columns: 1fr 1fr`), single column on mobile.
Add `id="produs"` to the section for scroll anchor from hero CTA.

**Step 2: Verify**

Open: `http://localhost:3000` — scroll to product section, verify layout + pricing.
Run: `npx next lint src/app/page.tsx`

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(homepage): add product hero section with pricing card"
```

---

### Task 4: Section 4 — Testimonials

**Files:**
- Modify: `src/app/page.tsx` (add section 4)

**Step 1: Add testimonials section**

Insert after product hero section.

- Gradient background `#e8c2ff → white`
- Heading: "Ce spun cursanții mei" + subtitle
- 3 testimonial cards in CSS grid (3 cols desktop, 1 col mobile)
- Each card: white bg, rounded corners, decorative quote mark, 5 stars, quote, avatar circle with initial, name + role
- Link to studii-de-caz page

**Testimonials data:**
```typescript
const TESTIMONIALS = [
  { quote: 'Eva, te iubesc! Dacă ai ști cât de mult s-a schimbat tot după cursul tău... Voi fi mereu recunoscătoare!', name: 'Roxana', role: 'Absolventă Cursul A.D.O.' },
  { quote: 'Singurul curs care te scoate din întuneric este A.D.O.! Totul este atât de simplu, și nu ai nevoie de niciun alt curs după.', name: 'Loredana', role: 'Absolventă Cursul A.D.O.' },
  { quote: 'Am învățat că totul pleacă de la mine. Perspectiva mea s-a schimbat complet, iar viața a început să reflecte asta.', name: 'Elena', role: 'Absolventă Cursul A.D.O.' },
]
```

Reuse the `StarSVG` component from the current homepage (keep it as a local component).

**Step 2: Verify**

Open: `http://localhost:3000` — verify testimonials render with stars and styling.

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(homepage): add testimonials section"
```

---

### Task 5: Section 5 — Cross-sell (Guides + Sedinte)

**Files:**
- Modify: `src/app/page.tsx` (add section 5 + guide data fetching)

**Step 1: Add data fetching for guides**

At the top of the `Home` component, add guide fetching using the same pattern as `src/app/ghiduri/page.tsx`:

```typescript
import { prisma } from '@/lib/db'

// Inside Home():
let guides: { id: string; title: string; slug: string; price: number; coverImage: string | null }[] = []
try {
  guides = await prisma.guide.findMany({
    where: {},
    orderBy: { createdAt: 'asc' },
    select: { id: true, title: true, slug: true, price: true, coverImage: true },
  })
} catch { /* fallback to empty */ }

let bundle: { id: string; price: number; originalPrice: number } | null = null
try {
  bundle = await prisma.bundle.findFirst({
    where: { active: true },
    select: { id: true, price: true, originalPrice: true },
  })
} catch { /* fallback to null */ }
```

**Step 2: Add Section 5 — Cross-sell**

2-column layout:
- **Left (wider):** 3 guide mini-cards (horizontal card: cover image + title + price + "Cumpără →" link) stacked vertically + bundle highlight card underneath
- **Right:** Ședințe 1:1 large card with background image, title, description, CTA

Guide cards: flex row, image left (`w-20 h-28 object-cover rounded-xl`), content right.
Bundle card: `bg-[#51087e]`, price + crossed original + savings badge + CTA.
Ședințe card: background image with gradient overlay, similar to current homepage service cards.

**Step 3: Verify**

Open: `http://localhost:3000` — verify guide cards render with prices, bundle shows savings, ședințe card looks correct.
Run: `npx next lint src/app/page.tsx`

**Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(homepage): add cross-sell section with guides and sedinte"
```

---

### Task 6: Section 6 — Final CTA

**Files:**
- Modify: `src/app/page.tsx` (add final section before Footer)

**Step 1: Add final CTA section**

- Background image `IMG_6166-min_1.avif` with purple gradient overlays (same pattern as current)
- Heading: "Ești gata să trăiești o altă realitate?"
- Pricing repeat: "Cursul A.D.O. — €1.188 (sau 2 × €644)"
- Primary CTA: "Înscrie-te acum →" white pill button → checkout
- Secondary CTA: "Explorează ghidurile →" outline light → /ghiduri

**Step 2: Verify full page**

Open: `http://localhost:3000` — scroll through entire page:
1. Hero with pricing CTA ✓
2. Social proof strip ✓
3. Product hero with pricing card ✓
4. Testimonials ✓
5. Cross-sell guides + ședințe ✓
6. Final CTA ✓

Test responsive at 375px, 768px, 1024px, 1440px.

Run: `npx next lint src/app/page.tsx`

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(homepage): add final CTA section — complete sales page redesign"
```

---

### Task 7: Responsive Polish + Mobile Grid Fixes

**Files:**
- Modify: `src/app/page.tsx` (add responsive className overrides)

**Step 1: Add responsive CSS classes**

The current homepage uses `className` for responsive grid overrides (e.g., `layout-3-cols`, `grid-2-cols`, `guide-3-cols`). Check if `globals.css` has any media queries for these. If needed, add Tailwind responsive classes directly:

For each grid section, ensure:
- 3-col grids → `className="grid-cols-1 md:grid-cols-3"` style override
- 2-col grids → `className="grid-cols-1 md:grid-cols-2"` style override  
- Hero content → `className="w-full md:w-1/2"` override
- Social proof → `className="grid grid-cols-2 md:flex"` override

**Step 2: Test all breakpoints**

Test at: 375px (iPhone), 768px (iPad), 1024px (laptop), 1440px (desktop).
Verify: No horizontal overflow, CTAs are tappable, text is readable, cards stack properly.

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "fix(homepage): responsive polish for mobile and tablet"
```

---

### Task 8: Final Verification

**Step 1: Run linting**

```bash
npx next lint
```

Expected: No errors on changed files.

**Step 2: Run build**

```bash
npm run build
```

Expected: Build succeeds. Page renders server-side.

**Step 3: Run existing tests**

```bash
npm run test -- --run
```

Expected: All existing tests pass (we haven't changed test files).

**Step 4: Manual smoke test**

Open `http://localhost:3000`:
- All 6 sections render
- "Înscrie-te — €1.188" CTA in hero links to `/checkout?product=COURSE&type=full`
- "Vezi ce include ↓" scrolls to product section
- Pricing card CTA links to checkout
- Guide "Cumpără" links include correct guide IDs
- Bundle CTA links to checkout with bundle ID
- Final CTA links work
- Mobile layout is clean at 375px

**Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "chore(homepage): final polish after smoke test"
```
