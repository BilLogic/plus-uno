import React from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { AiSources } from './AiSources';

/**
 * `AiSources` -- what an AI answer read, listed under the message.
 *
 * THE TEST SEAM IS THIS FILE. Each play reads what a person meets: the list
 * named "Sources", one link per source, and the toggle that shows the rest.
 */
export default {
    title: 'AI UI/Components/AI message/AI sources',
    component: AiSources,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        sources: { control: 'object', table: { category: 'Content' } },
        target: { control: 'text', table: { category: 'Development' } },
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

/** Up to three sources, each a link with its type beside it. */
export const Overview = {
    args: { sources: SOURCES.slice(0, 3) },
    play: async ({ canvasElement }) => {
        const list = within(canvasElement).getByRole('list', { name: 'Sources' });
        await expect(within(list).getAllByRole('link')).toHaveLength(3);
    },
};

/** Past three, the rest fold behind "Show N more sources". */
export const MoreThanThree = {
    args: { sources: SOURCES },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByRole('link')).toHaveLength(3);
        await userEvent.click(canvas.getByRole('button', { name: 'Show 2 more sources' }));
        await expect(canvas.getAllByRole('link')).toHaveLength(5);
        await expect(canvas.getByRole('button', { name: 'Show fewer sources' }).getAttribute('aria-expanded')).toBe('true');
    },
};

/** The playground. */
export const Interactive = { args: { sources: SOURCES } };
