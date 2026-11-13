import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TokenLibrary } from './token-library-blocks.jsx';
import { corpus } from './token-collection-blocks.jsx';

// Vitest hands back an empty string for a `.scss?raw` import, so the token
// sources the page bundles are read from disk here; the page code is unchanged.
vi.mock('./token-collection-blocks.jsx', async () => {
    const fs = await import('node:fs');
    const { collectTokens } = await import('@/storybook-docs/lib/token-collections.mjs');
    const files = ['_scales', '_type', '_frame_layers', 'color/_palette', 'color/_semantic', 'color/_elevation', 'ladder/_components', 'ladder/_layers', 'ladder/_patterns', 'ladder/_semantics', 'ladder/_springs'];
    const SOURCES = files.map((f) => ({ file: `${f}.scss`, text: fs.readFileSync(`${process.cwd()}/src/tokens/${f}.scss`, 'utf8') }));
    return { SOURCES, corpus: collectTokens(SOURCES) };
});

/**
 * The Library lists every token once, and its search, exact-match toggle and
 * collection, tier and scope filters combine and update the count.
 */
const count = () => Number(screen.getByTestId('token-count').textContent.match(/^[\d,]+/)[0].replace(/,/g, ''));
const search = (text) => fireEvent.change(screen.getByRole('searchbox'), { target: { value: text } });
const pick = async (label, option) => {
    fireEvent.click(screen.getByRole('combobox', { name: label }));
    fireEvent.click(await screen.findByRole('option', { name: option }));
};

describe('TokenLibrary', () => {
    it('lists every token exactly once and says how many', () => {
        const { container } = render(<TokenLibrary />);
        expect(count()).toBe(corpus.size);
        const names = [...container.querySelectorAll('[data-token-name]')].map((n) => n.getAttribute('data-token-name'));
        expect(names).toHaveLength(corpus.size);
        expect(new Set(names).size).toBe(corpus.size);
    });

    it('search narrows the count and exact match narrows it to one token', () => {
        render(<TokenLibrary />);
        search('ds-text-sub');
        const partial = count();
        expect(partial).toBeGreaterThan(1);
        fireEvent.click(screen.getByRole('switch', { name: /exact match/i }));
        search('--ds-text-subtle');
        expect(count()).toBe(1);
        search('--ds-text-sub');
        expect(count()).toBe(0);
        expect(screen.getByText(/no tokens match/i)).toBeTruthy();
    });

    it('filters combine with search', async () => {
        render(<TokenLibrary />);
        await pick('Collection', 'Color');
        const color = count();
        await pick('Tier', 'Semantic');
        const semantic = count();
        await pick('Scope', 'Global');
        const global = count();
        expect(corpus.size).toBeGreaterThan(color);
        expect(color).toBeGreaterThan(semantic);
        expect(semantic).toBeGreaterThan(global);
        search('border');
        expect(count()).toBeGreaterThan(0);
        expect(count()).toBeLessThan(global);
    });

    it('shows a light and a dark value on a color role', () => {
        render(<TokenLibrary />);
        search('--ds-text');
        const row = document.querySelector('[data-token-name="--ds-text"]').closest('tr');
        expect(within(row).getByText(/^Light/)).toBeTruthy();
        expect(within(row).getByText(/^Dark/)).toBeTruthy();
    });

    it('copies a name from the keyboard and announces it', async () => {
        const writeText = vi.fn().mockResolvedValue();
        Object.assign(navigator, { clipboard: { writeText } });
        render(<TokenLibrary />);
        search('--ds-text-subtle');
        const button = screen.getByRole('button', { name: "Copy --ds-text-subtle" });
        button.focus();
        fireEvent.click(button); // a keyboard Enter or Space on a button fires click
        expect(writeText).toHaveBeenCalledWith('--ds-text-subtle');
        expect((await screen.findByTestId('copy-status')).textContent).toContain('Copied --ds-text-subtle');
        expect(screen.getByTestId('copy-status').getAttribute('aria-live')).toBe('polite');
    });
});
