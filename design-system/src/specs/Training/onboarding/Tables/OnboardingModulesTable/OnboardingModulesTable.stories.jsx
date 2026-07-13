/**
 * OnboardingModulesTable - Training Onboarding Table
 * 
 * Table showing onboarding modules with columns: Module, Duration, Progress, Actions.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121873
 */

import React, { useState } from 'react';
import OnboardingModulesTable from './OnboardingModulesTable';
import './OnboardingModulesTable.scss';
import '@/specs/Training/Onboarding/Elements/StatusIndicators/StatusIndicators.scss';
import '@/specs/Training/Onboarding/Elements/CtaButtons/CtaButtons.scss';

export default {
    title: 'Specs/Training/Onboarding/Tables/Onboarding Modules Table',
    component: OnboardingModulesTable,
    tags: ['!dev', '!autodocs'],
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
