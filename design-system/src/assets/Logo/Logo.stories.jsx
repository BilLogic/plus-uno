import React from 'react';
import { expect, within } from 'storybook/test';

import Logo from './Logo';
import { Spinner } from '@/components';
import { DoDontGrid } from '@/storybook-docs/ds-docs-layout.jsx';

/**
 * `Logo` is the PLUS mark, with or without the wordmark.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser and read the rendered frame of each size, so the sizes table
 * on the docs page cannot drift from what is drawn.
 */

export default {
    title: 'Foundations/Logos',
    component: Logo,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'The PLUS mark, with or without the wordmark, in colored, filled and outlined styles.',
            },
        },
    },
    argTypes: {
        style: {
            control: 'select',
            options: ['colored', 'filled', 'outlined'],
            description: 'Visual style of the logo',
            table: { category: 'Appearance' },
        },
        size: {
            control: 'select',
            options: ['XS', 'S', 'M', 'L', 'XL'],
            description: 'Size step',
            table: { category: 'Appearance' },
        },
        text: {
            control: 'boolean',
            description: 'Adds the PLUS wordmark beside the mark',
            table: { category: 'Appearance' },
        },
        className: {
            control: false,
            table: { disable: true },
        },
    },
};

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

/** The frame of the mark-only logo at each step: the mark plus its padding. */
const FRAME = { XS: 60, S: 96, M: 132, L: 192, XL: 224 };

const row = { display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-end' };
const caption = { font: 'var(--body-small)', color: 'var(--ds-text-subtle)' };
const cell = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' };

/** Filled and outlined are drawn in the current text color, so they need a colored ground. */
const colored = {
    padding: '16px',
    borderRadius: 'var(--card-radius)',
    background: 'var(--ds-background-brand-bold)',
    color: 'var(--ds-text-inverse)',
};

/** The default logo: colored, M, no wordmark. */
export const Overview = (args) => <Logo {...args} />;

/* ----------------------------------------------------------------- styles */

export const Styles = () => (
    <div style={row}>
        <div style={cell}>
            <Logo style="colored" size="S" />
            <span style={caption}>colored, on a light ground</span>
        </div>
        <div style={cell}>
            <div style={colored}><Logo style="filled" size="S" /></div>
            <span style={caption}>filled, on a colored ground</span>
        </div>
        <div style={cell}>
            <div style={colored}><Logo style="outlined" size="S" /></div>
            <span style={caption}>outlined, on a tinted ground</span>
        </div>
    </div>
);

/* ------------------------------------------------------------------ sizes */

export const Sizes = () => (
    <div style={row}>
        {SIZES.map((size) => (
            <div key={size} style={cell}>
                <Logo size={size} data-testid={`logo-${size}`} />
                <span style={caption}>{size}</span>
            </div>
        ))}
    </div>
);

/** Each step draws the mark and its padding in the frame the sizes table lists. */
Sizes.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of SIZES) {
        const box = canvas.getByTestId(`logo-${size}`).getBoundingClientRect();
        await expect(Math.round(box.width), `${size} width`).toBe(FRAME[size]);
        await expect(Math.round(box.height), `${size} height`).toBe(FRAME[size]);
    }
};

/* --------------------------------------------------------------- wordmark */

export const Wordmark = () => (
    <div style={row}>
        <div style={cell}>
            <Logo size="S" text={false} />
            <span style={caption}>text off</span>
        </div>
        <div style={cell}>
            <Logo size="S" text />
            <span style={caption}>text on</span>
        </div>
    </div>
);

/* ---------------------------------------------------------------- loading */

export const LoadingMark = () => <Spinner variant="growing" />;

/* ------------------------------------------------------------- do / don't */

const title = { font: 'var(--heading-medium)', color: 'var(--ds-text)' };
const inline = { display: 'flex', alignItems: 'center', gap: '8px' };

export const DoDont = () => (
    <DoDontGrid
        pairs={[
            {
                doExample: (
                    <div style={inline}>
                        <Logo size="XS" text={false} />
                        <span style={title}>PLUS Tutoring</span>
                    </div>
                ),
                doCaption: 'The mark beside the product title.',
                dontExample: (
                    <div style={inline}>
                        <Logo size="XS" text />
                        <span style={title}>PLUS Tutoring</span>
                    </div>
                ),
                dontCaption: 'The wordmark and the title saying PLUS twice.',
            },
            {
                doExample: <Logo size="XS" />,
                doCaption: 'One Logo in the header.',
                dontExample: (
                    <div style={inline}>
                        <Logo size="XS" />
                        <Logo size="XS" />
                    </div>
                ),
                dontCaption: 'Two Logos in the same view.',
            },
        ]}
    />
);
