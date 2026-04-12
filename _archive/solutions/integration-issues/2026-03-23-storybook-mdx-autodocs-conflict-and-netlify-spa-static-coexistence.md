---
title: "Storybook MDX + autodocs conflicts, and Netlify SPA + static file coexistence"
category: integration-issues
date: 2026-03-23
tags: [storybook, mdx, autodocs, netlify, deployment, vite, tailwind]
modules: [.storybook/, design-system/src/forms/, netlify.toml, vite.config.js]
severity: medium
---

## Problem 1: Storybook MDX + autodocs conflict

After merging vic-main's Storybook docs upgrade (47 new MDX files), the Storybook build failed with:
> "You created a component docs page for 'Forms/Input', but also tagged the CSF file with 'autodocs'. This is probably a mistake."

Additionally, Input.mdx and Select.mdx referenced story exports (`Content`, `Styles`, `Sizes`, `InteractionStates`) that didn't exist in the stories files, causing `of={undefined}` runtime errors.

### Root Cause

The vic-main branch added MDX docs and converted most stories to use `tags: ['!dev']` (hide from sidebar, docs live on MDX). But Input.stories.jsx and Select.stories.jsx were merge-conflict files that kept the old `tags: ['autodocs']` and the old `Overview`-only export pattern instead of the new segmented exports.

### Solution

1. Changed `tags: ['autodocs']` → `tags: ['!dev']` in both Input.stories.jsx and Select.stories.jsx
2. Updated Input.mdx and Select.mdx to replace broken `<Canvas of={...Stories.Content}>` blocks with inline `DocsDemoBlock` components using the actual component imports — matching the pattern used by other fixed MDX files

**Pattern for fixing future MDX/stories mismatches:**
```mdx
{/* Instead of referencing a non-existent story export: */}
<Canvas of={InputStories.Content} />

{/* Use inline demo with DocsDemoBlock: */}
<DocsDemoBlock description="Default input with label and placeholder.">
  <Input id="demo" label="Email" placeholder="Enter email" />
</DocsDemoBlock>
```

---

## Problem 2: Netlify SPA catch-all blocks Storybook static files

The deployed Storybook at `/storybook/` returned the React SPA's `index.html` instead of Storybook's own `index.html` because netlify.toml had a single `/* → /index.html` redirect.

### Root Cause

Netlify processes redirects in order. The SPA catch-all `from = "/*"` matched `/storybook/*` before the static files could be served.

### Solution

Add a passthrough redirect BEFORE the SPA catch-all:

```toml
# Storybook static files — serve as-is (MUST come before SPA catch-all)
[[redirects]]
  from = "/storybook/*"
  to = "/storybook/:splat"
  status = 200

# SPA catch-all for the React app
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Also set `VITE_STORYBOOK_URL` in `[build.environment]` so the FAB nav and StorybookEmbed components link to the correct URL in production.

---

## Problem 3: Tailwind vite plugin breaks non-Storybook build

The vic-main merge added `import tailwindcss from '@tailwindcss/vite'` as a hard import in vite.config.js. The main app doesn't use Tailwind (only Storybook docs do), so the build failed when `@tailwindcss/vite` wasn't installed.

### Solution

Made the import conditional, matching the existing pattern for vitest plugins:

```js
let tailwindcss;
try {
  tailwindcss = require('@tailwindcss/vite').default;
} catch (e) {
  tailwindcss = null;
}

// In plugins array:
plugins: [tailwindcss ? tailwindcss() : null, react()].filter(Boolean),
```

## Prevention

- When merging branches that add MDX docs, always check for `autodocs` tags in the corresponding stories files — they conflict with explicit MDX
- Netlify redirect ordering matters: specific paths before catch-alls
- Optional build dependencies should use try/catch imports, not hard imports
- After merging a large Storybook branch, always run `npm run build-storybook` before deploying
