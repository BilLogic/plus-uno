import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import DocsFab, { MARKETPLACE_HREF, BLUEPRINT_HREF } from './DocsFab';

const open = async (ui = <DocsFab />) => {
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
        const { trigger } = await open();
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
        const { user } = await open();
        const [first, second] = await screen.findAllByRole('menuitem');
        await waitFor(() => expect(first).toHaveFocus());
        await user.keyboard('{ArrowDown}');
        expect(second).toHaveFocus();
    });

    it('closes on Escape and returns focus to the trigger', async () => {
        const { user, trigger } = await open();
        await screen.findAllByRole('menuitem');
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryAllByRole('menuitem')).toHaveLength(0));
        expect(trigger).toHaveFocus();
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes on an outside click', async () => {
        const { user } = await open();
        await screen.findAllByRole('menuitem');
        await user.click(document.body);
        await waitFor(() => expect(screen.queryAllByRole('menuitem')).toHaveLength(0));
    });

    it('closes on a second click of the trigger', async () => {
        const { user, trigger } = await open();
        await screen.findAllByRole('menuitem');
        await user.click(trigger);
        await waitFor(() => expect(screen.queryAllByRole('menuitem')).toHaveLength(0));
    });

    it('links Prototype Marketplace to Notion in a new tab', async () => {
        await open();
        const link = await screen.findByRole('menuitem', { name: 'Prototype Marketplace' });
        expect(link).toHaveAttribute('href', MARKETPLACE_HREF);
        expect(link.getAttribute('href')).toMatch(/^https:\/\/app\.notion\.com\//);
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
        expect(link).toHaveClass('plus-btn--circle');
    });

    it('links Uno Blueprint to /blueprint/ with its logo', async () => {
        await open();
        const link = await screen.findByRole('menuitem', { name: 'Uno Blueprint' });
        expect(link).toHaveAttribute('href', BLUEPRINT_HREF);
        expect(BLUEPRINT_HREF).toBe('/blueprint/');
        expect(link).toHaveClass('plus-btn--circle');
        // The stack lives in the preview frame; Blueprint must replace the whole page.
        expect(link).toHaveAttribute('target', '_top');
        expect(link.querySelector('img')).toHaveAttribute('src', '/uno-bot/logos/uno-blueprint.png');
    });

    it('uses the default 32px spacing and the Tooltip in place of a native title', async () => {
        await open();
        for (const link of await screen.findAllByRole('menuitem')) {
            expect(link).not.toHaveClass('plus-btn--compact');
            expect(link).not.toHaveAttribute('title');
        }
    });

    it('stacks Marketplace above Blueprint with nothing above for the AI agent', async () => {
        await open();
        const names = (await screen.findAllByRole('menuitem')).map((l) => l.getAttribute('aria-label'));
        expect(names).toEqual(['Prototype Marketplace', 'Uno Blueprint']);
    });

    it('renders the aiAgent slot above Marketplace, as a third action', async () => {
        await open(<DocsFab aiAgent={<button type="button">AI</button>} />);
        const items = await screen.findAllByRole('menuitem');
        expect(items).toHaveLength(2);
        const ai = screen.getByRole('button', { name: 'AI' });
        const marketplace = screen.getByRole('menuitem', { name: 'Prototype Marketplace' });
        expect(ai.compareDocumentPosition(marketplace) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
});
