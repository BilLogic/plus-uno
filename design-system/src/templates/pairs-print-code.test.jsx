import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CODE as cardCode } from './Card/CardCases.jsx';
import { CODE as sectionCode, STORY_CODE as sectionStoryCode } from './Section/SectionCases.jsx';
import { CODE as tableCode } from './Table/TableCases.jsx';

/**
 * Every Do and Don't pair on the Section, Card and Table pages prints the code
 * a consumer writes: imports from react, `@/components` and `@/templates`
 * only, and nothing the docs add around an example.
 */

// The Case guard names docs wrappers (SectionCase); a lowercase-led word like toLowerCase is consumer code.
const DOCS_ONLY = /\b[A-Z]\w*Case\b|storybook-docs|section-header|view-bar|SectionActions|ViewPills|FormatSwitch|HeaderSearch|StudentsTable|ScreenStage|InAppFrame|sb-unstyled|HeadingLevelContext|\b(inline|isOpen|show|titleAs)=/;
const ALLOWED = new Set(['react', '@/components', '@/templates']);

const pages = [
    ['Section', sectionCode],
    ['Section stories', sectionStoryCode],
    ['Card', cardCode],
    ['Table', tableCode],
];

describe.each(pages)('%s page printed code', (name, code) => {
    it('prints only consumer code', () => {
        expect(Object.keys(code).length).toBeGreaterThan(0);
        for (const [example, text] of Object.entries(code)) {
            expect(text, example).not.toMatch(DOCS_ONLY);
            for (const [, from] of text.matchAll(/from '([^']+)'/g)) {
                expect(ALLOWED.has(from), `${example} imports ${from}`).toBe(true);
            }
            const known = new Set();
            for (const [, names] of text.matchAll(/import\s+([^;]+?)\s+from/g)) {
                for (const n of names.match(/[A-Za-z_$][\w$]*/g)) known.add(n);
            }
            for (const [, n] of text.matchAll(/^(?:const|function)\s+([A-Za-z_$][\w$]*)/gm)) known.add(n);
            for (const [, tag] of text.matchAll(/<([A-Z][\w$]*)/g)) {
                expect(known.has(tag), `${example} uses <${tag}> without importing or defining it`).toBe(true);
            }
        }
    });

    it('prints both sides of every Do and Don\'t pair', () => {
        if (name === 'Section stories') return;
        const mdx = readFileSync(join(__dirname, name, `${name}.mdx`), 'utf8');
        const pairs = mdx.split('<DoDontPair').slice(1).map((chunk) => chunk.split('\n/>')[0]);
        expect(pairs.length).toBeGreaterThan(0);
        for (const pair of pairs) {
            expect(pair).toMatch(/doCode=\{CODE\.\w+\}/);
            expect(pair).toMatch(/dontCode=\{CODE\.\w+\}/);
        }
    });
});

describe('Table pairs', () => {
    it('gives each Do side its own subject', () => {
        const mdx = readFileSync(join(__dirname, 'Table', 'Table.mdx'), 'utf8');
        const dos = [...mdx.matchAll(/doExample=\{<(\w+) \/>\}/g)].map((m) => m[1]);
        expect(new Set(dos).size).toBe(dos.length);
    });
});
