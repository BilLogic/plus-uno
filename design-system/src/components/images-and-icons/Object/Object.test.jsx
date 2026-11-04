import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BugIcon, TaskIcon } from './Object';

describe('Object icons', () => {
    it('labels itself with the kind by default', () => {
        render(<TaskIcon />);
        expect(screen.getByRole('img', { name: 'Task' })).toBeInTheDocument();
    });

    it('lets a caller override the label', () => {
        render(<BugIcon label="Known issue" />);
        expect(screen.getByRole('img', { name: 'Known issue' })).toBeInTheDocument();
    });

    it('goes decorative with an empty label', () => {
        render(<TaskIcon label="" testId="deco" />);
        const node = screen.getByTestId('deco');
        expect(node).toHaveAttribute('aria-hidden', 'true');
        expect(node).not.toHaveAttribute('aria-label');
    });
});
