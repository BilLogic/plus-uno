// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = resolve(import.meta.dirname, '..', '..');
const read = (file) => readFileSync(resolve(ROOT, file), 'utf8');

const tokenSources = [
    'design-system/src/tokens/_scales.scss',
    'design-system/src/tokens/ladder/_components.scss',
].map(read).join('\n');

// Resolves a custom property to pixels through the token sources: var(), calc() with * and +/-.
function px(name, seen = new Set()) {
    const match = tokenSources.match(new RegExp(`${name}:\\s*([^;]+);`));
    if (!match) throw new Error(`${name} is not defined`);
    if (seen.has(name)) throw new Error(`${name} loops`);
    const expr = match[1]
        .replace(/\/\*.*?\*\//g, '')
        .replace(/var\((--[\w-]+)\)/g, (_, ref) => String(px(ref, new Set([...seen, name]))))
        .replace(/(\d+(?:\.\d+)?)px/g, '$1')
        .replace(/calc/g, '');
    return Function(`return (${expr});`)();
}

const scss = read('design-system/src/components/ai/AiChat/AiChat.scss');

describe('AiChat size tokens', () => {
    it('keeps the launcher at 48px and the popup at 2 x the old height', () => {
        expect(px('--ai-chat-fab-size')).toBe(px('--height-300'));
        expect(px('--ai-chat-height')).toBe(px('--height-2000') * 2);
        expect(px('--ai-chat-fab-size')).toBe(48);
        expect(px('--ai-chat-height')).toBe(640);
    });

    it('reads only its own tokens for those sizes', () => {
        const css = scss.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
        expect(css).not.toMatch(/var\(--height-/);
        expect(css).toMatch(/var\(--ai-chat-fab-size\)/);
        expect(css).toMatch(/var\(--ai-chat-height\)/);
    });
});
