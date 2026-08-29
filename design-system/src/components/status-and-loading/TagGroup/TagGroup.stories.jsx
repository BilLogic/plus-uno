import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import Tag from '../Tag';
import TagGroup from './TagGroup';

/**
 * `TagGroup` — the gaps and the wrapping (#276).
 *
 * The assertions here are about the SET: that it announces itself as a list,
 * that `+n` counts what is actually hidden, and that pressing it reaches the
 * hidden tags rather than only reporting that they exist.
 */

export default {
    title: 'Components/Status and loading/Tag group',
    component: TagGroup,
    parameters: {
        docs: {
            description: {
                component:
                    'Owns what a single tag cannot decide: the gaps between tags, and whether a '
                    + 'long set wraps or collapses behind a `+n` overflow tag.',
            },
        },
    },
};

const SUBJECTS = ['Science', 'Mathematics', 'History', 'Geography', 'Music', 'Art', 'Drama'];

export const Wrapping = () => (
    <div style={{ maxWidth: '320px' }}>
        <TagGroup label="Subjects">
            {SUBJECTS.map((s) => <Tag key={s} color="blue">{s}</Tag>)}
        </TagGroup>
    </div>
);

/**
 * The set announces itself as a list.
 *
 * Without it a screen reader reads seven unrelated words in a row. With it the
 * person is told there are seven of them and can move through them as a group.
 */
Wrapping.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('list', { name: 'Subjects' });
    await expect(within(list).getAllByRole('listitem')).toHaveLength(SUBJECTS.length);
};

/**
 * `+n` counts what is hidden, and pressing it reaches them.
 *
 * An overflow tag that only reports a number tells a person values exist and
 * gives them no way to see them, which is worse than showing no count at all.
 */
export const Overflow = () => (
    <div style={{ maxWidth: '420px' }}>
        <TagGroup label="Subjects" overflow="collapse" maxVisible={3}>
            {SUBJECTS.map((s) => <Tag key={s} color="green">{s}</Tag>)}
        </TagGroup>
    </div>
);

Overflow.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Three tags plus the overflow tag itself.
    await expect(canvas.getAllByRole('listitem')).toHaveLength(4);
    await expect(canvas.queryByText('Music')).toBeNull();

    const more = canvas.getByRole('button', { name: '+4' });
    await userEvent.click(more);

    await expect(canvas.getAllByRole('listitem')).toHaveLength(SUBJECTS.length);
    await expect(canvas.getByText('Music')).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: '+4' })).toBeNull();
};

/**
 * A set short enough to fit shows no overflow tag.
 *
 * `+0` is the failure this guards: an off-by-one in the slice would render an
 * overflow tag claiming nothing is hidden.
 */
export const NoOverflowWhenItFits = () => (
    <TagGroup label="Subjects" overflow="collapse" maxVisible={5}>
        {SUBJECTS.slice(0, 3).map((s) => <Tag key={s} color="teal">{s}</Tag>)}
    </TagGroup>
);

NoOverflowWhenItFits.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
    await expect(canvas.queryByText(/^\+/)).toBeNull();
};

/**
 * Conditional children are skipped, not counted.
 *
 * `{cond && <Tag/>}` is ordinary JSX and yields `false`. Counting those would
 * make `+n` claim tags that do not exist — the count would be right about the
 * array and wrong about the screen.
 */
export const ConditionalChildrenAreNotCounted = () => (
    <TagGroup label="Subjects" overflow="collapse" maxVisible={2}>
        <Tag color="blue">Science</Tag>
        {false && <Tag color="blue">Hidden</Tag>}
        {null}
        <Tag color="blue">History</Tag>
    </TagGroup>
);

ConditionalChildrenAreNotCounted.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('listitem')).toHaveLength(2);
    await expect(canvas.queryByText(/^\+/)).toBeNull();
};

/**
 * A dismissible set: the group holds the gaps, the tags hold the values.
 */
export const DismissibleSet = () => {
    const [picked, setPicked] = useState(SUBJECTS.slice(0, 4));
    return (
        <TagGroup label="Chosen subjects">
            {picked.map((s) => (
                <Tag
                    key={s}
                    variant="dismissible"
                    color="purple"
                    onRemove={() => setPicked((prev) => prev.filter((x) => x !== s))}
                >
                    {s}
                </Tag>
            ))}
        </TagGroup>
    );
};

DismissibleSet.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('listitem')).toHaveLength(4);

    await userEvent.click(canvas.getByRole('button', { name: 'Remove History' }));

    // The list shrinks with it — the group counts what is really there.
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
    await expect(canvas.queryByText('History')).toBeNull();
};

/**
 * `onOverflowClick` replaces the reveal, for opening a picker instead.
 */
export const CustomOverflowAction = () => {
    const [opened, setOpened] = useState(0);
    return (
        <div>
            <TagGroup
                label="Subjects"
                overflow="collapse"
                maxVisible={2}
                overflowLabel={(n) => `${n} more`}
                onOverflowClick={() => setOpened((n) => n + 1)}
            >
                {SUBJECTS.map((s) => <Tag key={s} color="orange">{s}</Tag>)}
            </TagGroup>
            <p className="body2-txt">Picker opened {opened} time(s)</p>
        </div>
    );
};

CustomOverflowAction.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const more = canvas.getByRole('button', { name: '5 more' });

    await userEvent.click(more);
    await expect(canvas.getByText('Picker opened 1 time(s)')).toBeInTheDocument();

    // The default reveal must NOT also run, or the caller's picker opens onto a
    // row that has already expanded behind it.
    await expect(canvas.getByRole('button', { name: '5 more' })).toBeInTheDocument();
    await expect(canvas.queryByText('Music')).toBeNull();
};
