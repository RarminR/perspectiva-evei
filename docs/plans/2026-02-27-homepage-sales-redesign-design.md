# Homepage Sales Redesign — Design Document

**Date:** 2026-02-27
**Approach:** A — "Sales Page" (full conversion funnel)
**Hero product:** Cursul A.D.O.
**File:** `src/app/page.tsx`

---

## Overview

Redesign the homepage from a brand-showcase into a conversion-focused sales page. Cursul A.D.O. is the hero product, with ghiduri and sedinte 1:1 as cross-sell. Prices are visible throughout, CTAs link directly to checkout.

## Design System Reference

- **Colors:** `#51087e` (purple), `#a007dc` (magenta), `#2c0246` (dark purple), `#e8c2ff` (light pink), `#f8f9fa` (text light)
- **Font:** Inter (400, 500, 600)
- **Buttons:** Pill shape (`border-radius: 999px`), variants: primary (`bg-#51087e`), alt (`bg-white text-#51087e`), outline-light (`border white, bg transparent`)
- **Cards:** `rounded-2xl` or `rounded-3xl`, white or purple gradient backgrounds
- **Gradients:** Sections alternate `white→#e8c2ff` and `#e8c2ff→white`
- **Existing components:** `<Navbar />`, `<Footer />`, `<Section />`, `<Badge />`, `<Accordion />`
- **Existing images:** `IMG_7501.jpg` (desert hero), `IMG_6166-min_1.avif`, `IMG_6167-min_1.jpeg`, `IMG_6176-min_1.avif`, `Untitled-design-1.jpg`, guide cover PNGs

---

## Section 1: Hero

**Background:** Same `IMG_7501.jpg` desert image with gradient overlay `linear-gradient(101deg, #a007dc, rgba(62,6,97,0.75) 30%, rgba(62,6,97,0.5) 55%, transparent 69%)`. Height `90vh`.

**Content (left-aligned, max 50% width on desktop):**

1. **Pills row:** Two pills with `bg-white/25 rounded-full px-6 py-3`
   - "Locuri limitate" with animated ping dot (green/magenta)
   - "Sesiuni live pe Zoom"

2. **Headline:** "Transformă-ți viața în 8 săptămâni."
   - Gradient text `linear-gradient(90deg, white, #e0e0e0)` with `-webkit-background-clip: text`
   - `font-size: clamp(2.5rem, 5vw, 4rem)`, `font-weight: 700`

3. **Sub-headline:** "Cursul A.D.O. te învață să devii Creatorul realității tale. Fără tehnici. Fără meditații. Doar tu, într-o postură complet nouă."
   - `color: white`, `opacity: 0.8`, `max-width: 480px`

4. **CTA row:**
   - Primary: "Înscrie-te — €1.188" → `/checkout?product=COURSE&type=full`
     - `bg-white, color: #51087e, border-radius: 999px, font-weight: 600`
   - Secondary: "Vezi ce include ↓" → `#produs` anchor scroll
     - `border: 1px solid white, bg: transparent, color: white`

5. **Rate note:** "sau 2 × €644 în rate" — `color: white/50, font-size: 0.85rem`

**Responsive (< 768px):** Content 100% width, height 70vh, CTAs stack vertically.

---

## Section 2: Social Proof Strip

**Background:** `bg-[#51087e]`, `padding: 20px 30px`.

**Layout:** Centered flex row, 4 stat items separated by `border-r border-white/20`.

| Number | Label |
|--------|-------|
| 100+   | cursanți mulțumiți |
| 4+     | ani de experiență |
| 8      | săptămâni de transformare |
| 15     | participanți max / ediție |

**Styling:**
- Numbers: `text-2xl font-bold text-white`
- Labels: `text-sm text-white/60`

**Responsive (< 768px):** 2×2 grid, no dividers.

---

## Section 3: Product Hero — Cursul A.D.O.

**id:** `produs` (scroll anchor from hero CTA)
**Background:** Gradient `linear-gradient(180deg, white, #e8c2ff)`, padding `90px 30px`.

**Layout:** 2-column grid (`1fr 1fr`, gap `3rem`) inside `max-width: 940px`.

### Left Column — Benefits

**Heading:** "Ce primești în Cursul A.D.O." — gradient text `#51087e→#8f0edf`
**Subtitle:** "8 săptămâni de transformare autentică, live pe Zoom"

**4 benefit cards** (vertical stack, gap `20px`):
Each card: `bg-rgba(81,8,126,0.15)`, `border-radius: 20px`, `padding: 30px`, flex row.
- Left: icon circle `bg-white, color: #51087e, w-60, h-60, rounded-[15px], box-shadow: 0 0 15px rgba(81,8,126,0.5)` with `✦`
- Right: benefit title in gradient text, `font-size: 1.1rem, font-weight: 700`

Benefits (from ADO page):
1. "Înțelegi manifestarea conștientă"
2. "Te bucuri de atenție personalizată"
3. "Deprinzi un nou mod de gândire"
4. "Ajungi la cârma propriei vieți"

### Right Column — Pricing Card

**Card:** `bg-[#51087e]`, `rounded-3xl`, `padding: 40px`, `position: relative`, `overflow: hidden`

**Decorative:** Two glow orbs (absolute positioned, blurred)
- Top-right: `bg-[#a007dc]/20, w-60, h-60, blur-[80px]`
- Bottom-left: `bg-[#e0b0ff]/15, w-48, h-48, blur-[60px]`

