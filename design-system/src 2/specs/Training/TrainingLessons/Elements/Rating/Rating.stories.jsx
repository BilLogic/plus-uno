/**
 * Rating Stories
 * 
 * Rating component stories
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-177637
 */

import React from 'react';
import Rating from './Rating';
import './Rating.scss';
import '../RatingSingle/RatingSingle.scss';

export default {
    title: 'Specs/Training/TrainingLessons/Elements/Rating',
    component: Rating,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Rating component with 5 rating singles (1-5). Used for confidence and experience ratings.',
            },
        },
    },
    argTypes: {
        rating: {
            control: { type: 'select' },
            options: ['rest', 1, 2, 3, 4, 5],
            description: 'Selected rating value'
        }
    }
};

/**
 * Rest State
 * Default unselected state
 */
export const Rest = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg, 32px)' }}>
            <Rating rating="rest" />
        </div>
    )
};

/**
 * Selected States
 * Different selected rating values
 */
export const Selected = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg, 32px)', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {[1, 2, 3, 4, 5].map(val => (
                <div key={val}>
                    <p className="body2-txt" style={{ marginBottom: '8px' }}>Rating: {val}</p>
                    <Rating rating={val} />
                </div>
            ))}
        </div>
    )
};

/**
 * Interactive
 * Interactive rating with change handler
 */
export const Interactive = {
    render: (args) => {
        const [selectedRating, setSelectedRating] = React.useState(args.rating || 'rest');
        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg, 32px)' }}>
                <p className="body2-txt" style={{ marginBottom: '16px' }}>
                    Selected: {selectedRating === 'rest' ? 'None' : selectedRating}
                </p>
                <Rating
                    rating={selectedRating}
                    onRatingChange={(val) => {
                        setSelectedRating(val);
                        console.log('Rating changed:', val);
                    }}
                />
            </div>
        );
    },
    args: {
        rating: 'rest'
    }
};
