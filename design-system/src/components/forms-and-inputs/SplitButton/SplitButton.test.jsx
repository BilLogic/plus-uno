import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SplitButton from './SplitButton';

describe('SplitButton', () => {
    it('renders the action and a named menu chevron', () => {
        render(<SplitButton text="Save" menuLabel="More save options" />);
        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
        const menu = screen.getByRole('button', { name: 'More save options' });
        expect(menu).toHaveAttribute('aria-haspopup', 'menu');
        expect(menu).toHaveAttribute('aria-expanded', 'false');
    });

    it('fires each half separately', () => {
        const onClick = vi.fn();
        const onMenuClick = vi.fn();
        render(<SplitButton text="Save" menuLabel="More" onClick={onClick} onMenuClick={onMenuClick} />);
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onMenuClick).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'More' }));
        expect(onMenuClick).toHaveBeenCalledTimes(1);
    });

    it('publishes the menu state', () => {
        render(<SplitButton text="Save" menuLabel="More" isMenuExpanded />);
        expect(screen.getByRole('button', { name: 'More' })).toHaveAttribute('aria-expanded', 'true');
    });

    it('passes appearance and spacing to both halves and disables both', () => {
        render(<SplitButton text="Save" menuLabel="More" appearance="primary" spacing="compact" isDisabled />);
        for (const name of ['Save', 'More']) {
            const button = screen.getByRole('button', { name });
            expect(button).toHaveClass('plus-btn--primary', 'plus-btn--compact');
            expect(button).toBeDisabled();
        }
    });
});