**Content:**
1. Badge: "Plată integrală" — `bg-white/10 text-white border border-white/20 rounded-full px-4 py-1.5`
2. Price: `€1.188` — `text-4xl font-bold text-white`
3. Crossed price: `€1.288` — `text-lg text-white/40 line-through`
4. Savings badge: "Salvezi 7,76%" — `bg-green-500/10 text-green-400 rounded-full`
5. Divider: `hr border-white/10 my-6`
6. Rate option: "sau 2 × €644 în rate" — `text-white/60 text-sm`
7. Features list (3 items with checkmark SVGs):
   - "Acces nelimitat la întâlnirile live și la înregistrări"
   - "Singurul curs de manifestare conștientă de care vei avea nevoie"
   - "Garanția clarității"
8. **CTA:** "Cumpără acum →" → `/checkout?product=COURSE&type=full`
   - `bg-[#a007dc], text-white, w-full, py-4, rounded-xl, font-semibold, text-lg`
9. Urgency note: "Doar 15 locuri per ediție" with ping dot — `text-white/50 text-sm`

**Responsive (< 768px):** Single column, benefits first, pricing card below.

---

## Section 4: Testimonials

**Background:** Gradient `linear-gradient(180deg, #e8c2ff, white)`, padding `90px 30px`.

**Heading:** "Ce spun cursanții mei" — gradient text `#51087e→#8f0edf`
**Subtitle:** "Vieți schimbate și transformări reale."

**3 testimonial cards** in `grid-cols-3` (gap `30px`):

Each card: `bg-white, rounded-2xl, p-8, shadow-sm, border border-[#a007dc]/10`
- Decorative quote mark: `absolute -top-3 left-6, text-4xl, text-[#a007dc]/30, font-serif`
- 5 amber stars row
- Quote text: italic, `text-[#51087e]/80, text-sm`
- Divider + avatar (gradient circle `from-[#a007dc] to-[#e0b0ff]` with initial) + name + role

**Data:**
1. Roxana — "Eva, te iubesc! Dacă ai ști cât de mult s-a schimbat tot..."
2. Loredana — "Singurul curs care te scoate din întuneric este A.D.O.!..."
3. Elena — "Am învățat că totul pleacă de la mine..."

**Link:** "Vezi toate studiile de caz →" — `text-[#a007dc] font-semibold`

**Responsive (< 768px):** Single column stack.

---

## Section 5: Cross-sell — Other Products

**Background:** Gradient `linear-gradient(180deg, white, #e8c2ff)`, padding `90px 30px`.

**Heading:** "Explorează și alte resurse" — gradient text
**Subtitle:** "Ghiduri digitale și sesiuni individuale pentru transformarea ta."

**Layout:** 2-column grid (`2fr 1fr`, gap `40px`).

### Left — Guides

**3 mini guide cards** in vertical stack (gap `16px`):
Each card: `bg-white, rounded-2xl, p-5, shadow-sm, border border-[#a007dc]/10`, flex row (image left + content right).
- Image: guide cover, `w-20 h-28 object-cover rounded-xl`
- Title: `text-lg font-bold text-[#51087e]`
- Price: `€99` in `text-[#a007dc] font-bold`
- CTA: "Cumpără →" link to `/checkout?product=GUIDE&id={id}`

**Bundle card** below guides:
- `bg-[#51087e], rounded-2xl, p-6`
- Title: "Pachet Complet — toate ghidurile"
- Price: `€82.50` + `€110` crossed + badge "25% reducere"
- CTA: "Cumpără Pachetul →" → checkout

### Right — Sedinte 1:1

**Large card:** Same style as current homepage service card.
- Background image `IMG_6167-min_1.jpeg` with gradient overlay
- Title: "Ședințe individuale"
- Description: "Îndrumare adaptată nevoilor tale"
- CTA: "Programează o ședință →" → `/sedinte-1-la-1`

**Responsive (< 768px):** Single column, guides first, sedinte below.

---

## Section 6: Final CTA

**Background:** Same as current — `IMG_6166-min_1.avif` with gradient overlays:
`linear-gradient(rgba(81,8,126,0.4), rgba(81,8,126,0.4)), linear-gradient(transparent, #51087e), url(...)`
Padding `100px 30px`, text centered.

**Content:**
1. Heading: "Ești gata să trăiești o altă realitate?" — gradient text white
2. Pricing repeat: "Cursul A.D.O. — €1.188 (sau 2 × €644)" — `text-white/70 text-lg`
3. **Primary CTA:** "Înscrie-te acum →" → `/checkout?product=COURSE&type=full`
   - `bg-white, color: #51087e, rounded-full, px-10 py-4, font-semibold, text-xl`
4. **Secondary CTA:** "Explorează ghidurile →" → `/ghiduri`
   - `border: 1px solid white, bg: transparent, color: white, rounded-full`

---

## Data Sources

- Course pricing constants: already defined in `src/app/cursul-ado/page.tsx` — extract to shared constants
- Guide data: fetched from Prisma (existing `getGuides()` in ghiduri page)
- Testimonials: hardcoded array (existing pattern)
- Active edition / enrollment: `getCourseWithEditions('cursul-ado')` from `@/services/course`

## Components Reused

- `<Navbar />` — as-is
- `<Footer />` — as-is
- `<Section />` — for sections with standard gradients
- `<Badge />` — for pills and badges
- `StarSVG` — keep existing star component

## Files Changed

- `src/app/page.tsx` — full rewrite (same file)
- No new components needed — everything is page-level JSX following existing patterns
