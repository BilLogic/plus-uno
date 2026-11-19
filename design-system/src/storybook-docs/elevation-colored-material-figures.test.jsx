import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StatusTag, Tag } from '@/components';
import { ColoredMaterialLive } from './elevation-colored-material-figures.jsx';

const COLORS = ['brand', 'success', 'warning', 'danger', 'information', 'discovery'];

describe('colored material on Tag and Status tag', () => {
    it('a Tag takes bold or subtle in each color', () => {
        for (const m of ['bold', 'subtle']) {
            for (const c of COLORS) {
                const { container, unmount } = render(<Tag material={m} materialColor={c}>x</Tag>);
                const el = container.querySelector('.plus-tag');
                expect(el.classList.contains(`plus-tag--material-${m}`), `${m} ${c}`).toBe(true);
                expect(el.classList.contains(`plus-tag--material-${c}`), `${m} ${c}`).toBe(true);
                unmount();
            }
        }
    });

    it('a Tag ignores material unless it is read-only', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { container } = render(<Tag material="bold" href="#x">x</Tag>);
        expect(container.querySelector('[class*="plus-tag--material"]')).toBeNull();
        const sel = render(<Tag material="bold" isSelected={false}>x</Tag>);
        expect(sel.container.querySelector('[class*="plus-tag--material"]')).toBeNull();
        warn.mockRestore();
    });

    it('a Status tag maps its appearance to the material color, and neutral takes none', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const info = render(<StatusTag material="bold" appearance="info">x</StatusTag>);
        expect(info.container.querySelector('.plus-status--material-information.plus-status--material-bold')).not.toBeNull();
        const neutral = render(<StatusTag material="subtle">x</StatusTag>);
        expect(neutral.container.querySelector('[class*="plus-status--material"]')).toBeNull();
        warn.mockRestore();
    });

    it('the live figure shows both treatments over a picture', () => {
        const { getByTestId } = render(<ColoredMaterialLive />);
        expect(getByTestId('colored-bold').querySelectorAll('.plus-tag--material-bold').length).toBe(6);
        expect(getByTestId('colored-subtle').querySelectorAll('.plus-status--material-subtle').length).toBe(5);
    });
});
