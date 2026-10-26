import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PatternModal from './PatternModal';

/**
 * PatternModal takes Figma's sizing: `width` sm · md · lg from the screen grid
 * and `height` hug · fill. The old `padding`, `gap` and `maxHeight` props keep
 * drawing as they did and say once, in development, that they are deprecated.
 *
 * The widths themselves are CSS, held to Figma's numbers in
 * scripts/frame-layer-tokens.test.mjs and measured in the stories.
 */
const dialog = () => screen.getByRole('dialog');

describe('PatternModal sizing', () => {
    let warn;
    beforeEach(() => {
        warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
        warn.mockRestore();
    });

    it('defaults to width sm and height hug, with the Figma pad and stack', () => {
        render(<PatternModal title="Move session">Body</PatternModal>);
        const el = dialog();
        expect(el).toHaveClass('plus-pattern-modal-width-sm', 'plus-pattern-modal-height-hug');
        expect(el.className).not.toMatch(/plus-pattern-modal-(pad|gap)-/);
        expect(warn).not.toHaveBeenCalled();
    });

    it.each(['sm', 'md', 'lg'])('takes width %s', (width) => {
        render(<PatternModal title="Move session" width={width}>Body</PatternModal>);
        expect(dialog()).toHaveClass(`plus-pattern-modal-width-${width}`);
    });

    it.each(['hug', 'fill'])('takes height %s', (height) => {
        render(<PatternModal title="Move session" height={height}>Body</PatternModal>);
        expect(dialog()).toHaveClass(`plus-pattern-modal-height-${height}`);
    });

    it('makes a fill body a tab stop, since it can scroll', () => {
        render(<PatternModal title="Settings" height="fill">Body</PatternModal>);
        expect(dialog().querySelector('.plus-pattern-modal-body')).toHaveAttribute('tabindex', '0');
    });

    it('keeps the old padding and gap classes for callers that pass them', () => {
        render(<PatternModal title="Old" padding="lg" gap="sm">Body</PatternModal>);
        expect(dialog()).toHaveClass('plus-pattern-modal-pad-lg', 'plus-pattern-modal-gap-sm');
    });

    it('keeps maxHeight as an inline cap with a scrollable body', () => {
        render(<PatternModal title="Old" maxHeight={320}>Body</PatternModal>);
        expect(dialog()).toHaveStyle({ maxHeight: '320px' });
        expect(dialog().querySelector('.plus-pattern-modal-body')).toHaveAttribute('tabindex', '0');
    });
});

describe('PatternModal deprecation warnings', () => {
    it('warns once per deprecated prop, however many modals pass it', async () => {
        vi.resetModules();
        const { default: Fresh } = await import('./PatternModal');
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(
            <>
                <Fresh title="One" padding="md" maxHeight={200}>Body</Fresh>
                <Fresh title="Two" padding="sm" gap="lg">Body</Fresh>
            </>,
        );
        const messages = warn.mock.calls.map(([message]) => message);
        expect(messages.filter((m) => m.includes('padding'))).toHaveLength(1);
        expect(messages.filter((m) => m.includes('gap'))).toHaveLength(1);
        expect(messages.filter((m) => m.includes('maxHeight'))).toHaveLength(1);
        expect(messages.every((m) => m.startsWith('[PatternModal]'))).toBe(true);
        warn.mockRestore();
    });
});

/**
 * Tabs under the title: a tab group in the header, so it stays put while the
 * body, which is the tab panel, scrolls. The keyboard model is NavTabs'
 * tabs mode; these hold the wiring between the strip and the body.
 */
