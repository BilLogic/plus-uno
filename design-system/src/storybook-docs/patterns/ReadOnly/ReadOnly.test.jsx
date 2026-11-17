import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { expectTypeCardAnchors } from '@/storybook-docs/lib/type-card-anchors.jsx';
import {
    FadedNoReasonCase,
    FieldForFixedValueCase,
    PlainValueCase,
    ReadableWithReasonCase,
} from './ReadOnlyCases.jsx';

vi.mock('@storybook/addon-docs/blocks', () => import('@/storybook-docs/lib/addon-docs-blocks-mock.jsx'));

describe('ReadOnly live cases and TypeCard links', () => {
    it('ReadableWithReasonCase renders an enabled read-only field with a reason while FadedNoReasonCase disables it with no reason', () => {
        const { container, unmount } = render(<ReadableWithReasonCase />);
        expect(container.querySelector('[inert]')).toBeNull();
        const field = screen.getByLabelText('Session time');
        expect(field).toHaveAttribute('readonly');
        expect(field).toBeEnabled();
        expect(screen.getByText('Set by your supervisor.')).toBeVisible();
        unmount();

        render(<FadedNoReasonCase />);
        expect(screen.getByLabelText('Session time')).toBeDisabled();
        expect(screen.queryByText('Set by your supervisor.')).toBeNull();
    });

    it('PlainValueCase renders plain details text without inputs while FieldForFixedValueCase puts fixed values in read-only inputs', () => {
        const { unmount } = render(<PlainValueCase />);
        expect(screen.queryAllByRole('textbox')).toHaveLength(0);
        expect(screen.getByText('Lincoln Middle School')).toBeVisible();
        unmount();

        render(<FieldForFixedValueCase />);
        expect(screen.getAllByRole('textbox')).toHaveLength(2);
        expect(screen.getByLabelText('School')).toHaveAttribute('readonly');
    });

    it('links every TypeCard anchor to a ComponentExample heading id in ReadOnly.mdx', () => {
        expectTypeCardAnchors(join(__dirname, 'ReadOnly.mdx'), 2);
    });
});
