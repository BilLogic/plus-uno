/**
 * TrainingOnboardingVariations.stories.jsx
 *
 * ITERATION MODE — 4 structural layout variations for the Training Onboarding page.
 * All variations share identical content hierarchy from the Consulting Mode brief.
 *
 * Approved structure (from Consulting Mode):
 *   S1 — Welcome Header (orient + progress)
 *   S2 — Next Step CTA (primary action, above fold)
 *   S3 — Onboarding Path (sequential steps with status)
 *   S4 — Supplemental Resources (collapsed, optional)
 *
 * ─── Variations ───────────────────────────────────────────────────────────────
 *   V1 — Linear Stepper     Two-column: stepper nav left + detail panel right
 *   V2 — Dashboard Progress Metric tiles + hero CTA + compact path list
 *   V3 — Card Journey       Horizontal card pipeline + expandable detail below
 *   V4 — Checklist          Progress ring + checklist rows with inline CTA
 */

import React from 'react';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';
import V1_LinearStepper from './V1_LinearStepper';
import V2_DashboardProgress from './V2_DashboardProgress';
import V3_CardJourney from './V3_CardJourney';
import V4_ChecklistCompletion from './V4_ChecklistCompletion';
import { MOCK_STEPS, MOCK_SUPPLEMENTAL } from './shared';

// ─── Story config ─────────────────────────────────────────────────────────────

export default {
    title: 'Playground/Ashley/Training Onboarding/Variations',
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
                component: `## Training Onboarding — Layout Variations (Iteration Mode)

> **4 structural alternatives. Same content, different layout logic.**
> All variations preserve the approved consulting brief hierarchy. No visual design decisions made.

---

### Content Hierarchy (constant across all variations)
1. **Welcome Header** — Personalised greeting + progress indicator
2. **Next Step CTA** — Single primary action, above the fold
3. **Onboarding Path** — Sequential steps with status
4. **Supplemental Resources** — Collapsed, not primary

---

### Variation Comparison

| | V1 Linear Stepper | V2 Dashboard | V3 Card Journey | V4 Checklist |
|---|---|---|---|---|
| **Layout** | 2-col: nav + panel | Tiles + 2-zone | H-scroll cards + panel | Ring + list |
| **CTA Location** | Right detail panel | Hero block left | Bottom panel | Inline in row |
| **Progress Model** | Bar + node states | Stat tiles + bar | Card states | Ring + bar |
| **Cognitive Load** | Low | Medium | Medium | Lowest |
| **Best for** | Multi-session | Return users | Milestone feel | Action-oriented |
| **Screen fit** | Desktop-first | Desktop-first | Desktop/tablet | All sizes |

---

### UX Principles Applied (from Consulting Mode)
- **P1 — Progress Visibility**: Every variation exposes progress prominently
- **P2 — One Decision at a Time**: Each surfaces one primary CTA
- **P3 — Structure Before Content**: Path is always accessible but not primary

---

### What Was Removed (all variations)
- ❌ Featured Modules carousel
- ❌ All Modules table as default view
- ❌ Sort / filter controls
- ❌ Free browsing before path completion`,
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
    },
};

// ─── Comparison story (Docs) ──────────────────────────────────────────────────

