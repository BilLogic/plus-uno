/**
 * StatusIndicators - Training Onboarding Element
 * 
 * Status indicator icons showing different stages: not started, in progress, completed.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121906
 */

import React from 'react';
import StatusIndicators from './StatusIndicators';
import './StatusIndicators.scss';

export default {
    title: 'Specs/Training/Onboarding/Elements/Status Indicators',
    component: StatusIndicators,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Status indicator icons showing different stages: not started, in progress, completed. Used throughout Training Onboarding to show progress state.'
            }
        }
    },
    argTypes: {
        stage: {
            control: { type: 'select' },
            options: ['not started', 'in progress', 'completed'],
            description: 'Status stage',
            table: { category: 'Content' }
        },
        size: {
            control: { type: 'select' },
            options: [12, 14, 18],
            description: 'Glyph size in pixels',
            table: { category: 'Design' }
        }
    }
};

/**
 * Overview
 * Shows all status indicator variants matching Figma design
 */
export const Overview = {
    render: () => (
        <div style={{
            padding: 'var(--size-section-pad-y-lg, 24px)',
            backgroundColor: 'var(--ds-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-md, 24px)'
        }}>
            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>All Stages</h6>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 'var(--size-section-gap-lg, 32px)',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <StatusIndicators stage="not started" />
                        <span className="body3-txt">Not Started</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <StatusIndicators stage="in progress" />
                        <span className="body3-txt">In Progress</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <StatusIndicators stage="completed" />
                        <span className="body3-txt">Completed</span>
                    </div>
                </div>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Sizes</h6>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 'var(--size-section-gap-lg, 32px)',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <StatusIndicators stage="completed" size={12} />
                        <span className="body3-txt">12</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <StatusIndicators stage="completed" size={14} />
                        <span className="body3-txt">14</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <StatusIndicators stage="completed" size={18} />
                        <span className="body3-txt">18</span>
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
        stage: 'not started',
        size: 14
    },
    render: (args) => (
        <div style={{
            padding: 'var(--size-section-pad-y-lg, 24px)',
            backgroundColor: 'var(--ds-surface)'
        }}>
            <StatusIndicators {...args} />
        </div>
    )
};
