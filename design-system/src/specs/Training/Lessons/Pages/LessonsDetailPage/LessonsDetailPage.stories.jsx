/**
 * LessonsDetailPage Stories
 * 
 * Lesson detail page component stories
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-178289
 */

import React, { useState } from 'react';
import { Select } from '@/components';
import LessonsDetailPage from './LessonsDetailPage';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';
import './LessonsDetailPage.scss';

import '@/specs/Training/Lessons/Elements/Rating/Rating.scss';
import '@/specs/Training/Lessons/Elements/RatingSingle/RatingSingle.scss';

export default {
    title: 'Specs/Training/Lessons/Pages/Lessons Detail Page',
    component: LessonsDetailPage,
    tags: ['!dev', '!autodocs'],
    decorators: [
        (Story, context) => (
            <ResponsiveFrame breakpoint={(context.globals?.plusBreakpoint || context.args.breakpoint || 'native') || 'native'}>
                <Story />
            </ResponsiveFrame>
        ),
    ],
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
        },
        breakpoint: {
            control: { type: 'select' },
            options: ['md', 'lg', 'xl'],
            description: 'Responsive breakpoint',
            table: { category: 'Responsive' },
        },
    },
    args: {},
};

/**
 * P1 - Intro/Content with Ratings
 */
export const P1 = {
    name: 'P1',
    render: (args) => (
        <LessonsDetailPage
            variant="P1"
            lessonTitle={args.lessonTitle}
            estimatedTime={args.estimatedTime}
            onBack={() => console.log('Back clicked')}
            onRatingChange={(rating) => console.log('Rating changed:', rating)}
        />
    ),
    args: {
        breakpoint: 'native',
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
        <LessonsDetailPage
            variant="P2"
            lessonTitle={args.lessonTitle}
            onBack={() => console.log('Back clicked')}
            onPrevious={() => console.log('Previous clicked')}
            onNext={() => console.log('Next clicked')}
        />
    ),
    args: {
        breakpoint: 'native',
        lessonTitle: 'Giving Effective Praise'
    }
};

/**
 * P3 - Conclusion & Feedback
 */
export const P3 = {
    name: 'P3',
    render: (args) => (
        <LessonsDetailPage
            variant="P3"
            lessonTitle={args.lessonTitle}
            onBack={() => console.log('Back clicked')}
            onPrevious={() => console.log('Previous clicked')}
            onNext={() => console.log('Next clicked')}
        />
    ),
    args: {
        breakpoint: 'native',
        lessonTitle: 'Giving Effective Praise'
    }
};

/**
 * P4 - Scenario/Assessment
 */
export const P4 = {
    name: 'P4',
    render: (args) => (
        <LessonsDetailPage
            variant="P4"
            lessonTitle={args.lessonTitle}
            onBack={() => console.log('Back clicked')}
            onPrevious={() => console.log('Previous clicked')}
            onNext={() => console.log('Next clicked')}
        />
    ),
    args: {
        breakpoint: 'native',
        lessonTitle: 'Giving Effective Praise'
    }
};

/**
 * P5 - Congratulations
 */
export const P5 = {
    name: 'P5',
    render: (args) => (
        <LessonsDetailPage
            variant="P5"
            lessonTitle={args.lessonTitle}
            onBack={() => console.log('Back clicked')}
            onPrevious={() => console.log('Previous clicked')}
            onNext={() => console.log('Next clicked')}
        />
    ),
    args: {
        breakpoint: 'native',
        lessonTitle: 'Giving Effective Praise'
    }
};

const VARIANT_OPTIONS = [
    { value: 'P1', label: 'P1 - Intro/Content with Ratings' },
    { value: 'P2', label: 'P2 - Research Says' },
    { value: 'P3', label: 'P3 - Conclusion & Feedback' },
    { value: 'P4', label: 'P4 - Scenario/Assessment' },
    { value: 'P5', label: 'P5 - Congratulations' },
];

/**
 * Interactive - Variant selector with controls
 */
export const Interactive = {
    name: 'Interactive',
    render: (args) => {
        const [variant, setVariant] = useState(args.variant || 'P1');

        const variants = ['P1', 'P2', 'P3', 'P4', 'P5'];

        const handleNext = () => {
            const currentIndex = variants.indexOf(variant);
            if (currentIndex < variants.length - 1) {
                setVariant(variants[currentIndex + 1]);
            }
        };

        const handlePrevious = () => {
            const currentIndex = variants.indexOf(variant);
            if (currentIndex > 0) {
                setVariant(variants[currentIndex - 1]);
            }
        };

        return (
            <div>
                <div style={{
                    padding: 'var(--space-100)',
                    backgroundColor: 'var(--ds-surface-container)',
                    marginBottom: 'var(--space-100)',
                }}>
                    <Select
                        label="Variant"
                        spacing="compact"
                        clearable={false}
                        options={VARIANT_OPTIONS}
                        value={variant}
                        onChange={setVariant}
                    />
                </div>
                <LessonsDetailPage
                    variant={variant}
                    lessonTitle={args.lessonTitle}
                    estimatedTime={args.estimatedTime}
                    onBack={() => console.log('Back clicked')}
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    onRatingChange={(rating) => console.log('Rating changed:', rating)}
                />
            </div>
        );
    },
    args: {
        breakpoint: 'native',
        variant: 'P1',
        lessonTitle: 'Giving Effective Praise',
        estimatedTime: '15 Minutes'
    }
};
