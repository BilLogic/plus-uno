import React from 'react';
import { Button } from '@/components';
import { expect } from 'storybook/test';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';
import Avatar from '@/components/images-and-icons/Avatar';
import Comment from '@/components/forms-and-inputs/Comment';

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
        content="Top-level comment"
        nestedReplies={(
            <Comment author="Teacher" content="A reply" />
        )}
    />
);

WithNestedReplies.play = async ({ canvasElement }) => {
    const node = canvasElement.querySelector('#comment-nested');
    const replies = node.querySelector('.plus-comment-replies');
    await expect(replies).toHaveTextContent('A reply');
    await expect(replies.querySelectorAll('.plus-comment')).toHaveLength(1);
};

export const Interactive = {
    args: { author: 'Ari Patel', content: 'Comment text', isSaving: false, isHighlighted: false },
    render: (args) => <Comment {...args} />,
};

const radiusOf = (root, selector) => getComputedStyle(root.querySelector(selector)).borderTopLeftRadius;
Basic.play = async ({ canvasElement }) => {
    await expect(radiusOf(canvasElement, '.plus-comment'), 'Comment radius is 12').toBe('12px');
};
