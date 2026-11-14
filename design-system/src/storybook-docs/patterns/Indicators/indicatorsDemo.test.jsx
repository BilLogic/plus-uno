import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
    ChecklistCard,
    ChecklistInPage,
    ChecklistInSidebar,
    ChecklistOnHome,
    HOME_CHECKLIST_STEPS,
    ONE_DAY_MS,
} from './indicatorsDemo.jsx';

describe('Checklist (Patterns › Indicators)', () => {
    it('renders card on Home from PatternSection and PatternCard with open steps above done steps and dismiss X', () => {
        const { container } = render(<ChecklistOnHome />);

        expect(container.querySelector('.plus-pattern-section')).not.toBeNull();
        const card = container.querySelector('.plus-pattern-card');
        expect(card).not.toBeNull();

        expect(within(card).getByRole('heading', { name: 'Get ready for your first session' })).toBeInTheDocument();
        expect(within(card).getByText('2 of 5 done')).toBeInTheDocument();

        const bar = within(card).getByRole('progressbar', { name: /Get ready for your first session/i });
        expect(bar).toHaveAttribute('aria-valuenow', '40');

        const dismissBtn = within(card).getByRole('button', { name: 'Dismiss checklist' });
        expect(dismissBtn).toBeInTheDocument();

        const rows = [...card.querySelectorAll('[data-checklist-step]')];
        expect(rows).toHaveLength(5);

        // Open steps stay in original order on top; done steps sit below them.
        const titles = rows.map((row) => row.getAttribute('data-checklist-step'));
        expect(titles).toEqual([
            'Connect your calendar',
            'Upload background check',
            'Complete safeguarding check-in',
            'Verify school email',
            'Choose tutoring subjects',
        ]);

        // Each open step has one enabled Button; each done step has "Completed" text and no button.
        for (const openRow of rows.slice(0, 3)) {
            const btn = within(openRow).getByRole('button');
            expect(btn).toBeEnabled();
            expect(within(openRow).queryByText('Completed')).toBeNull();
        }
        for (const doneRow of rows.slice(3)) {
            expect(within(doneRow).queryByRole('button')).toBeNull();
            expect(within(doneRow).getByText('Completed')).toBeInTheDocument();
        }
        expect(within(card).queryByRole('button', { name: /completed/i })).toBeNull();
    });

    it('dismisses the Home checklist when X is pressed', async () => {
        const user = userEvent.setup();
        render(<ChecklistOnHome />);

        expect(screen.getByRole('heading', { name: 'Get ready for your first session' })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Dismiss checklist' }));
        expect(screen.queryByRole('heading', { name: 'Get ready for your first session' })).toBeNull();
    });

    it('moves a newly completed step below open steps and shrinks a dismissible checklist to one line for a day before disappearing', async () => {
        const user = userEvent.setup();
        const completedTime = 1_700_000_000_000;
        const { container, rerender } = render(
            <ChecklistCard
                title="Get ready for your first session"
                defaultSteps={HOME_CHECKLIST_STEPS}
                dismissible
                now={completedTime}
            />
        );

        // Complete the second open step ("Upload background check"); first and third open steps stay on top in order.
        await user.click(screen.getByRole('button', { name: 'Upload file' }));
        expect(screen.getByText('3 of 5 done')).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');

        const titlesAfterOne = [...container.querySelectorAll('[data-checklist-step]')].map((el) =>
            el.getAttribute('data-checklist-step')
        );
        expect(titlesAfterOne).toEqual([
            'Connect your calendar',
            'Complete safeguarding check-in',
            'Verify school email',
            'Choose tutoring subjects',
            'Upload background check',
        ]);

        // Complete the remaining two open steps -> all 5 done -> shrinks to one line while within 24h.
        await user.click(screen.getByRole('button', { name: 'Connect' }));
        await user.click(screen.getByRole('button', { name: 'Start check-in' }));

        expect(container.querySelectorAll('[data-checklist-step]')).toHaveLength(0);
        expect(screen.getByText(/All 5 steps completed/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Dismiss checklist' })).toBeInTheDocument();

        // After one day passes, the completed dismissible checklist disappears automatically.
        rerender(
            <ChecklistCard
                title="Get ready for your first session"
                defaultSteps={HOME_CHECKLIST_STEPS}
                dismissible
                now={completedTime + ONE_DAY_MS}
            />
        );
        expect(container.querySelector('.plus-pattern-card')).toBeNull();
        expect(screen.queryByText(/All 5 steps completed/)).toBeNull();
    });

    it('renders persistent card in a page without X and stays with all steps ticked when all are done', async () => {
        const user = userEvent.setup();
        const { container } = render(<ChecklistInPage />);

        const card = container.querySelector('.plus-pattern-card');
        expect(card).not.toBeNull();
        expect(within(card).getByText('2 of 5 done')).toBeInTheDocument();
        expect(within(card).queryByRole('button', { name: /dismiss/i })).toBeNull();

        // Complete all three open steps.
        const actionButtons = within(card).getAllByRole('button');
        expect(actionButtons).toHaveLength(3);
        for (const btn of [...actionButtons]) {
            await user.click(btn);
        }

        // Persistent checklist stays open with 5 of 5 done, success ProgressBar, and all 5 rows ticked with Completed.
        expect(within(card).getByText('5 of 5 done')).toBeInTheDocument();
        const bar = within(card).getByRole('progressbar');
        expect(bar).toHaveAttribute('aria-valuenow', '100');
        expect(bar.closest('.plus-progressbar').className).toContain('success');

        const rows = [...card.querySelectorAll('[data-checklist-step]')];
        expect(rows).toHaveLength(5);
        expect(within(card).queryAllByRole('button')).toHaveLength(0);
        expect(within(card).getAllByText('Completed')).toHaveLength(5);
    });

    it('renders compact checklist at the foot of the sidebar with count, bar and next step, and opens the full list on press', async () => {
        const user = userEvent.setup();
        render(<ChecklistInSidebar />);

        const nav = screen.getByRole('navigation', { name: 'Main' });
        const sidebar = nav.closest('.plus-pattern-frame__sidebar') ?? nav.parentElement.parentElement;

        expect(within(sidebar).getByText('2 of 5 done')).toBeInTheDocument();
        expect(within(sidebar).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');
        const nextBtn = within(sidebar).getByRole('button', { name: /Connect your calendar/i });
        expect(nextBtn).toBeInTheDocument();

        // Full checklist is not yet on the Sessions page; pressing the compact checklist opens Home with the full list.
        expect(screen.queryByRole('heading', { name: 'Get ready for your first session' })).toBeNull();
        await user.click(nextBtn);

        expect(screen.getByRole('heading', { name: 'Get ready for your first session' })).toBeInTheDocument();
        expect(screen.getAllByText('Connect your calendar').length).toBeGreaterThanOrEqual(1);
    });
});
