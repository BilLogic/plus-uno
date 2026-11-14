import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { isDocsView, keepDocsAtTop } from './docs-open-at-top.js';

const docsWindow = (viewMode) => ({
    HTMLElement: window.HTMLElement,
    addEventListener: (...a) => window.addEventListener(...a),
    removeEventListener: (...a) => window.removeEventListener(...a),
    location: { search: `?viewMode=${viewMode}&id=x` },
});

describe('keepDocsAtTop', () => {
    let original;
    let seen;
    let release;

    beforeEach(() => {
        original = HTMLElement.prototype.focus;
        seen = [];
        HTMLElement.prototype.focus = function (o) { seen.push(o); };
    });
    afterEach(() => {
        release?.();
        HTMLElement.prototype.focus = original;
    });

    it('makes focus() preventScroll on a docs page, overriding preventScroll: false', () => {
        release = keepDocsAtTop(docsWindow('docs'));
        const el = document.createElement('button');
        el.focus();
        el.focus({ focusVisible: true });
        el.focus({ preventScroll: false });
        expect(seen).toEqual([
            { preventScroll: true },
            { focusVisible: true, preventScroll: true },
            { preventScroll: true },
        ]);
    });

    it('leaves a story alone', () => {
        release = keepDocsAtTop(docsWindow('story'));
        document.createElement('button').focus({ preventScroll: false });
        expect(seen).toEqual([{ preventScroll: false }]);
    });

    it('lets go after the reader acts, and holds again when the page changes', () => {
        let rearm;
        release = keepDocsAtTop(docsWindow('docs'), (fn) => { rearm = fn; });
        const el = document.createElement('button');
        window.dispatchEvent(new Event('keydown'));
        el.focus({ preventScroll: false });
        expect(seen.pop()).toEqual({ preventScroll: false });
        rearm();
        el.focus({ preventScroll: false });
        expect(seen.pop()).toEqual({ preventScroll: true });
    });

    it('removes the guard on release', () => {
        const stub = HTMLElement.prototype.focus;
        release = keepDocsAtTop(docsWindow('docs'));
        expect(HTMLElement.prototype.focus).not.toBe(stub);
        release();
        expect(HTMLElement.prototype.focus).toBe(stub);
    });
});

describe('isDocsView', () => {
    it('reads viewMode from the URL', () => {
        expect(isDocsView({ location: { search: '?viewMode=docs&id=x' } })).toBe(true);
        expect(isDocsView({ location: { search: '?viewMode=story' } })).toBe(false);
    });
});
