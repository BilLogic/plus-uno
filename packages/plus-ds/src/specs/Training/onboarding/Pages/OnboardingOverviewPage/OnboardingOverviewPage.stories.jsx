/**
 * OnboardingOverviewPage - Training Onboarding Page
 * 
 * Full page layout for Onboarding Overview with featured modules carousel and all modules table.
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121828
 */

import React, { useState } from 'react';
import OnboardingOverviewPage from './OnboardingOverviewPage';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';
import './OnboardingOverviewPage.scss';

export default {
    title: 'Specs/Training/Onboarding/Pages/OnboardingOverviewPage',
    component: OnboardingOverviewPage,
    tags: ['autodocs'],
    decorators: [
        (Story, context) => (
            <ResponsiveFrame breakpoint={context.args.breakpoint || 'xl'}>
                <Story />
            </ResponsiveFrame>
        ),
    ],
    parameters: {
        docs: {
            description: {
                component: 'Full page layout for Onboarding Overview. Shows featured modules in a horizontal carousel and all modules in a table with sorting.',
            },
        },
        layout: 'fullscreen',
    },
    argTypes: {
        breakpoint: {
            control: { type: 'select' },
            options: ['md', 'lg', 'xl'],
            description: 'Responsive breakpoint',
            table: { category: 'Responsive' },
        },
        sortBy: {
            control: { type: 'select' },
            options: ['Name', 'Duration', 'Progress'],
            description: 'Sort field',
            table: { category: 'Filters' },
        },
        sortOrder: {
            control: { type: 'select' },
            options: ['A-Z', 'Z-A'],
            description: 'Sort order',
            table: { category: 'Filters' },
        },
        showEmptyState: {
            control: 'boolean',
            description: 'Show empty state (no modules)',
            table: { category: 'State' },
        },
    },
    args: {
        breakpoint: 'xl',
    },
};

/**
 * Docs
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>OnboardingOverviewPage</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Full page layout for Onboarding Overview. Contains two main sections:
                        Featured Modules (horizontal carousel with navigation arrows) and
                        All Modules (table with sorting dropdown).
                    </p>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Features</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li>TopBar with breadcrumbs and user avatar</li>
                        <li>Sidebar navigation</li>
                        <li>Featured Modules carousel with arrow navigation</li>
                        <li>Module cards with thumbnail, title, duration, badge, status</li>
                        <li>All Modules table with sortable columns</li>
                        <li>Sorting dropdown (Name, Duration, Progress)</li>
                    </ul>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Figma Reference</h4>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Node ID: 74-121828
                    </p>
                </section>
            </div>
        </div>
    ),
};

/**
 * Overview
 */
export const Overview = {
    render: () => (
        <OnboardingOverviewPage />
    ),
};

/**
 * Interactive
 */
export const Interactive = {
    render: (args) => {
        const [sortBy, setSortBy] = useState(args.sortBy || 'Name');
        const [sortOrder, setSortOrder] = useState(args.sortOrder || 'A-Z');

        const handleSortChange = (newSort) => {
            if (newSort.sortBy) setSortBy(newSort.sortBy);
            if (newSort.sortOrder) setSortOrder(newSort.sortOrder);
        };

        const featuredModules = args.showEmptyState ? [] : [
            { id: 1, title: 'Welcome to PLUS', duration: '9 mins', variant: 'thumbnail', badgeType: 'other', stage: 'completed' },
            { id: 2, title: 'Your Role at PLUS', duration: '12 mins', variant: 'thumbnail', badgeType: 'video', stage: 'in progress' },
            { id: 3, title: 'Tutoring Session Overview', duration: '15 mins', variant: 'thumbnail', badgeType: 'document', stage: 'not started' },
            { id: 4, title: 'Student Engagement', duration: '10 mins', variant: 'thumbnail', badgeType: 'other', stage: 'not started' },
        ];

        const allModules = args.showEmptyState ? [] : [
            { id: 1, title: 'Welcome to PLUS', duration: '11mins', stage: 'completed', ctaState: 'completed' },
            { id: 2, title: 'Your role at PLUS', duration: '15mins', stage: 'in progress', ctaState: 'in progress' },
            { id: 3, title: 'Tutoring Session Overview', duration: '20mins', stage: 'not started', ctaState: 'not started' },
            { id: 4, title: 'Tutor Session Flow/Responsibilities', duration: '18mins', stage: 'not started', ctaState: 'not started' },
            { id: 5, title: 'Student Communication', duration: '12mins', stage: 'not started', ctaState: 'not started' },
        ];

        return (
            <OnboardingOverviewPage
                featuredModules={featuredModules}
                allModules={allModules}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                onModuleClick={(module) => console.log('Module clicked:', module)}
                onCtaClick={(module) => console.log('CTA clicked:', module)}
            />
        );
    },
    args: {
        sortBy: 'Name',
        sortOrder: 'A-Z',
        showEmptyState: false,
    },
};
