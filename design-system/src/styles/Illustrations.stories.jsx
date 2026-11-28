import React from 'react';
import { expect } from 'storybook/test';
import { Illustration } from '@/components';
import { typeStyle } from '@/storybook-docs/lib/type-style.js';

/**
 * Specimens for Foundations/Illustrations: the competency area and math characters,
 * drawn by the real `Illustration` component.
 */
export default {
    title: 'Foundations/Brand/Illustrations',
    tags: ['!dev', '!autodocs'],
};

// One neutral panel, as the Shadow ramp figures sit, with an even grid of
// sunken tiles: each character gets room for its arms and fuzzy edge, so no
// two characters or captions touch.
const panel = {
    boxSizing: 'border-box',
    width: '100%',
    padding: 'var(--card-pad)',
    borderRadius: 'var(--card-radius)',
    background: 'var(--ds-background-neutral)',
};
const grid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(calc(var(--image-xl) * 3.5), 1fr))',
    gap: 'var(--grid-gutter)',
};
const tile = {
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--stack-md)',
    padding: 'var(--card-pad)',
    borderRadius: 'var(--card-radius)',
    background: 'var(--ds-surface-sunken)',
};
const art = { flex: 1, display: 'grid', placeItems: 'center', minHeight: 'calc(var(--image-xl) * 3)' };
const name = { ...typeStyle('body-sm'), color: 'var(--ds-text)', textAlign: 'center' };
const label = (character) => {
    const words = character.replace(/-/g, ' ');
    return words[0].toUpperCase() + words.slice(1);
};

const Gallery = ({ characters }) => (
    <div data-docs-stage="" style={panel}>
        <div style={grid}>
            {characters.map((character) => (
                <figure key={character} style={tile}>
                    <span style={art}>
                        <Illustration character={character} size={96} title={label(character)} />
                    </span>
                    <figcaption style={name}>{label(character)}</figcaption>
                </figure>
            ))}
        </div>
    </div>
);

/** One character per competency area; the body color is the area. */
export const CompetencyAreaCharacters = {
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
