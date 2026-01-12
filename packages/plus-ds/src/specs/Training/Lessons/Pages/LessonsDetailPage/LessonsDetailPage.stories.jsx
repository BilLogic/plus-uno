/**
 * LessonsDetailPage Stories
 * 
 * Lesson detail page component stories
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-178289
 */

import React, { useState } from 'react';
import LessonsDetailPage from './LessonsDetailPage';
import ResponsiveFrame from '../ResponsiveFrame';
import './LessonsDetailPage.scss';
import '../../Elements/Rating/Rating.scss';
import '../../Elements/RatingSingle/RatingSingle.scss';

export default {
    title: 'Specs/Training/Lessons/Pages/LessonsDetailPage',
    component: LessonsDetailPage,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Individual lesson detail page with 5 variants (P1-P5).

| Variant | Description |
|---------|-------------|
| P1 | Intro/Content - Lesson intro with Likert Scale confidence & experience ratings |
| P2 | Research Says - Research content with comparison table |
| P3 | Conclusion & Feedback - Summary with feedback links and references |
| P4 | Scenario Assessment - Questions with textarea and radio options |
| P5 | Congratulations - Completion page with final rating |`,
            },
        },
        layout: 'fullscreen',
    },
    argTypes: {
        variant: {
            control: { type: 'select' },
            options: ['P1', 'P2', 'P3', 'P4', 'P5'],
            description: 'Page variant'
        },
        lessonTitle: {
            control: { type: 'text' },
            description: 'Lesson title'
        },
        estimatedTime: {
            control: { type: 'text' },
            description: 'Estimated time to complete (P1 only)'
        }
    }
};

/**
 * P1 - Intro/Content with Ratings
 */
export const P1 = {
    name: 'P1',
    render: (args) => (
        <ResponsiveFrame breakpoint={args.breakpoint}>
            <LessonsDetailPage
                variant="P1"
                lessonTitle={args.lessonTitle}
                estimatedTime={args.estimatedTime}
                onBack={() => console.log('Back clicked')}
                onRatingChange={(rating) => console.log('Rating changed:', rating)}
            />
        </ResponsiveFrame>
    ),
    args: {
        breakpoint: 'xl',
        lessonTitle: 'Giving Effective Praise',
        estimatedTime: '15 Minutes'
    }
};

/**
 * P2 - Research Says
 */
export const P2 = {
    name: 'P2',
    render: (args) => (
        <ResponsiveFrame breakpoint={args.breakpoint}>
            <LessonsDetailPage
                variant="P2"
                lessonTitle={args.lessonTitle}
                onBack={() => console.log('Back clicked')}
                onPrevious={() => console.log('Previous clicked')}
                onNext={() => console.log('Next clicked')}
            />
        </ResponsiveFrame>
    ),
    args: {
        breakpoint: 'xl',
        lessonTitle: 'Giving Effective Praise'
    }
};

/**
 * P3 - Conclusion & Feedback
 */
export const P3 = {
    name: 'P3',
    render: (args) => (
        <ResponsiveFrame breakpoint={args.breakpoint}>
            <LessonsDetailPage
                variant="P3"
                lessonTitle={args.lessonTitle}
                onBack={() => console.log('Back clicked')}
                onPrevious={() => console.log('Previous clicked')}
                onNext={() => console.log('Next clicked')}
            />
        </ResponsiveFrame>
    ),
    args: {
        breakpoint: 'xl',
        lessonTitle: 'Giving Effective Praise'
    }
};

/**
 * P4 - Scenario/Assessment
 */
export const P4 = {
    name: 'P4',
    render: (args) => (
        <ResponsiveFrame breakpoint={args.breakpoint}>
            <LessonsDetailPage
                variant="P4"
                lessonTitle={args.lessonTitle}
                onBack={() => console.log('Back clicked')}
                onPrevious={() => console.log('Previous clicked')}
                onNext={() => console.log('Next clicked')}
            />
        </ResponsiveFrame>
    ),
    args: {
        breakpoint: 'xl',
        lessonTitle: 'Giving Effective Praise'
    }
};

/**
 * P5 - Congratulations
 */
export const P5 = {
    name: 'P5',
    render: (args) => (
        <ResponsiveFrame breakpoint={args.breakpoint}>
            <LessonsDetailPage
                variant="P5"
                lessonTitle={args.lessonTitle}
                onBack={() => console.log('Back clicked')}
                onPrevious={() => console.log('Previous clicked')}
                onNext={() => console.log('Next clicked')}
            />
        </ResponsiveFrame>
    ),
    args: {
        breakpoint: 'xl',
        lessonTitle: 'Giving Effective Praise'
    }
};

/**
 * Interactive - Variant selector with controls
 */
export const Interactive = {
    name: 'Interactive',
    render: (args) => {
        const [variant, setVariant] = useState(args.variant || 'P1');
        return (
            <div>
                <div style={{ 
                    padding: '16px', 
                    backgroundColor: 'var(--color-surface-container)', 
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <label className="body2-txt">Variant:</label>
                    <select
                        value={variant}
                        onChange={(e) => setVariant(e.target.value)}
                        style={{ 
                            padding: '8px 12px', 
                            borderRadius: '4px', 
                            border: '1px solid var(--color-outline-variant)',
                            fontSize: '14px'
                        }}
                    >
                        <option value="P1">P1 - Intro/Content with Ratings</option>
                        <option value="P2">P2 - Research Says</option>
                        <option value="P3">P3 - Conclusion & Feedback</option>
                        <option value="P4">P4 - Scenario/Assessment</option>
                        <option value="P5">P5 - Congratulations</option>
                    </select>
                </div>
                <ResponsiveFrame breakpoint={args.breakpoint}>
                    <LessonsDetailPage
                        variant={variant}
                        lessonTitle={args.lessonTitle}
                        estimatedTime={args.estimatedTime}
                        onBack={() => console.log('Back clicked')}
                        onPrevious={() => console.log('Previous clicked')}
                        onNext={() => console.log('Next clicked')}
                        onRatingChange={(rating) => console.log('Rating changed:', rating)}
                    />
                </ResponsiveFrame>
            </div>
        );
    },
    args: {
        breakpoint: 'xl',
        variant: 'P1',
        lessonTitle: 'Giving Effective Praise',
        estimatedTime: '15 Minutes'
    }
};
