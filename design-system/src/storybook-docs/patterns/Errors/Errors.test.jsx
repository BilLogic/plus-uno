import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectTypeCardAnchors } from '@/storybook-docs/lib/type-card-anchors.jsx';
import { BorderAndTooltipCase, CODE, FailureInModal, FailureInSlot, MessageOnFieldCase } from './ErrorsCases.jsx';
import { MessageOnField } from './ErrorsExamples.jsx';

vi.mock('@storybook/addon-docs/blocks', () => import('@/storybook-docs/lib/addon-docs-blocks-mock.jsx'));

describe('Errors live cases and TypeCard links', () => {
    it('MessageOnField stays quiet on render, shows its message after blur with a bad value, and clears once fixed', async () => {
        const user = userEvent.setup();
        render(<MessageOnField />);
        const message = 'Enter a full email, like name@school.org';
        const field = screen.getByLabelText(/School email/);
        expect(field).not.toHaveAttribute('aria-invalid', 'true');
        expect(screen.queryByText(message)).toBeNull();

        await user.click(field);
        expect(screen.queryByText(message)).toBeNull();
        await user.tab();
        expect(field).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText(message)).toBeInTheDocument();

        await user.clear(field);
        await user.type(field, 'ana@school.org');
        expect(field).not.toHaveAttribute('aria-invalid', 'true');
        expect(screen.queryByText(message)).toBeNull();
    });

    it('MessageOnFieldCase is drawn after a blur, with the message in words; BorderAndTooltipCase puts it in a tooltip', () => {
        const { container, unmount } = render(<MessageOnFieldCase />);
        expect(container.querySelector('[inert]')).toBeNull();
        expect(screen.getByLabelText(/School email/)).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText('Enter a full email, like name@school.org')).toBeInTheDocument();
        expect(screen.queryByRole('tooltip')).toBeNull();
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
