import React from 'react';
import StaticBadgeSmart from '@/components/StaticBadgeSmart';

export default {
    title: 'Components/StaticBadgeSmart',
    component: StaticBadgeSmart,
    tags: ['autodocs'],
    argTypes: {
        type: {
            control: 'select',
            options: ['socio-emotional', 'mastering-content', 'advocacy', 'relationships', 'technology-tools'],
            description: 'Badge type',
        },
        size: {
            control: 'select',
            options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3'],
            description: 'Badge size',
        },
    },
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <StaticBadgeSmart type="socio-emotional" size="h5" />
            <StaticBadgeSmart type="mastering-content" size="h5" />
            <StaticBadgeSmart type="advocacy" size="h5" />
            <StaticBadgeSmart type="relationships" size="h5" />
            <StaticBadgeSmart type="technology-tools" size="h5" />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <StaticBadgeSmart type="socio-emotional" size="h1" />
            <StaticBadgeSmart type="socio-emotional" size="h3" />
            <StaticBadgeSmart type="socio-emotional" size="b1" />
        </div>
    </div>
);

export const Interactive = {
    args: {
        type: 'socio-emotional',
        size: 'h5',
    },
};
