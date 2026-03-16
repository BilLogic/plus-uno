/**
 * ViewToggleVariations.stories.jsx
 *
 * ITERATION MODE — 4 structural variations for the Card/List view toggle
 * on the Training → Onboarding page.
 *
 * All variations:
 *   • Reuse only PLUS DS components (Button, ButtonGroup, NavTabs, NavPills)
 *   • Preserve linear onboarding logic and progress visibility
 *   • Share identical content (same steps, same two views)
 *   • Differ ONLY in toggle placement and component style
 *
 * ─── PLUS DS Components Used ──────────────────────────────────────────────────
 *   T1 → ButtonGroup + Button (icon-only)       → top-right of section header
 *   T2 → ButtonGroup + Button (labeled + icon)  → full-width strip under hero
 *   T3 → NavTabs (underline)                    → inline, replaces section heading
 *   T4 → NavPills (pill)                        → inside hero, beside progress bar
 */

import React from 'react';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';
import T1_TopRightIconButtons from './T1_TopRightIconButtons';
import T2_UnderHeroSegmented from './T2_UnderHeroSegmented';
import T3_InlineNavTabs from './T3_InlineNavTabs';
import T4_NavPillsUnderProgress from './T4_NavPillsUnderProgress';

export default {
    title: 'Playground/Ashley/Training Onboarding/View Toggle Variations',
    tags: ['autodocs'],
    decorators: [
        (Story, context) => (
            <ResponsiveFrame breakpoint={context.args?.breakpoint || 'xl'}>
                <Story />
            </ResponsiveFrame>
        ),
    ],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: `## View Toggle — Structural Placement Variations

> **4 structural alternatives for the Card ↔ List view toggle.**
> Same content, same two views, same PLUS DS components. Structural placement and component choice differ.

---

### What's being toggled?

| View | Layout | Purpose |
|---|---|---|
| **List / Guided Path** | Linear stepper rows | Journey-first; follows onboarding sequence |
| **Card / Gallery** | Grid of OnboardingModuleCards | Browse-first; see all at once |

---

### Toggle Comparison

| | T1 Icon Buttons | T2 Segmented Under Hero | T3 Nav Tabs | T4 Nav Pills in Hero |
|---|---|---|---|---|
| **PLUS DS Component** | ButtonGroup + Button | ButtonGroup + Button | NavTabs | NavPills |
| **Placement** | Top-right of section header | Strip between hero + content | Inline, replaces section title | Inside hero, beside progress |
| **Label?** | ❌ Icon only | ✅ Icon + text | ✅ Text tab | ⚠️ Short text ("Path"/"Cards") |
| **Vertical space cost** | None | High (full strip) | None | None |
| **Cognitive weight** | Low (familiar) | Medium (explicit decision) | Low (tab convention) | Low |
| **Discovery** | Low (small) | High (prominent) | High (universal) | Medium |
| **Default view** | List | List | List (first tab) | List (first pill) |

---

### UX Principles Maintained (from Consulting Mode)
- **P1 Progress Visibility**: Progress bar present in all headers
- **P2 One Decision**: CTA always exists in list view; card view is secondary
- **P3 Structure Before Content**: Linear path is always the default tab/button

---

### Constraint: PLUS DS Components Used
- \`ButtonGroup\` + \`Button\` → T1 (icon-only), T2 (labeled)
- \`NavTabs\` → T3 underline pattern
- \`NavPills\` → T4 pill pattern
- \`OnboardingModuleCard\` → card view body
- \`PageLayout\` → all variations`,
            },
        },
    },
    argTypes: {
        breakpoint: {
            control: { type: 'select' },
            options: ['md', 'lg', 'xl'],
            table: { category: 'Responsive' },
        },
        userName: {
            control: 'text',
            table: { category: 'Content' },
        },
        defaultView: {
            control: { type: 'radio' },
            options: ['list', 'card'],
            description: 'Which view is selected on first render',
            table: { category: 'Toggle State' },
        },
    },
};

// ─── Decision Guide ───────────────────────────────────────────────────────────

