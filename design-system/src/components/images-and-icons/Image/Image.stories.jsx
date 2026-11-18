import React from 'react';
import { expect } from 'storybook/test';
import { Image, IMAGE_SIZES } from '@/components';
import sessionSummaryLight from '@/assets/images/lessons/session-summary-light.svg';
import sessionSummaryDark from '@/assets/images/lessons/session-summary-dark.svg';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)' }}>
        {IMAGE_SIZES.map((size) => (
            <div key={size} style={{ width: '200px' /* token gap: 200px */ }}>
                <Image src={sessionSummaryLight} alt="" size={size} testId={`image-${size}`} />
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
    <Image
        src={sessionSummaryLight}
        srcDark={sessionSummaryDark}
        alt="Weekly tutoring session summary in light and dark mode"
        testId="image-dark"
    />
);

DarkVariant.play = async ({ canvasElement }) => {
    const picture = canvasElement.querySelector('picture');
    await expect(picture).toBeTruthy();
    const source = picture.querySelector('source');
    await expect(source.getAttribute('srcset')).toBe(sessionSummaryDark);
};

export const Interactive = {
    args: { src: sessionSummaryLight, alt: 'Weekly tutoring session summary', size: 'fluid' },
    render: (args) => <div style={{ width: '240px' }}><Image {...args} /></div>,
};

/** An image is a picture, not a control: its one state is at rest. */
export const Rest = () => (
    <Image src={sessionSummaryLight} alt="Weekly tutoring session summary" testId="image-rest" />
);

Rest.play = async ({ canvasElement }) => {
    const node = canvasElement.querySelector('[data-testid="image-rest"]');
    await expect(node).toHaveAttribute('alt', 'Weekly tutoring session summary');
    await expect(node).not.toHaveAttribute('tabindex');
};
