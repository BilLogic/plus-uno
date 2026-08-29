import React from 'react';
import { expect, within } from 'storybook/test';

import Carousel from './Carousel/Carousel';

/**
 * What a `Carousel` slide does with a string.
 *
 * WHY THIS FILE EXISTS (#316). `slides[].content` is typed `string | node`, and
 * the string branch had two destinations: a path ending in an image extension
 * became an `img`, and everything else was written into the DOM with
 * `dangerouslySetInnerHTML`. `slides` is a public prop, so any caller piping a
 * review body, a note or an API description through it had an injection — and
 * the comment above the branch said as much before doing it anyway.
 *
 * No guard could have caught this. `propTypes` validates that the value is a
 * string, which it is; axe has nothing to say about escaped versus unescaped
 * text; and every story in `Carousel.stories.jsx` passes elements, so the
 * string branch had no coverage at all. The defect was one `grep` away and
 * nothing was grepping.
 *
 * The assertion is deliberately the crude one: put a tag in a slide, and check
 * that it is TEXT on the page and not an element in the tree. Both halves are
 * needed — "the text is visible" alone passes if the browser also parsed it.
 */

export default {
    title: 'Components/Layout and structure/Slide content escaping',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Regression cover for #316: a string slide renders as text, never as markup.',
            },
        },
    },
};

/** A caller passing text they did not write. */
const untrusted = '<img src=x onerror="window.__slideEscaped = false"> Ran 45 minutes over.';

export const StringSlidesRenderAsText = () => (
    <div style={{ maxWidth: '640px' }}>
        <Carousel
            slides={[{ content: untrusted }]}
            controls={false}
            indicators={false}
            data-testid="sce-carousel"
        />
    </div>
);

StringSlidesRenderAsText.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Half one: the string is on the page, whole, as text.
    await expect(canvas.getByText(untrusted)).toBeTruthy();

    // Half two: and it was not parsed. An `img` here is the defect — the
    // element the string would have become, in the tree, with its handler.
    await expect(canvasElement.querySelectorAll('img')).toHaveLength(0);
};

/**
 * The image path branch is unchanged, and has to stay unchanged.
 *
 * A fix that escaped everything would have taken the `img` slide with it, which
 * is the shipped behaviour every existing call site depends on.
 */
export const ImagePathsStillRenderAsImages = () => (
    <div style={{ maxWidth: '640px' }}>
        <Carousel
            slides={[{ content: '/logo.svg', alt: 'A slide' }]}
            controls={false}
            indicators={false}
        />
    </div>
);

ImagePathsStillRenderAsImages.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const image = canvas.getByRole('img', { name: 'A slide' });
    await expect(image.getAttribute('src')).toBe('/logo.svg');
};
