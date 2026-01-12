/**
 * RatingSingle Stories
 * 
 * Single rating button component stories
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-177643
 */

import React from 'react';
import RatingSingle from './RatingSingle';
import './RatingSingle.scss';

export default {
    title: 'Specs/Training/Lessons/Elements/RatingSingle',
    component: RatingSingle,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Single rating button with rest and selected states. Used within Rating component.',
            },
        },
    },
    argTypes: {
        value: {
            control: { type: 'number', min: 1, max: 5 },
            description: 'Rating value (1-5)'
        },
        status: {
            control: { type: 'select' },
            options: ['rest', 'selected'],
            description: 'Button status'
        }
    }
};

/**
 * Rest State
 * Default unselected state
 */
export const Rest = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg, 32px)', display: 'flex', gap: '16px' }}>
            {[1, 2, 3, 4, 5].map(val => (
                <RatingSingle key={val} value={val} status="rest" />
            ))}
        </div>
    )
};

/**
 * Selected State
 * Selected state
 */
export const Selected = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg, 32px)', display: 'flex', gap: '16px' }}>
            {[1, 2, 3, 4, 5].map(val => (
                <RatingSingle key={val} value={val} status={val === 3 ? 'selected' : 'rest'} />
            ))}
        </div>
    )
};

/**
 * Interactive
 * Interactive rating single with click handler
 */
export const Interactive = {
    render: (args) => {
        const [selected, setSelected] = React.useState(args.value || 1);
        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg, 32px)', display: 'flex', gap: '16px' }}>
                {[1, 2, 3, 4, 5].map(val => (
                    <RatingSingle
                        key={val}
                        value={val}
                        status={selected === val ? 'selected' : 'rest'}
                        onClick={() => setSelected(val)}
                    />
                ))}
            </div>
        );
    },
    args: {
        value: 1
    }
};
