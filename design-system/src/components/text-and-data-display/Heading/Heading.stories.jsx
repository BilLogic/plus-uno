import React from 'react';
import { expect } from 'storybook/test';
import Heading, { HEADING_SIZES, HeadingContextProvider } from '@/components/text-and-data-display/Heading';

export default {
    title: 'Components/Text and data display/Heading',
    component: Heading,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        size: { control: 'select', options: HEADING_SIZES, table: { category: 'Design' } },
        color: { control: 'select', options: ['default', 'inverse'], table: { category: 'Design' } },
        as: { control: false, table: { category: 'Development' } },
    },
};

export const Sizes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {HEADING_SIZES.map((size) => (
            <Heading key={size} size={size} id={`heading-${size}`}>
                {size} heading
            </Heading>
        ))}
    </div>
);

/** Each size draws the matching `--heading-*` text style and the default tag it maps to. */
Sizes.play = async ({ canvasElement }) => {
    const tagOf = {
        xxlarge: 'H1', xlarge: 'H1', large: 'H2', medium: 'H3', small: 'H4', xsmall: 'H5', xxsmall: 'H6',
    };
    for (const size of HEADING_SIZES) {
        const node = canvasElement.querySelector(`#heading-${size}`);
        await expect(node.tagName, `${size} defaults to ${tagOf[size]}`).toBe(tagOf[size]);
    }
};

export const AsOverride = () => (
    <Heading size="xxlarge" as="h2" id="heading-as-override">Large type, h2 semantics</Heading>
);

AsOverride.play = async ({ canvasElement }) => {
    const node = canvasElement.querySelector('#heading-as-override');
    await expect(node.tagName, 'as overrides the size default').toBe('H2');
};

export const Context = () => (
    <HeadingContextProvider level={2}>
        <Heading size="xsmall" id="heading-in-context">Pinned to h2 by its provider</Heading>
    </HeadingContextProvider>
);

Context.play = async ({ canvasElement }) => {
    const node = canvasElement.querySelector('#heading-in-context');
    await expect(node.tagName, 'HeadingContextProvider wins over the size default').toBe('H2');
};

export const Inverse = () => (
    <div style={{ background: 'var(--ds-background-brand-bold)', padding: '16px' }}>
        <Heading size="xlarge" color="inverse" id="heading-inverse">On a bold fill</Heading>
    </div>
);

export const Interactive = {
    args: { size: 'medium', color: 'default', children: 'Heading text' },
    render: (args) => <Heading {...args} />,
};
