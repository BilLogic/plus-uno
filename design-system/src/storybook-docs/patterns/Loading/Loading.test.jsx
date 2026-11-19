import { join } from 'node:path';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { expectTypeCardAnchors } from '@/storybook-docs/lib/type-card-anchors.jsx';
import { CODE, MenuOneRowCase, MenuSkeletonRowsCase, SkeletonInShape, SpinnerInBlank } from './LoadingCases.jsx';

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

    it('SkeletonInShape holds skeleton bars in the table shape; SpinnerInBlank holds one spinner and no bars', () => {
        const shaped = render(<SkeletonInShape />);
        expect(shaped.container.querySelectorAll('.plus-skeleton').length).toBeGreaterThan(1);
        shaped.unmount();
        const blank = render(<SpinnerInBlank />);
        expect(blank.container.querySelectorAll('.plus-skeleton')).toHaveLength(0);
        expect(screen.getByText('Loading students')).toBeInTheDocument();
    });

    it('prints the two table examples from their own source', () => {
        expect(Object.keys(CODE)).toEqual(['SkeletonInShape', 'SpinnerInBlank']);
        expect(CODE.SkeletonInShape).toContain("import { LoadThenReveal } from '@/lib/loadRevealMotion';");
        expect(CODE.SkeletonInShape).toContain('const SkeletonRows');
        expect(CODE.SpinnerInBlank).toContain('<Spinner size={24} label="Loading students" />');
        for (const code of Object.values(CODE)) expect(code).not.toMatch(/Example\.|storybook-docs/);
    });

    it('links every TypeCard anchor to a ComponentExample heading id in Loading.mdx', () => {
        expectTypeCardAnchors(join(__dirname, 'Loading.mdx'), 4);
    });
});
