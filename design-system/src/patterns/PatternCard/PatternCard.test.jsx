import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Card from './PatternCard';

describe('Card image placements', () => {
    it.each(['top', 'start', 'end'])('keeps the heading, image and action available with %s placement', (imagePlacement) => {
        const onClick = vi.fn();
        render(
            <Card imagePlacement={imagePlacement} imageSplit="1/2"
                image={<img alt="Session illustration" src="session.svg" />}
                title="Ana Ruiz" description="Lincoln Middle · Thu 4:00 PM"
                footer={<button onClick={onClick}>View session</button>}>
                <p>Practice set 4 assigned</p>
            </Card>,
        );
        expect(screen.getByRole('heading', { name: 'Ana Ruiz', level: 2 })).toBeVisible();
        expect(screen.getByRole('img', { name: 'Session illustration' })).toBeVisible();
        expect(screen.getByText('Practice set 4 assigned')).toBeVisible();
        fireEvent.click(screen.getByRole('button', { name: 'View session' }));
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('renders the content without requiring an image', () => {
        render(<Card imagePlacement="end" imageSplit="1/2" title="Ana Ruiz">Practice set 4 assigned</Card>);
        expect(screen.getByRole('heading', { name: 'Ana Ruiz' })).toBeVisible();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByText('Practice set 4 assigned')).toBeVisible();
    });
});

describe('Card surfaces', () => {
    it('defaults to sunken and applies surface, clickable, and dragging modifiers', () => {
        const { container, rerender } = render(<Card title="Sunken">Body</Card>);
        const card = () => container.firstElementChild;

        expect(card()).toHaveClass('plus-template-card', 'plus-template-card--surface-sunken');
        expect(card()).not.toHaveClass('plus-template-card--surface-default', 'plus-template-card--surface-raised');

        rerender(<Card surface="default" title="Default">Body</Card>);
        expect(card()).toHaveClass('plus-template-card--surface-default');

        rerender(<Card surface="raised" onClick={() => {}} title="Raised">Body</Card>);
        expect(card()).toHaveClass('plus-template-card--surface-raised', 'plus-template-card--clickable');

        rerender(<Card surface="sunken" dragging title="Dragging">Body</Card>);
        expect(card()).toHaveClass('plus-template-card--surface-sunken', 'plus-template-card--dragging');
        expect(card().className).not.toMatch(/plus-template-card-pad-/);
        expect(card().querySelector('.plus-template-card-inner')).toBeInTheDocument();
    });
});
