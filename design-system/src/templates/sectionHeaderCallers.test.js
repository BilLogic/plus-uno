import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every Section header drawn in the docs follows the header rules: the title
 * row's actions are 32 (no compact Button in a Section's or Table's
 * `actions`), and the button that clears applied filters reads
 * "Reset filters".
 */

const SRC = resolve(__dirname, '..');
const sources = execSync(
    "git ls-files 'templates/*.jsx' 'storybook-docs/patterns/*.jsx' 'components/*.stories.jsx'",
    { cwd: SRC, encoding: 'utf8' },
).split('\n').filter((file) => file && !file.includes('.test.')).map((file) => resolve(SRC, file));

/** The `{...}` expression that opens at `start`. */
const braced = (text, start) => {
    let depth = 0;
    for (let i = start; i < text.length; i += 1) {
        if (text[i] === '{') depth += 1;
        if (text[i] === '}') {
            depth -= 1;
            if (depth === 0) return text.slice(start, i + 1);
        }
    }
    return text.slice(start);
};

/** Each `actions={...}` that belongs to a `<Section` or `<Table` opening tag. */
const headerActions = (text) => {
    const found = [];
    const opener = /<(Section|Table)\b/g;
    let match;
    while ((match = opener.exec(text))) {
        const rest = text.slice(match.index + match[0].length);
        const end = rest.search(/\n\s*>\s*\n|\/>/);
        const tag = end === -1 ? rest : rest.slice(0, end);
        const slot = tag.search(/\bactions=\{/);
        if (slot === -1) continue;
        const before = tag.slice(0, slot);
        if (/<(Section|Table|PanelHeader|Card)\b/.test(before)) continue;
        found.push(braced(tag, slot + 'actions='.length));
    }
    return found;
};

describe('Section headers in the docs', () => {
    it('reads the docs sources', () => {
        expect(sources.length).toBeGreaterThan(50);
    });

    it('keep title-row actions at 32: no compact Button in a Section or Table `actions`', () => {
        const offenders = sources.flatMap((file) => headerActions(readFileSync(file, 'utf8'))
            .filter((actions) => /<(Button|IconButton)\b[^>]*spacing="compact"/.test(actions))
            .map((actions) => `${file}: ${actions.replace(/\s+/g, ' ').slice(0, 100)}`));
        expect(offenders).toEqual([]);
    });

    it('name the clear-every-filter button "Reset filters"', () => {
        const offenders = sources.filter((file) => /text="Clear filters?"/.test(readFileSync(file, 'utf8')));
        expect(offenders).toEqual([]);
    });
});
