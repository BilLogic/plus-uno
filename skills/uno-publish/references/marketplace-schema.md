# Marketplace Schema

Schema for entries in `src/pages/PrototypeMarket/prototypes-data.js`.

## Entry Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | `string` | Yes | Unique identifier. Use a numeric string (auto-increment from last entry). | `'1025'` |
| `title` | `string` | Yes | Short display name for the prototype card. | `'Student Onboarding Wizard'` |
| `description` | `string` | Yes | 1-2 sentence summary of what the prototype demonstrates. | `'Multi-step student onboarding wizard with baseline assessment and goal setting.'` |
| `deploymentUrl` | `string \| null` | Yes | Full URL to the deployed prototype on Netlify (or null if not deployed). | `'https://my-proto.netlify.app'` or `null` |
| `notionCardUrl` | `string \| null` | Yes | Link to the associated Notion card (or null if none). | `'https://www.notion.so/example-card-id'` or `null` |
| `notionCardId` | `string \| null` | Yes | Notion card identifier like `PLUS-42` (or null if none). | `'PLUS-42'` or `null` |
| `stage` | `'low' \| 'mid' \| 'high'` | Yes | Fidelity stage of the prototype. Must be one of the `STAGES` enum values. | `'mid'` |
| `lastUpdated` | `string` | Yes | Date in `YYYY-MM-DD` format. Auto-fill with today's date. | `'2026-03-23'` |
| `creators` | `string[]` | Yes | Array of creator names (who built it). | `['Bill']` |
| `contributors` | `string[]` | Yes | Array of contributor names. Defaults to same as creators. | `['Bill', 'Victor']` |
| `productPillar` | `string` | Yes | Product area. Must be one of `PRODUCT_PILLARS`: `admin`, `home`, `login`, `profile`, `toolkit`, `training`, `universal`. | `'home'` |
| `localPath` | `string \| null` | Yes | Route path in the root app (e.g., `'/1025'`). Null if not wired into root app router. | `'/1025'` or `null` |
| `repoPath` | `string` | Yes | Path to the prototype directory relative to repo root. Always ends with `/`. | `'playground/student-onboarding-wizard/'` |

## Enums

### STAGES
- `'low'` — Low-fidelity (wireframes, rough structure)
- `'mid'` — Mid-fidelity (styled, some interactions)
- `'high'` — High-fidelity (production-like, full interactions)

### PRODUCT_PILLARS
- `'admin'` — Admin dashboard and management views
- `'home'` — Student/tutor home dashboard
- `'login'` — Authentication and onboarding flows
- `'profile'` — User profile and settings
- `'toolkit'` — In-session tools and workflows
- `'training'` — Training modules and progress
- `'universal'` — Cross-cutting (navigation, layout, shared components)

## Stage Badge Styles

| Stage | Label | Badge Style |
|-------|-------|-------------|
| `low` | Low-fi | `warning` |
| `mid` | Mid-fi | `info` |
| `high` | High-fi | `success` |

## File Location

`src/pages/PrototypeMarket/prototypes-data.js`

Entries are appended to the `prototypes` array export.
