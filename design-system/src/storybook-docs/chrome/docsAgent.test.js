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
        expect(out.sources).toEqual([{ title: 'Button', href: '/b' }]);
        expect(out.text).toMatch(/search/i);
        expect(out.text).toMatch(/These pages match:/);
    });

    it('falls back when the network fails or the reply has no text', async () => {
        const down = createAgentResponder({ fetchFn: async () => { throw new Error('offline'); }, search });
        expect((await down('Button')).text).toMatch(/search/i);
        const empty = createAgentResponder({ fetchFn: async () => ok({ text: '' }), search });
        expect((await empty('Button')).text).toMatch(/search/i);
    });
});
