/**
 * Training Onboarding Page — Storybook Stories
 *
 * Playground prototype based on the consulting brief:
 * "Guide new PLUS tutors from zero to first session — one step at a time."
 *
 * WIREFRAME ONLY — structural layout, no visual design decisions.
 *
 * Stories:
 *   1. Docs        – Consulting brief summary + UX principles
 *   2. Wireframe   – Default state (tutor mid-onboarding, step 2 active)
 *   3. FreshStart  – All steps locked (new tutor, day 1)
 *   4. NearComplete – Most steps done (step 5 in-progress)
 *   5. AllDone     – Onboarding complete (no CTA shown)
 */

import React, { useState } from 'react';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';
import TrainingOnboardingPage from './TrainingOnboardingPage';

// ─── Shared mock datasets ─────────────────────────────────────────────────────

const STEPS_FRESH_START = [
    { id: 1, title: 'Welcome to PLUS', description: 'Learn what PLUS is and how it operates.', duration: '9 mins', status: 'in-progress' },
    { id: 2, title: 'Your Role at PLUS', description: 'Understand your responsibilities as a tutor.', duration: '12 mins', status: 'locked' },
    { id: 3, title: 'Tutoring Session Overview', description: 'Walk through what a standard session looks like.', duration: '15 mins', status: 'locked' },
    { id: 4, title: 'Student Communication', description: 'Best practices for engaging and motivating students.', duration: '10 mins', status: 'locked' },
    { id: 5, title: 'Session Wrap-Up & Reporting', description: 'How to close sessions and complete post-session notes.', duration: '11 mins', status: 'locked' },
];

const STEPS_MID_ONBOARDING = [
    { id: 1, title: 'Welcome to PLUS', description: 'Learn what PLUS is and how it operates.', duration: '9 mins', status: 'completed' },
    { id: 2, title: 'Your Role at PLUS', description: 'Understand your responsibilities as a tutor.', duration: '12 mins', status: 'in-progress' },
    { id: 3, title: 'Tutoring Session Overview', description: 'Walk through what a standard session looks like.', duration: '15 mins', status: 'locked' },
    { id: 4, title: 'Student Communication', description: 'Best practices for engaging and motivating students.', duration: '10 mins', status: 'locked' },
    { id: 5, title: 'Session Wrap-Up & Reporting', description: 'How to close sessions and complete post-session notes.', duration: '11 mins', status: 'locked' },
];

const STEPS_NEAR_COMPLETE = [
    { id: 1, title: 'Welcome to PLUS', description: 'Learn what PLUS is and how it operates.', duration: '9 mins', status: 'completed' },
    { id: 2, title: 'Your Role at PLUS', description: 'Understand your responsibilities as a tutor.', duration: '12 mins', status: 'completed' },
    { id: 3, title: 'Tutoring Session Overview', description: 'Walk through what a standard session looks like.', duration: '15 mins', status: 'completed' },
    { id: 4, title: 'Student Communication', description: 'Best practices for engaging and motivating students.', duration: '10 mins', status: 'completed' },
    { id: 5, title: 'Session Wrap-Up & Reporting', description: 'How to close sessions and complete post-session notes.', duration: '11 mins', status: 'in-progress' },
];

const STEPS_ALL_DONE = [
    { id: 1, title: 'Welcome to PLUS', description: 'Learn what PLUS is and how it operates.', duration: '9 mins', status: 'completed' },
    { id: 2, title: 'Your Role at PLUS', description: 'Understand your responsibilities as a tutor.', duration: '12 mins', status: 'completed' },
    { id: 3, title: 'Tutoring Session Overview', description: 'Walk through what a standard session looks like.', duration: '15 mins', status: 'completed' },
    { id: 4, title: 'Student Communication', description: 'Best practices for engaging and motivating students.', duration: '10 mins', status: 'completed' },
    { id: 5, title: 'Session Wrap-Up & Reporting', description: 'How to close sessions and complete post-session notes.', duration: '11 mins', status: 'completed' },
];

// ─── Story export config ──────────────────────────────────────────────────────

