import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { expectTypeCardAnchors } from '@/storybook-docs/lib/type-card-anchors.jsx';
import {
    DimmedInMenuCase,
    LeftOutOfMenuCase,
    ReasonInCaptionCase,
    ReasonInTooltipCase,
} from './DisabledCases.jsx';

vi.mock('@storybook/addon-docs/blocks', () => import('@/storybook-docs/lib/addon-docs-blocks-mock.jsx'));

describe('Disabled live cases and TypeCard links', () => {
    it('ReasonInCaptionCase shows visible caption text without a tooltip, while ReasonInTooltipCase hides the reason in a tooltip', () => {
        const { container, unmount } = render(<ReasonInCaptionCase />);
        expect(container.querySelector('[inert]')).toBeNull();
        expect(screen.getByLabelText('Group')).toBeDisabled();
        expect(screen.getByText('Choose a school first.')).toBeVisible();
        expect(screen.queryByRole('tooltip')).toBeNull();
        unmount();

        render(<ReasonInTooltipCase />);
        expect(screen.getByLabelText('Group')).toBeDisabled();
        expect(screen.getByRole('tooltip')).toHaveTextContent('Choose a school first.');
    });

    it('LeftOutOfMenuCase omits restricted actions while DimmedInMenuCase renders a disabled Delete school row', async () => {
        const { unmount } = render(<LeftOutOfMenuCase />);
        expect(await screen.findByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
        expect(screen.queryByRole('menuitem', { name: 'Delete school' })).toBeNull();
        unmount();

        render(<DimmedInMenuCase />);
        const deleteItem = await screen.findByRole('menuitem', { name: 'Delete school' });
        expect(deleteItem).toHaveAttribute('aria-disabled', 'true');
    });

    it('links every TypeCard anchor to a ComponentExample heading id in Disabled.mdx', () => {
        expectTypeCardAnchors(join(__dirname, 'Disabled.mdx'), 4);
    });
});
