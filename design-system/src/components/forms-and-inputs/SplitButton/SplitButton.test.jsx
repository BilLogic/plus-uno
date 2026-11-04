import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SplitButton from './SplitButton';
import Button from '../Button/Button';
import IconButton from '../IconButton/IconButton';

describe('SplitButton', () => {
    it('groups the action and a named menu chevron', () => {
        render(
            <SplitButton>
                <Button text="Save" />
                <IconButton icon="chevron-down" label="More save options" aria-haspopup="menu" aria-expanded={false} />
            </SplitButton>
        );
        expect(screen.getByRole('group')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
        const menu = screen.getByRole('button', { name: 'More save options' });
        expect(menu).toHaveAttribute('aria-haspopup', 'menu');
        expect(menu).toHaveAttribute('aria-expanded', 'false');
    });

    it('fires each child separately', () => {
        const onClick = vi.fn();
        const onMenuClick = vi.fn();
        render(
            <SplitButton>
                <Button text="Save" onClick={onClick} />
                <IconButton icon="chevron-down" label="More" onClick={onMenuClick} />
            </SplitButton>
        );
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onMenuClick).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'More' }));
        expect(onMenuClick).toHaveBeenCalledTimes(1);
    });

    it('lets each child carry its own appearance, spacing and disabled state', () => {
        render(
            <SplitButton>
                <Button text="Save" appearance="primary" spacing="compact" isDisabled />
                <IconButton icon="chevron-down" label="More" appearance="primary" spacing="compact" isDisabled />
            </SplitButton>
        );
        for (const name of ['Save', 'More']) {
            const button = screen.getByRole('button', { name });
            expect(button).toHaveClass('plus-btn--primary', 'plus-btn--compact');
            expect(button).toBeDisabled();
        }
    });

    it('maps testId to data-testid on the group', () => {
        render(
            <SplitButton testId="save-split">
                <Button text="Save" />
                <IconButton icon="chevron-down" label="More" />
            </SplitButton>
        );
        expect(screen.getByRole('group')).toHaveAttribute('data-testid', 'save-split');
    });
});