describe('PatternModal tabs', () => {
    const tabs = [
        { key: 'details', label: 'Details', content: <p>Details panel</p> },
        { key: 'students', label: 'Students', content: <p>Students panel</p> },
        { key: 'notes', label: 'Notes', content: <p>Notes panel</p> },
    ];

    it('puts a tablist in the header, under the title, and renders the first tab', () => {
        render(<PatternModal title="Session settings" tabs={tabs} />);
        const header = dialog().querySelector('.plus-pattern-modal-header-group');
        expect(header).not.toBeNull();
        expect(header.querySelector('[role="tablist"]')).not.toBeNull();
        expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByText('Details panel')).toBeInTheDocument();
        expect(screen.queryByText('Students panel')).toBeNull();
    });

    it('makes the body the tab panel, named by its tab and always a tab stop', () => {
        render(<PatternModal title="Session settings" tabs={tabs} />);
        const panel = screen.getByRole('tabpanel');
        const tab = screen.getByRole('tab', { name: 'Details' });
        expect(panel).toHaveClass('plus-pattern-modal-body');
        expect(panel).toHaveAttribute('aria-labelledby', tab.id);
        expect(tab).toHaveAttribute('aria-controls', panel.id);
        expect(panel).toHaveAttribute('tabindex', '0');
        expect(screen.getByRole('tab', { name: 'Students' })).not.toHaveAttribute('aria-controls');
    });

    it('moves between tabs with the arrow keys and relabels the panel', () => {
        render(<PatternModal title="Session settings" tabs={tabs} />);
        const details = screen.getByRole('tab', { name: 'Details' });
        details.focus();
        fireEvent.keyDown(details, { key: 'ArrowRight' });
        const students = screen.getByRole('tab', { name: 'Students' });
        expect(students).toHaveAttribute('aria-selected', 'true');
        expect(students).toHaveFocus();
        expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', students.id);
        expect(screen.getByText('Students panel')).toBeInTheDocument();
        fireEvent.keyDown(students, { key: 'End' });
        const notes = screen.getByRole('tab', { name: 'Notes' });
        expect(notes).toHaveAttribute('aria-selected', 'true');
        fireEvent.keyDown(notes, { key: 'ArrowRight' });
        expect(details).toHaveAttribute('aria-selected', 'true');
    });

    it('starts on defaultActiveTab and reports changes', () => {
        const onTabChange = vi.fn();
        render(<PatternModal title="Session settings" tabs={tabs} defaultActiveTab="notes" onTabChange={onTabChange} />);
        expect(screen.getByText('Notes panel')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('tab', { name: 'Details' }));
        expect(onTabChange).toHaveBeenCalledWith('details');
        expect(screen.getByText('Details panel')).toBeInTheDocument();
    });

    it('follows activeTab when controlled', () => {
        const onTabChange = vi.fn();
        const { rerender } = render(
            <PatternModal title="Session settings" tabs={tabs} activeTab="students" onTabChange={onTabChange} />,
        );
        fireEvent.click(screen.getByRole('tab', { name: 'Notes' }));
        expect(onTabChange).toHaveBeenCalledWith('notes');
        expect(screen.getByText('Students panel')).toBeInTheDocument();
        rerender(<PatternModal title="Session settings" tabs={tabs} activeTab="notes" onTabChange={onTabChange} />);
        expect(screen.getByText('Notes panel')).toBeInTheDocument();
    });

    it('skips a disabled tab', () => {
        const withDisabled = [tabs[0], { ...tabs[1], disabled: true }, tabs[2]];
        render(<PatternModal title="Session settings" tabs={withDisabled} />);
        fireEvent.keyDown(screen.getByRole('tab', { name: 'Details' }), { key: 'ArrowRight' });
        expect(screen.getByRole('tab', { name: 'Notes' })).toHaveAttribute('aria-selected', 'true');
    });

    it('scrolls the body back to the top when the tab changes', () => {
        render(<PatternModal title="Session settings" height="fill" tabs={tabs} />);
        screen.getByRole('tabpanel').scrollTop = 120;
        fireEvent.click(screen.getByRole('tab', { name: 'Students' }));
        expect(screen.getByRole('tabpanel').scrollTop).toBe(0);
    });

    it('keeps the header markup as it was when there are no tabs', () => {
        render(<PatternModal title="Move session">Body</PatternModal>);
        expect(dialog().querySelector('.plus-pattern-modal-header-group')).toBeNull();
        expect(dialog().querySelector('[role="tablist"]')).toBeNull();
        expect(dialog().querySelector('.plus-pattern-modal-body')).not.toHaveAttribute('role');
    });
});
