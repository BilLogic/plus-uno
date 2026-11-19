import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Cascader, DatePicker, Select, TreeSelect } from '@/components';
import { Modal } from '@/templates';
import { MotionPreferenceContext } from '@/lib/motionPreference';
import { OverlayContainer } from '@/lib/overlay';

function Bounded({ children }) {
    const [container, setContainer] = useState(null);
    return <div ref={setContainer} data-testid="canvas" style={{ position: 'relative' }}>
        <OverlayContainer container={container}>{children}</OverlayContainer>
    </div>;
}

const fields = [
    ['Select', () => <Select label="Field" options={['One', 'Two']} />],
    ['DatePicker', () => <DatePicker aria-label="Field" />],
    ['DatePicker range', () => <DatePicker range aria-label="Field" />],
    ['TreeSelect', () => <TreeSelect label="Field" options={['One', 'Two']} />],
    ['Cascader', () => <Cascader label="Field" options={['One', 'Two']} />],
];

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe.each(fields)('%s field popup contract', (_name, field) => {
    it('portals above its Modal and latches a keyboard open', async () => {
        render(<Bounded><Modal show title="Edit" onClose={() => {}}>{field()}</Modal></Bounded>);
        const trigger = await screen.findByRole('combobox', { name: 'Field' });
        fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        const surface = document.querySelector('.plus-listbox');
        expect(surface.parentElement).toBe(trigger.closest('.plus-template-blanket'));
        expect(surface).toHaveAttribute('data-instant', 'keyboard');
        expect(surface).toHaveAttribute('data-side', 'bottom');
        fireEvent.pointerDown(surface);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        fireEvent.pointerDown(document.body);
        await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    });

    it('retains an inert surface until the exit animation finishes', async () => {
        render(field());
        const trigger = screen.getByRole('combobox', { name: 'Field' });
        fireEvent.click(trigger);
        const surface = document.querySelector('.plus-listbox');
        let finish;
        const finished = new Promise((resolve) => { finish = resolve; });
        surface.getAnimations = () => [{ finished, effect: { getComputedTiming: () => ({ iterations: 1 }) } }];
        fireEvent.pointerDown(document.body);
        expect(surface).toBeInTheDocument();
        expect(surface).toHaveAttribute('data-ending-style');
        expect(surface).toHaveAttribute('aria-hidden', 'true');
        expect(surface).toHaveAttribute('inert');
        await act(async () => finish());
        expect(surface).not.toBeInTheDocument();
    });

    it('honors reduced motion and leaves pointer opens animated', () => {
        render(<MotionPreferenceContext.Provider value={true}>{field()}</MotionPreferenceContext.Provider>);
        const trigger = screen.getByRole('combobox', { name: 'Field' });
        fireEvent.pointerDown(trigger);
        fireEvent.click(trigger);
        const surface = document.querySelector('.plus-listbox');
        expect(surface).toHaveAttribute('data-reduced', 'true');
        expect(surface).not.toHaveAttribute('data-instant');
    });

    it('cancels pending removal when reopened during an exit', async () => {
        render(field());
        const trigger = screen.getByRole('combobox', { name: 'Field' });
        fireEvent.click(trigger);
        const surface = document.querySelector('.plus-listbox');
        let finish;
        const finished = new Promise((resolve) => { finish = resolve; });
        surface.getAnimations = () => [{ finished, effect: { getComputedTiming: () => ({ iterations: 1 }) } }];
        fireEvent.pointerDown(document.body);
        fireEvent.click(trigger);
        await act(async () => finish());
        expect(surface).toBeInTheDocument();
        expect(surface).not.toHaveAttribute('data-ending-style');
        expect(surface).not.toHaveAttribute('aria-hidden');
        expect(surface).not.toHaveAttribute('inert');
    });

    it('stays below the field and shifts inside an OverlayContainer', () => {
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
            if (this.dataset.testid === 'canvas') return { top: 200, left: 100, right: 400, bottom: 500, width: 300, height: 300 };
            if (this.classList.contains('plus-listbox')) return { top: 0, left: 0, right: 200, bottom: 500, width: 200, height: 500 };
            return { top: 420, left: 300, right: 500, bottom: 454, width: 200, height: 34 };
        });
        render(<Bounded>{field()}</Bounded>);
        fireEvent.click(screen.getByRole('combobox', { name: 'Field' }));
        const surface = document.querySelector('.plus-listbox');
        expect(surface.parentElement).toBe(screen.getByTestId('canvas'));
        expect(surface).toHaveAttribute('data-placement', 'bottom');
        expect(surface).toHaveStyle({ position: 'absolute', top: '258px', left: '92px', minWidth: '200px' });
    });
});
