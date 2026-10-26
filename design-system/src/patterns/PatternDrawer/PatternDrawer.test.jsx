import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PatternDrawer, { DRAWER_PLACEMENTS } from './PatternDrawer';

/** A page with the button that opens the drawer, so focus has somewhere to return to. */
function Page({ initiallyOpen = false, drawerProps = {} }) {
    const [open, setOpen] = React.useState(initiallyOpen);
    return (
        <>
            <button type="button" onClick={() => setOpen(true)}>Open details</button>
            <PatternDrawer
                open={open}
                title="Session details"
                onClose={() => setOpen(false)}
                footer={<button type="button">Save changes</button>}
                {...drawerProps}
            >
                <a href="#notes">Notes</a>
            </PatternDrawer>
        </>
    );
}

describe('PatternDrawer', () => {
    it('names its placements, end first', () => {
        expect(DRAWER_PLACEMENTS).toEqual(['end', 'start']);
    });

    it('is a modal dialog named by its title, the h1', () => {
        render(<PatternDrawer title="Session details" description="Thursday · 4:00–5:00 PM">Body</PatternDrawer>);
        const drawer = screen.getByRole('dialog', { name: 'Session details' });
        expect(drawer).toHaveAttribute('aria-modal', 'true');
        expect(screen.getByRole('heading', { level: 1, name: 'Session details' })).toBeInTheDocument();
        expect(drawer).toHaveAccessibleDescription('Thursday · 4:00–5:00 PM');
    });

    it('takes a width step and sits in an Overlay at the end edge by default', () => {
        render(<PatternDrawer title="Filters" width="lg">Body</PatternDrawer>);
        const drawer = screen.getByRole('dialog');
        expect(drawer).toHaveClass('plus-pattern-drawer', 'plus-pattern-drawer-width-lg');
        expect(drawer.parentElement).toHaveClass('plus-pattern-overlay', 'plus-pattern-overlay-placement-end');
    });

    it('defaults to the sm width and can sit at the start edge', () => {
        render(<PatternDrawer title="Filters" placement="start">Body</PatternDrawer>);
        const drawer = screen.getByRole('dialog');
        expect(drawer).toHaveClass('plus-pattern-drawer-width-sm');
        expect(drawer.parentElement).toHaveClass('plus-pattern-overlay-placement-start');
    });

    it('renders nothing while closed', () => {
        render(<PatternDrawer open={false} title="Filters">Body</PatternDrawer>);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('moves focus into the drawer when it opens and returns it on close', () => {
        render(<Page />);
        const opener = screen.getByRole('button', { name: 'Open details' });
        opener.focus();
        fireEvent.click(opener);
        expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(opener).toHaveFocus();
    });

    it('focuses the drawer itself when it holds nothing focusable', () => {
        render(<PatternDrawer title="Notes">No notes yet.</PatternDrawer>);
        expect(screen.getByRole('dialog')).toHaveFocus();
    });

    it('traps Tab: past the last control it wraps to the first, and back', () => {
        render(<Page initiallyOpen />);
        const close = screen.getByRole('button', { name: 'Close' });
        const save = screen.getByRole('button', { name: 'Save changes' });
        save.focus();
        fireEvent.keyDown(save, { key: 'Tab' });
        expect(close).toHaveFocus();
        fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
        expect(save).toHaveFocus();
    });

    it('leaves Tab between inner controls to the browser', () => {
        render(<Page initiallyOpen />);
        const close = screen.getByRole('button', { name: 'Close' });
        const event = fireEvent.keyDown(close, { key: 'Tab' });
        expect(event).toBe(true);
    });

    it('closes on Escape and returns focus to the opener', () => {
        render(<Page />);
        const opener = screen.getByRole('button', { name: 'Open details' });
        opener.focus();
        fireEvent.click(opener);
        fireEvent.keyDown(screen.getByRole('link', { name: 'Notes' }), { key: 'Escape' });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(opener).toHaveFocus();
    });

    it('leaves an Escape an inner control already handled', () => {
        const onClose = vi.fn();
        render(
            <PatternDrawer title="Filters" onClose={onClose}>
                <input aria-label="Search" onKeyDown={(e) => e.key === 'Escape' && e.preventDefault()} />
            </PatternDrawer>,
        );
        fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
        expect(onClose).not.toHaveBeenCalled();
    });

    it('closes on a click on the scrim, not on the drawer', () => {
        const onClose = vi.fn();
        render(<PatternDrawer title="Filters" onClose={onClose}>Body</PatternDrawer>);
        fireEvent.click(screen.getByRole('dialog'));
        expect(onClose).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('dialog').parentElement);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('draws inline for docs without taking focus or claiming to be modal', () => {
        render(
            <>
                <button type="button">Elsewhere</button>
                <PatternDrawer inline screenWidth={1024} screenHeight={520} title="Filters">Body</PatternDrawer>
            </>,
        );
        const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
        expect(elsewhere).not.toHaveFocus();
        const drawer = screen.getByRole('dialog');
        expect(drawer).toHaveAttribute('aria-modal', 'false');
        expect(drawer.parentElement).toHaveClass('plus-pattern-overlay-inline');
        expect(drawer.parentElement.style.getPropertyValue('--plus-overlay-screen')).toBe('1024px');
    });
});
