import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleInPageLink } from './in-page-anchors';

const click = (el, init = {}) => {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
    Object.defineProperty(event, 'target', { value: el });
    return event;
};

describe('in-page docs links', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <nav><a id="to-a" href="#foundation-overview"><span id="inner">Overview</span></a>
            <a id="to-missing" href="#nowhere">Missing</a>
            <a id="away" href="https://example.com/">Away</a></nav>
            <section id="foundation-overview"></section>`;
        Element.prototype.scrollIntoView = vi.fn();
        window.history.replaceState(null, '', '/');
    });

    it('scrolls to the section and records the hash instead of navigating', () => {
        const event = click(document.getElementById('inner'));
        expect(handleInPageLink(event)).toBe(true);
        expect(event.defaultPrevented).toBe(true);
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledOnce();
        expect(window.location.hash).toBe('#foundation-overview');
    });

    it('leaves a link alone when its target is not on the page', () => {
        const event = click(document.getElementById('to-missing'));
        expect(handleInPageLink(event)).toBe(false);
        expect(event.defaultPrevented).toBe(false);
    });

    it('leaves external links and modified clicks alone', () => {
        expect(handleInPageLink(click(document.getElementById('away')))).toBe(false);
        expect(handleInPageLink(click(document.getElementById('to-a'), { metaKey: true }))).toBe(false);
    });
});
