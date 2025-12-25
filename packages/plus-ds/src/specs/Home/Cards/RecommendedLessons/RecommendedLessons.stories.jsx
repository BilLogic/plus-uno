import React from 'react';
import RecommendedLessons from './RecommendedLessons';

export default {
    title: 'Specs/Home/Cards/RecommendedLessons',
    component: RecommendedLessons,
    tags: ['autodocs'],
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
            <h3 style={{ marginBottom: '16px', fontFamily: 'var(--font-family-header)', fontSize: 'var(--font-size-h6)' }}>
                Below XXL
            </h3>
            <RecommendedLessons
                breakpoint="< XXL"
                title="Lesson Title"
                badgeType="mastering-content"
                duration="12 mins"
                status="in-progress"
                aiRecommended={true}
            />
        </div>
        <div>
            <h3 style={{ marginBottom: '16px', fontFamily: 'var(--font-family-header)', fontSize: 'var(--font-size-h6)' }}>
                XXL & Above
            </h3>
            <RecommendedLessons
                breakpoint="XXL & above"
                title="Lesson Title"
                badgeType="mastering-content"
                duration="12 mins"
                status="in-progress"
                aiRecommended={true}
            />
        </div>
    </div>
);

