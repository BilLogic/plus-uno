import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectTypeCardAnchors } from '@/storybook-docs/lib/type-card-anchors.jsx';
import { BorderAndTooltipCase, MessageOnFieldCase } from './ErrorsCases.jsx';

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
        unmount();

        render(<BorderAndTooltipCase />);
        const tooltipField = screen.getByLabelText(/School email/);
        expect(tooltipField).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByRole('tooltip')).toHaveTextContent('Enter a full email, like name@school.org');
    });

    it('links every TypeCard anchor to a ComponentExample heading id in Errors.mdx', () => {
        expectTypeCardAnchors(join(__dirname, 'Errors.mdx'), 6);
    });
});
