import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import TagInput from './TagInput';

/**
 * `TagInput` — a labelled field of Tags, each with a × where removing it can
 * take effect.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser. They assert what a person can observe: the label names
 * the group, a × removes its own tag, and a field that cannot remove anything
 * offers no ×. Label association across every form component is held in
 * `LabelAssociation.stories.jsx`, not repeated here.
 */

export default {
    title: 'Components/Forms and inputs/Tag input',
    component: TagInput,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A labelled field holding a set of short values as Tags. TagInput keeps the list '
                    + 'itself when `tags` is not passed, and each tag carries a × wherever removing it '
                    + 'can take effect.',
            },
        },
    },
    argTypes: {
        label: {
            control: 'text',
            description: 'Field label. Names the group the tags sit in.',
            table: { category: 'Content' },
        },
        required: {
            control: 'boolean',
            description: 'Draws the required asterisk after the label',
            table: { category: 'Content' },
        },
        size: {
            control: 'radio',
            options: ['small', 'medium', 'large'],
            description: 'Size variant',
            table: { category: 'Design' },
        },
        disabled: {
            control: 'boolean',
            description: 'Disables every tag and removes every ×',
            table: { category: 'Behavior' },
        },
        tags: { control: false, table: { disable: true, category: 'Development' } },
        defaultTags: { control: 'object', table: { category: 'Development' } },
        onAdd: { control: false, table: { disable: true, category: 'Development' } },
        onRemove: { control: false, table: { disable: true, category: 'Development' } },
        onChange: { control: false, table: { disable: true, category: 'Development' } },
        id: { control: false, table: { disable: true, category: 'Development' } },
        name: { control: false, table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
        style: { control: false, table: { disable: true, category: 'Development' } },
    },
};

const TOPICS = ['Algebra', 'Geometry', 'Fractions'];

export const Overview = () => (
    <div style={{ maxWidth: '600px' }}>
        <TagInput label="Topics" defaultTags={TOPICS} />
    </div>
);

/**
 * The label names the group, and a × removes its own tag and no other.
 *
 * Uncontrolled, so the field keeps the list itself: the removal is visible
 * without a handler.
 */
Overview.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group', { name: 'Topics' });
    await expect(within(group).getByText('Geometry')).toBeInTheDocument();

    await userEvent.click(within(group).getByRole('button', { name: 'Remove Geometry' }));

    await expect(within(group).queryByText('Geometry')).not.toBeInTheDocument();
    await expect(within(group).getByText('Algebra')).toBeInTheDocument();
    await expect(within(group).getByText('Fractions')).toBeInTheDocument();
};

export const Sizes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
        {['small', 'medium', 'large'].map((size) => (
            <TagInput key={size} label={`Topics, ${size}`} size={size} defaultTags={TOPICS} />
        ))}
    </div>
);

export const Colors = () => (
    <div style={{ maxWidth: '600px' }}>
        <TagInput
            label="Subjects"
            defaultTags={[
                { value: 'math', text: 'Math', color: 'blue' },
                { value: 'reading', text: 'Reading', color: 'green' },
                { value: 'science', text: 'Science', color: 'purple' },
                'Other',
            ]}
        />
    </div>
);

export const Disabled = () => (
    <div style={{ maxWidth: '600px' }}>
        <TagInput label="Topics" defaultTags={TOPICS} disabled />
    </div>
);

/** A disabled field leaves nothing to press: no × on any tag. */
Disabled.play = async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole('group', { name: 'Topics' });
    await expect(within(group).getByText('Algebra')).toBeInTheDocument();
    await expect(within(group).queryAllByRole('button', { name: /^Remove/ })).toHaveLength(0);
};

const ControlledField = () => {
    const [tags, setTags] = useState(TOPICS);
    return <TagInput label="Controlled, with onChange" tags={tags} onChange={setTags} />;
};

export const Controlled = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
        <ControlledField />
        <TagInput label="Controlled, no handler" tags={TOPICS} />
    </div>
);

/**
 * A controlled field offers a × only when it has a handler to tell. Without
 * one, pressing it could change nothing, so it is not drawn.
 */
Controlled.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const handled = canvas.getByRole('group', { name: 'Controlled, with onChange' });
    const bare = canvas.getByRole('group', { name: 'Controlled, no handler' });

    await expect(within(bare).queryAllByRole('button', { name: /^Remove/ })).toHaveLength(0);

    await userEvent.click(within(handled).getByRole('button', { name: 'Remove Algebra' }));
    await expect(within(handled).queryByText('Algebra')).not.toBeInTheDocument();
    await expect(within(bare).getByText('Algebra')).toBeInTheDocument();
};

// Keyed on `defaultTags`, which an uncontrolled field reads once: editing the
// control remounts the field rather than leaving the old list on screen.
export const Interactive = (args) => (
    <div style={{ maxWidth: '600px' }}>
        <TagInput key={JSON.stringify(args.defaultTags)} {...args} />
    </div>
);

Interactive.args = {
    label: 'Topics',
    required: false,
    size: 'medium',
    disabled: false,
    defaultTags: TOPICS,
};
