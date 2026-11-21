import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { expectTypeCardAnchors } from '@/storybook-docs/lib/type-card-anchors.jsx';
import { CODE, CountBareCase, CountInWordsCase, ScopeNamedCase, ScopeUnnamedCase } from './SearchCases.jsx';

vi.mock('@storybook/addon-docs/blocks', () => import('@/storybook-docs/lib/addon-docs-blocks-mock.jsx'));

describe('Search live example links', () => {
    it('links every TypeCard anchor to a unique ComponentExample heading id in Search.mdx', () => {
        expectTypeCardAnchors(join(__dirname, 'Search.mdx'), 3);
    });
});

describe('Search do and don\'t cases', () => {
    it('prints consumer code for all four examples', () => {
        for (const key of ['ScopeNamed', 'ScopeUnnamed', 'CountInWords', 'CountBare']) {
            expect(CODE[key], key).toContain('<Section');
            expect(CODE[key], key).not.toMatch(/\b[A-Z]\w*Case\b|storybook-docs/);
        }
    });

    it('names the scope in the placeholder, or does not', () => {
        const named = render(<ScopeNamedCase />);
        expect(screen.getByPlaceholderText('Search students')).toBeInTheDocument();
        named.unmount();
        render(<ScopeUnnamedCase />);
        expect(screen.getByPlaceholderText('Search…')).toBeInTheDocument();
    });

    it('reads the count in words, or bare', () => {
        const words = render(<CountInWordsCase />);
        expect(screen.getByRole('status')).toHaveTextContent('2 of 6 students');
        words.unmount();
        render(<CountBareCase />);
        expect(screen.getByRole('status')).toHaveTextContent('2 results');
    });
});
