# Design Refactor Learnings

## Colors
- purple: #51087e (primary)
- magenta: #a007dc (secondary)  
- purple-dark: #2c0246 (gradient bottom)

## Container
maxWidth: 940px, width: 100%, margin: 0 auto

## Sections
- White to purple: linear-gradient(180deg, white, #e8c2ff), padding: 90px 30px
- Purple to white (alt): linear-gradient(180deg, #e8c2ff, white), padding: 90px 30px
- Hero dark: linear-gradient(#51087e, #a62bf1), padding: 120px 0

## Headings
- White gradient (dark bg): linear-gradient(90deg, white, #e0e0e0), WebkitTextFillColor: transparent
- Purple gradient (light bg): linear-gradient(90deg, #51087e, #8f0edf), WebkitTextFillColor: transparent

## Buttons
- Primary: bg #51087e, border #51087e, borderRadius 999px, color #f8f9fa
- Alt (white): bg white, border white, borderRadius 999px, color #51087e
- Outline light: bg transparent, border white, borderRadius 999px, color white

## Cards
- single-card: bg #51087e, borderRadius 40px, overflow hidden
- content-card bottom: linear-gradient(180deg, #51087e, #a007dc), padding 20px
- benefit card: bg rgba(81,8,126,0.15), borderRadius 20px, padding 30px

## Auth pages
- Layout already has gradient purple background
- Card: white, borderRadius 24px, padding 2.5rem, boxShadow 0 20px 60px rgba(81,8,126,0.3), maxWidth 440px

## Build Status
- Build passes after removing unused Navbar import from lesson page

## Completed Pages
- layout.tsx, globals.css, tailwind.config.ts
- Navbar.tsx, Button.tsx, Footer.tsx, Section.tsx
- (auth)/layout.tsx
- page.tsx (homepage)
- curs/[editionSlug]/page.tsx
- curs/[editionSlug]/lectia/[lessonSlug]/page.tsx

## Available Images in /public/images/
- IMG_7501.jpg (hero homepage)
- IMG_6176-min_1.avif (Cursul ADO card)
- IMG_6167-min_1.jpeg (Sedinte 1:1 card)
- IMG_6166-min_1.avif (CTA background)
- Cover-Servicii.jpg (servicii/sedinte hero)
- Untitled-design-1.jpg (Eva photo)
- poza-eva-hero.png (Eva avatar)
- Cine-manifesta.png, este-despre-mine.png, este-tot-despre-mine.png (guide covers)
