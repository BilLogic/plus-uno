import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectTypeCardAnchors } from '@/storybook-docs/lib/type-card-anchors.jsx';
import { OnNavigationCase, worstIndicator } from './IndicatorsCases.jsx';

vi.mock('@storybook/addon-docs/blocks', () => import('@/storybook-docs/lib/addon-docs-blocks-mock.jsx'));

describe('Indicators examples', () => {
    it('selects navigation rows and decrements counts to zero when items are handled', async () => {
        const user = userEvent.setup();
        const { container } = render(<OnNavigationCase />);

        const item = (name) => container.querySelector(`[data-nav-item="${name}"]`);
        await user.click(within(item('Inbox')).getByRole('button'));
        const handleBtn = screen.getByRole('button', { name: 'Handle item' });

        await user.click(handleBtn);
        expect(within(item('Inbox')).getByText('2')).toBeInTheDocument();
        await user.click(handleBtn);
        await user.click(handleBtn);
        expect(item('Inbox').querySelector('.plus-count')).toBeNull();
        expect(handleBtn).toBeDisabled();
    });

    it('picks the highest-severity indicator in worstIndicator', () => {
        expect(worstIndicator([
            { appearance: 'info', status: 'Scheduled' },
            { appearance: 'danger', status: 'Missed' },
            { appearance: 'warning', status: 'Needs review' },
        ]).status).toBe('Missed');
    });

    it('links every TypeCard anchor to a unique ComponentExample heading id in Indicators.mdx', () => {
        expectTypeCardAnchors(join(__dirname, 'Indicators.mdx'), 6);
    });
});
