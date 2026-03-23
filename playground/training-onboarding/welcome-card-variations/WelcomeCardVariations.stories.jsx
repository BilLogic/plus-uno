/**
 * WelcomeCardVariations.stories.jsx
 *
 * ITERATION MODE — 5 distinctly different welcome card designs
 * Each card replaces the current ProgressHeader + NextStepBanner in TrainingOnboardingHiFi.
 *
 * All 5 cards:
 *   • Use identical 6-module mock data (welcome-shared.js)
 *   • Are desktop-first (optimised for ≥960px)
 *   • Include milestone steps as part of the card — not below it
 *   • Target first-timer tutors completing onboarding
 *
 * ─── Variations ───────────────────────────────────────────────────────────────
 *   WC1 — Horizontal Stepper Strip    Greeting + bar + 6 connected milestone bubbles
 *   WC2 — Two-Zone Checklist          Ring stat header + full checklist below divider
 *   WC3 — Split Column                Brand-tinted left (CTA) + stepper right (path)
 *   WC4 — Hero + Bubble Track         Dark gradient hero + large track bubbles below
 *   WC5 — Compact + Expandable Drawer Tight always-visible bar + collapsible step list
 */

import React from 'react';
import WC1_HorizontalStepper from './WC1_HorizontalStepper';
import WC2_TwoZoneChecklist from './WC2_TwoZoneChecklist';
import WC3_SplitColumn from './WC3_SplitColumn';
import WC4_HeroBubbleTrack from './WC4_HeroBubbleTrack';
import WC5_CompactDrawer from './WC5_CompactDrawer';

const LABEL_STYLE = {
    fontFamily: 'inherit',
    fontSize: '0.65rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#3f484a',
    marginBottom: 10,
    marginTop: 0,
};

const CARD_WRAP = {
    maxWidth: 1100,
    margin: '0 auto',
};

const VARIATION_META = [
    {
        id: 'WC1',
        label: 'WC1 — Horizontal Stepper Strip',
        optimises: 'Spatial journey overview — see all 6 steps at a glance',
        compromises: 'Low per-step info density; truncates on <900px',
        bestFor: 'First-timers asking "how long is this?"',
        component: WC1_HorizontalStepper,
    },
    {
        id: 'WC2',
        label: 'WC2 — Two-Zone Checklist',
        optimises: 'Completeness and transparency — every module visible with status',
        compromises: 'Tallest card; row scanning is slower than spatial scanning',
        bestFor: 'Users who want full scope before they start',
        component: WC2_TwoZoneChecklist,
    },
    {
        id: 'WC3',
        label: 'WC3 — Split Column',
        optimises: 'Equal weight to CTA (left) and journey map (right)',
        compromises: 'Needs ≥960px; two things to process simultaneously',
        bestFor: 'First-timers who need motivation + orientation in one view',
        component: WC3_SplitColumn,
    },
    {
        id: 'WC4',
        label: 'WC4 — Hero + Bubble Track',
        optimises: 'Emotional engagement and immediate CTA — most motivating',
        compromises: 'Largest footprint; dark hero may feel heavy',
        bestFor: 'Driving the very first click from a brand-new tutor',
        component: WC4_HeroBubbleTrack,
    },
    {
        id: 'WC5',
        label: 'WC5 — Compact + Expandable Drawer',
        optimises: 'Minimal footprint — keeps module grid above the fold',
        compromises: 'Steps hidden by default; extra click for first-timers',
        bestFor: 'Pages where the card should orient without dominating',
        component: WC5_CompactDrawer,
    },
];

// ─── Story config ──────────────────────────────────────────────────────────────

