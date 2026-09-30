/**
 * SmartBadges (SMART Competency Badges)
 * 
 * SMART competency area badges representing:
 * - **S** - Socio-Emotional Learning
 * - **M** - Mastering Content
 * - **A** - Advocacy
 * - **R** - Relationships
 * - **T** - Technology & Tools
 */

import React from 'react';
import StaticBadgeSmart from '@/components/_internal/StaticBadgeSmart/StaticBadgeSmart';

export default {
    title: 'Specs/Universal/Elements/Smart Badges',
    component: StaticBadgeSmart,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: `SMART competency areas, each a read-only Tag in its curriculum color.

| Type | Area |
|------|------|
| S | Socio-Emotional Learning |
| M | Mastering Content |
| A | Advocacy |
| R | Relationships |
| T | Technology & Tools |`
            }
        }
    }
};

/**
 * Overview
 * Every SMART area: a read-only Tag in the area's curriculum color. A Tag has
 * one size, so there are no size variants.
 */
export const Overview = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>All Types</h6>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                    <StaticBadgeSmart type="socio-emotional" />
                    <StaticBadgeSmart type="mastering-content" />
                    <StaticBadgeSmart type="advocacy" />
                    <StaticBadgeSmart type="relationships" />
                    <StaticBadgeSmart type="technology-tools" />
                </div>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>In a row</h6>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <StaticBadgeSmart type="socio-emotional" />
                    <StaticBadgeSmart type="mastering-content" />
                    <StaticBadgeSmart type="advocacy" />
                    <StaticBadgeSmart type="relationships" />
                    <StaticBadgeSmart type="technology-tools" />
                </div>
            </section>
        </div>
    )
};

/**
 * Interactive
 * Playground with a control for the area
 */
export const Interactive = {
    render: (args) => <StaticBadgeSmart {...args} />,
    args: {
        type: 'socio-emotional'
    },
    argTypes: {
        type: {
            control: { type: 'select' },
            options: ['socio-emotional', 'mastering-content', 'advocacy', 'relationships', 'technology-tools'],
            table: { category: 'Design' }
        },
        size: { table: { disable: true } }
    }
};
