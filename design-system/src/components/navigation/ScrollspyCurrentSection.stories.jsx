import React from 'react';
import { expect, within } from 'storybook/test';

import Scrollspy, { ScrollspyContent } from './Scrollspy/Scrollspy';

/**
 * Saying which section the reader is in.
 *
 * WHY THIS FILE EXISTS (#325). `Scrollspy` marked the current item with a class
 * and nothing else. The whole purpose of the component — "you are here" — was
 * therefore available only to someone looking at the colour: a screen-reader
 * user got a list of links with no indication of position, which is the same
 * list they would have got with no scrollspy at all.
 *
 * `aria-current="location"` rather than `"page"`: every item points at a section
 * INSIDE the page already open, and "page" would claim the reader had navigated
 * somewhere they have not.
 *
 * The landmark's name was the second half. It was the fixed string "Scrollspy
 * navigation", so two on a page were two landmarks with one name, and neither
 * said what it navigated.
 */

export default {
    title: 'Components/Navigation/Scrollspy current section',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Regression cover for #325: the current section is announced, and the '
                    + 'landmark can be named.',
            },
        },
    },
};

const ITEMS = [
    { text: 'Scope', href: '#css-scope' },
    { text: 'Retention', href: '#css-retention' },
];

export const CurrentSectionIsAnnounced = () => (
    <div style={{ display: 'flex', gap: '24px', maxWidth: '720px' }}>
        <Scrollspy
            id="css-nav"
            brand="Policy"
            items={ITEMS}
            contentId="css-content"
            aria-label="Policy sections"
        />
        <ScrollspyContent id="css-content" height="160px" aria-label="Policy">
            <section id="css-scope"><h3>Scope</h3><p>Who this applies to.</p></section>
            <section id="css-retention"><h3>Retention</h3><p>How long we keep it.</p></section>
        </ScrollspyContent>
    </div>
);

CurrentSectionIsAnnounced.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The landmark answers to the name the caller gave it, not to the fixed one.
    const nav = canvas.getByRole('navigation', { name: 'Policy sections' });
    await expect(nav).toBeTruthy();

    // Exactly one item is current, and it is the section at the top.
    const links = within(nav).getAllByRole('link');
    const current = links.filter((link) => link.getAttribute('aria-current') === 'location');
    await expect(current).toHaveLength(1);
    await expect(current[0].textContent).toContain('Scope');

    // "location" and not "page": the reader has not left the page.
    await expect(links.some((link) => link.getAttribute('aria-current') === 'page')).toBe(false);
};
