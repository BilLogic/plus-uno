import React from 'react';
import { StudentTag } from './StudentTag.jsx';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/In-Session/Elements/Badges/Student Tags',
    component: StudentTag,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: `
# Student Tags (PLUS Tags)

Pill-shaped tags used to label students with contextual signals across categories.
All render from the shared **StudentTag** component (warning-tonal Badge + signal icon).

## Categories
- **Goal**: Goal met, Goal not met
- **Engagement**: Driven, Unengaged
- **Content**: Accomplished, Developing
- **Misc**: Overflow indicator ("…")

## Signal
- **positive** (green \`fa-circle-check\`) — favourable status
- **negative** (red \`fa-triangle-exclamation\`) — attention needed
- **neutral** — no icon (overflow)

## Design tokens
- **Surface**: \`--color-warning-state-08\` (tonal warning) · **Text**: \`--color-warning-text\`
- **Radius**: \`--size-element-radius-full\` (pill) · **Type**: body3 (12px)
                `
            }
        }
    },
    argTypes: {
        label: { control: 'text', table: { category: 'Content' } },
        signal: {
            control: 'radio',
            options: ['positive', 'negative', 'neutral'],
            table: { category: 'Design' },
        },
    },
};

// ─── Goal ────────────────────────────────────────────────────────
export const GoalMet = { args: { label: 'Goal met', signal: 'positive' } };
export const GoalNotMet = { args: { label: 'Goal not met', signal: 'negative' } };

// ─── Engagement ──────────────────────────────────────────────────
export const Driven = { args: { label: 'Driven', signal: 'positive' } };
export const Unengaged = { args: { label: 'Unengaged', signal: 'negative' } };

// ─── Content ─────────────────────────────────────────────────────
export const Accomplished = { args: { label: 'Accomplished', signal: 'positive' } };
export const Developing = { args: { label: 'Developing', signal: 'negative' } };

// ─── Misc ────────────────────────────────────────────────────────
export const Overflow = { args: { label: '…', signal: 'neutral' } };

// ─── All Variations ──────────────────────────────────────────────
const CATEGORIES = [
    { name: 'Goal', tags: [['Goal met', 'positive'], ['Goal not met', 'negative']] },
    { name: 'Engagement', tags: [['Driven', 'positive'], ['Unengaged', 'negative']] },
    { name: 'Content', tags: [['Accomplished', 'positive'], ['Developing', 'negative']] },
    { name: 'Misc', tags: [['…', 'neutral']] },
];

export const AllVariations = () => (
    <div
        className="d-flex flex-column gap-4"
        style={{
            padding: 'var(--size-section-gap-lg)',
            backgroundColor: 'var(--color-surface-variant)',
            minHeight: '100vh',
        }}
    >
        <div>
            <h5 className="text-muted mb-2">Student Tags (PLUS Tags)</h5>
            <p className="text-muted small mb-0">
                Pill tags with signal icons, labelling students across goal, engagement, and content categories.
            </p>
        </div>

        <div className="d-flex flex-wrap align-items-start" style={{ gap: 'var(--size-section-gap-lg)' }}>
            {CATEGORIES.map((cat) => (
                <div key={cat.name} className="d-flex flex-column gap-3">
                    <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>
                        {cat.name}
                    </h6>
                    <div className="d-flex flex-column gap-2 align-items-start">
                        {cat.tags.map(([label, signal]) => (
                            <StudentTag key={label} label={label} signal={signal} />
                        ))}
                    </div>
                </div>
            ))}
        </div>

        {/* Inline layout (as shown in Figma) */}
        <div className="d-flex flex-column gap-3">
            <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>
                Inline layout
            </h6>
            <div className="d-flex flex-wrap" style={{ gap: 'var(--size-element-gap-sm)' }}>
                {CATEGORIES.flatMap((c) => c.tags).map(([label, signal], i) => (
                    <StudentTag key={`${label}-${i}`} label={label} signal={signal} />
                ))}
            </div>
        </div>
    </div>
);
