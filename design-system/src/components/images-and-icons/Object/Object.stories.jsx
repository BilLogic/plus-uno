import React from 'react';
import { expect } from 'storybook/test';
import { BugIcon, IdeaIcon, OBJECT_SIZES, PageIcon, ProjectIcon, PullRequestIcon, TaskIcon } from '@/components';
export default {
    title: 'Components/Images and icons/Object',
    tags: ['!dev', '!autodocs'],
    argTypes: {
        size: { control: 'select', options: OBJECT_SIZES, table: { category: 'Design' } },
        label: { control: 'text', table: { category: 'Content' } },
    },
};

export const Kinds = () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <TaskIcon testId="object-task" />
        <BugIcon testId="object-bug" />
        <IdeaIcon testId="object-idea" />
        <PullRequestIcon testId="object-pr" />
        <ProjectIcon testId="object-project" />
        <PageIcon testId="object-page" />
    </div>
);

Kinds.play = async ({ canvasElement }) => {
    const task = canvasElement.querySelector('[data-testid="object-task"]');
    await expect(task).toHaveAttribute('aria-label', 'Task');
};

export const Sizes = () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        {OBJECT_SIZES.map((size) => <TaskIcon key={size} size={size} testId={`object-size-${size}`} />)}
    </div>
);

export const Decorative = () => <TaskIcon label="" testId="object-decorative" />;

Decorative.play = async ({ canvasElement }) => {
    const node = canvasElement.querySelector('[data-testid="object-decorative"]');
    await expect(node).toHaveAttribute('aria-hidden', 'true');
    await expect(node.hasAttribute('aria-label')).toBe(false);
};

/** An object glyph is a picture, not a control: its one state is at rest. */
export const Rest = () => <TaskIcon testId="object-rest" />;

Rest.play = async ({ canvasElement }) => {
    const node = canvasElement.querySelector('[data-testid="object-rest"]');
    await expect(node).toHaveAttribute('role', 'img');
    await expect(node).not.toHaveAttribute('tabindex');
};

export const Interactive = {
    args: { size: 16, label: 'Task' },
    render: (args) => <TaskIcon {...args} />,
};