export const VariationGuide = {
    name: '📋 Variation Guide',
    render: () => (
        <div style={{ padding: '32px', maxWidth: '900px' }}>
            <h2 className="h2" style={{ marginBottom: '8px' }}>Layout Variations — Iteration Mode</h2>
            <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '32px' }}>
                4 structural alternatives for the Training Onboarding page. Same hierarchy, different spatial logic.
            </p>

            {[
                {
                    id: 'V1',
                    name: 'Linear Stepper',
                    emoji: '↔️',
                    structure: 'Two-column split — vertical stepper nav on left, step detail panel on right',
                    strengths: [
                        'Progress embedded spatially — you see the path and current position at once',
                        'Right panel focus isolates one decision at a time (P2)',
                        'Familiar "wizard" pattern from enterprise onboarding flows',
                        'Clicking stepper nodes is a fast, low-effort navigation pattern',
                    ],
                    tradeoffs: [
                        'Requires wider viewport — collapses on tablet/mobile',
                        'Panel can feel sparse for short modules (low content density)',
                        'Hard to scan descriptions without selecting each step',
                    ],
                    bestFor: 'Desktop-first experiences with 5+ steps and per-step rich content. Multi-session onboarding where the tutor needs orientation re-entry.',
                },
                {
                    id: 'V2',
                    name: 'Dashboard Progress',
                    emoji: '📊',
                    structure: 'Metric stat tiles → hero CTA block (left) + compact path list (right)',
                    strengths: [
                        'Immediate orientation via at-a-glance stats (steps done, time left, status)',
                        'Motivating and achievement-oriented — progress feels measurable',
                        'Excellent for returning tutors who need quick re-orientation',
                        'Two-column lower zone is visually balanced and information-dense',
                    ],
                    tradeoffs: [
                        'Higher cognitive load on first load — more elements competing for attention',
                        'Stat tiles feel redundant for a short 5-step journey',
                        'Dashboard metaphor implies ongoing use, not one-time completion',
                        'Path summary list truncates on narrow screens',
                    ],
                    bestFor: 'Platforms emphasising progress metrics. Best when onboarding spans multiple sessions or the tutor returns mid-flow frequently.',
                },
                {
                    id: 'V3',
                    name: 'Card Journey',
                    emoji: '🃏',
                    structure: 'Horizontal step card pipeline → active card detail panel below',
                    strengths: [
                        'Cards give each step a distinct visual identity — tangible and achievable',
                        'Pipeline rhythm communicates "journey" metaphor naturally',
                        'Familiar mobile-first interaction: tap card → detail expands below',
                        'All step titles visible simultaneously — good for orientation',
                    ],
                    tradeoffs: [
                        'Horizontal scroll hides content on smaller viewports without cues',
                        'Card metaphor risks feeling like a content library if not constrained',
                        'Two-zone layout (cards + panel) splits attention slightly',
                        'Card size degrades badly above 6 steps',
                    ],
                    bestFor: 'Platforms wanting onboarding to feel engaging and milestone-based. Ideal for 4–6 steps with distinct per-step topics or icons.',
                },
                {
                    id: 'V4',
                    name: 'Checklist Completion',
                    emoji: '✅',
                    structure: 'Circular progress ring header → checklist rows with inline CTA on the active step',
                    strengths: [
                        'Checklist triggers a powerful completion instinct — extremely motivating',
                        'Inline CTA on the active row eliminates a navigation layer',
                        'Most compact layout — excellent on smaller screens',
                        'Familiar from task managers: Todoist, Notion, Asana',
                        'Progress ring is a satisfying visual anchor',
                    ],
                    tradeoffs: [
                        'Checklist pattern understates module depth (feels like tasks, not learning)',
                        'Step descriptions are compressed — less motivational framing',
                        'Inline CTA pattern may be unexpected (users expect a dedicated CTA zone)',
                        'Completed rows visually fade — discourages revisiting content',
                    ],
                    bestFor: 'Action-oriented tutors focused on completion velocity. Best when certification has a deadline and the total journey is under 60 mins.',
                },
            ].map((v) => (
                <section key={v.id} style={{ marginBottom: '36px', paddingBottom: '36px', borderBottom: '1px solid var(--color-outline-variant)' }}>
                    <h3 className="h4" style={{ marginBottom: '8px' }}>{v.emoji} {v.id} — {v.name}</h3>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '16px' }}>
                        <strong>Structure:</strong> {v.structure}
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
                        <strong>Best Use Case:</strong> {v.bestFor}
                    </p>
                </section>
            ))}
        </div>
    ),
};

// ─── V1: Linear Stepper ───────────────────────────────────────────────────────

