import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Icon from '../../images-and-icons/Icon';
import Button, { BUTTON_APPEARANCES, BUTTON_SPACINGS } from './Button';

describe('Button', () => {
    it('carries no title while disabled or loading, and keeps it otherwise', () => {
        const { rerender } = render(<Button text="Save" title="Save the notes" />);
        expect(screen.getByRole('button')).toHaveAttribute('title', 'Save the notes');
        rerender(<Button text="Save" title="Save the notes" isDisabled />);
        expect(screen.getByRole('button')).not.toHaveAttribute('title');
        rerender(<Button text="Save" title="Save the notes" isLoading />);
        expect(screen.getByRole('button')).not.toHaveAttribute('title');
    });

    it('takes no click while disabled', () => {
        const onClick = vi.fn();
        render(<Button text="Save" onClick={onClick} isDisabled />);
        fireEvent.click(screen.getByRole('button'));
        expect(onClick).not.toHaveBeenCalled();
    });

    it('renders its text as the accessible name', () => {
        render(<Button text="Save notes" />);
        expect(screen.getByRole('button', { name: 'Save notes' })).toBeInTheDocument();
    });

    it('draws the default appearance at default spacing unless told otherwise', () => {
        render(<Button text="Plain" />);
        const button = screen.getByRole('button');
        expect(BUTTON_SPACINGS).toEqual(['default', 'compact', 'spacious']);
        expect(button).toHaveClass('plus-btn--default');
        expect(button).not.toHaveClass('plus-btn--compact');
        expect(button).not.toHaveClass('plus-btn--spacious');
    });

    it.each(['default', 'primary', 'subtle', 'warning', 'danger', 'discovery', 'ai', 'link', 'danger-link'])(
        'draws the %s appearance',
        (appearance) => {
            render(<Button appearance={appearance} text={appearance} />);
            expect(screen.getByRole('button')).toHaveClass(`plus-btn--${appearance}`);
        },
    );

    it('offers link and danger-link beside the filled appearances', () => {
        expect(BUTTON_APPEARANCES).toEqual(['default', 'primary', 'subtle', 'warning', 'danger', 'discovery', 'ai', 'link', 'danger-link']);
    });

    it('draws a link appearance on an anchor and keeps it disabled-aware', () => {
        const { rerender } = render(<Button appearance="link" text="Save and exit" href="#exit" />);
        expect(screen.getByRole('button', { name: 'Save and exit' })).toHaveClass('plus-btn--link');
        rerender(<Button appearance="danger-link" text="Delete" isDisabled />);
        const button = screen.getByRole('button', { name: 'Delete' });
        expect(button).toHaveClass('plus-btn--danger-link');
        expect(button).toBeDisabled();
    });

    it('draws the sparkle before an AI label and ignores any other leading icon', () => {
        const { container, rerender } = render(<Button appearance="ai" text="Generate summary" />);
        expect(screen.getByRole('button', { name: 'Generate summary' })).toBeInTheDocument();
        expect(container.querySelector('.plus-btn-visual--before svg')).not.toBeNull();
        rerender(<Button appearance="ai" text="Ask" iconBefore="wand-magic-sparkles" />);
        expect(container.querySelector('.plus-btn-visual--before i')).toBeNull();
        expect(container.querySelector('.plus-btn-visual--before svg')).not.toBeNull();
    });

    it('draws compact spacing', () => {
        render(<Button spacing="compact" text="Row action" />);
        expect(screen.getByRole('button')).toHaveClass('plus-btn--compact');
    });

    it('draws spacious spacing', () => {
        render(<Button spacing="spacious" text="Footer action" />);
        expect(screen.getByRole('button')).toHaveClass('plus-btn--spacious');
    });

    it('fills its container when asked', () => {
        render(<Button shouldFitContainer text="Wide" />);
        expect(screen.getByRole('button')).toHaveClass('plus-btn--fit-container');
    });

    it('calls onClick', () => {
        const onClick = vi.fn();
        render(<Button text="Go" onClick={onClick} />);
        fireEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('disables the button when isDisabled is set', () => {
        const onClick = vi.fn();
        render(<Button isDisabled text="Off" onClick={onClick} />);
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        fireEvent.click(button);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('marks the button selected and pressed when isSelected is set', () => {
        render(<Button isSelected text="Grid" />);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('plus-btn--selected');
        expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('leaves aria-pressed off a button that is not a toggle', () => {
        render(<Button text="Save" />);
        expect(screen.getByRole('button')).not.toHaveAttribute('aria-pressed');
    });

    it('blocks interaction and announces busy while loading', () => {
        const onClick = vi.fn();
        render(<Button isLoading text="Saving" onClick={onClick} />);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('plus-btn--loading');
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-busy', 'true');
        fireEvent.click(button);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('renders Font Awesome glyphs from icon names and explicit small chevron Icon nodes', () => {
        const { container } = render(<Button text="Add" iconBefore="plus" iconAfter={<Icon name="chevron-right" size={12} />} />);
        expect(container.querySelector('.plus-btn-visual--before i')).toHaveClass('fa-solid', 'fa-plus');
        expect(container.querySelector('.plus-btn-visual--before i')).not.toHaveClass('plus-icon--size-12');
        expect(container.querySelector('.plus-btn-visual--after i')).toHaveClass('fa-solid', 'fa-chevron-right', 'plus-icon--size-12');
    });
});
