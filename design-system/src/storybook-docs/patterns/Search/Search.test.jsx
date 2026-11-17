import { join } from 'node:path';
import { describe, it, vi } from 'vitest';
import { expectTypeCardAnchors } from '@/storybook-docs/lib/type-card-anchors.jsx';

vi.mock('@storybook/addon-docs/blocks', () => import('@/storybook-docs/lib/addon-docs-blocks-mock.jsx'));

describe('Search live example links', () => {
    it('links every TypeCard anchor to a unique ComponentExample heading id in Search.mdx', () => {
        expectTypeCardAnchors(join(__dirname, 'Search.mdx'), 3);
    });
});
