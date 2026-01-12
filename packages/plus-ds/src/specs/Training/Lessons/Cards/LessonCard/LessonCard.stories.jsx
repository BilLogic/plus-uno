/**
 * LessonCard - Training Lessons Card
 * 
 * Lesson card with thumbnail, tags, title, status, and action buttons.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-177597
 */

import React from 'react';
import LessonCard from './LessonCard';
import './LessonCard.scss';

export default {
    title: 'Specs/Training/Lessons/Cards/LessonCard',
    component: LessonCard,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Lesson card with thumbnail (or description text), competency area badge, duration, title, status indicator, optional AI indicator, and Continue button. Supports default and hover states.',
            },
        },
    },
    argTypes: {
        lessonTitle: {
            control: 'text',
            description: 'Lesson title',
            table: { category: 'Content' }
        },
        lessonDescription: {
            control: 'text',
            description: 'Lesson description for thumbnail',
            table: { category: 'Content' }
        },
        competencyArea: {
            control: { type: 'select' },
            options: ['socio-emotional', 'mastering-content', 'advocacy', 'relationships', 'technology-tools'],
            description: 'SMART competency area',
            table: { category: 'Content' }
        },
        duration: {
            control: 'text',
            description: 'Lesson duration',
            table: { category: 'Content' }
        },
        status: {
            control: { type: 'select' },
            options: ['not-started', 'in-progress', 'completed', 'assigned'],
            description: 'Lesson status',
            table: { category: 'State' }
        },
        showAiIndicator: {
            control: 'boolean',
            description: 'Whether to show AI indicator',
            table: { category: 'Display' }
        },
        state: {
            control: { type: 'select' },
            options: ['default', 'hover'],
            description: 'Card state',
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
            <h3 className="h3" style={{ marginBottom: '16px' }}>LessonCard</h3>
            <p className="body2-txt" style={{ marginBottom: '24px' }}>
                Lesson card with thumbnail (or description text), competency area badge, duration, title,
                status indicator, optional AI indicator, and Continue button. Supports default and hover states.
            </p>
            <ul className="body2-txt" style={{ marginBottom: '24px', paddingLeft: '20px' }}>
                <li>Thumbnail area with description text (opacity changes on hover)</li>
                <li>Competency area badge (SMART badge)</li>
                <li>Duration display</li>
                <li>Lesson title (H5)</li>
                <li>Divider line</li>
                <li>Continue button (primary filled)</li>
                <li>Status indicator icon</li>
                <li>Optional AI indicator</li>
            </ul>
            <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                Figma Node: 63-177597
            </p>
        </div>
    )
};

/**
 * Overview
 * Default card with sample data
 */
export const Overview = {
    render: () => (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg, 32px)', 
            backgroundColor: 'var(--color-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            alignItems: 'flex-start'
        }}>
            <LessonCard 
                lessonTitle="Introduction to Social-Emotional Learning"
                lessonDescription="Learn the fundamentals of SEL"
                competencyArea="socio-emotional"
                duration="12 mins"
                status="not-started"
                showAiIndicator={true}
                onContinue={() => console.log('Continue clicked')}
            />
            <LessonCard 
                lessonTitle="Building Strong Relationships"
                lessonDescription="Explore relationship-building strategies"
                competencyArea="relationships"
                duration="15 mins"
                status="in-progress"
                showAiIndicator={true}
                state="hover"
                onContinue={() => console.log('Continue clicked')}
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
            <LessonCard
                lessonTitle={args.lessonTitle}
                lessonDescription={args.lessonDescription}
                competencyArea={args.competencyArea}
                duration={args.duration}
                status={args.status}
                showAiIndicator={args.showAiIndicator}
                state={args.state}
                onContinue={() => {
                    console.log('Continue clicked');
                    args.onContinue && args.onContinue();
                }}
                onClick={() => {
                    console.log('Card clicked');
                    args.onClick && args.onClick();
                }}
            />
        </div>
    ),
    args: {
        lessonTitle: 'Introduction to Social-Emotional Learning',
        lessonDescription: 'Learn the fundamentals of SEL',
        competencyArea: 'socio-emotional',
        duration: '12 mins',
        status: 'not-started',
        showAiIndicator: true,
        state: 'default'
    }
};
