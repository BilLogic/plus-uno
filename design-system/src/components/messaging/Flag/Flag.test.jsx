import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Flag, FlagGroup, FLAG_AUTO_CLOSE_MS, FLAG_APPEARANCES } from './Flag';

/**
 * How long a flag stays. Success and information close themselves after 8 seconds;
 * warning and error stay until the person dismisses them, because they ask
 * for something to be done.
 */
describe('Flag timing', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it('waits 8 seconds', () => {
        expect(FLAG_AUTO_CLOSE_MS).toBe(8000);
    });

    it.each(['normal', 'success', 'information'])('closes a %s flag after 8 seconds, not before', (appearance) => {
        const onClose = vi.fn();
        render(<Flag appearance={appearance} title="Saved" show onDismiss={onClose}>Done.</Flag>);
        act(() => { vi.advanceTimersByTime(FLAG_AUTO_CLOSE_MS - 1); });
        expect(onClose).not.toHaveBeenCalled();
        act(() => { vi.advanceTimersByTime(1); });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it.each(['warning', 'error'])('keeps a %s flag open until it is dismissed', (appearance) => {
        const onClose = vi.fn();
        render(<Flag appearance={appearance} title="Upload failed" show onDismiss={onClose}>Try again.</Flag>);
        act(() => { vi.advanceTimersByTime(60000); });
        expect(onClose).not.toHaveBeenCalled();
    });

    it('lets a caller override the timing', () => {
        const onClose = vi.fn();
        render(<Flag appearance="error" title="Gone" show onDismiss={onClose} autohide delay={3000}>x</Flag>);
        act(() => { vi.advanceTimersByTime(3000); });
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});

describe('Flag visibility', () => {
    it('renders nothing when show is false', () => {
        render(<Flag title="Saved" show={false} onDismiss={() => {}}>Done.</Flag>);
        expect(screen.queryByText('Done.')).not.toBeInTheDocument();
    });

    it('shows by default even without an explicit show prop', () => {
        render(<Flag title="Saved" onDismiss={() => {}}>Done.</Flag>);
        expect(screen.getByText('Done.')).toBeInTheDocument();
    });
});

describe('Flag appearance', () => {
    it('offers the five appearances', () => {
        expect(FLAG_APPEARANCES).toEqual(['normal', 'information', 'warning', 'error', 'success']);
    });

    it.each(FLAG_APPEARANCES)('marks a %s flag with its appearance', (appearance) => {
        render(<Flag appearance={appearance} title="T" autohide={false} data-testid="flag" />);
        expect(screen.getByTestId('flag')).toHaveClass(`plus-flag--${appearance}`);
    });

    it('is normal by default', () => {
        render(<Flag title="T" autohide={false} data-testid="flag" />);
        expect(screen.getByTestId('flag')).toHaveClass('plus-flag--normal');
    });

    it('speaks assertively only for warning and error', () => {
        const { rerender } = render(<Flag appearance="error" title="T" autohide={false} data-testid="flag" />);
        expect(screen.getByTestId('flag')).toHaveAttribute('role', 'alert');
        rerender(<Flag appearance="success" title="T" autohide={false} data-testid="flag" />);
        expect(screen.getByTestId('flag')).toHaveAttribute('role', 'status');
    });

    it('expands to the bold fill', () => {
        render(<Flag appearance="success" bold title="T" autohide={false} data-testid="flag" />);
        expect(screen.getByTestId('flag')).toHaveClass('plus-flag--bold');
    });

    it('needs only a title: the description is optional', () => {
        render(<Flag title="Saved" autohide={false} />);
        expect(screen.getByText('Saved')).toBeInTheDocument();
    });
});

describe('Flag actions and dismiss', () => {
    it('draws actions in order and calls their handlers', () => {
        const first = vi.fn();
        render(
            <Flag title="Upload failed" autohide={false} actions={[{ text: 'Retry', onClick: first }, { text: 'Details', href: '/details' }]}>
                Try again.
            </Flag>,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
        expect(first).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('link', { name: 'Details' })).toHaveAttribute('href', '/details');
    });

    it('labels the dismiss control "Dismiss" and calls onDismiss', () => {
        const onDismiss = vi.fn();
        render(<Flag title="T" autohide={false} onDismiss={onDismiss} />);
        fireEvent.click(screen.getByRole('button', { name: 'Dismiss flag' }));
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('has no dismiss control when dismissible is false', () => {
        render(<Flag title="T" autohide={false} dismissible={false} />);
        expect(screen.queryByRole('button', { name: 'Dismiss flag' })).not.toBeInTheDocument();
    });
});

describe('Flag expand on bold', () => {
    it('starts a bold flag collapsed and expands to the description and actions', () => {
        render(<Flag appearance="error" bold title="T" autohide={false} actions={[{ text: 'Retry' }]}>Details here.</Flag>);
        const toggle = screen.getByRole('button', { name: 'Expand' });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByText('Details here.')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
        fireEvent.click(toggle);
        expect(screen.getByRole('button', { name: 'Collapse' })).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('Details here.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    it('can start expanded', () => {
        render(<Flag appearance="error" bold defaultExpanded title="T" autohide={false}>Details here.</Flag>);
        expect(screen.getByText('Details here.')).toBeInTheDocument();
    });

    it('has no toggle on a flag that is not bold', () => {
        render(<Flag title="T" autohide={false}>Details here.</Flag>);
        expect(screen.queryByRole('button', { name: 'Expand' })).not.toBeInTheDocument();
        expect(screen.getByText('Details here.')).toBeInTheDocument();
    });
});

describe('FlagGroup', () => {
    it('sits bottom-start by default', () => {
        render(<FlagGroup data-testid="flags"><span>flag</span></FlagGroup>);
        const group = screen.getByTestId('flags');
        expect(group).toHaveAttribute('data-position', 'bottom-start');
        expect(group).toHaveAttribute('data-container-position', 'fixed');
    });

    it('takes a logical position as given', () => {
        render(<FlagGroup data-testid="flags" position="top-end"><span>flag</span></FlagGroup>);
        expect(screen.getByTestId('flags')).toHaveAttribute('data-position', 'top-end');
    });
});

describe('Flag exit', () => {
    afterEach(() => { vi.unstubAllGlobals(); });

    it('is gone after dismiss, once its exit ends', async () => {
        const { rerender } = render(<Flag title="Saved" show onDismiss={() => {}}>Done.</Flag>);
        rerender(<Flag title="Saved" show={false} onDismiss={() => {}}>Done.</Flag>);
        const flag = screen.getByText('Saved').closest('.plus-flag');
        expect(flag).toHaveAttribute('data-leaving');
        fireEvent.animationEnd(flag);
        await waitFor(() => expect(screen.queryByText('Saved')).toBeNull());
    });

    it('is gone at once under reduced motion', () => {
        vi.stubGlobal('matchMedia', (query) => ({ matches: query.includes('reduce'), addEventListener() {}, removeEventListener() {} }));
        const { rerender } = render(<Flag title="Saved" show onDismiss={() => {}}>Done.</Flag>);
        rerender(<Flag title="Saved" show={false} onDismiss={() => {}}>Done.</Flag>);
        expect(screen.queryByText('Saved')).toBeNull();
    });
});
