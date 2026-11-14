import { afterEach, describe, expect, it } from 'vitest';

import { isDocsView, keepDocsAtTop } from './docs-open-at-top.js';

describe('keepDocsAtTop', () => {
    let release;
    afterEach(() => release?.());

    it('makes focus() preventScroll until the reader acts', () => {
        const original = HTMLElement.prototype.focus;
        const seen = [];
        HTMLElement.prototype.focus = function (o) { seen.push(o); };
        release = keepDocsAtTop();
        const el = document.createElement('button');
        el.focus();
        el.focus({ focusVisible: true });
        expect(seen[0]).toEqual({ preventScroll: true });
        expect(seen[1]).toEqual({ focusVisible: true, preventScroll: true });
        release();
        HTMLElement.prototype.focus = original;
    });

    it('overrides a caller preventScroll: false', () => {
        const original = HTMLElement.prototype.focus;
        const seen = [];
        HTMLElement.prototype.focus = function (o) { seen.push(o); };
        release = keepDocsAtTop();
        document.createElement('button').focus({ preventScroll: false });
        expect(seen[0]).toEqual({ preventScroll: true });
        release();
        HTMLElement.prototype.focus = original;
    });

    it('lets go after the first user input', () => {
        const original = HTMLElement.prototype.focus;
        HTMLElement.prototype.focus = function () {};
        const base = HTMLElement.prototype.focus;
        release = keepDocsAtTop();
        expect(HTMLElement.prototype.focus).not.toBe(base);
        window.dispatchEvent(new Event('keydown'));
        expect(HTMLElement.prototype.focus).toBe(base);
        HTMLElement.prototype.focus = original;
    });
});

describe('isDocsView', () => {
    it('reads viewMode from the URL', () => {
        expect(isDocsView({ location: { search: '?viewMode=docs&id=x' } })).toBe(true);
        expect(isDocsView({ location: { search: '?viewMode=story' } })).toBe(false);
    });
});
