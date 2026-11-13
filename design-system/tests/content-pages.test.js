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
        expect(readFileSync(join(STYLES, file), 'utf8')).toContain(`<Meta title="${title}" />`);
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
            if (file !== 'ContentVoiceAndTone.mdx') expect(tags, file).toBeGreaterThanOrEqual(pairs);
        }
    });

    it('Messages links each type’s component docs page', () => {
        const text = readFileSync(join(STYLES, 'ContentMessages.mdx'), 'utf8');
        for (const id of ['flag', 'section-message', 'inline-message', 'banner', 'modal-dialog', 'empty-state', 'spotlight']) {
            expect(text).toContain(`components-messaging-${id}`);
        }
    });
});
