import { describe, it, expect, vi } from 'vitest';
import { goToTarget, interceptDocsLinks, navigateInPlace, SELECT_STORY, storybookTarget } from './docsNavigate';

const BASE = 'http://localhost:6006/iframe.html?id=foundations-color--docs';

describe('storybookTarget', () => {
    it('reads a docs or story address, relative or absolute', () => {
        expect(storybookTarget('?path=/docs/foundations-color--docs', BASE)).toEqual({ storyId: 'foundations-color--docs', viewMode: 'docs' });
        expect(storybookTarget('http://localhost:6006/?path=/story/components-forms-and-inputs-close-button--overview', BASE)).toEqual({ storyId: 'components-forms-and-inputs-close-button--overview', viewMode: 'story' });
    });

    it('is null for anything else', () => {
        expect(storybookTarget('https://example.com/', BASE)).toBeNull();
        expect(storybookTarget('/blueprint/', BASE)).toBeNull();
        expect(storybookTarget('', BASE)).toBeNull();
    });
});

describe('navigateInPlace', () => {
    it('asks the manager to select the page over the channel', () => {
        const emit = vi.fn();
        const win = { location: { href: BASE }, __STORYBOOK_ADDONS_CHANNEL__: { emit } };
        expect(navigateInPlace('?path=/docs/foundations-color--docs', win)).toBe(true);
        expect(emit).toHaveBeenCalledWith(SELECT_STORY, { storyId: 'foundations-color--docs', viewMode: 'docs' });
    });

    it('declines without a channel or for a page outside Storybook', () => {
        expect(navigateInPlace('?path=/docs/foundations-color--docs', { location: { href: BASE } })).toBe(false);
        const win = { location: { href: BASE }, __STORYBOOK_ADDONS_CHANNEL__: { emit: vi.fn() } };
        expect(navigateInPlace('https://example.com', win)).toBe(false);
    });
});

describe('interceptDocsLinks', () => {
    const click = (anchor, over = {}) => ({
        button: 0, defaultPrevented: false, target: { closest: () => anchor }, preventDefault: vi.fn(), ...over,
    });
    const anchor = (href, target = '_top') => ({ target, getAttribute: () => href });

    it('switches pages in place on a plain click on a docs link', () => {
        const navigate = vi.fn(() => true);
        const event = click(anchor('?path=/docs/foundations-color--docs'));
        interceptDocsLinks(navigate)(event);
        expect(navigate).toHaveBeenCalledWith('?path=/docs/foundations-color--docs');
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('leaves a modified click and a new-window link alone', () => {
        const navigate = vi.fn(() => true);
        interceptDocsLinks(navigate)(click(anchor('?path=/docs/foundations-color--docs'), { metaKey: true }));
        interceptDocsLinks(navigate)(click(anchor('https://x.test', '_blank')));
        expect(navigate).not.toHaveBeenCalled();
    });
});

describe('goToTarget', () => {
    it.each([
        ['Take me to Color', 'Color'],
        ['can you open the Button page?', 'Button'],
        ['Go to spacing docs', 'spacing'],
    ])('%s → %s', (question, name) => expect(goToTarget(question)).toBe(name));

    it('is null for a question', () => {
        expect(goToTarget('How do I use Button?')).toBeNull();
    });
});
