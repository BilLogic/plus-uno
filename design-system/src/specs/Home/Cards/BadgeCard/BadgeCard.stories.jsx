import React from 'react';
import BadgeCard from './BadgeCard';

export default {
    title: 'Specs/Home/Cards/Badge Card',
    component: BadgeCard,
    tags: ['!dev', '!autodocs'],
};

/**
 * Figma Overview Card / Training Progress — badge status × size matrix (sans floating tooltips).
 */
export const Overview = {
    render: () => (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '24px',
                flexWrap: 'wrap',
                padding: '24px',
                backgroundColor: 'var(--color-surface-container-high)',
            }}
        >
            <BadgeCard
                size=">M"
                headline="20/20"
                subline="Lessons completed"
                badgeType="unclaimed"
                buttonText="Claim My Badge"
                tooltipText="Click 'Claim' to add it to your profile and share your accomplishment!"
            />
            <BadgeCard
                size="M"
                badgeType="unclaimed"
                buttonText="Claim"
                tooltipText="Click 'Claim' to add it to your profile and share your accomplishment!"
            />
            <BadgeCard
                size=">M"
                headline="Certified Tutor"
                subline="for completing all training lessons"
                badgeType="claimed-v1"
                buttonText="View My Badge"
                tooltipText="This badge was awarded for completing all training lessons. View your badge to share it!"
            />
            <BadgeCard
                size="M"
                badgeType="claimed-v1"
                buttonText="View"
                tooltipText="This badge was awarded for completing all training lessons. View your badge to share it!"
            />
        </div>
    ),
};
