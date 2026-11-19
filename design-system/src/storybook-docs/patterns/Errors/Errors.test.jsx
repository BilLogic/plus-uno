import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectTypeCardAnchors } from '@/storybook-docs/lib/type-card-anchors.jsx';
import { BorderAndTooltipCase, CODE, FailureInModal, FailureInSlot, MessageOnFieldCase } from './ErrorsCases.jsx';

vi.mock('@storybook/addon-docs/blocks', () => import('@/storybook-docs/lib/addon-docs-blocks-mock.jsx'));

describe('Errors live cases and TypeCard links', () => {
    it('MessageOnFieldCase shows visible error text that clears once valid, while BorderAndTooltipCase puts the message in a tooltip', async () => {
        const user = userEvent.setup();
        const { container, unmount } = render(<MessageOnFieldCase />);
        expect(container.querySelector('[inert]')).toBeNull();
        const field = screen.getByLabelText(/School email/);
        expect(field).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText('Enter a full email, like name@school.org')).toBeInTheDocument();
        expect(screen.queryByRole('tooltip')).toBeNull();

        await user.clear(field);
        await user.type(field, 'ana@school.org');
        expect(field).not.toHaveAttribute('aria-invalid', 'true');
        expect(screen.queryByText('Enter a full email, like name@school.org')).toBeNull();
        unmount();

        render(<BorderAndTooltipCase />);
        const tooltipField = screen.getByLabelText(/School email/);
        expect(tooltipField).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByRole('tooltip')).toHaveTextContent('Enter a full email, like name@school.org');
    });

    it('FailureInSlot keeps the Section header with Try again in its body; FailureInModal puts the failure in a dialog', () => {
        const slot = render(<FailureInSlot />);
        expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
        expect(screen.getByRole('searchbox', { name: 'Search sessions' })).toBeInTheDocument();
        slot.unmount();
        render(<FailureInModal />);
        expect(screen.getByText("Couldn't load sessions")).toBeInTheDocument();
    });

    it('prints each example from its own source, with the PLUS imports it needs', () => {
        expect(Object.keys(CODE)).toEqual(['MessageOnField', 'BorderAndTooltip', 'FailureInSlot', 'FailureInModal']);
        expect(CODE.FailureInSlot).toMatch(/^import \{ .*EmptyState.* \} from '@\/components';/);
        expect(CODE.FailureInSlot).toContain("header=\"Couldn't load this week's sessions\"");
        expect(CODE.FailureInModal).toContain('<Modal');
        expect(CODE.MessageOnField).toContain('isValidEmail');
        for (const code of Object.values(CODE)) expect(code).not.toMatch(/Example\.|storybook-docs/);
    });

    it('links every TypeCard anchor to a ComponentExample heading id in Errors.mdx', () => {
        expectTypeCardAnchors(join(__dirname, 'Errors.mdx'), 6);
    });
});