export const ToggleDecisionGuide = {
    name: '📋 Toggle Decision Guide',
    render: () => (
        <div style={{ padding: '32px', maxWidth: '960px' }}>
            <h2 className="h2" style={{ marginBottom: '8px' }}>View Toggle — Decision Guide</h2>
            <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '32px' }}>
                4 placements and component styles for the Card ↔ List toggle. Each reuses PLUS DS components.
            </p>

            {[
                {
                    id: 'T1',
                    name: 'Top-Right Icon Buttons',
                    emoji: '🔳',
                    component: 'ButtonGroup + Button (icon-only, size="small")',
                    placement: 'Top-right of section header — header row: [title] [toggle]',
                    default: 'List — first-time landing should default to guided path',
                    strengths: [
                        'Zero vertical space cost — lives in the existing header row',
                        'Familiar view-switching metaphor (file explorer, photo library)',
                        'ButtonGroup gives a connected "one control" affordance',
                        'Stays out of the way for users who never switch views',
                    ],
                    tradeoffs: [
                        'No labels — tutors may not know what ⊞ and ☰ mean on first visit',
                        'Small click targets — touch accessibility concern',
                        'Spatially distant from content it controls (top-right → bottom content)',
                        'Not discoverable without prior experience with icon toggles',
                    ],
                    bestFor: 'Returning tutors, experienced product users, or contexts where analytics confirm low toggle usage after first visit.',
                },
                {
                    id: 'T2',
                    name: 'Labeled Segmented Control Under Hero',
                    emoji: '⬜',
                    component: 'ButtonGroup + Button (leading icon + text, size="medium")',
                    placement: 'Full-width strip between the hero block and content section',
                    default: 'List ("Guided Path") — label makes rationale self-evident',
                    strengths: [
                        '"Guided Path" vs "Browse All" fully explains the two modes',
                        'Strip placement acts as a structural gateway between orient and act zones',
                        'Labels + icons serve both fast-recognition and literacy-based users',
                        'Hint text can contextually explain the recommended mode',
                    ],
                    tradeoffs: [
                        'Highest vertical space cost — full strip row added to the page',
                        '"Browse All" may invite exploration that disrupts linear onboarding',
                        'At mobile widths, buttons may stack or truncate label text',
                        'Feels heavy as a secondary control (large buttons for a display toggle)',
                    ],
                    bestFor: 'First-time users or products where the two views have genuinely different workflows (new tutor path vs experienced tutor library).',
                },
                {
                    id: 'T3',
                    name: 'Inline NavTabs',
                    emoji: '📑',
                    component: 'NavTabs + NavTabs.Item (underline pattern from PLUS DS)',
                    placement: 'Inline within the section — tab bar replaces the section h2 heading',
                    default: 'List ("Step by Step") — first tab = recommended = default convention',
                    strengths: [
                        'Most universal toggle pattern — zero learning curve',
                        'Cannot have simpler spatial cost: replaces, not adds, the section heading',
                        'NavTabs built-in keyboard navigation (tab/arrow key support from RB)',
                        '"Step by Step" label actively reinforces the guided journey metaphor',
                    ],
                    tradeoffs: [
                        'Tabs imply equal-weight alternatives — may undermine "List is recommended"',
                        '"All Modules" tab visible = invitation to deviate from linear path',
                        'Tab pattern is associated with content sections, not view density toggle',
                        'Content area starts immediately below underline — might feel abrupt',
                    ],
                    bestFor: 'Products where the same page is used by both new tutors (list) and experienced tutors (cards) in equal measure, OR where consistency with NavTabs on adjacent pages is a priority.',
                },
                {
                    id: 'T4',
                    name: 'NavPills Adjacent to Progress Bar',
                    emoji: '💊',
                    component: 'NavPills + NavPills.Item (pill pattern from PLUS DS)',
                    placement: 'Inside hero block — same row as the progress bar (right of bar)',
                    default: 'List ("Path") — left pill = first = default convention',
                    strengths: [
                        'Contextually co-located: progress and view preference are both "how you see your journey"',
                        'Pills are compact — does not add vertical stack to the hero block',
                        'Section header stays clean — no toggle controls in the content area',
                        'NavPills are visually distinct from action Buttons (no accidental clicks)',
                    ],
                    tradeoffs: [
                        'Control is physically far from the content it controls (hero → content)',
                        '"Path" and "Cards" labels are terse — may confuse unfamiliar tutors',
                        'Hero block becomes denser, risking visual crowding as the product evolves',
                        'Pills alongside a progress bar create visual competition in the hero zone',
                    ],
                    bestFor: 'View preference as a "set and forget" setting (users choose once on landing, rarely switch). Best when research confirms low toggle frequency after session 1.',
                },
            ].map((v) => (
                <section key={v.id} style={{ marginBottom: '36px', paddingBottom: '36px', borderBottom: '1px solid var(--color-outline-variant)' }}>
                    <h3 className="h4" style={{ marginBottom: '4px' }}>{v.emoji} {v.id} — {v.name}</h3>
                    <p className="body3-txt" style={{ color: 'var(--color-primary)', fontWeight: 600, marginBottom: '4px' }}>
                        DS Component: <code>{v.component}</code>
                    </p>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '4px' }}>
                        Placement: {v.placement}
                    </p>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '16px' }}>
                        Default view: <strong>{v.default}</strong>
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                        <div>
                            <p className="body3-txt" style={{ fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>UX Strengths</p>
                            <ul className="body2-txt" style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {v.strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                        <div>
                            <p className="body3-txt" style={{ fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tradeoffs</p>
                            <ul className="body2-txt" style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {v.tradeoffs.map((t, i) => <li key={i}>{t}</li>)}
                            </ul>
                        </div>
                    </div>

                    <p className="body2-txt" style={{ marginBottom: 0 }}>
                        <strong>Best for:</strong> {v.bestFor}
                    </p>
                </section>
            ))}
        </div>
    ),
};