export default {
    title: 'Playground/Ashley/Training Onboarding/Consulting (low-fi)',
    component: TrainingOnboardingPage,
    tags: ['autodocs'],
    decorators: [
        (Story, context) => (
            <ResponsiveFrame breakpoint={context.args.breakpoint || 'xl'}>
                <Story />
            </ResponsiveFrame>
        ),
    ],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: `## Training → Onboarding Page (Wireframe Prototype)

> **Consulting Brief Output** — Structure-first concept. No visual design decisions made.

### Page Goal
**"Guide new PLUS tutors from zero to first session — one step at a time."**

---

### Structural Layout (4 blocks)

| Block | Section | Purpose | Content |
|---|---|---|---|
| 1 | Welcome Header | Orient & personalize | Name, progress bar, step count |
| 2 | Next Step CTA | Drive immediate action | Current module title, description, primary CTA |
| 3 | Onboarding Path | Show full journey | Sequential steps with status labels |
| 4 | Supplemental Resources | Don't block discovery | Hidden by default, optional |

---

### 3 UX Principles

**P1 — Progress Visibility Reduces Anxiety**
A persistent progress bar validates effort and creates forward momentum.

**P2 — One Decision at a Time**
The next action is always singular and obvious. No carousel. No library browsing at onboarding stage.

**P3 — Structure Before Content**
Experience feels like a guided path, not a content library to navigate.

---

### What Was Removed
- ❌ Featured Modules carousel (causes choice paralysis)
- ❌ All Modules table (overwhelming as default view)
- ❌ Sorting/filtering controls (irrelevant at this stage)
- ❌ Free browsing before onboarding is complete`,
            },
        },
    },
    argTypes: {
        breakpoint: {
            control: { type: 'select' },
            options: ['md', 'lg', 'xl'],
            description: 'Responsive breakpoint for ResponsiveFrame',
            table: { category: 'Responsive' },
        },
        userName: {
            control: 'text',
            description: 'Personalized tutor name for the Welcome header',
        },
    },
};

// ─── Story 1: Docs ────────────────────────────────────────────────────────────
export const Docs = {
    name: '📋 Docs',
    render: () => (
        <div style={{ padding: '32px', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '8px' }}>Training Onboarding — Wireframe</h2>
            <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '32px' }}>
                Consulting Mode output. See the component description (above) for the full brief.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                <section>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>Page Goal</h4>
                    <p className="body2-txt" style={{ fontStyle: 'italic' }}>
                        "Guide new PLUS tutors from zero to first session — one step at a time."
                    </p>
                </section>

                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Layout Blocks</h4>
                    <ol className="body2-txt" style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <li><strong>Section 1 — Welcome Header:</strong> Personalised greeting + progress bar</li>
                        <li><strong>Section 2 — Next Step CTA:</strong> One module, one action button (primary, above fold)</li>
                        <li><strong>Section 3 — Onboarding Path:</strong> Numbered sequential steps with status</li>
                        <li><strong>Section 4 — Supplemental:</strong> Collapsed by default, not primary journey</li>
                    </ol>
                </section>

                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>3 UX Principles</h4>
                    <ul className="body2-txt" style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <li><strong>P1 — Progress Visibility Reduces Anxiety:</strong> Always show where you are</li>
                        <li><strong>P2 — One Decision at a Time:</strong> Never more than one primary CTA visible</li>
                        <li><strong>P3 — Structure Before Content:</strong> Guided path, not content library</li>
                    </ul>
                </section>

                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>What Was Removed</h4>
                    <ul className="body2-txt" style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <li>Featured Modules carousel</li>
                        <li>All Modules table (default view)</li>
                        <li>Sort / filter controls</li>
                        <li>Unrestricted browsing before path completion</li>
                    </ul>
                </section>

            </div>
        </div>
    ),
};

// ─── Story 2: Wireframe (default mid-onboarding state) ────────────────────────
export const Wireframe = {
    name: '🔲 Wireframe — Mid Onboarding',
    args: {
        breakpoint: 'xl',
        userName: 'Ashley',
    },
    render: (args) => (
        <TrainingOnboardingPage
            userName={args.userName}
            steps={STEPS_MID_ONBOARDING}
            onStartModule={(step) => console.log('[Wireframe] Start:', step)}
            onContinueModule={(step) => console.log('[Wireframe] Continue:', step)}
        />
    ),
};

// ─── Story 3: Fresh Start ─────────────────────────────────────────────────────
export const FreshStart = {
    name: '🆕 Fresh Start — Day 1',
    args: {
        breakpoint: 'xl',
        userName: 'Jordan',
    },
    render: (args) => (
        <TrainingOnboardingPage
            userName={args.userName}
            steps={STEPS_FRESH_START}
            onStartModule={(step) => console.log('[FreshStart] Start:', step)}
            onContinueModule={(step) => console.log('[FreshStart] Continue:', step)}
        />
    ),
};

// ─── Story 4: Near Complete ───────────────────────────────────────────────────
export const NearComplete = {
    name: '🏁 Near Complete — Step 5',
    args: {
        breakpoint: 'xl',
        userName: 'Sam',
    },
    render: (args) => (
        <TrainingOnboardingPage
            userName={args.userName}
            steps={STEPS_NEAR_COMPLETE}
            onStartModule={(step) => console.log('[NearComplete] Start:', step)}
            onContinueModule={(step) => console.log('[NearComplete] Continue:', step)}
        />
    ),
};

// ─── Story 5: All Done ────────────────────────────────────────────────────────
export const AllDone = {
    name: '✅ All Done — Onboarding Complete',
    args: {
        breakpoint: 'xl',
        userName: 'Morgan',
    },
    render: (args) => (
        <TrainingOnboardingPage
            userName={args.userName}
            steps={STEPS_ALL_DONE}
            onStartModule={(step) => console.log('[AllDone] Revisit:', step)}
        />
    ),
};
