import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The Foundations pages name Figma collections and variable groups the way the
 * four-tier plan does. A retired name in doc text is a stale claim.
 */
const STYLES = join(__dirname, '..', 'styles');
const PAGES = ['Accessibility', 'Border', 'Colors', 'Elevation', 'Grid', 'Icons', 'Illustrations', 'Logos', 'Radius', 'Spacing', 'TokensColor', 'TokensTypography', 'TokensSpacingAndSize', 'TokensElevationAndLayers', 'TokensMotion', 'Typography', 'FoundationsOverview'];
const RETIRED = ['color / foundations', 'spacing / foundations', 'spacing / layout', 'Element/', 'Surface 16'];

describe('Foundations pages', () => {
    it.each(PAGES)('%s names no retired collection or group', (page) => {
        const text = readFileSync(join(STYLES, `${page}.mdx`), 'utf8');
        for (const name of RETIRED) expect(text, `${page} still says "${name}"`).not.toContain(name);
    });

    it('lists every page file it checks', () => {
        const files = readdirSync(STYLES);
        for (const page of PAGES) expect(files).toContain(`${page}.mdx`);
    });
});
