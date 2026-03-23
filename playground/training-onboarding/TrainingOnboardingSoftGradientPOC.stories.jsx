/**
 * TrainingOnboardingSoftGradientPOC.stories.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * PROTOTYPING MODE — High-Fi POC with VS1 Soft Gradient (refined)
 *
 * Full training onboarding page with VS1 Soft Gradient welcome card (iteration-refined).
 * Low-contrast gradient: surface + hint of primary → surface. CTA and progress ring stay prominent.
 * Shows all progress: hero + 6-module bubble track + module grid.
 */

import React from 'react';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';
import TrainingOnboardingHiFi from './TrainingOnboardingHiFi';
import TrainingOnboardingClickthrough from './TrainingOnboardingClickthrough';

const CARD_WRAP = { maxWidth: '100%', padding: 0 };

export default {
    title: 'Playground/Ashley/Training Onboarding/High-Fi',
    component: TrainingOnboardingHiFi,
    tags: ['autodocs'],
    decorators: [
        (Story, context) => (
            <ResponsiveFrame breakpoint={context.args?.breakpoint || 'xl'}>
                <div style={CARD_WRAP}>
                    <Story />
                </div>
            </ResponsiveFrame>
        ),
    ],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                story: `**Prototyping POC** — Fully interactive training onboarding with **VS1 Soft Gradient** (iteration-refined).
Soft, low-contrast gradient based on PLUS design system colors; CTA and progress indicators remain clear and prominent.
Same flow as Training Onboarding clickthrough: Get Started → inner module page → reflection → Back to overview.
Click hero CTA, bubbles, or module cards to navigate. View toggle works.`,
            },
        },
    },
    argTypes: {
        breakpoint: {
            control: { type: 'select' },
            options: ['md', 'lg', 'xl'],
            table: { category: 'Responsive' },
        },
    },
};

export const SoftGradientPOC = {
    name: 'Soft Gradient POC — Interactive',
    args: {
        breakpoint: 'xl',
    },
    parameters: {
        docs: {
            description: {
                story: `**VS1 Soft Gradient** (iteration-refined) — Fully interactive welcome card.
Soft, low-contrast gradient (surface + hint of primary); CTA and progress ring stay prominent.
Day 1 fresh start. Click "Get Started" or a module → inner page with reflection form → Back to overview.
View toggle (list/card), hero CTA, bubble track, and module cards are all interactive.`,
            },
        },
    },
    render: (args) => (
        <TrainingOnboardingClickthrough
            userName="Ashley Xu"
            defaultView="card"
            welcomeCardVariant="soft-gradient"
        />
    ),
};
