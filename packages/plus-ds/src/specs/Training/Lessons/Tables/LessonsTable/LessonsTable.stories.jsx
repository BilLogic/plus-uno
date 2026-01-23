/**
 * LessonsTable - Training Lessons Table
 * 
 * Data table for displaying lessons with expandable rows.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-178095
 */

import React from 'react';
import LessonsTable from './LessonsTable';
import './LessonsTable.scss';

export default {
    title: 'Specs/Training/Lessons/Tables/LessonsTable',
    component: LessonsTable,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Table showing lessons with expandable rows. Overview story demonstrates visual states (Default, Hover, Pressed, Focus, Disabled).',
            },
        },
    },
    argTypes: {

        headless: {
            control: 'boolean',
            description: 'Hide table header (for stacked tables)',
            table: { category: 'Display' }
        }
    }
};

/**
 * Overview
 * Displays all states (Default, Hover, Pressed, Focus, Disabled) in both Collapsed and Expanded views.
 * States are separated by subtitles.
 */
export const Overview = {
    render: () => {
        const commonLesson = {
            competencyArea: 'socio-emotional',
            status: 'not-started',
            duration: '12mins',
            showAiIndicator: true,
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
        };

        const sections = [
            {
                title: 'Default',
                lessons: [
                    { id: 'def-col', title: 'Lesson Title', ...commonLesson, expanded: false },
                    { id: 'def-exp', title: 'Lesson Title', ...commonLesson, expanded: true }
                ]
            },
            {
                title: 'Hover',
                lessons: [
                    { id: 'hov-col', title: 'Lesson Title', ...commonLesson, expanded: false, state: 'hover' },
                    { id: 'hov-exp', title: 'Lesson Title', ...commonLesson, expanded: true, state: 'hover' }
                ]
            },
            {
                title: 'Pressed',
                lessons: [
                    { id: 'prs-col', title: 'Lesson Title', ...commonLesson, expanded: false, state: 'pressed' },
                    { id: 'prs-exp', title: 'Lesson Title', ...commonLesson, expanded: true, state: 'pressed' }
                ]
            },
            {
                title: 'Focus',
                lessons: [
                    { id: 'foc-col', title: 'Lesson Title', ...commonLesson, expanded: false, state: 'focus' },
                    { id: 'foc-exp', title: 'Lesson Title', ...commonLesson, expanded: true, state: 'focus' }
                ]
            },
            {
                title: 'Disabled',
                lessons: [
                    { id: 'dis-col', title: 'Lesson Title', ...commonLesson, expanded: false, state: 'disabled' },
                    { id: 'dis-exp', title: 'Lesson Title', ...commonLesson, expanded: true, state: 'disabled' }
                ]
            }
        ];

        return (
            <div style={{ padding: '32px', backgroundColor: 'var(--color-surface)' }}>
                <h3 className="h3" style={{ marginBottom: '24px' }}>Lesson List Item States</h3>

                {sections.map((section, index) => (
                    <div key={section.title} style={{ marginBottom: '32px' }}>
                        <h6 className="h6" style={{ marginBottom: '8px', color: 'var(--color-primary)', fontWeight: '600' }}>
                            {section.title}
                        </h6>
                        <LessonsTable
                            lessons={section.lessons}
                            headless={index > 0} // Only show header for the first section
                        />
                    </div>
                ))}
            </div>
        );
    }
};

/**
 * Interactive
 * Playground for testing interaction
 */
export const Interactive = {
    argTypes: {
        rowState: {
            control: 'select',
            options: ['default', 'hover', 'pressed', 'focus', 'disabled'],
            mapping: { 'default': '' },
            description: 'State to apply to all rows for testing',
            table: { category: 'State' }
        },
        forceExpanded: {
            control: 'boolean',
            description: 'Force all rows to be expanded initially',
            table: { category: 'State' }
        }
    },
    render: (args) => {
        const lessonsWithState = args.lessons.map(l => ({
            ...l,
            state: args.rowState || undefined,
            expanded: args.forceExpanded !== undefined ? args.forceExpanded : l.expanded,
            showAiIndicator: true
        }));

        return (
            <div style={{
                padding: 'var(--size-section-pad-y-lg, 32px)',
                backgroundColor: 'transparent'
            }}>
                <LessonsTable
                    lessons={lessonsWithState}

                    headless={args.headless}
                    onLessonContinue={(lesson) => {
                        console.log('Continue:', lesson);
                        args.onLessonContinue && args.onLessonContinue(lesson);
                    }}
                    onLessonAction={(lesson) => {
                        console.log('Action:', lesson);
                        args.onLessonAction && args.onLessonAction(lesson);
                    }}
                    onLessonClick={(lesson) => {
                        console.log('Row Click:', lesson);
                        args.onLessonClick && args.onLessonClick(lesson);
                    }}
                />
            </div>
        );
    },
    args: {
        rowState: '',
        forceExpanded: false,
        lessons: [
            {
                id: 1,
                title: 'Giving Effective Praise',
                description: 'Learn how to give effective praise to increase student motivation.',
                competencyArea: 'socio-emotional',
                status: 'not-started',
                duration: '12mins'
            }
        ],

        headless: false
    }
};
