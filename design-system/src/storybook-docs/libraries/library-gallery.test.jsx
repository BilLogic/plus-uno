import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LibraryHero } from './library-hero.jsx';
import { FREE_ICON_NAMES, filterIcons } from './library-gallery.jsx';

describe('the icon search', () => {
    it('searches the whole Free set, each name once', () => {
        expect(FREE_ICON_NAMES.length).toBeGreaterThan(1000);
        expect(new Set(FREE_ICON_NAMES).size).toBe(FREE_ICON_NAMES.length);
    });
    it('keeps the names holding every typed word', () => {
        const hits = filterIcons('arrow down');
        expect(hits.length).toBeGreaterThan(0);
        expect(hits.every((n) => n.includes('arrow') && n.includes('down'))).toBe(true);
    });
    it('shows everything for an empty query and nothing for nonsense', () => {
        expect(filterIcons('  ')).toHaveLength(FREE_ICON_NAMES.length);
        expect(filterIcons('zzqq')).toEqual([]);
    });
});

describe('the page hero', () => {
    it('reads "Library" above the title of every Libraries page', () => {
        const html = renderToStaticMarkup(<LibraryHero title="Motion" summary="x" />);
        expect(html).toContain('>Library<');
        expect(html).not.toContain('Foundation<');
    });
});
