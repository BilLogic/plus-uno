import React from 'react';
import RecommendedLessons from './RecommendedLessons';

export default {
    title: 'Specs/Home/Cards/Recommended Lessons',
    component: RecommendedLessons,
    tags: ['!dev', '!autodocs'],
};

/**
 * Figma Recommended Lessons — both breakpoints side by side.
 */
export const Overview = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '40px',
            flexWrap: 'wrap',
            padding: '24px',
            backgroundColor: 'var(--color-surface-container-high)',
        }}
    >
        <RecommendedLessons
            breakpoint="< XXL"
            title="Lesson Title"
            badgeType="mastering-content"
            duration="12 mins"
            status="in-progress"
            aiRecommended
        />
        <RecommendedLessons
            breakpoint="XXL & above"
            title="Lesson Title"
            badgeType="mastering-content"
            duration="12 mins"
            status="in-progress"
            aiRecommended
        />
    </div>
);
