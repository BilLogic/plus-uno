/**
 * OnboardingModulesTable - Training Onboarding Table
 * 
 * Table showing onboarding modules with columns: Module, Duration, Progress, Actions.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121873
 */

import React, { useState } from 'react';
import OnboardingModulesTable from './OnboardingModulesTable';
import './OnboardingModulesTable.scss';
import '../../Elements/StatusIndicators/StatusIndicators.scss';
import '../../Elements/CtaButtons/CtaButtons.scss';

export default {
    title: 'Specs/Training/Onboarding/Tables/OnboardingModulesTable',
    component: OnboardingModulesTable,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Table component for displaying onboarding modules. Shows module thumbnail, title, duration, progress status indicator, and action buttons (Get Started/Continue/Review).',
            },
        },
    },
    argTypes: {
        sortable: {
            control: 'boolean',
            description: 'Enable sortable columns',
            table: { category: 'Behavior' },
        },
        hover: {
            control: 'boolean',
            description: 'Enable row hover effects',
            table: { category: 'Behavior' },
        },
    },
};

/**
 * Docs
 * Documentation for OnboardingModulesTable component
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>OnboardingModulesTable</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Table component for displaying onboarding modules with thumbnail, title, duration,
                        progress status indicator (not started, in progress, completed), and action buttons.
                        Uses a 6-column grid layout with the Module column spanning 3 columns.
                    </p>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Props</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>modules</strong>: Array of module objects (id, title, duration, stage, ctaState, imageUrl)</li>
                        <li><strong>sortable</strong>: Enable sortable columns (default: true)</li>
                        <li><strong>hover</strong>: Enable row hover effects (default: true)</li>
                        <li><strong>onModuleClick</strong>: Callback when row is clicked</li>
                        <li><strong>onCtaClick</strong>: Callback when CTA button is clicked</li>
                    </ul>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Figma Reference</h4>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Node ID: 74-121873
                    </p>
                </section>
            </div>
        </div>
    ),
};

/**
 * Overview
 * Shows table with multiple rows and states matching Figma design
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md, 24px)' }}>
            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Onboarding Modules Table</h6>
                <OnboardingModulesTable 
                    modules={[
                        { id: 1, title: 'Introduction to Tutoring', duration: '15mins', stage: 'completed', ctaState: 'completed' },
                        { id: 2, title: 'Building Rapport with Students', duration: '20mins', stage: 'in progress', ctaState: 'in progress' },
                        { id: 3, title: 'Effective Communication', duration: '12mins', stage: 'not started', ctaState: 'not started' },
                        { id: 4, title: 'Goal Setting Strategies', duration: '18mins', stage: 'not started', ctaState: 'not started' },
                        { id: 5, title: 'Session Planning', duration: '10mins', stage: 'not started', ctaState: 'not started' },
                    ]}
                />
            </section>
        </div>
    ),
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    render: (args) => {
        const [modules] = useState([
            { id: 1, title: 'Introduction to Tutoring', duration: '15mins', stage: 'completed', ctaState: 'completed' },
            { id: 2, title: 'Building Rapport with Students', duration: '20mins', stage: 'in progress', ctaState: 'in progress' },
            { id: 3, title: 'Effective Communication', duration: '12mins', stage: 'not started', ctaState: 'not started' },
        ]);

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Onboarding Modules Table</h6>
                <OnboardingModulesTable 
                    modules={modules}
                    sortable={args.sortable}
                    hover={args.hover}
                    onModuleClick={(module) => console.log('Module clicked:', module)}
                    onCtaClick={(module) => console.log('CTA clicked:', module)}
                />
            </div>
        );
    },
    args: {
        sortable: true,
        hover: true,
    },
};
