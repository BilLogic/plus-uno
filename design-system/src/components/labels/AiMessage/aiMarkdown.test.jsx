import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AiMarkdown, isSafeHref, parseBlocks } from './aiMarkdown';

describe('parseBlocks', () => {
    it('splits paragraphs, headings, lists and fenced code', () => {
        const blocks = parseBlocks('Intro line\nsecond line\n\n## Props\n- one\n- two\n\n1. first\n2. second\n\n```tsx\nimport { Button } from \'@/components\';\n```');
        expect(blocks.map((b) => b.type)).toEqual(['p', 'heading', 'ul', 'ol', 'code']);
        expect(blocks[0].lines).toEqual(['Intro line', 'second line']);
        expect(blocks[2].items).toEqual(['one', 'two']);
        expect(blocks[4]).toEqual({ type: 'code', language: 'tsx', text: "import { Button } from '@/components';" });
    });
});

describe('AiMarkdown', () => {
    it('draws bold, italic, inline code and links, not the raw marks', () => {
        const { container } = render(<AiMarkdown text="Use **Button** with `appearance`, see *also* [Link](?path=/docs/link--docs)." />);
        expect(container.querySelector('strong')).toHaveTextContent('Button');
        expect(container.querySelector('em')).toHaveTextContent('also');
        expect(container.querySelector('code')).toHaveTextContent('appearance');
        expect(screen.getByRole('link', { name: 'Link' })).toHaveAttribute('href', '?path=/docs/link--docs');
        expect(container.textContent).not.toMatch(/\*\*|`/);
    });

    it('keeps a fenced block as code and lists as lists', () => {
        const { container } = render(<AiMarkdown text={'- a\n- b\n\n```\nx = 1\n```'} />);
        expect(container.querySelectorAll('li')).toHaveLength(2);
        expect(container.querySelector('pre code')).toHaveTextContent('x = 1');
    });

    it('leaves an unsafe link as text', () => {
        render(<AiMarkdown text="[click](javascript:alert(1))" />);
        expect(screen.queryByRole('link')).toBeNull();
        expect(isSafeHref('javascript:alert(1)')).toBe(false);
        expect(isSafeHref('https://x.test')).toBe(true);
    });

    it('lets the host rewrite link addresses', () => {
        render(<AiMarkdown text="[Color](color)" resolveHref={(h) => `/docs/${h}`} />);
        expect(screen.getByRole('link', { name: 'Color' })).toHaveAttribute('href', '/docs/color');
    });
});
