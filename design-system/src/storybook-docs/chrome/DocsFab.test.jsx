import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { IconButton } from '@/components';
import DocsFab, { MARKETPLACE_HREF, BLUEPRINT_HREF } from './DocsFab';

const openFab = async (ui = <DocsFab />) => {
    const user = userEvent.setup();
    const view = render(ui);
    const trigger = screen.getByRole('button', { name: 'Prototype links' });
    await user.click(trigger);
    return { user, trigger, ...view };
};

describe('DocsFab', () => {
    it('renders one closed trigger with an accessible name and no links', () => {
        render(<DocsFab />);
        const trigger = screen.getByRole('button', { name: 'Prototype links' });
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(trigger).toHaveClass('plus-btn--circle');
        expect(screen.queryAllByRole('menuitem')).toHaveLength(0);
    });

    it('opens on click and reflects aria-expanded', async () => {
        const { trigger } = await openFab();
        expect(await screen.findAllByRole('menuitem')).toHaveLength(2);
        await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    });

    it('opens from the keyboard', async () => {
        const user = userEvent.setup();
        render(<DocsFab />);
        screen.getByRole('button', { name: 'Prototype links' }).focus();
        await user.keyboard('{Enter}');
        expect(await screen.findAllByRole('menuitem')).toHaveLength(2);
    });

    it('moves between actions with the arrow keys', async () => {
        const { user } = await openFab();
        const [first, second] = await screen.findAllByRole('menuitem');
        await user.keyboard('{ArrowDown}');
        await waitFor(() => expect(first).toHaveFocus());
        await user.keyboard('{ArrowDown}');
        expect(second).toHaveFocus();
    });

    it('closes on Escape and returns focus to the trigger', async () => {
        const { user, trigger } = await openFab();
        await screen.findAllByRole('menuitem');
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryAllByRole('menuitem')).toHaveLength(0));
        expect(trigger).toHaveFocus();
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('keeps one tab stop: the actions are roving, not tabbable', async () => {
        await openFab();
        for (const item of await screen.findAllByRole('menuitem')) {
            expect(item).toHaveAttribute('tabindex', '-1');
        }
    });

    it('opens on Space and the AI agent joins the arrow-key order', async () => {
        const user = userEvent.setup();
        render(<DocsFab aiAgent={<IconButton icon="wand-magic-sparkles" label="AI agent" shape="circle" />} />);
        screen.getByRole('button', { name: 'Prototype links' }).focus();
        await user.keyboard(' ');
        const items = await screen.findAllByRole('menuitem');
        expect(items.map((i) => i.getAttribute('aria-label'))).toEqual(['AI agent', 'Prototype Marketplace', 'Uno Blueprint']);
        await user.keyboard('{Home}');
        await waitFor(() => expect(items[0]).toHaveFocus());
        await user.keyboard('{ArrowDown}');
        expect(items[1]).toHaveFocus();
    });

    it('activates a link with Space and closes the menu', async () => {
        const { user } = await openFab();
        const [marketplace] = await screen.findAllByRole('menuitem');
        const click = vi.fn((e) => e.preventDefault());
        marketplace.addEventListener('click', click);
        await user.keyboard('{ArrowDown}');
        await waitFor(() => expect(marketplace).toHaveFocus());
        await user.keyboard(' ');
        expect(click).toHaveBeenCalled();
        await waitFor(() => expect(screen.queryAllByRole('menuitem')).toHaveLength(0));
    });

    it('closes on an outside click', async () => {
        const { user } = await openFab();
        await screen.findAllByRole('menuitem');
        await user.click(document.body);
        await waitFor(() => expect(screen.queryAllByRole('menuitem')).toHaveLength(0));
    });

    it('closes on a second click of the trigger', async () => {
        const { user, trigger } = await openFab();
        await screen.findAllByRole('menuitem');
        await user.click(trigger);
        await waitFor(() => expect(screen.queryAllByRole('menuitem')).toHaveLength(0));
    });

    it('links Prototype Marketplace to Notion in a new tab', async () => {
        await openFab();
        const link = await screen.findByRole('menuitem', { name: 'Prototype Marketplace' });
        expect(link).toHaveAttribute('href', MARKETPLACE_HREF);
        expect(link.getAttribute('href')).toMatch(/^https:\/\/app\.notion\.com\//);
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
        expect(link).toHaveClass('plus-btn--circle');
    });

    it('links Uno Blueprint to /blueprint/ with its logo', async () => {
        await openFab();
        const link = await screen.findByRole('menuitem', { name: 'Uno Blueprint' });
        expect(link).toHaveAttribute('href', BLUEPRINT_HREF);
        expect(BLUEPRINT_HREF).toBe('/blueprint/');
        expect(link).toHaveClass('plus-btn--circle');
        // The stack lives in the preview frame; Blueprint must replace the whole page.
        expect(link).toHaveAttribute('target', '_top');
        expect(link.querySelector('img')).toHaveAttribute('src', '/uno-bot/logos/uno-blueprint.png');
    });

    it('uses the default 32px spacing and the Tooltip in place of a native title', async () => {
        await openFab();
        for (const link of await screen.findAllByRole('menuitem')) {
            expect(link).not.toHaveClass('plus-btn--compact');
            expect(link).not.toHaveAttribute('title');
        }
    });

    it('stacks Marketplace above Blueprint with nothing above for the AI agent', async () => {
        await openFab();
        const names = (await screen.findAllByRole('menuitem')).map((l) => l.getAttribute('aria-label'));
        expect(names).toEqual(['Prototype Marketplace', 'Uno Blueprint']);
    });

});
