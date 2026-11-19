// @vitest-environment node
/** AI chat is a component: the `@/components` barrel carries it and its parts, and its docs live under AI UI › Components. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import * as components from '@/components';

describe('AI chat in @/components', () => {
    it('exports the chat, its hook and its constants', () => {
        for (const name of ['AiChat', 'useAiChat', 'AI_CHAT_MODES', 'AI_CHAT_STORAGE_KEY', 'AI_CHAT_FULLSCREEN_BELOW', 'AI_CHAT_DISCLAIMER']) {
            expect(components[name], name).toBeDefined();
        }
    });

    it('is filed under AI UI › Components, with no `variant` prop', () => {
        const dir = new URL('../src/components/ai/AiChat/', import.meta.url);
        expect(readFileSync(new URL('AiChat.stories.jsx', dir), 'utf8')).toMatch(/title: 'AI UI\/Components\/AI chat',/);
        expect(readFileSync(new URL('AiChat.jsx', dir), 'utf8')).not.toMatch(/\bvariant\b/);
    });
});
