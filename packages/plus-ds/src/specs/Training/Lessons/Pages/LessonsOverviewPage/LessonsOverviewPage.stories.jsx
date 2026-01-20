/**
 * LessonsOverviewPage - Training Lessons Page
 * 
 * Full page layout for Lessons Overview with filter bar, lesson list table, and navigation.
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-178237
 */

import React, { useState } from 'react';
import LessonsOverviewPage from './LessonsOverviewPage';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';
import './LessonsOverviewPage.scss';


export default {
    title: 'Specs/Training/Lessons/Pages/LessonsOverviewPage',
    component: LessonsOverviewPage,
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
                component: 'Full page layout for Lessons Overview. Shows filter bar with status select, sort control, view toggle, and expandable lessons table.',
            },
        },
        layout: 'fullscreen',
    },
    args: {
        breakpoint: 'xl',
    },
    argTypes: {

        breakpoint: {
            control: { type: 'select' },
            options: ['md', 'lg', 'xl', 'xxl'],
            description: 'Responsive breakpoint (md: 768px, lg: 992px, xl: 1200px, xxl: 1400px)',
            table: { category: 'Responsive' },
        },
        statusFilter: {
            control: { type: 'select' },
            options: ['all', 'not-started', 'in-progress', 'completed'],
            description: 'Status filter value',
            table: { category: 'Filters' },
        },
        sortBy: {
            control: { type: 'select' },
            options: ['Name', 'Status', 'Competency Areas'],
            description: 'Sort field',
            table: { category: 'Filters' },
        },
        sortOrder: {
            control: { type: 'select' },
            options: ['A-Z', 'Z-A'],
            description: 'Sort order',
            table: { category: 'Filters' },
        },
        currentView: {
            control: { type: 'select' },
            options: ['list', 'grid'],
            description: 'Current view mode',
            table: { category: 'Display' },
        },
    },
};

/**
 * Docs
 * Documentation for LessonsOverviewPage component
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>LessonsOverviewPage</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Full page layout for Lessons Overview. Contains filter bar with TrainingLessonStatusSelect,
                        SortControl, Expand All button, view toggle (list/grid), and expandable LessonsTable.
                    </p>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Features</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li>TopBar with breadcrumbs and user avatar</li>
                        <li>Sidebar navigation</li>
                        <li>Filter bar with status select, sort control, expand all, view toggle</li>
                        <li>LessonsTable with expandable rows</li>
                        <li>Horizontal scrolling for table when needed</li>
                    </ul>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Figma Reference</h4>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Node ID: 63-178237
                    </p>
                </section>
            </div>
        </div>
    ),
};

/**
 * Overview
 * Static rendering matching Figma design exactly
 */
export const Overview = {
    render: () => (
        <LessonsOverviewPage />
    ),

    parameters: {
        layout: 'fullscreen',
    },
    args: {
        breakpoint: 'lg',
    },
};

/**
 * Interactive
 * Interactive playground with Storybook controls
 */
export const Interactive = {
    render: (args) => {
        const [statusFilter, setStatusFilter] = useState(args.statusFilter || 'all');
        const [sortBy, setSortBy] = useState(args.sortBy || 'Name');
        const [sortOrder, setSortOrder] = useState(args.sortOrder || 'A-Z');
        const [currentView, setCurrentView] = useState(args.currentView || 'list');

        return (
            <LessonsOverviewPage

                statusFilter={statusFilter}
                sortBy={sortBy}
                sortOrder={sortOrder}
                currentView={currentView}
                onStatusChange={(value) => {
                    setStatusFilter(value);
                    args.onStatusChange && args.onStatusChange(value);
                }}
                onSortByChange={(value) => {
                    setSortBy(value);
                    args.onSortByChange && args.onSortByChange(value);
                }}
                onOrderChange={(value) => {
                    setSortOrder(value);
                    args.onOrderChange && args.onOrderChange(value);
                }}
                onViewToggle={(view) => {
                    setCurrentView(view);
                    args.onViewToggle && args.onViewToggle(view);
                }}
                onExpandAll={() => {
                    console.log('Expand All clicked');
                    args.onExpandAll && args.onExpandAll();
                }}
                onLessonContinue={(lesson) => {
                    console.log('Continue lesson:', lesson);
                    args.onLessonContinue && args.onLessonContinue(lesson);
                }}
                onLessonClick={(lesson) => {
                    console.log('Lesson clicked:', lesson);
                    args.onLessonClick && args.onLessonClick(lesson);
                }}
            />
        );
    },

    args: {
        breakpoint: 'lg',
        statusFilter: 'all',
        sortBy: 'Name',
        sortOrder: 'A-Z',
        currentView: 'list',
    },
};
