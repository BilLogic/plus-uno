import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LockDo, LockDont, NamesDo, NamesDont, TabLabelDo, TabLabelDont } from './Sidebar.examples.jsx';

describe('Sidebar live examples', () => {
    it('renders all six do/dont examples without inert or hidden landmarks and with unique nav labels', () => {
        const { container } = render(
            <div>
                <NamesDo />
                <NamesDont />
                <LockDo />
                <LockDont />
                <TabLabelDo />
                <TabLabelDont />
            </div>,
        );
        expect(container.querySelector('[inert]')).toBeNull();
        const labels = screen.getAllByRole('navigation').map((nav) => nav.getAttribute('aria-label'));
        expect(new Set(labels).size).toBe(6);
    });

    it('lets users interact with area rows and open tabs in Sidebar examples', async () => {
        const user = userEvent.setup();
        const { unmount } = render(<NamesDo />);
        const students = screen.getByRole('button', { name: 'Students' });
        await user.click(students);
        expect(students).toHaveAttribute('aria-current', 'page');
        unmount();

        render(<TabLabelDo />);
        const tab = screen.getByRole('button', { name: '4:00 PM · Ms. Ortiz' });
        await user.click(tab);
        expect(tab).toHaveAttribute('aria-current', 'page');
    });
});
