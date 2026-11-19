import React, { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MotionPreferenceContext } from '@/lib/motionPreference';
import PatternSection from './PatternSection';

/**
 * The Section's optional `detail` prop renders an inline expand built on Base
 * UI's Collapsible: a disclosure trigger opens the detail region in place
 * inside the Section and pushes the content below it down.
 */
const renderDetail = (props = {}) => render(
    <MotionPreferenceContext.Provider value>
        <PatternSection
            title="Session reflections"
            detail={<div>The reflection names two goals for next week.</div>}
            detailTitle="Ava Thompson"
            detailDescription="Grade 7"
            detailFooter={<button type="button">Open full review</button>}
            {...props}
        >
            <div>Section rows</div>
        </PatternSection>
    </MotionPreferenceContext.Provider>,
);

describe('PatternSection detail (inline expand)', () => {
    it('starts closed by default with a disclosure button, drawn as a sunken Card', () => {
        const { container } = renderDetail();
        const trigger = screen.getByRole('button', { name: /Ava Thompson/ });
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('region', { name: 'Ava Thompson' })).toBeNull();
        expect(screen.getByText('Section rows')).toBeInTheDocument();
        const detail = container.querySelector('.plus-template-section-detail');
        expect(detail.className).toContain('plus-template-card--surface-sunken');
        expect(detail.className).toContain('plus-template-card');
    });

    it('opens in place on click and names the detail region from detailTitle, then closes on click', async () => {
        renderDetail();
        const trigger = screen.getByRole('button', { name: /Ava Thompson/ });
        await userEvent.click(trigger);

        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        const region = screen.getByRole('region', { name: 'Ava Thompson' });
        expect(within(region).getByText('The reflection names two goals for next week.')).toBeInTheDocument();
        expect(within(region).getByRole('button', { name: 'Open full review' })).toBeInTheDocument();
        expect(screen.getByText('Section rows')).toBeInTheDocument();

        await userEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await waitFor(() => expect(screen.queryByRole('region', { name: 'Ava Thompson' })).toBeNull());
    });

    it('supports defaultDetailOpen and controlled detailOpen with onDetailOpenChange', async () => {
        const onDetailOpenChange = vi.fn();
        const Controlled = () => {
            const [open, setOpen] = useState(true);
            return (
                <MotionPreferenceContext.Provider value>
                    <PatternSection
                        title="Session reflections"
                        detail={<div>Controlled body</div>}
                        detailTitle="Ava Thompson"
                        detailOpen={open}
                        onDetailOpenChange={(next) => {
                            onDetailOpenChange(next);
                            setOpen(next);
                        }}
                    >
                        <div>Section rows</div>
                    </PatternSection>
                </MotionPreferenceContext.Provider>
            );
        };
        render(<Controlled />);
        const trigger = screen.getByRole('button', { name: /Ava Thompson/ });
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('region', { name: 'Ava Thompson' })).toBeInTheDocument();

        await userEvent.click(trigger);
        expect(onDetailOpenChange).toHaveBeenCalledWith(false);
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('toggles with Enter and Space on the disclosure button', async () => {
        renderDetail();
        const trigger = screen.getByRole('button', { name: /Ava Thompson/ });
        trigger.focus();
        expect(trigger).toHaveFocus();

        await userEvent.keyboard('{Enter}');
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('region', { name: 'Ava Thompson' })).toBeInTheDocument();

        await userEvent.keyboard(' ');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await waitFor(() => expect(screen.queryByRole('region', { name: 'Ava Thompson' })).toBeNull());
    });

    it('closes on Escape when focus is inside the detail and returns focus to the trigger', async () => {
        renderDetail({ defaultDetailOpen: true });
        const trigger = screen.getByRole('button', { name: /Ava Thompson/ });
        const innerButton = screen.getByRole('button', { name: 'Open full review' });

        innerButton.focus();
        expect(innerButton).toHaveFocus();

        await userEvent.keyboard('{Escape}');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(trigger).toHaveFocus();
        await waitFor(() => expect(screen.queryByRole('region', { name: 'Ava Thompson' })).toBeNull());
    });

    it('draws no detail wrapper on a plain Section or when detail is null', () => {
        const { container, rerender } = render(<PatternSection title="Sessions">Body</PatternSection>);
        expect(container.querySelector('.plus-template-section-with-detail')).toBeNull();
        expect(container.querySelector('.plus-template-section-detail')).toBeNull();

        rerender(<PatternSection title="Sessions" detail={null}>Body</PatternSection>);
        expect(container.querySelector('.plus-template-section-detail')).toBeNull();
    });
});
