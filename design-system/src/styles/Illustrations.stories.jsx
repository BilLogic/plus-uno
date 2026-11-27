import React from 'react';
import { expect } from 'storybook/test';
import { Illustration } from '@/components';
import { typeStyle } from '@/storybook-docs/lib/type-style.js';

/**
 * Specimens for Foundations/Illustrations: the SMART and math characters,
 * drawn by the real `Illustration` component.
 */
export default {
    title: 'Foundations/Brand/Illustrations',
    tags: ['!dev', '!autodocs'],
};

const row = { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--stack-xl) var(--inline-xl)' };
const figure = { margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--stack-sm)' };
const caption = { ...typeStyle('body-sm'), color: 'var(--ds-text-subtle)' };

const Gallery = ({ characters }) => (
    <div style={row}>
        {characters.map((character) => (
            <figure key={character} style={figure}>
                <Illustration character={character} size={96} title={character.replace(/-/g, ' ')} />
                <figcaption style={caption}>{character}</figcaption>
            </figure>
        ))}
    </div>
);

/** One character per SMART area; the body color is the area. */
export const SmartCharacters = {
    render: () => <Gallery characters={['mastering-content', 'advocacy', 'technology', 'relationships', 'social-emotional']} />,
    play: async ({ canvas }) => {
        await expect(canvas.getAllByRole('img')).toHaveLength(5);
    },
};

/** Seven math characters for general moments. */
export const MathCharacters = {
    render: () => <Gallery characters={['dot', 'approximately-equal', 'root', 'all', 'pi', 'equal', 'divider']} />,
    play: async ({ canvas }) => {
        await expect(canvas.getAllByRole('img')).toHaveLength(7);
    },
};
