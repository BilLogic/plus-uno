/**
 * TrainingOnboardingHiFi.stories.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * PROTOTYPING MODE stories — High-Fidelity Training Onboarding Page
 *
 * Stories included:
 *   1. Dev Handoff Notes    — full spec doc (component tree, state matrix, tokens, a11y)
 *   2. Default (Card View)  — default state, module 2 in-progress, card/gallery layout
 *   3. List View (Stepper)  — same state, list layout
 *   4. Day One (Fresh)      — all not started
 *   5. Near Complete        — 5 of 6 complete
 *   6. All Done             — all 6 complete, session unlocked
 */

import React from 'react';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';
import TrainingOnboardingHiFi, { DEFAULT_MODULES } from './TrainingOnboardingHiFi';
import TrainingOnboardingClickthrough from './TrainingOnboardingClickthrough';

export default {
    title: 'Playground/Ashley/Training Onboarding/High-Fi',
    component: TrainingOnboardingHiFi,
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
                component: `## Training Onboarding — High-Fidelity (Prototyping Mode)
> **Selected toggle:** T1 — Top-Right Icon ButtonGroup, matching \`LessonsOverviewPage\` pattern.
> **Welcome Card:** WC4 — Hero + Bubble Track (approved from Iteration Mode, implemented in Prototyping Mode).

### WC4 Hero Progress Card
Replaces the previous \`ProgressHeader\` + \`NextStepBanner\`.

| Zone | Content | Behaviour |
|---|---|---|
| **Hero band** | Dark gradient · greeting · subtitle · CTA button | CTA fires \`onModuleCta(nextModule)\` |
| **Progress ring** | Animated SVG ring · X/N count label | Animates in on mount (0.8s ease-out, 0.15s delay) |
| **Bubble track** | 6 milestone bubbles · title · duration | Click fires \`onModuleCta(module)\`; locked = disabled |

#### Bubble States
| State | Visual | Interaction |
|---|---|---|
| Completed | Primary fill, check icon | Clickable — fires CTA |
| In Progress | Primary-container fill, play icon, primary border | Clickable — fires CTA |
| Unlocked (next) | Surface-variant fill, step number | Clickable — fires CTA |
| Locked | Surface-variant fill, lock icon, 40% opacity | Disabled — no click |

### PLUS DS Components
| Component | Usage |
|---|---|
| \`PageLayout\` | Page frame (top bar + sidebar) |
| \`Button\` | Hero CTA + view toggle (icon-only, size=small, style=primary) |
| \`OnboardingModuleCard\` | Card view items |
| \`StatusIndicators\` | Icon status in list rows |
| \`CtaButtons\` | Get Started / Continue / Review CTA |

### View Toggle Spec
Matches \`LessonsOverviewPage\` exactly:
\`\`\`jsx
// List button
<Button leadingVisual="list-ul" style="primary" fill={view==='list' ? 'tonal' : 'ghost'} size="small" active={view==='list'} aria-pressed={view==='list'} />

// Card/Grid button
<Button leadingVisual="table-cells-large" style="primary" fill={view==='card' ? 'tonal' : 'ghost'} size="small" active={view==='card'} aria-pressed={view==='card'} />
\`\`\`

Container: \`border: 1px solid --color-outline-variant\` · \`border-radius: --size-element-radius-sm\` · \`overflow: hidden\``,
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
            description: 'Initial view. Default is "card" (gallery-first).',
            table: { category: 'Toggle State' },
        },
        welcomeCardVariant: {
            control: { type: 'radio' },
            options: ['default', 'soft-gradient'],
            description: 'Prototyping: soft-gradient = VS1 Soft (refined) — low-contrast gradient, CTA + progress prominent.',
            table: { category: 'Prototyping' },
        },
    },
};

// ─── Dev Handoff Notes story ──────────────────────────────────────────────────

