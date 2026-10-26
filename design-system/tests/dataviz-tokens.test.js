/**
 * Charts color by token only. Every file under `src/dataviz/` (components,
 * stories and MDX) names `--ds-*` tokens through `var()` or the palette in
 * `src/dataviz/palette.js`: no legacy `--color-*` name, and no color literal,
 * so a chart reads the same token in light, dark and increased contrast.
 * Unit tests are exempt: they feed literal colors to pure functions.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../src/dataviz');

const files = (dir) => readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(jsx?|mdx|s?css)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
});

const PATTERNS = {
    'a legacy --color-* token': /--color-[\w-]+/g,
    // `(#300)` is an issue citation in a comment, not a color.
    'a hex color': /(?<!\()#[0-9a-fA-F]{3,8}\b(?!\))/g,
    'an rgb() or hsl() literal': /\b(?:rgba?|hsla?)\(\s*\d/g,
};

describe('dataviz colors are tokens', () => {
    for (const [what, pattern] of Object.entries(PATTERNS)) {
        it(`no file under src/dataviz names ${what}`, () => {
            const found = files(ROOT).flatMap((path) => {
                const text = readFileSync(path, 'utf8');
                return text.split('\n').flatMap((line, i) =>
                    (line.match(pattern) ?? []).map((m) => `${relative(ROOT, path)}:${i + 1} ${m}`));
            });
            expect(found).toEqual([]);
        });
    }
});
