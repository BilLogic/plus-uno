import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Jumbotron, { resetJumbotronDeprecationWarnings } from './Jumbotron';

vi.mock('@fortawesome/fontawesome-free', () => ({}));

const root = (container) => container.firstChild;

describe('Jumbotron', () => {
    let warn;

    beforeEach(() => {
        resetJumbotronDeprecationWarnings();
        warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        warn.mockRestore();
    });

    describe('the Figma API', () => {
        it('renders the title as the page h1 and the description under it', () => {
            render(<Jumbotron title="Plan your next session" description="One supporting line." />);
            const title = screen.getByRole('heading', { level: 1, name: 'Plan your next session' });
            expect(title).toHaveClass('plus-jumbotron-title');
            expect(screen.getByText('One supporting line.')).toHaveClass('plus-jumbotron-description');
        });

        it('defaults to a raised card, start-aligned, with no media', () => {
            const { container } = render(<Jumbotron title="Title" />);
            const el = root(container);
            expect(el).toHaveClass('plus-pattern-card');
            expect(el).toHaveClass('plus-pattern-card-pad-lg');
            expect(el).toHaveClass('plus-jumbotron--card');
            expect(el).toHaveClass('plus-jumbotron--align-start');
            expect(el).toHaveClass('plus-jumbotron--media-none');
            expect(container.querySelector('.plus-jumbotron-media')).toBeNull();
        });

        it('renders the band as a full-bleed block, not a card', () => {
            const { container } = render(<Jumbotron title="Title" container="band" />);
            const el = root(container);
            expect(el).toHaveClass('plus-jumbotron--band');
            expect(el).not.toHaveClass('plus-pattern-card');
        });

        it('renders the actions slot after the header', () => {
            render(
                <Jumbotron title="Title" actions={<button type="button">Get started</button>} />,
            );
            const button = screen.getByRole('button', { name: 'Get started' });
            expect(button.closest('.plus-jumbotron-actions')).not.toBeNull();
        });

        it('leaves the actions row out when there are no actions', () => {
            const { container } = render(<Jumbotron title="Title" />);
            expect(container.querySelector('.plus-jumbotron-actions')).toBeNull();
        });

        it('puts top media in the card image slot, full bleed', () => {
            const { container } = render(
                <Jumbotron title="Title" media={<img alt="Roster" src="data:," />} />,
            );
            const el = root(container);
            expect(el).toHaveClass('plus-jumbotron--media-top');
            const media = container.querySelector('.plus-jumbotron-media');
            expect(media).toHaveClass('plus-jumbotron-media--top');
            expect(media.closest('.plus-pattern-card-image')).not.toBeNull();
        });

        it('puts side media beside the content', () => {
            const { container } = render(
                <Jumbotron title="Title" media={<img alt="Roster" src="data:," />} mediaPosition="side" />,
            );
            expect(root(container)).toHaveClass('plus-jumbotron--media-side');
            const layout = container.querySelector('.plus-jumbotron-layout');
            expect(layout.lastChild).toHaveClass('plus-jumbotron-media--side');
        });

        it('keeps side media start-aligned, and says so', () => {
            const { container } = render(
                <Jumbotron title="Title" align="center" media={<img alt="" src="data:," />} mediaPosition="side" />,
            );
            expect(root(container)).toHaveClass('plus-jumbotron--align-start');
            expect(warn).toHaveBeenCalledWith(expect.stringContaining('align="center"'));
        });

        it('centers the content when align is center', () => {
            const { container } = render(<Jumbotron title="Title" align="center" />);
            expect(root(container)).toHaveClass('plus-jumbotron--align-center');
            expect(warn).not.toHaveBeenCalled();
        });

        it('logs nothing for the Figma API', () => {
            render(
                <Jumbotron
                    title="Title"
                    description="Line"
                    container="band"
                    align="center"
                    actions={<button type="button">Go</button>}
                    media={<img alt="" src="data:," />}
                />,
            );
            expect(warn).not.toHaveBeenCalled();
        });

        it('passes id, className and style through to the root', () => {
            const { container } = render(
                <Jumbotron id="hero" className="extra" style={{ marginTop: 1 }} title="Title" />,
            );
            const el = root(container);
            expect(el).toHaveAttribute('id', 'hero');
            expect(el).toHaveClass('extra');
            expect(el.style.marginTop).toBe('1px');
        });
    });

});
