import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PatternSidebar } from '@/patterns';

const groups = [
    { id: 'home', items: [{ id: 'home', text: 'Home', icon: 'house' }] },
    {
        id: 'toolkit',
        title: 'Toolkit',
        items: [
            { id: 'sessions', text: 'Sessions', icon: 'calendar' },
            { id: 'students', text: 'Students', icon: 'user' },
        ],
    },
];

const sessions = ['One', 'Two', 'Three', 'Four', 'Five'].map((label) => ({ id: `t-${label}`, label }));

const renderSidebar = () => render(
    <PatternSidebar
        storageKey={null}
        groups={groups}
        activeId="home"
        tabs={{ sessions }}
        onSelect={() => {}}
        onSelectTab={() => {}}
        onToggle={() => {}}
        account={{ id: 'a1', name: 'Mara Lindqvist', role: 'Tutor' }}
    />,
);

describe('Sidebar disclosures', () => {
    it('opens and closes a group from the keyboard and reports it in aria-expanded', async () => {
        const user = userEvent.setup();
        renderSidebar();
        const title = screen.getByRole('button', { name: 'Toolkit' });
        expect(title).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('button', { name: 'Students' })).toBeInTheDocument();

        title.focus();
        await user.keyboard('{Enter}');
        expect(title).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('button', { name: 'Students' })).toBeNull();

        await user.keyboard(' ');
        expect(title).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('button', { name: 'Students' })).toBeInTheDocument();
    });

    it('shows the rest of the open tabs from the keyboard and reports it in aria-expanded', async () => {
        const user = userEvent.setup();
        renderSidebar();
        const more = screen.getByRole('button', { name: 'Show 2 more' });
        expect(more).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('button', { name: 'Five' })).toBeNull();

        more.focus();
        await user.keyboard('{Enter}');
        const less = screen.getByRole('button', { name: 'Show less' });
        expect(less).toHaveAttribute('aria-expanded', 'true');
        // The extra tabs live in the sibling list, so the row must not point at a panel that is not there.
        document.querySelectorAll('[aria-controls]').forEach((el) => {
            expect(document.getElementById(el.getAttribute('aria-controls'))).not.toBeNull();
        });
        expect(screen.getByRole('button', { name: 'Five' })).toBeInTheDocument();

        await user.keyboard(' ');
        expect(screen.getByRole('button', { name: 'Show 2 more' })).toHaveAttribute('aria-expanded', 'false');
    });

    it('opens the account menu from the keyboard and renders each group's items in a list', async () => {
        const user = userEvent.setup();
        renderSidebar();
        const group = screen.getByRole('group', { name: 'Toolkit' });
        expect(group.querySelector('ul.plus-pattern-sidebar__list')).not.toBeNull();
        const trigger = screen.getByRole('button', { name: /account menu/ });
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        trigger.focus();
        await user.keyboard('{Enter}');
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(await screen.findByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument();
    });
});
