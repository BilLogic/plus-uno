import React from 'react';
import { expect } from 'storybook/test';
import Link, { LINK_APPEARANCES } from '@/components/navigation/Link';

export default {
    title: 'Components/Navigation/Link',
    component: Link,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        appearance: { control: 'select', options: LINK_APPEARANCES, table: { category: 'Design' } },
        href: { control: 'text', table: { category: 'Design' } },
        isOpenInNewWindow: { control: 'boolean', table: { category: 'Design' } },
    },
};

export const Appearances = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {LINK_APPEARANCES.map((appearance) => (
            <Link key={appearance} href="#" appearance={appearance} id={`link-${appearance}`}>
                {appearance} link
            </Link>
        ))}
    </div>
);

Appearances.play = async ({ canvasElement }) => {
    for (const appearance of LINK_APPEARANCES) {
        const node = canvasElement.querySelector(`#link-${appearance}`);
        await expect(node, `${appearance} renders an anchor`).toBeTruthy();
        await expect(node.tagName).toBe('A');
    }
};

export const OpenInNewWindow = () => (
    <Link href="https://example.com" isOpenInNewWindow id="link-new-window">
        Opens elsewhere
    </Link>
);

OpenInNewWindow.play = async ({ canvasElement }) => {
    const node = canvasElement.querySelector('#link-new-window');
    await expect(node.target).toBe('_blank');
    await expect(node.rel).toContain('noopener');
};

export const Interactive = {
    args: { href: '#', appearance: 'default', children: 'Link text', isOpenInNewWindow: false },
    render: (args) => <Link {...args} />,
};
