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
import StaticBadgeSmart from '../../../../components/StaticBadgeSmart/StaticBadgeSmart';

export default {
    title: 'Specs/Universal/Elements/SmartBadges',
    component: StaticBadgeSmart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `SMART competency area badges for tracking student progress.

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
 * Shows all SMART badge types and ALL size variants
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
                <h6 className="h6" style={{ marginBottom: '16px' }}>All Size Variants</h6>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3'].map(size => (
                        <div key={size} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span className="body3-txt" style={{ width: '30px', color: 'var(--color-on-surface-variant)' }}>{size}</span>
                            <StaticBadgeSmart type="socio-emotional" size={size} />
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Size Comparison Grid</h6>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    {['h4', 'b1', 'b2', 'b3'].map(size => (
                        <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>{size}</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                <StaticBadgeSmart type="socio-emotional" size={size} />
                                <StaticBadgeSmart type="mastering-content" size={size} />
                                <StaticBadgeSmart type="advocacy" size={size} />
                                <StaticBadgeSmart type="relationships" size={size} />
                                <StaticBadgeSmart type="technology-tools" size={size} />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
};

/**
 * Interactive
 * Playground with controls for type and size
 */
export const Interactive = {
    render: (args) => <StaticBadgeSmart {...args} />,
    args: {
        type: 'socio-emotional',
        size: 'b2'
    },
    argTypes: {
        type: {
            control: { type: 'select' },
            options: ['socio-emotional', 'mastering-content', 'advocacy', 'relationships', 'technology-tools'],
            table: { category: 'Design' }
        },
        size: {
            control: { type: 'select' },
            options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3'],
            table: { category: 'Design' }
        }
    }
};
