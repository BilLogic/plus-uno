// @vitest-environment node
/**
 * The Patterns overview routes to every pattern page, and the Templates
 * overview's Patterns column routes there too. Read from source with the same
 * docs index `check:pointers` uses, so a link must land on a page that exists:
 *
 *   - every group card links each of its patterns, and the four cards cover all of them
 *   - every row of the situation chooser links its pattern, and every pattern has a row
 *   - the state matrix links each of the six states in its head row
 *   - every pattern the Templates overview names is a link, not a word
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { docsIndex } from '../../scripts/lib/docs-cross-links.mjs';

const ROOT = resolve(__dirname, '../..');
const DOCS = resolve(__dirname, '../src/storybook-docs');
const OVERVIEW_ID = 'patterns-overview--docs';
const PATTERNS = Object.keys(docsIndex(ROOT)).filter((id) => id.startsWith('patterns-') && id !== OVERVIEW_ID);
const STATES = ['empty', 'loading', 'errors', 'overflow', 'disabled', 'read-only'].map((s) => `patterns-states-${s}--docs`);

const LINK = /path=\/docs\/([a-z0-9-]+--docs)/g;
const linksIn = (text) => [...text.matchAll(LINK)].map((m) => m[1]);

/** The text of one `<FoundationSection title="…">`. */
const section = (source, title) => {
    const start = source.indexOf(`<FoundationSection title="${title}">`);
    if (start === -1) return '';
    return source.slice(start, source.indexOf('</FoundationSection>', start));
};
/** The `<tr>` rows of a table body. */
const bodyRows = (text) => (text.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1] ?? '').match(/<tr>[\s\S]*?<\/tr>/g) ?? [];
/** The cells of a row. */
const cells = (row) => [...row.matchAll(/<t[dh]>([\s\S]*?)<\/t[dh]>/g)].map((m) => m[1]);

const patterns = readFileSync(resolve(DOCS, 'patterns/PatternsOverview.mdx'), 'utf8');
const templates = readFileSync(resolve(DOCS, 'templates/TemplatesOverview.mdx'), 'utf8');

describe('the Patterns overview', () => {
    it('finds the thirteen pattern pages', () => expect(PATTERNS).toHaveLength(13));

    it('links each pattern from exactly one group card', () => {
        const cards = section(patterns, 'The patterns').match(/<TypeCard[\s\S]*?<\/TypeCard>/g) ?? [];
        expect(cards, 'four group cards').toHaveLength(4);
        const linked = cards.flatMap(linksIn);
        expect([...linked].sort()).toEqual([...PATTERNS].sort());
    });

    describe('the situation chooser', () => {
        const rows = bodyRows(section(patterns, 'Which pattern for which situation'));

        it('has rows', () => expect(rows.length).toBeGreaterThan(0));
        rows.forEach((row) => {
            const [situation, pattern, also = ''] = cells(row);
            it(`"${situation.trim()}" links its pattern`, () => {
                const [first, ...more] = linksIn(pattern);
                expect(PATTERNS, 'the Pattern cell links one pattern page').toContain(first);
                expect(more, 'one pattern per row').toHaveLength(0);
                linksIn(also).forEach((id) => expect(PATTERNS, `also read: ${id}`).toContain(id));
            });
        });

        it('gives every pattern a row', () => {
            const primaries = rows.map((row) => linksIn(cells(row)[1])[0]);
            PATTERNS.forEach((id) => expect(primaries, id).toContain(id));
        });
    });

    it('links each of the six states in the matrix head', () => {
        const matrix = section(patterns, 'Which state is it?');
        const head = matrix.match(/<thead>([\s\S]*?)<\/thead>/)?.[1] ?? '';
        expect(linksIn(head)).toEqual(STATES);
        bodyRows(matrix).forEach((row) => expect(cells(row), row).toHaveLength(STATES.length + 1));
    });

    it('links only pages that exist', () => {
        const index = docsIndex(ROOT);
        linksIn(patterns).forEach((id) => expect(index, id).toHaveProperty([id]));
    });
});

describe('the Templates overview', () => {
    it('links every pattern in its Patterns column', () => {
        const rows = bodyRows(section(templates, 'Which template for which job'));
        expect(rows.length).toBeGreaterThan(0);
        rows.forEach((row) => {
            const cell = cells(row)[2];
            const names = cell.replace(/<a [^>]*>[^<]*<\/a>/g, '').split('·').map((s) => s.trim()).filter(Boolean);
            const linked = linksIn(cell);
            // AI chat routes to the AI guidelines, outside the Patterns root.
            if (/AI interaction/.test(cell)) return;
            expect(names, `words left unlinked in "${cells(row)[0]}"`).toEqual([]);
            linked.forEach((id) => expect(PATTERNS, id).toContain(id));
        });
    });
});
