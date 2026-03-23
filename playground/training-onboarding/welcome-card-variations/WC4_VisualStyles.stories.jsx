/**
 * WC4_VisualStyles.stories.jsx
 *
 * ITERATION MODE — Visual Style Exploration for WC4 Hero + Bubble Track
 *
 * Same two-row layout (hero band + milestone bubble track) across all variants.
 * Only the hero's visual treatment changes — no structural or content differences.
 * Every colour is a PLUS Design System token; no raw hex values introduced.
 *
 * ─── Variants ─────────────────────────────────────────────────────────────────
 *   default        — Dark brand gradient (baseline WC4)
 *   soft-gradient  — Light primary-container → surface gradient
 *   flat-container — Solid primary-container fill, no depth
 *   dark-inverse   — Near-black inverse-surface; white text
 *   accent-border  — Light surface-container-low + 4px primary left border
 *   elevated-light — White + primary top accent strip + elevation shadow
 */

import React from 'react';
import WC4_Styled from './WC4_Styled';

const LABEL_STYLE = {
    fontFamily: 'inherit',
    fontSize: '0.65rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#3f484a',
    marginBottom: 8,
    marginTop: 0,
};

const META_STYLE = {
    fontSize: '0.72rem',
    color: '#3f484a',
    marginBottom: 12,
    display: 'flex',
    gap: 24,
    flexWrap: 'wrap',
};

const CARD_WRAP = { maxWidth: 1100, margin: '0 auto' };

const VARIANTS = [
    {
        id: 'default',
        label: 'Default — Dark Brand Gradient',
        mood: 'Bold, immersive, motivating',
        tokens: '--color-primary → #004d75 diagonal gradient',
        heroType: 'dark',
    },
    {
        id: 'soft-gradient',
        label: 'VS1 — Soft Gradient',
        mood: 'Airy, accessible, welcoming',
        tokens: '--color-primary-container → --color-surface gradient',
        heroType: 'light',
    },
    {
        id: 'flat-container',
        label: 'VS2 — Flat Container',
        mood: 'Calm, friendly, no depth',
        tokens: '--color-primary-container solid fill',
        heroType: 'light',
    },
    {
        id: 'dark-inverse',
        label: 'VS3 — Dark Inverse',
        mood: 'Premium, focused, serious',
        tokens: '--color-inverse-surface + --color-inverse-primary ring',
        heroType: 'dark',
    },
    {
        id: 'accent-border',
        label: 'VS4 — Left Accent Border',
        mood: 'Minimal, editorial, open',
        tokens: '--color-surface-container-low + 4px --color-primary left border',
        heroType: 'light',
    },
    {
        id: 'elevated-light',
        label: 'VS5 — Elevated Light',
        mood: 'Polished, card-on-page, clean',
        tokens: '--color-surface + 4px --color-primary top accent + elevation shadow',
        heroType: 'light',
    },
];

// ─── Story config ─────────────────────────────────────────────────────────────

export default {
    title: 'Playground/Ashley/Training Onboarding/WC4 Visual Style Exploration',
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: `## WC4 — Visual Style Exploration

> **Iteration Mode** — 5 visual treatments applied to the Hero + Bubble Track layout.
> Identical two-row structure (hero band + milestone track), identical 6-module data.
> Only the hero zone's visual skin changes. All colours are PLUS Design System tokens.

---

### Design intent per variant

| Variant | Hero treatment | Mood |
|---|---|---|
| **Default** | \`--color-primary\` dark gradient | Bold, branded, motivating |
| **VS1 Soft Gradient** | \`--color-primary-container → --color-surface\` | Airy, accessible, welcoming |
| **VS2 Flat Container** | \`--color-primary-container\` solid | Calm, friendly, no depth |
| **VS3 Dark Inverse** | \`--color-inverse-surface\` | Premium, focused, serious |
| **VS4 Accent Border** | \`--color-surface-container-low\` + left border | Minimal, editorial, open |
| **VS5 Elevated Light** | \`--color-surface\` + top accent + shadow | Polished, card-on-page |

---

### What to look for
- How the **ring** adapts: white stroke on dark heroes → primary stroke on light heroes
- How the **CTA button** switches: \`secondary\` (outlined, white) on dark → \`primary\` (filled, blue) on light
- How the **bubble track** relates to each hero treatment
- Which moods feel appropriate for a **first-time tutor onboarding** flow
`,
            },
        },
    },
};

// ─── All variants stacked ─────────────────────────────────────────────────────

export const AllVisualStyles = {
    name: 'All Visual Styles',
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48, padding: '24px 0', ...CARD_WRAP }}>
            {VARIANTS.map(({ id, label, mood, tokens }) => (
                <div key={id}>
                    <p style={LABEL_STYLE}>{label}</p>
                    <div style={META_STYLE}>
                        <span>🎨 <strong>Mood:</strong> {mood}</span>
                        <span>🔑 <strong>Tokens:</strong> {tokens}</span>
                    </div>
                    <WC4_Styled variant={id} />
                </div>
            ))}
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'All 6 visual style variants (default + VS1–VS5) stacked for direct side-by-side comparison. Same mock data and layout — only hero treatment differs.',
            },
        },
    },
};

// ─── Individual stories ───────────────────────────────────────────────────────

export const DefaultVariant = {
    name: 'Default — Dark Brand Gradient',
    render: () => <div style={CARD_WRAP}><WC4_Styled variant="default" /></div>,
    parameters: {
        docs: {
            description: {
                story: '**Baseline.** Dark `--color-primary → #004d75` diagonal gradient. White text, white SVG ring, secondary outlined button. The original WC4 treatment.',
            },
        },
    },
};

export const SoftGradient = {
    name: 'VS1 — Soft Gradient',
    render: () => <div style={CARD_WRAP}><WC4_Styled variant="soft-gradient" /></div>,
    parameters: {
        docs: {
            description: {
                story: '**Light gradient.** `--color-primary-container → --color-surface` fade. Most approachable and accessible — primary text on a near-white canvas.',
            },
        },
    },
};

export const FlatContainer = {
    name: 'VS2 — Flat Container',
    render: () => <div style={CARD_WRAP}><WC4_Styled variant="flat-container" /></div>,
    parameters: {
        docs: {
            description: {
                story: '**Solid container fill.** `--color-primary-container` — no gradient, no depth. Calm and familiar; the same token already used for "in progress" row highlights.',
            },
        },
    },
};

export const DarkInverse = {
    name: 'VS3 — Dark Inverse',
    render: () => <div style={CARD_WRAP}><WC4_Styled variant="dark-inverse" /></div>,
    parameters: {
        docs: {
            description: {
                story: '**Inverse surface.** `--color-inverse-surface` (near-black) with `--color-inverse-primary` accent ring. More neutral dark than the brand gradient — premium and focused.',
            },
        },
    },
};

export const AccentBorder = {
    name: 'VS4 — Left Accent Border',
    render: () => <div style={CARD_WRAP}><WC4_Styled variant="accent-border" /></div>,
    parameters: {
        docs: {
            description: {
                story: '**Minimal accent.** `--color-surface-container-low` background + 4px `--color-primary` left border. Light and editorial — the accent anchors the brand without a full background fill.',
            },
        },
    },
};

export const ElevatedLight = {
    name: 'VS5 — Elevated Light',
    render: () => <div style={CARD_WRAP}><WC4_Styled variant="elevated-light" /></div>,
    parameters: {
        docs: {
            description: {
                story: '**Elevated surface.** White `--color-surface` with a 4px `--color-primary` top accent strip and subtle box-shadow. The card "floats" on the page — polished, clean, Notion-style.',
            },
        },
    },
};
