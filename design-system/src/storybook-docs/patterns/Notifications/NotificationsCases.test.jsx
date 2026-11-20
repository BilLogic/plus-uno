import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BannerDo, BannerDont, CODE, FlagDo, FlagDont } from './NotificationsCases.jsx';

vi.mock('@storybook/addon-docs/blocks', () => import('@/storybook-docs/lib/addon-docs-blocks-mock.jsx'));

describe('Notifications do and don\'t examples', () => {
    it('FlagDo is a passing notice; FlagDont puts a decision in a Flag', () => {
        const flag = render(<FlagDo />);
        expect(screen.getByText('Session logged')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Move' })).toBeNull();
        flag.unmount();
        render(<FlagDont />);
        expect(screen.getByRole('button', { name: 'Move' })).toBeInTheDocument();
    });

    it('keeps both Flag pictures on screen past the autohide delay', () => {
        vi.useFakeTimers();
        try {
            render(<><FlagDo /><FlagDont /></>);
            act(() => { vi.advanceTimersByTime(20000); });
            expect(screen.getByText('Session logged')).toBeInTheDocument();
            expect(screen.getByText('Move this session to 4:30 PM?')).toBeInTheDocument();
        } finally {
            vi.useRealTimers();
        }
    });

    it('BannerDo is one Banner; BannerDont stacks two', () => {
        const one = render(<BannerDo />);
        expect(one.container.querySelectorAll('.plus-banner')).toHaveLength(1);
        one.unmount();
        const two = render(<BannerDont />);
        expect(two.container.querySelectorAll('.plus-banner')).toHaveLength(2);
    });

    it('prints each example from its own source', () => {
        expect(Object.keys(CODE)).toEqual(['FlagDo', 'FlagDont', 'BannerDo', 'BannerDont']);
        expect(CODE.FlagDo).toMatch(/^import \{ Banner, Flag, FlagGroup \} from|^import \{ Flag, FlagGroup \} from '@\/components';/);
        expect(CODE.BannerDont).toContain('<Banner appearance="warning">');
        for (const code of Object.values(CODE)) expect(code).not.toMatch(/Example\.|storybook-docs/);
    });
});
