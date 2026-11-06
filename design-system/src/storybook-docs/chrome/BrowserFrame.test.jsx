import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BrowserFrame from './BrowserFrame';

describe('BrowserFrame', () => {
    it('renders children bare for none', () => {
        const { container } = render(<BrowserFrame browser="none"><p>page</p></BrowserFrame>);
        expect(container.querySelector('[data-browser]')).toBeNull();
        expect(screen.getByText('page')).toBeInTheDocument();
    });

    it('draws Chrome tabs and an omnibox', () => {
        const { container } = render(<BrowserFrame browser="chrome"><p>page</p></BrowserFrame>);
        expect(container.querySelector('[data-browser="chrome"]')).not.toBeNull();
        expect(container.querySelector('.plus-browser-frame__tab')).not.toBeNull();
        expect(container.querySelector('.plus-browser-frame__omnibox')).not.toBeNull();
    });

    it('draws a Safari toolbar with no tab strip', () => {
        const { container } = render(<BrowserFrame browser="safari"><p>page</p></BrowserFrame>);
        expect(container.querySelector('[data-browser="safari"]')).not.toBeNull();
        expect(container.querySelector('.plus-browser-frame__field')).not.toBeNull();
        expect(container.querySelector('.plus-browser-frame__tab')).toBeNull();
    });

    it('collapses when nested', () => {
        const { container } = render(
            <BrowserFrame browser="chrome"><BrowserFrame browser="safari"><p>page</p></BrowserFrame></BrowserFrame>,
        );
        expect(container.querySelectorAll('[data-browser]')).toHaveLength(1);
    });
});
