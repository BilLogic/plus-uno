import React from 'react';
import { expect } from 'storybook/test';
import { Image, IMAGE_FITS } from '@/components';
import sessionSummaryLight from '@/assets/images/kit/session-summary-light.svg';
import sessionSummaryDark from '@/assets/images/kit/session-summary-dark.svg';

export default {
    title: 'Components/Images and icons/Image',
    component: Image,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        fit: { control: 'select', options: IMAGE_FITS, table: { category: 'Design' } },
        alt: { control: 'text', table: { category: 'Design' } },
    },
};

export const Fits = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-xl)' }}>
        {IMAGE_FITS.map((fit) => (
            <div key={fit} style={{ width: '200px' /* token gap: 200px */ }}>
                <Image src={sessionSummaryLight} alt="" fit={fit} testId={`image-${fit}`} />
            </div>
        ))}
    </div>
);

Fits.play = async ({ canvasElement }) => {
    for (const fit of IMAGE_FITS) {
        const node = canvasElement.querySelector(`[data-testid="image-${fit}"]`);
        await expect(node).toBeTruthy();
        await expect(node.tagName).toBe('IMG');
    }
};

export const DarkVariant = () => (
    <Image
        src={sessionSummaryLight}
        srcDark={sessionSummaryDark}
        alt="Weekly tutoring session summary"
        testId="image-dark"
    />
);

DarkVariant.play = async ({ canvasElement }) => {
    const dark = canvasElement.querySelector('.plus-image--dark');
    await expect(dark).toBeTruthy();
    await expect(dark.getAttribute('src')).toBe(sessionSummaryDark);
};

export const Interactive = {
    args: { src: sessionSummaryLight, alt: 'Weekly tutoring session summary', fit: 'container' },
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
