import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import SidebarTab from './SidebarTab';

describe('SidebarTab row', () => {
    it('is a native button that Enter and Space activate', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(<SidebarTab text="Students" onClick={onClick} />);
        const row = screen.getByRole('button', { name: 'Students' });
        expect(row.tagName).toBe('BUTTON');
        expect(row).toHaveAttribute('type', 'button');
        await user.tab();
        expect(row).toHaveFocus();
        await user.keyboard('{Enter}');
        await user.keyboard(' ');
        expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('a disabled row takes no tab stop and does not fire', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(<SidebarTab text="Reports" state="disabled" onClick={onClick} />);
        const row = screen.getByRole('button', { name: 'Reports' });
        expect(row).toBeDisabled();
        await user.click(row);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('a row with href stays a link', () => {
        render(<SidebarTab text="Help" href="/help" />);
        expect(screen.getByRole('link', { name: 'Help' })).toBeInTheDocument();
    });
});
