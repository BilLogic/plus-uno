import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import {
  BRAND_IMAGE_PATH,
  BRAND_IMAGE_SVG_PATH,
  artifacts,
  renderBrandImage,
  run,
} from './generate-brand-image.js';

test('the committed brand-image module matches storybook-brand.svg', () => {
  assert.deepEqual(run(), []);
});

test('drift: missing output, edited output, and stale SVG source are findings, --check writes nothing, and regeneration is deterministic', () => {
  const root = mkdtempSync(join(tmpdir(), 'brand-image-'));
  try {
    const svgAbs = join(root, BRAND_IMAGE_SVG_PATH);
    const outAbs = join(root, BRAND_IMAGE_PATH);
    mkdirSync(dirname(svgAbs), { recursive: true });
    writeFileSync(svgAbs, '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>', 'utf8');

    assert.deepEqual(
      run({ repoRoot: root }).map((f) => f.file),
      [BRAND_IMAGE_PATH],
    );
    assert.equal(existsSync(outAbs), false, 'check mode must not create a missing output file');

    const [first] = artifacts(root);
    const [second] = artifacts(root);
    assert.equal(first.path, BRAND_IMAGE_PATH);
    assert.equal(first.content, second.content, 'regeneration must be deterministic');
    assert.equal(
      first.content,
      renderBrandImage('<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>'),
    );

    mkdirSync(dirname(outAbs), { recursive: true });
    writeFileSync(outAbs, first.content, 'utf8');
    assert.deepEqual(run({ repoRoot: root }), []);

    const edited = `${first.content}// edited`;
    writeFileSync(outAbs, edited, 'utf8');
    assert.deepEqual(
      run({ repoRoot: root }).map((f) => f.file),
      [BRAND_IMAGE_PATH],
    );
    assert.equal(readFileSync(outAbs, 'utf8'), edited, 'check mode must not overwrite an edited output file');

    writeFileSync(outAbs, first.content, 'utf8');
    writeFileSync(svgAbs, '<svg xmlns="http://www.w3.org/2000/svg"><circle r="5"/></svg>', 'utf8');
    assert.deepEqual(
      run({ repoRoot: root }).map((f) => f.file),
      [BRAND_IMAGE_PATH],
    );
    assert.equal(readFileSync(outAbs, 'utf8'), first.content, 'check mode must not write when SVG source changes');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
