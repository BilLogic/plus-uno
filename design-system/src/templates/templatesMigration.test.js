import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { loadRetirement } from '../../../scripts/lib/retirement.mjs';

// Source under design-system/src speaks the template names and imports from
// the templates barrel. The old names and the old barrel are gone. Which names
// and which barrel is the retirement list's (`_inventions.json`): the retired
// `Pattern*` names, and the retired barrel spelling. This guard spells none.
const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const retirement = loadRetirement(ROOT);
const OLD_NAMES = new RegExp(`(?<![/\\w])(?:${retirement.ofKind('tag').filter((r) => r.not.startsWith('Pattern')).map((r) => r.not).join('|')})(?![/\\w])`);
const OLD_BARREL_ROW = retirement.ofKind('spelling').find((r) => r.use.includes('@/templates'));
const saysOldBarrel = (text) => retirement.findIn(text, { kinds: ['spelling'] }).some((hit) => hit.row.not === OLD_BARREL_ROW.not);
const ROOTS = ['design-system/src', 'design-system/tests', 'design-system/guidelines', '.storybook'];

function sourceFiles() {
    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
    const out = execFileSync('git', ['ls-files', ...ROOTS], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return out
        .split('\n')
        .filter((f) => /\.(jsx?|mjs|tsx?|mdx?|scss)$/.test(f))
        .filter((f) => !/generated/.test(f))
        .map((f) => `${root}/${f}`);
}


describe('templates migration', () => {
    const files = sourceFiles();

    it('the retirement list names the old template names and the old barrel', () => {
        expect(OLD_NAMES.source).toMatch(/PatternSection/);
        expect(OLD_BARREL_ROW).toBeTruthy();
    });

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
        const hits = files.filter((f) => saysOldBarrel(readFileSync(f, 'utf8')));
        expect(hits).toEqual([]);
    });

    it('every coded template story sits under the Templates root', () => {
        const stories = files.filter(
            (f) => /\.stories\.jsx?$/.test(f) && /\/design-system\/src\/templates\//.test(f),
        );
        expect(stories.length).toBeGreaterThan(5);
        const misplaced = stories.filter((f) => !/title:\s*['"`]Templates\//.test(readFileSync(f, 'utf8')));
        expect(misplaced).toEqual([]);
    });
});
