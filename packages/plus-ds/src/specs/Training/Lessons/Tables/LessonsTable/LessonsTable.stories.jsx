/**
 * LessonsTable - Training Lessons Table
 * 
 * Data table for displaying lessons with expandable rows.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-178095
 */

import React, { useState } from 'react';
import LessonsTable from './LessonsTable';
import './LessonsTable.scss';

export default {
    title: 'Specs/Training/Lessons/Tables/LessonsTable',
    component: LessonsTable,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Table showing lessons with expandable rows (showing description when expanded), status icons or badges, competency area badges, duration, and action buttons/links (Continue/Start/Review). Supports both icon-based and pill-based status display modes.',
            },
        },
    },
    argTypes: {
        showProgress: {
            control: 'boolean',
            description: 'Show progress column',
            table: { category: 'Display' }
        },
        usePills: {
            control: 'boolean',
            description: 'Use status pills instead of icons',
            table: { category: 'Display' }
        }
    }
};

/**
 * Docs
 * Documentation page
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg, 32px)' }}>
            <h3 className="h3" style={{ marginBottom: '16px' }}>LessonsTable</h3>
            <p className="body2-txt" style={{ marginBottom: '24px' }}>
                Table showing lessons with expandable rows, status indicators, competency badges, duration, and actions.
            </p>
            <ul className="body2-txt" style={{ marginBottom: '24px', paddingLeft: '20px' }}>
                <li>Expandable rows showing description when expanded</li>
                <li>Status icons or badges (configurable)</li>
                <li>Competency area badges (SMART badges)</li>
                <li>Duration display</li>
                <li>Action buttons/links (Continue/Start/Review)</li>
                <li>Optional progress column</li>
                <li>Optional AI indicator</li>
            </ul>
            <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                Figma Node: 63-178095
            </p>
        </div>
    )
};

/**
 * Overview
 * Default table with sample data
 */
export const Overview = {
    render: () => (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg, 32px)', 
            backgroundColor: 'var(--color-surface)'
        }}>
            <LessonsTable 
                lessons={[
                    { 
                        id: 1, 
                        title: 'Giving Effective Praise', 
                        description: 'Learn how to give effective praise to increase student motivation.',
                        competencyArea: 'socio-emotional', 
                        status: 'not-started', 
                        duration: '12mins', 
                        showAiIndicator: true 
                    },
                    { 
                        id: 2, 
                        title: 'Building Rapport', 
                        description: 'Strategies for building strong relationships with students.',
                        competencyArea: 'relationships', 
                        status: 'in-progress', 
                        duration: '15mins', 
                        showAiIndicator: false 
                    },
                    { 
                        id: 3, 
                        title: 'Goal Setting', 
                        description: 'Help students set and achieve meaningful goals.',
                        competencyArea: 'advocacy', 
                        status: 'completed', 
                        duration: '10mins', 
                        showAiIndicator: true 
                    }
                ]}
                onLessonContinue={(lesson) => console.log('Continue:', lesson)}
            />
        </div>
    )
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    render: (args) => (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg, 32px)', 
            backgroundColor: 'var(--color-surface)'
        }}>
            <LessonsTable
                lessons={args.lessons}
                showProgress={args.showProgress}
                usePills={args.usePills}
                onLessonContinue={(lesson) => {
                    console.log('Continue:', lesson);
                    args.onLessonContinue && args.onLessonContinue(lesson);
                }}
                onLessonAction={(lesson) => {
                    console.log('Action:', lesson);
                    args.onLessonAction && args.onLessonAction(lesson);
                }}
            />
        </div>
    ),
    args: {
        lessons: [
            { 
                id: 1, 
                title: 'Giving Effective Praise', 
                description: 'Learn how to give effective praise to increase student motivation.',
                competencyArea: 'socio-emotional', 
                status: 'not-started', 
                duration: '12mins', 
                showAiIndicator: true 
            },
            { 
                id: 2, 
                title: 'Building Rapport', 
                description: 'Strategies for building strong relationships with students.',
                competencyArea: 'relationships', 
                status: 'in-progress', 
                duration: '15mins', 
                showAiIndicator: false 
            }
        ],
        showProgress: false,
        usePills: false
    }
};
