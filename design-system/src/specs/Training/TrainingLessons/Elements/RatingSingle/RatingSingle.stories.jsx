/**
 * RatingSingle Stories
 * 
 * Single rating button component stories
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-177673
 */

import React from 'react';
import RatingSingle from './RatingSingle';
import './RatingSingle.scss';

export default {
    title: 'Specs/Training/TrainingLessons/Elements/RatingSingle',
    component: RatingSingle,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Single rating button with rest and selected states. Shows ONE number with ONE radio button. Used as a building block within the Rating component.',
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
 * Overview
 * Shows both variants: rest (empty circle) and selected (filled circle)
 */
export const Overview = {
    render: () => (
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center' }}>
            <div>
                <h4 style={{ marginBottom: '16px', textAlign: 'center' }}>Rest State</h4>
                <RatingSingle value={1} status="rest" />
            </div>
            <div>
                <h4 style={{ marginBottom: '16px', textAlign: 'center' }}>Selected State</h4>
                <RatingSingle value={1} status="selected" />
            </div>
        </div>
    )
};

/**
 * Interactive
 * Interactive single rating button - click to toggle between rest and selected
 */
export const Interactive = {
    render: (args) => {
        const [isSelected, setIsSelected] = React.useState(false);
        return (
            <div style={{ padding: '32px', display: 'flex', justifyContent: 'center' }}>
                <RatingSingle
                    value={1}
                    status={isSelected ? 'selected' : 'rest'}
                    onClick={() => setIsSelected(!isSelected)}
                />
            </div>
        );
    },
    args: {
        value: 1,
        status: 'rest'
    }
};
