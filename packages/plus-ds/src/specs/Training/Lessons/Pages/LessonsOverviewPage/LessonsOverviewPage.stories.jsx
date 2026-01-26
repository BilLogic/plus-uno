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


const sampleLessons = [
    {
        id: 1,
        title: 'Giving Effective Praise',
        competencyArea: 'socio-emotional',
        status: 'in-progress',
        duration: '12mins',
        showAiIndicator: false,
        description: 'Learn how to give effective praise to increase student motivation.'
    },
    {
        id: 2,
        title: 'Building Relationships',
        competencyArea: 'socio-emotional',
        status: 'in-progress',
        duration: '12mins',
        showAiIndicator: false,
        description: 'Strategies for building strong relationships with students.'
    },
    {
        id: 3,
        title: 'Active Listening',
        competencyArea: 'socio-emotional',
        status: 'in-progress',
        duration: '12mins',
        showAiIndicator: true,
        description: 'Techniques for active listening in the classroom.'
    }
];

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
    args: {},
    argTypes: {
        breakpoint: {
            control: { type: 'select' },
            options: ['md', 'lg', 'xl'],
            description: 'Responsive breakpoint (md: 768px, lg: 1024px, xl: 1440px)',
            table: { category: 'Responsive' },
        },
        statusFilter: {
            control: { type: 'select' },
            options: ['All', 'Assigned', 'In Progress', 'Completed', 'Not Started'],
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
        status: {
            control: { type: 'select' },
            options: ['not-started', 'in-progress', 'completed'],
            description: 'Override status for all lessons',
            table: { category: 'Content' },
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
    args: {
        breakpoint: 'xl'
    },
    render: (args) => (
        <LessonsOverviewPage />
    ),

    parameters: {
        layout: 'fullscreen',
    },
};

/**
 * Interactive
 * Interactive playground with Storybook controls
 */
export const Interactive = {
    render: (args) => {
        const [statusFilter, setStatusFilter] = useState(args.statusFilter || 'All');
        const [sortBy, setSortBy] = useState(args.sortBy || 'Name');
        const [sortOrder, setSortOrder] = useState(args.sortOrder || 'A-Z');
        const [currentView, setCurrentView] = useState(args.currentView || 'list');

        return (
            <LessonsOverviewPage
                lessons={sampleLessons.map(l => ({ ...l, status: args.status || l.status }))}
                statusFilter={statusFilter}
                statusCounts={args.statusCounts}
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
        breakpoint: 'xl',
        statusFilter: 'All',
        status: 'in-progress',
        statusCounts: {
            all: 20,
            assigned: 0,
            inProgress: 0,
            completed: 5,
            notStarted: 15
        },
        sortBy: 'Name',
        sortOrder: 'A-Z',
        currentView: 'list',
    },
};
