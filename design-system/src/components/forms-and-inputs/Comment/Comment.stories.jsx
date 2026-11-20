import { LONG_TUTOR, LONG_SENTENCE, expectNoSilentClip, expectInsideWell } from '../_internal/overflowPlays';
import React from 'react';
import { Button, Avatar, Comment } from '@/components';
import { expect, within } from 'storybook/test';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';
export default {
    title: 'Components/Forms and inputs/Comment',
    component: Comment,
    tags: ['!dev', '!autodocs'],
};

export const Basic = () => (
    <Comment
        id="comment-basic"
        avatar={<Avatar name="Ari Patel" />}
        author="Ari Patel"
        time="2h ago"
        content="Can we move Thursday's session to 5pm?"
        actions={<Button>Reply</Button>}
    />
);

Basic.play = async ({ canvasElement }) => {
    const node = canvasElement.querySelector('#comment-basic');
    await expect(node.querySelector('.plus-comment-author')).toHaveTextContent('Ari Patel');
    await expect(node.querySelector('.plus-comment-actions')).toHaveTextContent('Reply');
};

export const Saving = () => (
    <Comment
        id="comment-saving"
        author="Ari Patel"
        content="Can we move Thursday's session to 5pm?"
        actions={<Button>Reply</Button>}
        isSaving
        savingText="Saving your reply…"
    />
);

Saving.play = async ({ canvasElement }) => {
    const node = canvasElement.querySelector('#comment-saving');
    await expect(node.querySelector('.plus-comment-saving')).toHaveTextContent('Saving your reply…');
    await expect(node.querySelector('.plus-comment-actions')).toBeNull();
};

export const Highlighted = () => (
    <Comment id="comment-highlighted" author="Ari Patel" content="Pinned note." isHighlighted />
);

Highlighted.play = async ({ canvasElement }) => {
    const node = canvasElement.querySelector('#comment-highlighted');
    await expect(node).toHaveClass('plus-comment--highlighted');
    await expect(getComputedStyle(node).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-selected'));
};

export const Edited = () => (
    <Comment
        id="comment-edited"
        avatar={<Avatar name="Ari Patel" />}
        author="Ari Patel"
        time="2h ago"
        edited="Edited"
        content="Can we move Thursday's session to 5pm?"
    />
);

Edited.play = async ({ canvasElement }) => {
    const node = canvasElement.querySelector('#comment-edited');
    await expect(node.querySelector('.plus-comment-edited')).toHaveTextContent('Edited');
    await expect(getComputedStyle(node.querySelector('.plus-comment-edited')).color).toBe(tokenColor(canvasElement, '--ds-text-subtle'));
};

export const Restricted = () => (
    <Comment
        id="comment-restricted"
        author="Ari Patel"
        time="2h ago"
        restrictedTo="Visible to staff only"
        content="Scheduling note for the team."
    />
);

Restricted.play = async ({ canvasElement }) => {
    const node = canvasElement.querySelector('#comment-restricted');
    await expect(node.querySelector('.plus-comment-restricted')).toHaveTextContent('Visible to staff only');
};

export const WithNestedReplies = () => (
    <Comment
        id="comment-nested"
        author="Ari Patel"
        content="Should we review fractions again before Friday's quiz?"
        nestedReplies={(
            <Comment author="Maya K." content="Yes, let's start with a five-minute warm-up." />
        )}
    />
);

WithNestedReplies.play = async ({ canvasElement }) => {
    const node = canvasElement.querySelector('#comment-nested');
    const replies = node.querySelector('.plus-comment-replies');
    await expect(replies).toHaveTextContent("Yes, let's start with a five-minute warm-up.");
    await expect(replies.querySelectorAll('.plus-comment')).toHaveLength(1);
};

export const Interactive = {
    args: { author: 'Ari Patel', content: 'Moved Maya K. to the 4:00 PM ET math group.', isSaving: false, isHighlighted: false },
    render: (args) => <Comment {...args} />,
};

const radiusOf = (root, selector) => getComputedStyle(root.querySelector(selector)).borderTopLeftRadius;
Basic.play = async ({ canvasElement }) => {
    await expect(radiusOf(canvasElement, '.plus-comment'), 'Comment radius is 16').toBe('16px');
};

/** Wrap: a long author name and a long note take more lines inside the comment; nothing is clipped. */
export const Overflow = {
    render: () => (
        <div style={{ width: '320px' /* demo frame */ }}>
            <Comment author={LONG_TUTOR} content={LONG_SENTENCE} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const comment = canvasElement.querySelector('.plus-comment');
        await expectNoSilentClip(canvasElement);
        await expectInsideWell(comment, canvasElement.firstElementChild);
        await expect(canvasElement).toHaveTextContent(LONG_TUTOR);
        await expect(canvasElement).toHaveTextContent(LONG_SENTENCE);
    },
};
