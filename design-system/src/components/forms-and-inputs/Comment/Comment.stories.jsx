import React from 'react';
import { expect } from 'storybook/test';
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
        actions={<button type="button">Reply</button>}
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
        actions={<button type="button">Reply</button>}
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

export const WithNestedReplies = () => (
    <Comment
        author="Ari Patel"
        content="Top-level comment"
        nestedReplies={(
            <Comment author="Teacher" content="A reply" />
        )}
    />
);

export const Interactive = {
    args: { author: 'Ari Patel', content: 'Comment text', isSaving: false, isHighlighted: false },
    render: (args) => <Comment {...args} />,
};
