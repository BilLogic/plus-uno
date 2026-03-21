/**
 * CtaButtons - Training Onboarding Element
 * 
 * CTA button component with different states: not started, in progress, completed.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121928
 */

import React from 'react';
import CtaButtons from './CtaButtons';
import './CtaButtons.scss';

export default {
    title: 'Specs/Training/Onboarding/Elements/CtaButtons',
    component: CtaButtons,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'CTA button component with different states: not started (Get Started), in progress (Continue), completed (Review). Uses the PLUS DS Button component with appropriate styling per state.'
            }
        }
    },
    argTypes: {
        state: {
            control: { type: 'select' },
            options: ['not started', 'in progress', 'completed'],
            description: 'Button state',
            table: { category: 'Content' }
        },
        disabled: {
            control: 'boolean',
            description: 'Disabled state',
            table: { category: 'State' }
        },
        onClick: {
            action: 'clicked',
            table: { category: 'Events' }
        }
    }
};

/**
 * Docs
 * Documentation overview of the component
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg, 24px)' }}>
            <h3 className="h3" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>CtaButtons</h3>
            <p className="body1-txt" style={{ marginBottom: 'var(--size-section-gap-md, 24px)' }}>
                CTA button component that changes text and styling based on the user's progress state.
                Uses the PLUS DS Button component as its foundation.
            </p>
            <h4 className="h4" style={{ marginBottom: 'var(--size-element-gap-md, 8px)' }}>States</h4>
            <ul className="body2-txt">
                <li><strong>not started</strong>: "Get Started" - Primary filled button</li>
                <li><strong>in progress</strong>: "Continue" - Primary filled button</li>
                <li><strong>completed</strong>: "Review" - Success tonal button</li>
            </ul>
        </div>
    )
};

/**
 * Overview
 * Shows all CTA button states matching Figma design
 */
export const Overview = {
    render: () => (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg, 24px)',
            backgroundColor: 'var(--color-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-md, 24px)'
        }}>
            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>All States</h6>
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'row', 
                    gap: 'var(--size-section-gap-lg, 32px)',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <CtaButtons state="not started" />
                        <span className="body3-txt">Not Started</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <CtaButtons state="in progress" />
                        <span className="body3-txt">In Progress</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <CtaButtons state="completed" />
                        <span className="body3-txt">Completed</span>
                    </div>
                </div>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Disabled States</h6>
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'row', 
                    gap: 'var(--size-section-gap-lg, 32px)',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <CtaButtons state="not started" disabled />
                        <span className="body3-txt">Disabled</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <CtaButtons state="completed" disabled />
                        <span className="body3-txt">Completed (Disabled)</span>
                    </div>
                </div>
            </section>
        </div>
    )
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    args: {
        state: 'not started',
        disabled: false
    },
    render: (args) => (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg, 24px)', 
            backgroundColor: 'var(--color-surface)' 
        }}>
            <CtaButtons {...args} />
        </div>
    )
};
