import React from 'react';
import BadgeCard from './BadgeCard';

export default {
    title: 'Specs/Home/Cards/BadgeCard',
    component: BadgeCard,
    tags: ['autodocs'],
};

export const Default = {
    render: () => (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            gap: '24px', 
            width: '100%',
            flexWrap: 'wrap',
            padding: '24px',
            backgroundColor: 'var(--color-surface-container)'
        }}>
            {/* Card 1: 20/20 Lessons completed with Claim My Badge */}
            {/* This card uses col-4 width (different from default col-3) */}
            <BadgeCard
                description="20/20 Lessons completed"
                badgeType="unclaimed"
                badgeSize="thumbnail"
                buttonText="Claim My Badge"
                tooltipText="Click 'Claim' to add it to your profile and share your accomplishment!"
                onButtonClick={() => console.log('Claim My Badge clicked')}
                style={{ width: 'var(--col-4)' }}
            />

            {/* Card 2: Just Claim button */}
            <BadgeCard
                badgeType="unclaimed"
                buttonText="Claim"
                tooltipText="Click 'Claim' to add it to your profile and share your accomplishment!"
                onButtonClick={() => console.log('Claim clicked')}
            />

            {/* Card 3: Certified Tutor with View My Badge */}
            {/* This card uses col-4 width (different from default col-3) */}
            <BadgeCard
                description="Certified Tutor for completing all training lessons"
                badgeType="claimed-v1"
                badgeSize="thumbnail"
                buttonText="View My Badge"
                tooltipText="completing all training lessons. View your badge to share it!"
                onButtonClick={() => console.log('View My Badge clicked')}
                style={{ width: 'var(--col-4)' }}
            />

            {/* Card 4: Just View button */}
            <BadgeCard
                badgeType="claimed-v1"
                buttonText="View"
                tooltipText="completing all training lessons. View your badge to share it!"
                onButtonClick={() => console.log('View clicked')}
            />
        </div>
    ),
};
