import { afterEach, describe, expect, it, vi } from 'vitest';
import { INERT_SELECTOR, expectFullScale, expectNotInert } from './live-example-asserts.js';

describe('live-example-asserts', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('passes expectNotInert when only Base UI popup siblings are marked inert', async () => {
        const host = document.createElement('div');
        host.innerHTML = '<div data-base-ui-inert inert></div><button type="button">Open</button>';
        expect(INERT_SELECTOR).toBe('[inert]:not([data-base-ui-inert])');
        await expectNotInert(host);
    });

    it('fails expectNotInert when a non-Base-UI descendant or ancestor is inert', async () => {
        const host = document.createElement('div');
        host.innerHTML = '<div inert><button type="button">Trapped</button></div>';
        await expect(expectNotInert(host)).rejects.toThrow();

        const parent = document.createElement('div');
        parent.setAttribute('inert', '');
        const child = document.createElement('div');
        parent.appendChild(child);
        await expect(expectNotInert(child)).rejects.toThrow();
    });

    it('passes expectFullScale when transform is none and fails when scaled down', async () => {
        const host = document.createElement('div');
        const stage = document.createElement('div');
        const frame = document.createElement('div');
        frame.className = 'plus-frame';
        stage.appendChild(frame);
        host.appendChild(stage);

        vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => ({
            transform: el.style.transform || 'none',
            zoom: el.style.zoom || '1',
        }));

        await expectFullScale(host);

        stage.style.transform = 'matrix(0.6, 0, 0, 0.6, 0, 0)';
        await expect(expectFullScale(host)).rejects.toThrow();
    });
});
