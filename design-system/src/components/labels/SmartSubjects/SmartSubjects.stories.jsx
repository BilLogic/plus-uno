import React from 'react';

import { SMART_TAG_COLORS, StaticBadgeSmart, Tag, TagContext } from '@/components';

/**
 * The five SMART subjects as the product draws them: a read-only Tag filled in
 * the subject's SMART colors. The test seam for how they render is
 * `LabelMigration.stories.jsx`; this file shows them for the docs page.
 */

const SUBJECTS = [
    'socio-emotional',
    'mastering-content',
    'advocacy',
    'relationships',
    'technology-tools',
];

export default {
    title: 'Components/Labels/Status, count & tag/SMART subjects',
    component: StaticBadgeSmart,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'The five SMART subjects of tutoring, each with a color of its own, drawn as a '
                    + 'read-only Tag filled in that color.',
            },
        },
    },
};

const row = { display: 'flex', flexWrap: 'wrap', gap: 'var(--size-element-gap-sm)', alignItems: 'center' };

/** All five subjects, filled in their SMART colors. */
export const Subjects = () => (
    <div style={row}>
        {SUBJECTS.map((type) => (
            <StaticBadgeSmart key={type} type={type} />
        ))}
    </div>
);

/** Each subject beside the outlined Tag in the accent its colors alias. */
export const AsTags = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'max-content max-content', gap: 'var(--size-element-gap-sm) var(--size-element-gap-lg)' }}>
        {SUBJECTS.map((type) => (
            <React.Fragment key={type}>
                <StaticBadgeSmart type={type} />
                <Tag color={SMART_TAG_COLORS[type]}>{SMART_TAG_COLORS[type]}</Tag>
            </React.Fragment>
        ))}
    </div>
);

/** A subject in a disabled field turns to Tag's disabled look. */
export const Disabled = () => (
    <TagContext.Provider value={{ isDisabled: true }}>
        <div style={row}>
            {SUBJECTS.map((type) => (
                <StaticBadgeSmart key={type} type={type} />
            ))}
        </div>
    </TagContext.Provider>
);

/** Change the props in the docs playground. */
export const Interactive = {
    args: { type: 'mastering-content' },
    argTypes: {
        type: { control: 'select', options: SUBJECTS },
    },
    render: (args) => <StaticBadgeSmart {...args} />,
};
