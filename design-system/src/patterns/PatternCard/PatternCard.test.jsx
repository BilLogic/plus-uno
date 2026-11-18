import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PatternCard from './PatternCard';

describe('PatternCard image placements', () => {
    it.each(['top', 'start', 'end'])('keeps the heading, image and action available with %s placement', (imagePlacement) => {
        const onClick = vi.fn();
        render(
            <PatternCard imagePlacement={imagePlacement} imageSplit="1/2"
                image={<img alt="Session illustration" src="session.svg" />}
                title="Ana Ruiz" description="Lincoln Middle · Thu 4:00 PM"
                footer={<button onClick={onClick}>View session</button>}>
                <p>Practice set 4 assigned</p>
            </PatternCard>,
        );
        expect(screen.getByRole('heading', { name: 'Ana Ruiz', level: 2 })).toBeVisible();
        expect(screen.getByRole('img', { name: 'Session illustration' })).toBeVisible();
        expect(screen.getByText('Practice set 4 assigned')).toBeVisible();
        fireEvent.click(screen.getByRole('button', { name: 'View session' }));
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('renders the content without requiring an image', () => {
        render(<PatternCard imagePlacement="end" imageSplit="1/2" title="Ana Ruiz">Practice set 4 assigned</PatternCard>);
        expect(screen.getByRole('heading', { name: 'Ana Ruiz' })).toBeVisible();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByText('Practice set 4 assigned')).toBeVisible();
    });
});

describe('PatternCard surfaces', () => {
    it('defaults to sunken and applies surface, clickable, and dragging modifiers', () => {
        const { container, rerender } = render(<PatternCard title="Sunken">Body</PatternCard>);
        const card = () => container.firstElementChild;

        expect(card()).toHaveClass('plus-pattern-card', 'plus-pattern-card--surface-sunken');
        expect(card()).not.toHaveClass('plus-pattern-card--surface-default', 'plus-pattern-card--surface-raised');

        rerender(<PatternCard surface="default" title="Default">Body</PatternCard>);
        expect(card()).toHaveClass('plus-pattern-card--surface-default');

        rerender(<PatternCard surface="raised" onClick={() => {}} title="Raised">Body</PatternCard>);
        expect(card()).toHaveClass('plus-pattern-card--surface-raised', 'plus-pattern-card--clickable');

        rerender(<PatternCard surface="sunken" dragging title="Dragging">Body</PatternCard>);
        expect(card()).toHaveClass('plus-pattern-card--surface-sunken', 'plus-pattern-card--dragging');
    });
});