export const DevHandoffNotes = {
    name: '📋 Dev Handoff Notes',
    render: () => (
        <div style={{ padding: '32px', maxWidth: '960px', fontFamily: 'var(--font-family-body)' }}>

            <h2 className="h2" style={{ marginBottom: 24 }}>
                Training Onboarding — Dev Handoff Notes
            </h2>
            <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 32 }}>
                Prototyping Mode · High-Fidelity · For production implementation
            </p>

            {/* ─ Component Breakdown ─ */}
            <section style={{ marginBottom: 40 }}>
                <h3 className="h4" style={{ marginBottom: 12 }}>1. Component Breakdown</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-outline-variant)', background: 'var(--color-surface-container-low)' }}>
                            <th style={{ textAlign: 'left', padding: '8px 12px' }}>Sub-Component</th>
                            <th style={{ textAlign: 'left', padding: '8px 12px' }}>Type</th>
                            <th style={{ textAlign: 'left', padding: '8px 12px' }}>PLUS DS Source</th>
                            <th style={{ textAlign: 'left', padding: '8px 12px' }}>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            ['HeroProgressCard', 'New — local (WC4)', 'Button (hero CTA)', 'Dark gradient hero + animated SVG ring + interactive bubble track'],
                            ['ViewToggle', 'New — local', 'Button ×2', 'Matches LessonsOverviewPage pattern exactly'],
                            ['ModuleListRow', 'New — local', 'StatusIndicators, CtaButtons', 'Lists view stepper rows — one row per module'],
                            ['ModuleCardItem', 'New — local', 'OnboardingModuleCard, CtaButtons', 'Card view item — CTA pinned below card'],
                            ['OnboardingModuleCard', 'REUSED', 'specs/Training/onboarding', 'No changes — used as-is'],
                            ['StatusIndicators', 'REUSED', 'specs/Training/onboarding', 'No changes — used as-is'],
                            ['CtaButtons', 'REUSED', 'specs/Training/onboarding', 'No changes — Get Started / Continue / Review'],
                            ['PageLayout', 'REUSED', 'specs/Universal/Pages', 'No changes — standard frame'],
                        ].map(([comp, type, source, notes]) => (
                            <tr key={comp} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                                <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 13 }}>{comp}</td>
                                <td style={{ padding: '8px 12px' }}>{type}</td>
                                <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--color-on-surface-variant)' }}>{source}</td>
                                <td style={{ padding: '8px 12px', fontSize: 13 }}>{notes}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* ─ State Matrix ─ */}
            <section style={{ marginBottom: 40 }}>
                <h3 className="h4" style={{ marginBottom: 12 }}>2. Status State Matrix</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-outline-variant)', background: 'var(--color-surface-container-low)' }}>
                            {['Stage', 'List Row Style', 'Badge', 'CTA', 'Card Style', 'Lock Icon'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '8px 12px' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            ['completed', 'Default bg, title struck-through, opacity 0.75 card', 'Complete (primary-container)', 'Review (success tonal, disabled)', 'Opacity 0.75', '—'],
                            ['in progress', 'primary-container bg highlight', 'In Progress (secondary-container)', 'Continue (primary filled)', 'Active ring: primary border + box-shadow', '—'],
                            ['not started (unlocked)', 'Default bg', 'Next (surface-variant)', 'Get Started (primary filled)', 'Default', '—'],
                            ['not started (locked)', 'surface-container-low bg, opacity 0.5', 'Locked (surface-variant)', 'None — replaced by lock icon', 'Opacity 0.45, grayscale 40%', 'fa-lock visible'],
                        ].map(row => (
                            <tr key={row[0]} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                                {row.map((cell, i) => (
                                    <td key={i} style={{ padding: '8px 12px', fontSize: 13 }}>{cell}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className="body3-txt" style={{ marginTop: 8, color: 'var(--color-on-surface-variant)' }}>
                    <strong>Unlock rule:</strong> All completed/in-progress modules + first not-started after them = unlocked.
                    All subsequent not-started = locked.
                </p>
            </section>

            {/* ─ Token Usage ─ */}
            <section style={{ marginBottom: 40 }}>
                <h3 className="h4" style={{ marginBottom: 12 }}>3. Token Usage</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-outline-variant)', background: 'var(--color-surface-container-low)' }}>
                            {['Token', 'Value', 'Used in'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '8px 12px' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            ['--size-card-radius-sm', '12px', 'OnboardingModuleCard border-radius'],
                            ['--size-section-radius-sm', '8px', 'Progress header, next banner, list container, card container'],
                            ['--size-element-radius-sm', '6px', 'View toggle container border-radius'],
                            ['--size-element-border', '1px', 'All borders'],
                            ['--size-surface-gap-md', '24px', 'Root page gap between sections'],
                            ['--size-section-gap-md', '16px', 'Section internal gap'],
                            ['--size-element-gap-md', '16px', 'List row gap, card grid gap, toggle gap'],
                            ['--size-element-gap-sm', '8px', 'Small gaps, card CTA row gap'],
                            ['--size-card-pad-x-sm', '12px', 'OnboardingModuleCard padding'],
                            ['--size-section-pad-x-md', '20px', 'Progress header, banner, list row horizontal padding'],
                            ['--color-primary', '#006492', 'Active toggle, progress fill, banner border, in-progress ring'],
                            ['--color-primary-container', '#cde5f0', 'In-progress row bg, next banner bg, active card shadow, complete badge bg'],
                            ['--color-surface-container-low', '#f4f8f9', 'Progress header bg, locked row bg'],
                            ['--color-surface-variant', '#dde3ea', 'Progress bar track, next/locked badge bg'],
                            ['--color-outline-variant', '#bec8ca', 'All borders, toggle container, list row dividers'],
                        ].map(([token, value, usage]) => (
                            <tr key={token} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                                <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12 }}>{token}</td>
                                <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: 'var(--color-primary)' }}>{value}</td>
                                <td style={{ padding: '8px 12px' }}>{usage}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* ─ Responsive Spec ─ */}
            <section style={{ marginBottom: 40 }}>
                <h3 className="h4" style={{ marginBottom: 12 }}>4. Responsive Spec (Card View Grid)</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-outline-variant)', background: 'var(--color-surface-container-low)' }}>
                            {['Breakpoint', 'Viewport', 'CSS Query', 'Card Columns'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '8px 12px' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            ['XL', '≥1440px (design target)', 'default (no query)', '3 columns'],
                            ['LG', '1024–1199px', 'max-width: 1199px', '2 columns'],
                            ['MD/SM', '≤768px', 'max-width: 767px', '1 column'],
                        ].map(row => (
                            <tr key={row[0]} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                                {row.map((cell, i) => (
                                    <td key={i} style={{ padding: '8px 12px', fontSize: 13 }}>{cell}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className="body3-txt" style={{ marginTop: 8, color: 'var(--color-on-surface-variant)' }}>
                    Grid uses <code>grid-template-columns: repeat(N, 1fr)</code> with <code>gap: --size-element-gap-md</code>.
                    OnboardingModuleCard fixed width (275px) is overridden to <code>width: 100%</code> inside the grid.
                </p>
            </section>

            {/* ─ Interaction Behavior ─ */}
            <section style={{ marginBottom: 40 }}>
                <h3 className="h4" style={{ marginBottom: 12 }}>5. Interaction Behavior</h3>
                <ul className="body2-txt" style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <li><strong>View toggle:</strong> CSS <code>display: none / block</code> swap. No data re-fetch. No state reset.</li>
                    <li><strong>Scroll position:</strong> Each view maintains its own scroll independently (separate DOM nodes).</li>
                    <li><strong>Layout shift:</strong> None — both views are same-width block elements; toggle only changes opacity + display.</li>
                    <li><strong>Animation:</strong> Fade-in on <code>oob-hifi__view--visible</code> via <code>opacity</code> transition (200ms ease). No slide or shift.</li>
                    <li><strong>Progress state:</strong> Derived from <code>modules</code> prop via <code>useMemo</code>. Toggle does not touch state.</li>
                    <li><strong>CTA click:</strong> Calls <code>onModuleCta(module)</code> callback. Page does not handle navigation internally.</li>
                </ul>
            </section>

            {/* ─ Accessibility Checklist ─ */}
            <section style={{ marginBottom: 40 }}>
                <h3 className="h4" style={{ marginBottom: 12 }}>6. Accessibility Checklist</h3>
                {[
                    ['✅', 'Toggle buttons', 'aria-pressed={true|false} on each Button — announces state to screen readers'],
                    ['✅', 'Toggle buttons', 'aria-label="List view" / "Card view" — icon-only buttons need explicit labels'],
                    ['✅', 'Toggle buttons', 'title="List view" / "Card view" — visible tooltip on hover'],
                    ['✅', 'Toggle buttons', 'Keyboard: Tab to focus, Enter/Space to activate (handled by PLUS Button)'],
                    ['✅', 'Toggle buttons', 'focus-visible ring: 2px solid --color-primary, offset 1px'],
                    ['✅', 'Views', 'aria-hidden={view !== activeView} — inactive view removed from a11y tree'],
                    ['✅', 'List rows', 'aria-label="Module N: Title — stage" on each <li>'],
                    ['✅', 'Progress bar', 'role=progressbar, aria-valuenow/min/max on the fill bar'],
                    ['✅', 'Status badges', 'WCAG AA contrast verified (all badge combos ≥ 4.5:1)'],
                    ['✅', 'Next banner', 'role=complementary, aria-label="Next step"'],
                    ['✅', 'Section', 'aria-labelledby pointing to section h2 id'],
                    ['✅', 'Status icons', 'aria-hidden=true on decorative icons; StatusIndicators uses aria-label'],
                    ['⚠️', 'Locked cards', 'Screen reader reads "Complete previous module to unlock" — no interactive elements in locked state'],
                    ['⚠️', 'Card view', 'OnboardingModuleCard does not currently have a role=article — may want to add for list context'],
                ].map(([status, area, note]) => (
                    <div key={note} style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{status}</span>
                        <div>
                            <strong style={{ fontSize: 13 }}>{area}: </strong>
                            <span className="body3-txt">{note}</span>
                        </div>
                    </div>
                ))}
            </section>

            {/* ─ Storybook Documentation Checklist ─ */}
            <section>
                <h3 className="h4" style={{ marginBottom: 12 }}>7. Storybook Documentation Checklist</h3>
                {[
                    ['✅', 'Default (Card View) story — module 2 in progress, gallery layout'],
                    ['✅', 'List View (Stepper) story — same data, list layout'],
                    ['✅', 'Day One (Fresh Start) story — all not started'],
                    ['✅', 'Near Complete story — 5 of 6 complete'],
                    ['✅', 'All Done story — all 6 complete, session unlocked state'],
                    ['✅', 'Controls: breakpoint (md/lg/xl), userName, defaultView'],
                    ['✅', 'Dev Handoff Notes doc story (this page)'],
                    ['⬜', 'Motion reduced story — CSS prefers-reduced-motion version (future)'],
                    ['⬜', 'Dark mode story — when DS dark tokens available (future)'],
                ].map(([status, item]) => (
                    <div key={item} style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
                        <span style={{ fontSize: 16 }}>{status}</span>
                        <span className="body2-txt">{item}</span>
                    </div>
                ))}
            </section>
        </div>
    ),
};

// ─── Story: Default — Card View (Module 2 In Progress) ───────────────────────

export const DefaultCardView = {
    name: '⊞ Card View — Default',
    args: {
        breakpoint: 'xl',
        userName: 'Ashley Xu',
        defaultView: 'card',
    },
    parameters: {
        docs: {
            description: {
                story: `**Default state — card view.** Module 2 "Your Role at PLUS" is in progress.
Module 1 completed (muted, 0.75 opacity). Module 2 active card (primary border + shadow).
Modules 3–6 locked (greyscale, 0.45 opacity).
Grid icon in toggle is active (tonal fill). Sidebar: Onboarding tab selected.`,
            },
        },
    },
    render: (args) => (
        <TrainingOnboardingHiFi
            userName={args.userName}
            defaultView={args.defaultView}
            modules={DEFAULT_MODULES}
            welcomeCardVariant={args.welcomeCardVariant}
        />
    ),
};

// ─── Story: Prototype Mode — VS1 Soft Gradient ────────────────────────────────

export const SoftGradientPrototype = {
    name: '🧪 Prototype — VS1 Soft Gradient',
    args: {
        breakpoint: 'xl',
        userName: 'Ashley Xu',
        defaultView: 'card',
        welcomeCardVariant: 'soft-gradient',
    },
    parameters: {
        docs: {
            description: {
                story: `**Prototyping mode** — welcome card uses VS1 Soft Gradient (iteration-refined).
Soft, low-contrast gradient based on PLUS design system colors; CTA and progress indicators stay clear and prominent.`,
            },
        },
    },
    render: (args) => (
        <TrainingOnboardingHiFi
            userName={args.userName}
            defaultView={args.defaultView}
            modules={DEFAULT_MODULES}
            welcomeCardVariant="soft-gradient"
        />
    ),
};

// ─── Story: List View ─────────────────────────────────────────────────────────

export const ListViewStepper = {
    name: '📋 List View — Stepper',
    args: {
        breakpoint: 'xl',
        userName: 'Ashley Xu',
        defaultView: 'list',
    },
    parameters: {
        docs: {
            description: {
                story: `Same data, toggle set to **list view**.
Module 1 completed (struck-through). Module 2 active row highlighted (primary-container bg).
Modules 3–6 locked (dimmed). List icon in toggle is active (tonal fill).`,
            },
        },
    },
    render: (args) => (
        <TrainingOnboardingHiFi
            userName={args.userName}
            defaultView={args.defaultView}
            modules={DEFAULT_MODULES}
            welcomeCardVariant={args.welcomeCardVariant}
        />
    ),
};


// ─── Story: Day One (Fresh Start) ────────────────────────────────────────────

export const DayOneFreshStart = {
    name: '🌅 Day One — Fresh Start',
    args: { breakpoint: 'xl', userName: 'Ashley Xu', defaultView: 'list' },
    parameters: {
        docs: {
            description: {
                story: `All 6 modules not-started. Module 1 is the "next step" (unlocked). Modules 2–6 locked.
Progress bar at 0%. Next Step Banner shows module 1: "Get Started".`,
            },
        },
    },
    render: (args) => (
        <TrainingOnboardingHiFi
            userName={args.userName}
            defaultView={args.defaultView}
            modules={DEFAULT_MODULES.map(m => ({ ...m, stage: 'not started' }))}
            welcomeCardVariant={args.welcomeCardVariant}
        />
    ),
};

// ─── Story: Near Complete (5/6 done) ─────────────────────────────────────────

export const NearComplete = {
    name: '🔜 Near Complete — Step 6',
    args: { breakpoint: 'xl', userName: 'Ashley Xu', defaultView: 'list' },
    parameters: {
        docs: {
            description: {
                story: `5 modules completed, module 6 "Tutoring Tools" is in progress.
Progress bar at 83%. Next Step Banner: "Continue — Tutoring Tools".`,
            },
        },
    },
    render: (args) => (
        <TrainingOnboardingHiFi
            userName={args.userName}
            defaultView={args.defaultView}
            modules={DEFAULT_MODULES.map((m, i) => ({
                ...m,
                stage: i < 5 ? 'completed' : 'in progress',
            }))}
            welcomeCardVariant={args.welcomeCardVariant}
        />
    ),
};

// ─── Story: Module Clickthrough ───────────────────────────────────────────────

export const ModuleClickthrough = {
    name: '🖱️ Training Onboarding',
    args: {
        breakpoint: 'xl',
        userName: 'Ashley Xu',
        defaultView: 'list',
    },
    parameters: {
        docs: {
            description: {
                story: `**Interactive clickthrough flow.**
Day 1 fresh start — all modules not started.
Click the **"Get Started"** CTA on "Welcome to PLUS" to navigate to the inner module page.
The inner page shows the module thumbnail image, alert card, iframe placeholder, and reflection form.
Submitting the reflection shows the completion modal.
Click **"Back to Onboarding Overview"** to return.`,
            },
        },
    },
    render: (args) => (
        <TrainingOnboardingClickthrough
            userName={args.userName}
            defaultView={args.defaultView}
        />
    ),
};

// ─── Story: All Done ──────────────────────────────────────────────────────────

export const AllDone = {
    name: '✅ All Done — Onboarding Complete',
    args: { breakpoint: 'xl', userName: 'Ashley Xu', defaultView: 'list' },
    parameters: {
        docs: {
            description: {
                story: `All 6 modules completed. Progress bar at 100%.
No Next Step Banner — no active or unlocked modules remaining.
All list rows muted, struck-through, "Review" CTA (disabled) visible on each.
Card view shows all cards muted.`,
            },
        },
    },
    render: (args) => (
        <TrainingOnboardingHiFi
            userName={args.userName}
            defaultView={args.defaultView}
            modules={DEFAULT_MODULES.map(m => ({ ...m, stage: 'completed' }))}
            welcomeCardVariant={args.welcomeCardVariant}
        />
    ),
};
