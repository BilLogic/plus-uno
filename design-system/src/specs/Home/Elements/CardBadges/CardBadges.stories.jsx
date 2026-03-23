import React from 'react';
import { CardBadges } from './CardBadges';

export default {
    title: 'Specs/Home/Elements/CardBadges',
    component: CardBadges,
    parameters: {
        layout: 'centered',
    },
};

export const Overview = () => (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <CardBadges state="increase" percentage={12} />
        <CardBadges state="decrease" percentage={8} />
    </div>
);

