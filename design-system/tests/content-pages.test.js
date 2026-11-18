import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The Content group under Brand: each page renders its sections in the locked
 * order, and its Meta title files it under Foundations/Brand/Content.
 */
const STYLES = join(__dirname, '..', 'src', 'styles');

const PAGES = [
    { file: 'ContentVoiceAndTone.mdx', title: 'Foundations/Brand/Content/Voice and tone', sections: ['Voice', 'When to dial', 'Tone', 'In the product', 'Related'] },
    { file: 'ContentLanguage.mdx', title: 'Foundations/Brand/Content/Language', sections: ['Words', 'People', 'Sentences', 'Mechanics', 'Related'] },
    { file: 'ContentMessages.mdx', title: 'Foundations/Brand/Content/Messages', sections: ['Anatomy', 'Choose a type', 'Writing each type', 'Related'] },
];

describe('Content pages', () => {
    it.each(PAGES)('$file is titled under Brand > Content', ({ file, title }) => {
        const text = readFileSync(join(STYLES, file), 'utf8');
        // A page either titles itself, or attaches to its stories file and takes that file's title.
        const attached = text.match(/^import \* as (\w+) from '\.\/([\w.]+\.stories\.jsx)';$/m);
        if (attached && text.includes(`<Meta of={${attached[1]}} />`)) {
            expect(readFileSync(join(STYLES, attached[2]), 'utf8')).toContain(`title: '${title}'`);
        } else {
            expect(text).toContain(`<Meta title="${title}" />`);
        }
    });

    it.each(PAGES)('$file renders its sections in order', ({ file, sections }) => {
        const text = readFileSync(join(STYLES, file), 'utf8');
        const found = [...text.matchAll(/<FoundationSection title="([^"]+)"/g)].map((m) => m[1]);
        expect(found).toEqual(sections);
    });

    it.each(PAGES)('$file names its md twin and opens with the landing', ({ file }) => {
        const text = readFileSync(join(STYLES, file), 'utf8');
        expect(text).toMatch(/design-system\/guidelines\/foundations\/content\/[a-z-]+\.md/);
        expect(text).toMatch(/<DocsLanding\b/);
    });

    it('every Do and Don’t pair names a voice word', () => {
        for (const { file } of PAGES) {
            const text = readFileSync(join(STYLES, file), 'utf8');
            const tags = (text.match(/<VoiceTag word="(helpful|honest|warm|clear)"/g) ?? []).length;
            const pairs = (text.match(/<DoDont>/g) ?? []).length;
            expect(tags, file).toBeGreaterThanOrEqual(pairs);
        }
    });

    it('Messages links each type’s component docs page', () => {
        const text = readFileSync(join(STYLES, 'ContentMessages.mdx'), 'utf8');
        for (const id of ['flag', 'section-message', 'inline-message', 'banner', 'modal', 'empty-state', 'spotlight']) {
            expect(text).toContain(`components-messaging-${id}`);
        }
    });
});
