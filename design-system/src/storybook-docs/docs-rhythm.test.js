import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const rhythm = readFileSync(join(__dirname, 'docs-rhythm.css'), 'utf8');

describe('docs example well', () => {
    it('centers a figure with `safe center`, after a plain `center` for a browser without it', () => {
        expect(rhythm).toMatch(/align-items:\s*center;[^}]*?align-items:\s*safe center;/);
    });
});
