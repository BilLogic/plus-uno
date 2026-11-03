/**
 * SmartBadges (SMART Competency Badges)
 *
 * SMART competency area badges representing:
 * - **S** - Social-Emotional Learning
 * - **M** - Mastering Content
 * - **A** - Advocacy
 * - **R** - Relationship
 * - **T** - Technology & Tools
 */

import React from 'react';
import SmartTag, { SMART_TAG_SUBJECTS } from '@/components/labels/SmartTag';

export default {
    title: 'Specs/Universal/Elements/Smart Badges',
    component: SmartTag,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: `SMART competency areas, each a Tag in its curriculum color.

| Type | Area |
|------|------|
| S | Social-Emotional Learning |
| M | Mastering Content |
| A | Advocacy |
| R | Relationship |
| T | Technology & Tools |`
            }
        }
    }
};

/**
 * Overview
 * Every SMART area: a Tag in the area's curriculum color. A Tag has
 * one size, so there are no size variants.
 */
export const Overview = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>All Types</h6>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                    {SMART_TAG_SUBJECTS.map((subject) => (
                        <SmartTag key={subject} subject={subject} />
                    ))}
                </div>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>In a row</h6>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {SMART_TAG_SUBJECTS.map((subject) => (
                        <SmartTag key={subject} subject={subject} />
                    ))}
                </div>
            </section>
        </div>
    )
};

/**
 * Interactive
 * Playground with a control for the subject
 */
export const Interactive = {
    render: (args) => <SmartTag {...args} />,
    args: {
        subject: 'social-emotional'
    },
    argTypes: {
        subject: {
            control: { type: 'select' },
            options: SMART_TAG_SUBJECTS,
            table: { category: 'Design' }
        }
    }
};