export default {
    title: 'Playground/Ashley/Training Onboarding/Welcome Card Variations',
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: `## Welcome Card — 5 Iteration Variations

> **Iteration Mode** — 5 distinctly different card designs replacing the current ProgressHeader + NextStepBanner.
> Same content, different layout logic. Desktop-first. Designed for first-timer tutors.

---

### What's being redesigned
The current card ("Welcome back, Ashley" + progress bar + separate teal "Next Up" banner below) has been
redesigned in 5 directions that **integrate milestone steps directly into the card**.

---

### Variation Comparison

| | Layout | Optimises | Compromises |
|---|---|---|---|
| **WC1** | Horizontal stepper strip | Spatial overview | Low per-step density |
| **WC2** | Two-zone checklist | Full transparency | Tallest card |
| **WC3** | Split column | CTA + path equally | Requires wide viewport |
| **WC4** | Hero + bubble track | Motivation + first click | Largest footprint |
| **WC5** | Compact + drawer | Minimal height | Steps hidden by default |

---

### Recommendation for first-timer tutors

**WC4** if emotional engagement and first-click conversion matter most.
**WC3** if equal-weight orientation and CTA is the priority.
**WC1** if the card needs to stay compact but always show the full journey.
`,
            },
        },
    },
};

// ─── All 5 in one story ────────────────────────────────────────────────────────

export const AllVariations = {
    name: 'All Variations',
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, padding: '24px 0', ...CARD_WRAP }}>
            {VARIATION_META.map(({ id, label, optimises, compromises, bestFor, component: Comp }) => (
                <div key={id}>
                    <p style={LABEL_STYLE}>{label}</p>
                    <div style={{ fontSize: '0.72rem', color: '#3f484a', marginBottom: 10, display: 'flex', gap: 24 }}>
                        <span>✅ <strong>Optimises:</strong> {optimises}</span>
                        <span>⚠️ <strong>Compromises:</strong> {compromises}</span>
                        <span>🎯 <strong>Best for:</strong> {bestFor}</span>
                    </div>
                    <Comp />
                </div>
            ))}
        </div>
    ),
    parameters: {
        docs: {
            description: {
                story: 'All 5 welcome card variations stacked for side-by-side comparison. Same mock data across all.',
            },
        },
    },
};

// ─── Individual stories ────────────────────────────────────────────────────────

export const WC1 = {
    name: 'WC1 — Horizontal Stepper Strip',
    render: () => <div style={CARD_WRAP}><WC1_HorizontalStepper /></div>,
    parameters: {
        docs: {
            description: {
                story: '**Stacked layout.** Greeting → progress bar → 6 connected milestone bubbles. The entire journey is visible in one compact row. Desktop-first — step labels need ~90px each.',
            },
        },
    },
};

export const WC2 = {
    name: 'WC2 — Two-Zone Checklist',
    render: () => <div style={CARD_WRAP}><WC2_TwoZoneChecklist /></div>,
    parameters: {
        docs: {
            description: {
                story: '**Two-zone card.** Top zone has a greeting + SVG progress ring. Bottom zone lists all 6 modules as a checklist — status icon, title, duration, and an inline "Continue" CTA on the active row.',
            },
        },
    },
};

export const WC3 = {
    name: 'WC3 — Split Column',
    render: () => <div style={CARD_WRAP}><WC3_SplitColumn /></div>,
    parameters: {
        docs: {
            description: {
                story: '**Side-by-side columns.** Left panel (brand tinted): greeting + progress bar + "Next Up" card with CTA. Right panel: full vertical stepper showing all 6 milestones with status chips.',
            },
        },
    },
};

export const WC4 = {
    name: 'WC4 — Hero + Bubble Track',
    render: () => <div style={CARD_WRAP}><WC4_HeroBubbleTrack /></div>,
    parameters: {
        docs: {
            description: {
                story: '**Two-row hero.** Dark branded gradient hero with large greeting + animated SVG progress ring. Below: a white row of 6 large numbered bubble milestones connected by status-aware lines.',
            },
        },
    },
};

export const WC5 = {
    name: 'WC5 — Compact + Expandable Drawer',
    render: () => <div style={CARD_WRAP}><WC5_CompactDrawer /></div>,
    parameters: {
        docs: {
            description: {
                story: '**Minimal footprint.** A single-row bar shows greeting, slim progress bar, and CTA. A "View all N steps" toggle expands a milestone drawer inline — no navigation required.',
            },
        },
    },
};
