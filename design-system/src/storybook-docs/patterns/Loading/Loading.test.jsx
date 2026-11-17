import { join } from 'node:path';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { expectTypeCardAnchors } from '@/storybook-docs/lib/type-card-anchors.jsx';
import { MenuOneRowCase, MenuSkeletonRowsCase } from './LoadingCases.jsx';

vi.mock('@storybook/addon-docs/blocks', () => import('@/storybook-docs/lib/addon-docs-blocks-mock.jsx'));

describe('Loading live cases and TypeCard links', () => {
    it('MenuOneRowCase renders one Loading options row while MenuSkeletonRowsCase renders skeleton menu items', async () => {
        const { container, unmount } = render(<MenuOneRowCase />);
        expect(container.querySelector('[inert]')).toBeNull();
        await waitFor(() => expect(screen.getByText('Loading options')).toBeInTheDocument());
        expect(container.querySelectorAll('.plus-skeleton')).toHaveLength(0);
        unmount();

        const { container: skeletonContainer } = render(<MenuSkeletonRowsCase />);
        await waitFor(() => expect(screen.getAllByRole('menuitem')).toHaveLength(3));
        expect(skeletonContainer.querySelectorAll('.plus-skeleton')).toHaveLength(3);
    });

    it('links every TypeCard anchor to a ComponentExample heading id in Loading.mdx', () => {
        expectTypeCardAnchors(join(__dirname, 'Loading.mdx'), 4);
    });
});
