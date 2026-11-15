import { describe, it, expect } from 'vitest';
import { parseComponentNames, buildDocsEntries, answerDocsQuery, findPage, resolvePageLinks } from './docsSearch';

const INDEX = {
    v: 5,
    entries: {
        'components-forms-and-inputs-button-button--docs': { id: 'components-forms-and-inputs-button-button--docs', title: 'Forms and inputs/Button', name: 'Docs', type: 'docs' },
        'components-forms-and-inputs-button-button--overview': { id: 'components-forms-and-inputs-button-button--overview', title: 'Forms and inputs/Button', name: 'Overview', type: 'story' },
        'components-forms-and-inputs-checkbox-checkbox--overview': { id: 'components-forms-and-inputs-checkbox-checkbox--overview', title: 'Forms and inputs/Checkbox', name: 'Overview', type: 'story' },
        'patterns-frame--docs': { id: 'patterns-frame--docs', title: 'Templates/Frame', name: 'Docs', type: 'docs' },
        'foundations-visual-color--docs': { id: 'foundations-visual-color--docs', title: 'Foundations/Visual/Color', name: 'Docs', type: 'docs' },
    },
};

const MD = `
## UI components (3)

- [Button](../../src/components/forms-and-inputs/Button/index.md)
- [Checkbox](../../src/components/forms-and-inputs/Checkbox/index.md)
- [Tooltip](../../src/components/overlays/Tooltip/index.md)
`;

const href = (id, type) => `/?path=/${type === 'docs' ? 'docs' : 'story'}/${id}`;
const entries = buildDocsEntries(INDEX, parseComponentNames(MD));
const ask = (q) => answerDocsQuery(q, entries, { href });

describe('parseComponentNames', () => {
    it('reads names from the generated index list', () => {
        expect(parseComponentNames(MD)).toEqual(['Button', 'Checkbox', 'Tooltip']);
    });
    it('returns nothing for empty input', () => {
        expect(parseComponentNames('')).toEqual([]);
        expect(parseComponentNames(undefined)).toEqual([]);
    });
});

describe('buildDocsEntries', () => {
    it('groups by title, preferring the docs page and falling back to a story', () => {
        const byTitle = Object.fromEntries(entries.map((e) => [e.title, e]));
        expect(byTitle['Forms and inputs/Button']).toMatchObject({ id: 'components-forms-and-inputs-button-button--docs', type: 'docs', name: 'Button' });
        expect(byTitle['Forms and inputs/Checkbox']).toMatchObject({ id: 'components-forms-and-inputs-checkbox-checkbox--overview', type: 'story' });
    });
    it('tolerates a missing index', () => {
        expect(buildDocsEntries(null, ['Tooltip'])).toEqual([
            { title: 'Tooltip', name: 'Tooltip', id: null, type: null },
        ]);
    });
});

describe('answerDocsQuery', () => {
    it('links the docs page for an asked component name', () => {
        const reply = ask('How do I use Button?');
        expect(reply.sources[0]).toEqual({ title: 'Button', href: '/?path=/docs/components-forms-and-inputs-button-button--docs', type: 'Docs page' });
    });
    it('matches case-insensitively', () => {
        expect(ask('checkbox').sources[0].title).toBe('Checkbox');
    });
    it('links a story when a title has no docs page', () => {
        expect(ask('checkbox').sources[0].href).toBe('/?path=/story/components-forms-and-inputs-checkbox-checkbox--overview');
    });
    it('finds non-component pages by title words', () => {
        expect(ask('where is the color page').sources.map((s) => s.title)).toContain('Color');
    });
    it('says so when a component exists in the index but has no page', () => {
        const reply = ask('tooltip');
        expect(reply.sources).toEqual([]);
        expect(reply.text).toMatch(/Tooltip/);
        expect(reply.text).toMatch(/no docs page/i);
    });
    it('answers an unknown question without sources', () => {
        const reply = ask('zzzz qqqq');
        expect(reply.sources).toEqual([]);
        expect(reply.text).toMatch(/component name/i);
    });
    it('answers an empty question without sources', () => {
        expect(ask('   ').sources).toEqual([]);
    });
    it('ranks a multi-word name above partial matches', () => {
        const list = buildDocsEntries({ entries: {
            'a--docs': { id: 'a--docs', title: 'Forms/Date', type: 'docs' },
            'b--docs': { id: 'b--docs', title: 'Forms/Date picker', type: 'docs' },
        } }, []);
        expect(answerDocsQuery('date picker', list, { href }).sources[0].title).toBe('Date picker');
    });
    it('caps the sources', () => {
        const many = buildDocsEntries({ entries: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [
            `x-${i}--docs`, { id: `x-${i}--docs`, title: `Group/Card ${i}`, type: 'docs' },
        ])) }, []);
        expect(answerDocsQuery('card', many, { href }).sources).toHaveLength(5);
    });
});

describe('findPage and resolvePageLinks', () => {
    const entries = [
        { title: 'Foundations/Visual/Color', name: 'Color', id: 'foundations-visual-color--docs', type: 'docs' },
        { title: 'AI UI/Foundations/Color', name: 'Color', id: 'ai-ui-foundations-color--docs', type: 'docs' },
        { title: 'Components/Forms and inputs/Button/Button', name: 'Button', id: 'button--docs', type: 'docs' },
        { title: 'Tag', name: 'Tag', id: null, type: null },
    ];
    it('matches the exact title first, then a title ending in it, then a name', () => {
        expect(findPage('AI UI/Foundations/Color', entries).id).toBe('ai-ui-foundations-color--docs');
        expect(findPage('forms and inputs/button/button', entries).id).toBe('button--docs');
        expect(findPage('Button', entries).id).toBe('button--docs');
    });
    it('never returns a page that does not exist', () => {
        expect(findPage('Tag', entries)).toBeNull();
        expect(findPage('zzz', entries)).toBeNull();
    });
    it('rewrites page: links and keeps the label of one that does not resolve', () => {
        const out = resolvePageLinks('[Color](page:Foundations/Visual/Color), [X](page:zzz)', entries, (id) => `#${id}`);
        expect(out).toBe('[Color](#foundations-visual-color--docs), X');
    });
});
