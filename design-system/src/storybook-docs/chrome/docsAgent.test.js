import { describe, it, expect, vi } from 'vitest';
import { createAgentResponder, AGENT_ENDPOINT } from './docsAgent';

const search = vi.fn(async () => ({ text: 'These pages match:', sources: [{ title: 'Button', href: '/b' }] }));
const ok = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
const history = () => [{ role: 'user', text: 'earlier' }, { role: 'assistant', text: 'reply' }];

describe('createAgentResponder', () => {
    it('posts the question and the last turns to the function and returns its text with the search sources', async () => {
        const fetchFn = vi.fn(async () => ok({ text: 'Button takes appearance.' }));
        const respond = createAgentResponder({ fetchFn, search });
        const out = await respond('How do I use Button?', history());
        expect(fetchFn).toHaveBeenCalledWith(AGENT_ENDPOINT, expect.objectContaining({ method: 'POST' }));
        expect(JSON.parse(fetchFn.mock.calls[0][1].body)).toEqual({ question: 'How do I use Button?', history: history() });
        expect(out).toEqual({ text: 'Button takes appearance.', sources: [{ title: 'Button', href: '/b' }] });
    });

    it.each([[429], [500], [502]])('falls back to search and says so on a %i', async (status) => {
        const respond = createAgentResponder({ fetchFn: async () => ok({}, status), search });
        const out = await respond('Button');
        expect(out.sources).toEqual([]);
        expect(out.text).toMatch(/search/i);
        expect(out.text).toMatch(/These pages match:/);
        expect(out.text).toContain('- [Button](/b)');
    });

    it('falls back when the network fails or the reply has no text', async () => {
        const down = createAgentResponder({ fetchFn: async () => { throw new Error('offline'); }, search });
        expect((await down('Button')).text).toMatch(/search/i);
        const empty = createAgentResponder({ fetchFn: async () => ok({ text: '' }), search });
        expect((await empty('Button')).text).toMatch(/search/i);
    });
});

describe('createAgentResponder pages and navigation', () => {
    const entries = [
        { title: 'Foundations/Color', name: 'Color', id: 'foundations-color--docs', type: 'docs' },
        { title: 'Components/Forms and inputs/Button/Button', name: 'Button', id: 'components-forms-and-inputs-button-button--docs', type: 'docs' },
    ];
    const pages = async () => entries;
    const href = (id) => `?path=/docs/${id}`;

    it('turns the model\'s page: links into docs addresses and drops a link to a page that does not exist', async () => {
        const fetchFn = async () => ok({ text: 'See [Button](page:Components/Forms and inputs/Button/Button) and [Nope](page:Nope/Missing).' });
        const out = await createAgentResponder({ fetchFn, search, pages, href })('q');
        expect(out.text).toBe('See [Button](?path=/docs/components-forms-and-inputs-button-button--docs) and Nope.');
    });

    it('opens the page the model asked for, in place, and says so when it wrote nothing', async () => {
        vi.useFakeTimers();
        const navigate = vi.fn(() => true);
        const fetchFn = async () => ok({ text: '', open: 'Foundations/Color' });
        const out = await createAgentResponder({ fetchFn, search, pages, href, navigate })('Take me to color');
        expect(out.text).toBe('Opening [Color](?path=/docs/foundations-color--docs).');
        vi.runAllTimers();
        expect(navigate).toHaveBeenCalledWith('?path=/docs/foundations-color--docs');
        vi.useRealTimers();
    });

    it('opens a page from a "take me to" question when the model is down', async () => {
        vi.useFakeTimers();
        const navigate = vi.fn(() => true);
        const out = await createAgentResponder({ fetchFn: async () => ok({}, 502), search, pages, href, navigate })('Take me to the Color page');
        expect(out.text).toBe('Opening [Color](?path=/docs/foundations-color--docs).');
        vi.runAllTimers();
        expect(navigate).toHaveBeenCalledOnce();
        vi.useRealTimers();
    });
});