// ─── T1: Top-Right Icon Buttons ───────────────────────────────────────────────

export const T1_IconButtons = {
    name: '🔳 T1 — Top-Right Icon Buttons',
    args: { breakpoint: 'xl', userName: 'Ashley', defaultView: 'list' },
    parameters: {
        docs: {
            description: {
                story: `**PLUS DS:** \`ButtonGroup\` + \`Button\` (icon-only, size="small")
**Placement:** Top-right of section header — title on left, connected icon buttons on right

- Active view: \`fill="tonal"\`, \`active={true}\`
- Inactive view: \`fill="ghost"\`
- default: **List** (stepper path)

*Interaction:* Toggle between icon states. The detail panel below updates instantly. ButtonGroup provides the "one connected control" affordance.`,
            },
        },
    },
    render: (args) => (
        <T1_TopRightIconButtons
            userName={args.userName}
            defaultView={args.defaultView}
        />
    ),
};

// ─── T2: Under-Hero Segmented ─────────────────────────────────────────────────

export const T2_Segmented = {
    name: '⬜ T2 — Labeled Segmented Under Hero',
    args: { breakpoint: 'xl', userName: 'Ashley', defaultView: 'list' },
    parameters: {
        docs: {
            description: {
                story: `**PLUS DS:** \`ButtonGroup\` + \`Button\` (icon + text label, size="medium")
**Placement:** Full-width strip between hero block and content section

- "Guided Path" = list (default), "Browse All" = card view
- Active: \`fill="tonal"\`, \`style="primary"\`
- Inactive: \`fill="outline"\`, \`style="default"\`
- Hint text updates contextually based on active mode

*Key decision:* The label naming encodes the rationale — "Guided Path" communicates sequential, structured intent.`,
            },
        },
    },
    render: (args) => (
        <T2_UnderHeroSegmented
            userName={args.userName}
            defaultView={args.defaultView}
        />
    ),
};

// ─── T3: Inline NavTabs ───────────────────────────────────────────────────────

export const T3_Tabs = {
    name: '📑 T3 — Inline NavTabs (Underline)',
    args: { breakpoint: 'xl', userName: 'Ashley', defaultView: 'list' },
    parameters: {
        docs: {
            description: {
                story: `**PLUS DS:** \`NavTabs\` + \`NavTabs.Item\` (underline pattern)
**Placement:** Inline within section — the tab bar replaces the section \`h2\` heading

- "Step by Step" = list (default, first tab)
- "All Modules" = card view
- Tab keyboard navigation inherited from React-Bootstrap Nav

*Key decision:* Tabs are the most universal view switcher pattern. But the "equal weight" tab metaphor slightly flattens the hierarchy between guided path (recommended) and browse-all (optional).`,
            },
        },
    },
    render: (args) => (
        <T3_InlineNavTabs
            userName={args.userName}
            defaultView={args.defaultView}
        />
    ),
};

// ─── T4: NavPills in Hero ─────────────────────────────────────────────────────

export const T4_Pills = {
    name: '💊 T4 — NavPills in Hero (beside progress)',
    args: { breakpoint: 'xl', userName: 'Ashley', defaultView: 'list' },
    parameters: {
        docs: {
            description: {
                story: `**PLUS DS:** \`NavPills\` + \`NavPills.Item\` (pill pattern)
**Placement:** Inside hero block — same flex row as progress bar (right side)

- "Path" = list (default, left pill)
- "Cards" = card view
- Section header below is clean — no controls at the content level

*Key decision:* Co-locating the toggle with the progress bar creates a contextual grouping: "how you track" and "how you see" are both orientation tools. But the control is spatially distant from the content it changes.`,
            },
        },
    },
    render: (args) => (
        <T4_NavPillsUnderProgress
            userName={args.userName}
            defaultView={args.defaultView}
        />
    ),
};
