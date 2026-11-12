// @vitest-environment node
/**
 * `emulateReducedMotion` and `emulateColorPreferences` change the whole
 * browser page, and Vitest runs story files side by side on that page. A
 * pattern page that flips them can make an unrelated file read the wrong
 * preference (the Spinner "Reduced Motion" story saw `none` at rest). A pattern
 * page holds its own state through props, so no file under `patterns/` may call
 * them; the component stories that own a preference clean up in `beforeEach`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const PATTERNS = resolve(__dirname, '../src/storybook-docs/patterns');
const files = readdirSync(PATTERNS, { recursive: true, withFileTypes: true })
  .filter((f) => f.isFile() && /\.(jsx?|mdx)$/.test(f.name))
  .map((f) => resolve(f.parentPath, f.name));

describe('pattern pages never emulate a page-wide media preference', () => {
  it('finds the pattern files', () => expect(files.length).toBeGreaterThan(0));
  for (const file of files) {
    it(file.slice(PATTERNS.length + 1), () => {
      expect(readFileSync(file, 'utf8')).not.toMatch(/emulate(ReducedMotion|ColorPreferences)/);
    });
  }
});
