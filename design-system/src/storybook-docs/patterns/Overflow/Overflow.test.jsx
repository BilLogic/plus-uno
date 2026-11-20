import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectTypeCardAnchors } from '@/storybook-docs/lib/type-card-anchors.jsx';
import {
    CODE,
    ClippedCellNoTextCase,
    ClippedCellOpensTextCase,
    ClippedSectionTitleCase,
    FadedListCase,
    ShowMoreWithCountCase,
    WrappedSectionTitleCase,
} from './OverflowCases.jsx';
import { LONG_NOTE, LONG_TITLE } from './overflowDemo.jsx';

vi.mock('@storybook/addon-docs/blocks', () => import('@/storybook-docs/lib/addon-docs-blocks-mock.jsx'));

describe('Overflow live cases and TypeCard links', () => {
    it('WrappedSectionTitleCase keeps heading text unwrapped-style while ClippedSectionTitleCase truncates with ellipsis', () => {
        const { container, unmount } = render(<WrappedSectionTitleCase />);
        expect(container.querySelector('[inert]')).toBeNull();
        expect(screen.getByRole('heading', { name: LONG_TITLE })).toBeVisible();
        unmount();

        render(<ClippedSectionTitleCase />);
        const clipped = screen.getByText(LONG_TITLE);
        expect(clipped.style.textOverflow).toBe('ellipsis');
        expect(clipped.style.whiteSpace).toBe('nowrap');
    });

    it('ClippedCellOpensTextCase opens its tooltip on focus only while clipped, while ClippedCellNoTextCase omits the tooltip', async () => {
        const originalScrollWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth');
        Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
            configurable: true,
            get() {
                return this.textContent === LONG_NOTE ? 400 : 0;
            },
        });
        try {
            const { unmount } = render(<ClippedCellOpensTextCase />);
            expect(screen.queryByRole('tooltip')).toBeNull();
            const doNote = screen.getByText(LONG_NOTE);
            expect(doNote).toHaveAttribute('tabindex', '0');
            doNote.focus();
            expect(await screen.findByRole('tooltip')).toHaveTextContent(LONG_NOTE);
            unmount();

            render(<ClippedCellNoTextCase />);
            expect(screen.queryByRole('tooltip')).toBeNull();
            const dontNote = screen.getByText(LONG_NOTE);
            expect(dontNote.getAttribute('tabindex')).toBeNull();
        } finally {
            if (originalScrollWidth) {
                Object.defineProperty(HTMLElement.prototype, 'scrollWidth', originalScrollWidth);
            } else {
                delete HTMLElement.prototype.scrollWidth;
            }
        }
    });

    it('ShowMoreWithCountCase grows a list from 2 to 6 items on click while FadedListCase offers no expand control', async () => {
        const user = userEvent.setup();
        const { unmount } = render(<ShowMoreWithCountCase />);
        expect(screen.queryByRole('table')).toBeNull();
        expect(within(screen.getByRole('list', { name: 'Students' })).getAllByRole('listitem')).toHaveLength(2);
        await user.click(screen.getByRole('button', { name: 'Show 4 more' }));
        expect(within(screen.getByRole('list', { name: 'Students' })).getAllByRole('listitem')).toHaveLength(6);
        expect(screen.getByRole('button', { name: 'Show less' })).toBeVisible();
        unmount();

        render(<FadedListCase />);
        expect(screen.queryByRole('button', { name: /Show/ })).toBeNull();
    });

    it('prints each example from its own source', () => {
        expect(Object.keys(CODE)).toHaveLength(6);
        expect(CODE.ClippedCellOpensText).not.toContain('@/lib');
        expect(CODE.ShowMoreWithCount).toContain('const StudentList');
        expect(CODE.ClippedCellNoText).not.toContain('plus-table-cell-text');
        for (const code of Object.values(CODE)) expect(code).not.toMatch(/Example\.|storybook-docs/);
    });

    it('links every TypeCard anchor to a ComponentExample heading id in Overflow.mdx', () => {
        expectTypeCardAnchors(join(__dirname, 'Overflow.mdx'), 4);
    });
});
