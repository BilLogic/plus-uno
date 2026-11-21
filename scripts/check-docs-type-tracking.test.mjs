import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { findUntracked, inScope } from './check-docs-type-tracking.mjs';

describe('check-docs-type-tracking', () => {
    it('flags a bare font token, in either quote', () => {
        assert.deepEqual(findUntracked("a\nconst s = { font: 'var(--body-sm)' };"), [2]);
        assert.deepEqual(findUntracked('s = { font: "var(--metric-lg)" }'), [1]);
    });
    it('flags a declaration split across lines, at the line of `font`', () => {
        assert.deepEqual(findUntracked("a\nconst s = {\n  font:\n    'var(--metric-lg)',\n};"), [3]);
        assert.deepEqual(findUntracked("x = { font: 'var(--body-sm)' };\ny = {\n  font:\n    \"var(--heading-md)\" }"), [1, 3]);
    });
    it('passes typeStyle and non-style fonts', () => {
        assert.deepEqual(findUntracked("s = { ...typeStyle('body-sm') }"), []);
        assert.deepEqual(findUntracked("s = { font: 'var(--code-sm)' }"), []);
    });
    it('scopes docs and demo/cases files, not printed examples', () => {
        assert.equal(inScope('design-system/src/storybook-docs/foundation-page.jsx'), true);
        assert.equal(inScope('design-system/src/templates/Page/pageDemo.jsx'), true);
        assert.equal(inScope('design-system/src/storybook-docs/patterns/Empty/EmptyExamples.jsx'), false);
    });
});
