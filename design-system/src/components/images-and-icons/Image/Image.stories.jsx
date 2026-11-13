import React from 'react';
import { expect } from 'storybook/test';
import { Image, IMAGE_SIZES } from '@/components';
const SAMPLE = 'https://placehold.co/320x180';
const SAMPLE_DARK = 'https://placehold.co/320x180/111/eee';

export default {
    title: 'Components/Images and icons/Image',
    component: Image,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        size: { control: 'select', options: IMAGE_SIZES, table: { category: 'Design' } },
        alt: { control: 'text', table: { category: 'Design' } },
    },
};

export const Sizes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {IMAGE_SIZES.map((size) => (
            <div key={size} style={{ width: '200px' }}>
                <Image src={SAMPLE} alt="" size={size} testId={`image-${size}`} />
            </div>
        ))}
    </div>
);

Sizes.play = async ({ canvasElement }) => {
    for (const size of IMAGE_SIZES) {
        const node = canvasElement.querySelector(`[data-testid="image-${size}"]`);
        await expect(node).toBeTruthy();
        await expect(node.tagName).toBe('IMG');
    }
};

export const DarkVariant = () => (
    <Image src={SAMPLE} srcDark={SAMPLE_DARK} alt="A sample" testId="image-dark" />
);

DarkVariant.play = async ({ canvasElement }) => {
    const picture = canvasElement.querySelector('picture');
    await expect(picture).toBeTruthy();
    const source = picture.querySelector('source');
    await expect(source.getAttribute('srcset')).toBe(SAMPLE_DARK);
};

export const Interactive = {
    args: { src: SAMPLE, alt: 'Sample image', size: 'fluid' },
    render: (args) => <div style={{ width: '240px' }}><Image {...args} /></div>,
};

/** An image is a picture, not a control: its one state is at rest. */
export const Rest = () => <Image src={SAMPLE} alt="A sample" testId="image-rest" />;

Rest.play = async ({ canvasElement }) => {
    const node = canvasElement.querySelector('[data-testid="image-rest"]');
    await expect(node).toHaveAttribute('alt', 'A sample');
    await expect(node).not.toHaveAttribute('tabindex');
};
