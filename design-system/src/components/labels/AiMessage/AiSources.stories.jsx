import React from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { AiSources } from './AiSources';

/**
 * `AiSources` -- what an AI answer read, folded under the message.
 *
 * THE TEST SEAM IS THIS FILE. Each play reads what a person meets: the
 * "Sources (N)" toggle, and behind it the list named "Sources", one link per source.
 */
export default {
    title: 'AI UI/Components/AI message/AI sources',
    component: AiSources,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        sources: { control: 'object', table: { category: 'Content' } },
        target: { control: 'text', table: { category: 'Development' } },
        defaultOpen: { control: 'boolean', table: { category: 'Behavior' } },
        className: { table: { disable: true } },
    },
};

const SOURCES = [
    { title: 'Week 6 engagement report', href: '#report', type: 'Report' },
    { title: 'Visual representations', href: '#lesson', type: 'Lesson' },
    { title: 'Session notes, Mon 4:00 PM', href: '#notes', type: 'Session' },
    { title: 'Tutor handbook: pacing', href: '#handbook', type: 'Guide' },
    { title: 'Grade 7 math plan', href: '#plan', type: 'Plan' },
];

/** Closed at first: the toggle carries the count, and opens the list of links. */
export const Overview = {
    args: { sources: SOURCES.slice(0, 3) },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByRole('list', { name: 'Sources' })).toBeNull();
        const toggle = canvas.getByRole('button', { name: 'Sources (3)' });
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await userEvent.click(toggle);
        const list = canvas.getByRole('list', { name: 'Sources' });
        await expect(within(list).getAllByRole('link')).toHaveLength(3);
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    },
};

/** The same address twice shows once, and the count says so. */
export const Repeated = {
    args: { sources: [...SOURCES, SOURCES[0], SOURCES[1]], defaultOpen: true },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Sources (5)' })).toBeInTheDocument();
        await expect(canvas.getAllByRole('link')).toHaveLength(5);
    },
};

/** The playground. */
export const Interactive = { args: { sources: SOURCES } };
