import React from 'react';
import { expect, within } from 'storybook/test';

import { DoDontGrid } from '@/storybook-docs/ds-docs-layout.jsx';

/**
 * Image and Figure are the Bootstrap image utilities on `img` and `figure`
 * elements. No PLUS component wraps them, so these stories render the markup
 * itself and the docs page shows what to write.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser and read what the browser computes: the padding and radius
 * of the thumbnail frame, how a fluid picture scales, and where the caption sits.
 */

export default {
    title: 'Components/Images and icons/Image',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'The Bootstrap image and figure utilities. They place a picture in content and map to no PLUS component.',
            },
        },
    },
};

/** A picture drawn in the page's own teal, so it needs no file and works in every color mode. */
const picture = (width, height) => 'data:image/svg+xml;utf8,'
    + encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
        + `<rect width="${width}" height="${height}" fill="#8fc7c0"/>`
        + `<circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) / 4}" fill="#e6f4f1"/></svg>`,
    );

const row = { display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' };

/* ---------------------------------------------------------------- image */

export const Thumbnail = () => (
    <div style={row}>
        <img
            src={picture(200, 200)}
            className="img-thumbnail"
            alt="A lesson diagram, 200 by 200, at its own size"
            width={200}
            height={200}
            data-testid="fixed"
        />
        <div style={{ width: '200px' }}>
            <img
                src={picture(400, 200)}
                className="img-thumbnail img-fluid"
                alt="A lesson diagram that scales with its column"
                data-testid="fluid"
            />
        </div>
    </div>
);

/** A fluid thumbnail never overflows its column, and a thumbnail pads 4 around the picture. */
Thumbnail.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fluid = canvas.getByTestId('fluid');
    await expect(fluid.getBoundingClientRect().width).toBeLessThanOrEqual(200);
    await expect(parseFloat(getComputedStyle(canvas.getByTestId('fixed')).paddingTop)).toBe(4);
};

/* --------------------------------------------------------------- figure */

const Figure = ({ fluid = true, align = 'left', width = 200, height = 200, ...rest }) => (
    <figure className="figure" style={{ margin: 0, maxWidth: '240px' }} {...rest}>
        <img
            src={picture(width, height)}
            className={`figure-img img-thumbnail${fluid ? ' img-fluid' : ''}`}
            alt="A number line from 0 to 10 with 7 marked"
        />
        <figcaption className={`figure-caption text-${align === 'right' ? 'end' : 'start'}`}>
            A caption for the above image.
        </figcaption>
    </figure>
);

export const FigureWithCaption = () => (
    <div style={row}>
        <Figure fluid align="left" data-testid="left" />
        <Figure fluid align="right" data-testid="right" />
    </div>
);

/** The caption is part of the figure, and its alignment follows the class. */
FigureWithCaption.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const side of ['left', 'right']) {
        const caption = canvas.getByTestId(side).querySelector('figcaption');
        await expect(caption).toHaveTextContent('A caption for the above image.');
        await expect(getComputedStyle(caption).textAlign).toBe(side);
    }
};

export const FigureSizing = () => (
    <div style={row}>
        <Figure fluid width={200} height={200} />
        <Figure fluid={false} width={200} height={200} />
    </div>
);

/* ------------------------------------------------------------- do / don't */

export const DoDont = () => (
    <DoDontGrid
        pairs={[
            {
                doExample: <Figure fluid align="left" />,
                doCaption: 'A Figure with its caption.',
                dontExample: (
                    <div style={{ maxWidth: '240px' }}>
                        <img src={picture(200, 200)} className="img-thumbnail img-fluid" alt="A number line from 0 to 10 with 7 marked" />
                        <p style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)', margin: 0 }}>A caption for the above image.</p>
                    </div>
                ),
                dontCaption: 'An Image with a separate line of text under it.',
            },
            {
                doExample: <Figure fluid align="left" />,
                doCaption: 'A left-aligned caption in a left-aligned column.',
                dontExample: <Figure fluid align="right" />,
                dontCaption: 'A right-aligned caption under a picture in a left-aligned column.',
            },
        ]}
    />
);

/* -------------------------------------------------------------- playground */

export const Interactive = ({ fluid, align, width, height }) => (
    <Figure fluid={fluid} align={align} width={width} height={height} />
);
Interactive.args = { fluid: true, align: 'left', width: 200, height: 200 };
Interactive.argTypes = {
    fluid: { control: 'boolean', description: 'Adds img-fluid, so the picture scales down with its container.' },
    align: { control: 'inline-radio', options: ['left', 'right'], description: 'Aligns the caption.' },
    width: { control: 'number', description: 'The picture\'s own width.' },
    height: { control: 'number', description: 'The picture\'s own height.' },
};
