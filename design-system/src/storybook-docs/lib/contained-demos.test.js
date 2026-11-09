import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { assertContained, findEscapes } from './contained-demos';

const mount = (html) => {
    document.body.innerHTML = html;
    return document.getElementById('canvas');
};

// jsdom has no layout: measure an element from its inline width and height.
const realRect = Element.prototype.getBoundingClientRect;
beforeAll(() => {
    Element.prototype.getBoundingClientRect = function rect() {
        const width = parseFloat(this.style.width) || 0;
        const height = parseFloat(this.style.height) || 0;
        return { width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0 };
    };
});
afterAll(() => { Element.prototype.getBoundingClientRect = realRect; });

afterEach(() => { document.body.innerHTML = ''; });

describe('findEscapes', () => {
    it('passes a demo that renders in place', () => {
        const canvas = mount('<div id="canvas"><div role="dialog" style="width:10px;height:10px">Inline</div></div>');
        expect(findEscapes(canvas)).toEqual([]);
    });

    it('flags a modal dialog portaled over the page', () => {
        const canvas = mount('<div id="canvas"></div><div role="dialog" aria-modal="true" style="width:10px;height:10px">Edit</div>');
        expect(findEscapes(canvas)).toHaveLength(1);
    });

    it('flags a Flag stack fixed to the screen', () => {
        const canvas = mount('<div id="canvas"></div><div class="plus-flag-container" data-container-position="fixed" style="width:10px;height:10px"></div>');
        expect(findEscapes(canvas)[0]).toMatch(/over the page/);
    });

    it('flags an element fixed to the screen from inside the canvas', () => {
        const canvas = mount('<div id="canvas"><div style="position:fixed;width:10px;height:10px"></div></div>');
        expect(findEscapes(canvas)[0]).toMatch(/fixed to the screen/);
    });

    it('ignores a visually hidden 1px input', () => {
        const canvas = mount('<div id="canvas"><input style="position:fixed;width:1px;height:1px"></div>');
        expect(findEscapes(canvas)).toEqual([]);
    });

    it('ignores a hidden overlay', () => {
        const canvas = mount('<div id="canvas"></div><div role="dialog" aria-modal="true" style="display:none"></div>');
        expect(findEscapes(canvas)).toEqual([]);
    });
});

describe('assertContained', () => {
    it('skips test-only stories, whose resolved tags lack dev', async () => {
        const canvas = mount('<div id="canvas"></div><div role="dialog" aria-modal="true" style="width:10px;height:10px"></div>');
        await expect(assertContained({ canvasElement: canvas, tags: ['test'] })).resolves.toBeUndefined();
    });

    it('throws for a docs story that escapes', async () => {
        const canvas = mount('<div id="canvas"></div><div role="dialog" aria-modal="true" style="width:10px;height:10px"></div>');
        await expect(assertContained({ canvasElement: canvas, tags: ['dev', 'test'] })).rejects.toThrow(/leaves its canvas/);
    });
});
