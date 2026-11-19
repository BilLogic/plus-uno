import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Source under design-system/src speaks the template names and imports from
// the templates barrel. The old names and the old barrel are gone.
const OLD_NAMES = new RegExp(`(?<![/\\w])Pattern(?:${['Section', 'Card', 'Table'].join('|')})(?![/\\w])`);
const OLD_BARREL = new RegExp(`['"\`]@/${'patterns'}(?:/[^'"\`]*)?['"\`]`);
// This guard spells the old names to look for them.
const ALLOWED = new Set(['design-system/src/templates/templatesMigration.test.js']);
const ROOTS = ['design-system/src', 'design-system/tests', 'design-system/guidelines', '.storybook'];

function sourceFiles() {
    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
    const out = execFileSync('git', ['ls-files', ...ROOTS], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return out
        .split('\n')
        .filter((f) => /\.(jsx?|mjs|tsx?|mdx?|scss)$/.test(f))
        .filter((f) => !/generated/.test(f) && !ALLOWED.has(f))
        .map((f) => `${root}/${f}`);
}


describe('templates migration', () => {
    const files = sourceFiles();

    it('scans the source tree', () => {
        expect(files.length).toBeGreaterThan(100);
    });

    it('the patterns source folder is gone', () => {
        const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
        expect(existsSync(`${root}/design-system/src/${'patterns'}`)).toBe(false);
    });

    it('no source file uses an old template name', () => {
        const hits = files.filter((f) => OLD_NAMES.test(readFileSync(f, 'utf8')));
        expect(hits).toEqual([]);
    });

    it('no source file imports the patterns barrel', () => {
        const hits = files.filter((f) => OLD_BARREL.test(readFileSync(f, 'utf8')));
        expect(hits).toEqual([]);
    });

    // The AI chat template stays under the AI UI root, which has its own Patterns group.
    it('every coded template story sits under the Templates root', () => {
        const stories = files.filter(
            (f) => /\.stories\.jsx?$/.test(f) && /\/design-system\/src\/templates\//.test(f) && !f.endsWith('/AiChat/AiChat.stories.jsx'),
        );
        expect(stories.length).toBeGreaterThan(5);
        const misplaced = stories.filter((f) => !/title:\s*['"`]Templates\//.test(readFileSync(f, 'utf8')));
        expect(misplaced).toEqual([]);
    });
});
