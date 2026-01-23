/**
 * LikertScale Element Stories
 */

import React, { useState } from 'react';
import LikertScale from './LikertScale';

export default {
    title: 'Specs/Training/Lessons/Elements/LikertScale',
    component: LikertScale,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `
# LikertScale

Likert scale component with end labels and numbered options (1-5).
Displays labels on both ends with numbers and radio buttons in the center.

Figma Reference: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-177681
`
            }
        }
    },
    argTypes: {
        value: {
            control: 'number',
            description: 'Currently selected value (1-5)'
        },
        leftLabel: {
            control: 'text',
            description: 'Left end label'
        },
        rightLabel: {
            control: 'text',
            description: 'Right end label'
        },
        minValue: {
            control: 'number',
            description: 'Minimum value'
        },
        maxValue: {
            control: 'number',
            description: 'Maximum value'
        }
    }
};

export const Overview = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', padding: '24px' }}>
            <div>
                <h4 style={{ marginBottom: '16px' }}>Confidence Scale (Default)</h4>
                <LikertScale value={3} />
            </div>
            <div>
                <h4 style={{ marginBottom: '16px' }}>Agreement Scale</h4>
                <LikertScale
                    value={4}
                    leftLabel="Strongly Disagree"
                    rightLabel="Strongly Agree"
                />
            </div>
            <div>
                <h4 style={{ marginBottom: '16px' }}>Satisfaction Scale</h4>
                <LikertScale
                    value={5}
                    leftLabel="Very Unsatisfied"
                    rightLabel="Very Satisfied"
                />
            </div>
            <div>
                <h4 style={{ marginBottom: '16px' }}>7-Point Scale</h4>
                <LikertScale
                    value={4}
                    minValue={1}
                    maxValue={7}
                    leftLabel="Not at all likely"
                    rightLabel="Extremely likely"
                />
            </div>
        </div>
    )
};

export const Interactive = {
    render: (args) => {
        const [value, setValue] = useState(args.value);
        return (
            <div style={{ padding: '24px' }}>
                <h4 style={{ marginBottom: '16px' }}>
                    Selected: {value ? value : 'None'}
                </h4>
                <LikertScale
                    value={value}
                    onChange={setValue}
                    leftLabel={args.leftLabel}
                    rightLabel={args.rightLabel}
                    minValue={args.minValue}
                    maxValue={args.maxValue}
                />
            </div>
        );
    },
    args: {
        value: 3,
        leftLabel: 'Not at all confident',
        rightLabel: 'Extremely confident',
        minValue: 1,
        maxValue: 5
    }
};

