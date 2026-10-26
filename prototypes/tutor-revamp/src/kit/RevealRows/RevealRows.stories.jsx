import React from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Button } from '@/components';
import { RevealRows, RevealRow } from './RevealRows';
import { STUDENTS } from '../../data/mock';
import { DARK, LIGHT, onSurface } from '../storyModes';

/** RevealRows: a row's action shows on hover and on focus. */
export default {
    title: 'Prototypes/Tutor revamp/Kit/Reveal rows',
    component: RevealRows,
    decorators: [(Story) => <div style={{ width: 560 }}><Story /></div>, onSurface],
    render: () => (
        <RevealRows columns="minmax(0, 1fr) 80px" label="Students">
            {STUDENTS.map((s) => (
                <RevealRow key={s.id} action={<Button text="Open" style="default" fill="tonal" size="small" aria-label={`Open ${s.name}`} />}>
                    <span>{s.name}</span>
                </RevealRow>
            ))}
        </RevealRows>
    ),
};

const opacityOf = (el) => getComputedStyle(el.closest('[data-part="action"]')).opacity;

export const Light = {
    ...LIGHT,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const open = canvas.getByRole('button', { name: 'Open Arlene McCoy' });
        await waitFor(() => expect(opacityOf(open)).toBe('0'));
        // Hover is the same CSS rule as focus-within; a synthetic hover cannot
        // reach :hover, so the reveal is asserted through focus.
        const morgan = canvas.getByRole('button', { name: 'Open Morgan Reed' });
        morgan.focus();
        await waitFor(() => expect(opacityOf(morgan)).toBe('1'));
        morgan.blur();
    },
};
export const Dark = { ...DARK };
