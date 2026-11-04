import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PatternModal from './PatternModal';

/**
 * PatternModal takes Figma's sizing: `width` sm · md · lg from the screen grid
 * and `height` hug · fill.
 *
 * The widths themselves are CSS, held to Figma's numbers in
 * scripts/frame-layer-tokens.test.mjs and measured in the stories.
 */
const dialog = () => screen.getByRole('dialog');

describe('PatternModal sizing', () => {
    it('defaults to width sm and height hug', () => {
        render(<PatternModal title="Move session">Body</PatternModal>);
        const el = dialog();
        expect(el).toHaveClass('plus-pattern-modal-width-sm', 'plus-pattern-modal-height-hug');
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
});

describe('PatternModal options', () => {
    it('draws no divider and no skeleton by default', () => {
        render(<PatternModal title="Move session" footer={<button type="button">Save</button>}>Body</PatternModal>);
        const el = dialog();
        expect(el.querySelector('.plus-pattern-modal-divider')).toBeNull();
        expect(el.querySelector('.plus-pattern-modal-body')).not.toHaveAttribute('aria-busy');
        expect(screen.getByRole('heading', { level: 1, name: 'Move session' })).toBeInTheDocument();
    });

    it('takes the place of the title row with a custom header', () => {
        render(<PatternModal header={<span>Custom row</span>} onClose={() => {}} aria-label="Pick a time">Body</PatternModal>);
        expect(screen.getByText('Custom row')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
        expect(dialog()).toHaveAttribute('aria-label', 'Pick a time');
        expect(dialog()).not.toHaveAttribute('aria-labelledby');
    });

    it('draws a divider under the header and above the footer', () => {
        render(<PatternModal title="Move session" divider footer={<button type="button">Save</button>}>Body</PatternModal>);
        expect(dialog().querySelectorAll('.plus-pattern-modal-divider')).toHaveLength(2);
    });

    it('draws only the header divider when there is no footer', () => {
        render(<PatternModal title="Move session" divider>Body</PatternModal>);
        expect(dialog().querySelectorAll('.plus-pattern-modal-divider')).toHaveLength(1);
    });

    it('swaps the body for a skeleton while loading', () => {
        render(<PatternModal title="Move session" loading>Real body</PatternModal>);
        const body = dialog().querySelector('.plus-pattern-modal-body');
        expect(body).toHaveAttribute('aria-busy', 'true');
        expect(screen.queryByText('Real body')).toBeNull();
        expect(body.querySelector('[aria-hidden="true"]')).not.toBeNull();
    });
});

/**
 * Tabs under the title: a tab group in the header, so it stays put while the
 * body, which is the tab panel, scrolls. The keyboard model is `Tabs`'
 * own; these hold the wiring between the strip and the body.
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

    it('moves between tabs with the arrow keys and relabels the panel', async () => {
        render(<PatternModal title="Session settings" tabs={tabs} />);
        const details = screen.getByRole('tab', { name: 'Details' });
        details.focus();
        fireEvent.keyDown(details, { key: 'ArrowRight' });
        const students = screen.getByRole('tab', { name: 'Students' });
        await waitFor(() => expect(students).toHaveAttribute('aria-selected', 'true'));
        expect(students).toHaveFocus();
        expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', students.id);
        expect(screen.getByText('Students panel')).toBeInTheDocument();
        fireEvent.keyDown(students, { key: 'End' });
        const notes = screen.getByRole('tab', { name: 'Notes' });
        await waitFor(() => expect(notes).toHaveAttribute('aria-selected', 'true'));
        fireEvent.keyDown(notes, { key: 'ArrowRight' });
        await waitFor(() => expect(details).toHaveAttribute('aria-selected', 'true'));
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

    it('links tab and panel even when a key has spaces in it', () => {
        const spaced = [
            { key: 'past sessions', label: 'Past sessions', content: <p>Past</p> },
            { key: 'next week', label: 'Next week', content: <p>Next</p> },
        ];
        render(<PatternModal title="Sessions" tabs={spaced} />);
        const tab = screen.getByRole('tab', { name: 'Past sessions' });
        expect(tab.id).not.toMatch(/\s/);
        expect(screen.getByRole('tabpanel', { name: 'Past sessions' })).toBeInTheDocument();
    });

    it('reports nothing when the selected tab is clicked again', () => {
        const onTabChange = vi.fn();
        render(<PatternModal title="Session settings" tabs={tabs} onTabChange={onTabChange} />);
        fireEvent.click(screen.getByRole('tab', { name: 'Details' }));
        expect(onTabChange).not.toHaveBeenCalled();
    });

    it('shows the first enabled tab when a controlled key names a disabled one', () => {
        const withDisabled = [{ ...tabs[0], disabled: true }, tabs[1], tabs[2]];
        render(<PatternModal title="Session settings" tabs={withDisabled} activeTab="details" />);
        expect(screen.getByRole('tab', { name: 'Students' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByText('Students panel')).toBeInTheDocument();
    });

    it('reaches a disabled tab with the arrow keys but does not select it', async () => {
        // Base UI's own choice (see Tabs.test.jsx): a disabled tab stays in the
        // arrow-key path so its existence is discoverable, but is never selected.
        const withDisabled = [tabs[0], { ...tabs[1], disabled: true }, tabs[2]];
        render(<PatternModal title="Session settings" tabs={withDisabled} />);
        const details = screen.getByRole('tab', { name: 'Details' });
        details.focus();
        fireEvent.keyDown(details, { key: 'ArrowRight' });
        const students = screen.getByRole('tab', { name: 'Students' });
        await waitFor(() => expect(students).toHaveFocus());
        expect(students).toHaveAttribute('aria-selected', 'false');
        expect(details).toHaveAttribute('aria-selected', 'true');
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