export const V1_Stepper = {
    name: '↔️ V1 — Linear Stepper',
    args: { breakpoint: 'xl', userName: 'Ashley' },
    parameters: {
        docs: {
            description: {
                story: `**Two-column layout** — Vertical stepper nav on the left, step detail panel on the right.

**Spatial logic:** The path is always visible. Position is understood by which stepper node is highlighted.
Click any completed or in-progress step to update the right panel without scrolling.

**Key structural decision:** CTA lives in the right panel — removed from the path column to preserve hierarchy.`,
            },
        },
    },
    render: (args) => (
        <V1_LinearStepper
            userName={args.userName}
            steps={MOCK_STEPS}
            supplementalResources={MOCK_SUPPLEMENTAL}
            onStartModule={(s) => console.log('[V1] Start:', s.title)}
            onContinueModule={(s) => console.log('[V1] Continue:', s.title)}
        />
    ),
};

// ─── V2: Dashboard Progress ───────────────────────────────────────────────────

export const V2_Dashboard = {
    name: '📊 V2 — Dashboard Progress',
    args: { breakpoint: 'xl', userName: 'Ashley' },
    parameters: {
        docs: {
            description: {
                story: `**Metric-first layout** — Stat tiles at the top, hero CTA block below left, compact path list below right.

**Spatial logic:** Progress is quantified before reading any step titles. The tutor answers "Where am I?" in under 2 seconds.
The hero CTA is large and dominant; the path list acts as a compact reference, not the primary surface.

**Key structural decision:** Progress tiles serve orientation, not gamification. Kept to 3 metrics only.`,
            },
        },
    },
    render: (args) => (
        <V2_DashboardProgress
            userName={args.userName}
            steps={MOCK_STEPS}
            supplementalResources={MOCK_SUPPLEMENTAL}
            onStartModule={(s) => console.log('[V2] Start:', s.title)}
            onContinueModule={(s) => console.log('[V2] Continue:', s.title)}
        />
    ),
};

// ─── V3: Card Journey ─────────────────────────────────────────────────────────

export const V3_Cards = {
    name: '🃏 V3 — Card Journey',
    args: { breakpoint: 'xl', userName: 'Ashley' },
    parameters: {
        docs: {
            description: {
                story: `**Pipeline layout** — Horizontal scrollable card row at the top. Clicking any card loads its detail panel below.

**Spatial logic:** Each step has its own card "presence" — the journey feels concrete and tangible rather than abstract.
The active card expands to show duration. The detail panel below is the action surface — CTA always anchored there.

**Key structural decision:** Locked steps are selectable (to preview) but the CTA is disabled with explanatory copy.`,
            },
        },
    },
    render: (args) => (
        <V3_CardJourney
            userName={args.userName}
            steps={MOCK_STEPS}
            supplementalResources={MOCK_SUPPLEMENTAL}
            onStartModule={(s) => console.log('[V3] Start:', s.title)}
            onContinueModule={(s) => console.log('[V3] Continue:', s.title)}
        />
    ),
};

// ─── V4: Checklist Completion ─────────────────────────────────────────────────

export const V4_Checklist = {
    name: '✅ V4 — Checklist Completion',
    args: { breakpoint: 'xl', userName: 'Ashley' },
    parameters: {
        docs: {
            description: {
                story: `**Completion-focused layout** — Circular progress ring in the header. Checklist rows with inline CTA embedded in the active row.

**Spatial logic:** The ring provides a satisfying, single-glance progress indicator. The list is read top-to-bottom.
The active step row expands to show its description and CTA — no separate panel required.

**Key structural decision:** CTA is embedded inline in the active row (not in a separate panel) to reduce navigation distance to zero.`,
            },
        },
    },
    render: (args) => (
        <V4_ChecklistCompletion
            userName={args.userName}
            steps={MOCK_STEPS}
            supplementalResources={MOCK_SUPPLEMENTAL}
            onStartModule={(s) => console.log('[V4] Start:', s.title)}
            onContinueModule={(s) => console.log('[V4] Continue:', s.title)}
        />
    ),
};
