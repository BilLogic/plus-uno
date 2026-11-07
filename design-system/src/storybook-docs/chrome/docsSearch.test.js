import { describe, it, expect } from 'vitest';
import { parseComponentNames, buildDocsEntries, answerDocsQuery } from './docsSearch';

const INDEX = {
    v: 5,
    entries: {
        'components-forms-and-inputs-button-button--docs': { id: 'components-forms-and-inputs-button-button--docs', title: 'Forms and inputs/Button', name: 'Docs', type: 'docs' },
        'components-forms-and-inputs-button-button--overview': { id: 'components-forms-and-inputs-button-button--overview', title: 'Forms and inputs/Button', name: 'Overview', type: 'story' },
        'components-forms-and-inputs-checkbox--overview': { id: 'components-forms-and-inputs-checkbox--overview', title: 'Forms and inputs/Checkbox', name: 'Overview', type: 'story' },
        'patterns-frame--docs': { id: 'patterns-frame--docs', title: 'Patterns/Frame', name: 'Docs', type: 'docs' },
        'foundations-color--docs': { id: 'foundations-color--docs', title: 'Foundations/Color', name: 'Docs', type: 'docs' },
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
        expect(byTitle['Forms and inputs/Checkbox']).toMatchObject({ id: 'components-forms-and-inputs-checkbox--overview', type: 'story' });
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
        expect(reply.links[0]).toEqual({ label: 'Button', href: '/?path=/docs/components-forms-and-inputs-button-button--docs' });
    });
    it('matches case-insensitively', () => {
        expect(ask('checkbox').links[0].label).toBe('Checkbox');
    });
    it('links a story when a title has no docs page', () => {
        expect(ask('checkbox').links[0].href).toBe('/?path=/story/components-forms-and-inputs-checkbox--overview');
    });
    it('finds non-component pages by title words', () => {
        expect(ask('where is the color page').links.map((l) => l.label)).toContain('Color');
    });
    it('says so when a component exists in the index but has no page', () => {
        const reply = ask('tooltip');
        expect(reply.links).toEqual([]);
        expect(reply.text).toMatch(/Tooltip/);
        expect(reply.text).toMatch(/no docs page/i);
    });
    it('answers an unknown question without links', () => {
        const reply = ask('zzzz qqqq');
        expect(reply.links).toEqual([]);
        expect(reply.text).toMatch(/component name/i);
    });
    it('answers an empty question without links', () => {
        expect(ask('   ').links).toEqual([]);
    });
    it('ranks a multi-word name above partial matches', () => {
        const list = buildDocsEntries({ entries: {
            'a--docs': { id: 'a--docs', title: 'Forms/Date', type: 'docs' },
            'b--docs': { id: 'b--docs', title: 'Forms/Date picker', type: 'docs' },
        } }, []);
        expect(answerDocsQuery('date picker', list, { href }).links[0].label).toBe('Date picker');
    });
    it('caps the links', () => {
        const many = buildDocsEntries({ entries: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [
            `x-${i}--docs`, { id: `x-${i}--docs`, title: `Group/Card ${i}`, type: 'docs' },
        ])) }, []);
        expect(answerDocsQuery('card', many, { href }).links).toHaveLength(5);
    });
});
