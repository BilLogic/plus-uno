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
    title: 'Specs/Training/Onboarding/Elements/StatusIndicators',
    component: StatusIndicators,
    tags: ['autodocs'],
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
            options: ['small', 'medium', 'large'],
            description: 'Size variant',
            table: { category: 'Design' }
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
            <h3 className="h3" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>StatusIndicators</h3>
            <p className="body1-txt" style={{ marginBottom: 'var(--size-section-gap-md, 24px)' }}>
                Status indicator icons showing different stages of completion.
                Uses FontAwesome icons with PLUS DS color tokens.
            </p>
            <h4 className="h4" style={{ marginBottom: 'var(--size-element-gap-md, 8px)' }}>Variants</h4>
            <ul className="body2-txt">
                <li><strong>not started</strong>: Circle-stop icon in neutral color</li>
                <li><strong>in progress</strong>: Spinner icon in info color</li>
                <li><strong>completed</strong>: Circle-check icon in success color</li>
            </ul>
        </div>
    )
};

/**
 * Overview
 * Shows all status indicator variants matching Figma design
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
                        <StatusIndicators stage="completed" size="small" />
                        <span className="body3-txt">Small</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <StatusIndicators stage="completed" size="medium" />
                        <span className="body3-txt">Medium</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <StatusIndicators stage="completed" size="large" />
                        <span className="body3-txt">Large</span>
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
        size: 'medium'
    },
    render: (args) => (
        <div style={{
            padding: 'var(--size-section-pad-y-lg, 24px)',
            backgroundColor: 'var(--color-surface)'
        }}>
            <StatusIndicators {...args} />
        </div>
    )
};
