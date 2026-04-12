---
domain: preferences
type: preference
confidence: high
created: 2026-04-11
tags: [conventions, taste]
---

## FA Free only (no Pro icons)
- Use `fa-solid`, `fa-regular`, `fa-brands` only
- Never use `fa-light`, `fa-thin`, `fa-sharp`, `fa-duotone`, or Pro-only icon names (e.g., `fa-grid-2`)
- Brand icons (`fa-brands fa-notion`, `fa-brands fa-figma`) are included in FA Free
- CDN: use `cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.2.0` (not cdnjs.cloudflare.com which has wrong path for FA 7)

## Iframe over proxy for embedding external tools
- Storybook, external dashboards, and third-party tools should be embedded via iframe, not proxied through Vite
- Proxy approaches fail because external tool assets load at root paths that bypass subpath rewrites
- iframe gives native UX while keeping unified URL bar

## Vite not Next.js for prototypes
- plus-uno is a prototype builder and design system workspace, not a production app
- No auth, API routes, SSR, or server-side AI calls needed
- Production PLUS platform (if built) should be a separate Next.js app consuming the shared design system

## 4-digit numeric IDs not slugs
- Prototype listings use 4-digit IDs (1001+) for clean URLs and zero naming collisions
- Slug-based routing causes collisions when multiple contributors name things similarly

## Cheat sheet is law (mandatory before UI code)
- Before writing any React component from `@plus-ds` or applying any CSS token, read `docs/context/design-system/components/cheat-sheet.md`
- If it is not in the cheat sheet, it does not exist
- For page layouts, also read `docs/context/design-system/components/layout-cheat-sheet.md`

## Bootstrap-first (no Material UI, Ant Design, Tailwind)
- PLUS design system is built on React-Bootstrap / Bootstrap 5.3
- Use PLUS components first, fall back to generic React-Bootstrap when no PLUS equivalent exists
- Never introduce non-Bootstrap UI frameworks

## Sentence case for UI labels
- All UI labels, headings, button text, menu items, and navigation items use sentence case
- Example: "Session details" not "Session Details", "View all students" not "View All Students"
