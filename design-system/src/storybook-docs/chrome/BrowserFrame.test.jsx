import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BrowserFrame from './BrowserFrame';

const PRIMITIVE_READ = /var\(\s*--(?:space|radius|size|stroke)-\d/;

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

    it('draws Edge as tabs, a pill address bar and Edge tools', () => {
        const { container } = render(<BrowserFrame browser="edge"><p>page</p></BrowserFrame>);
        expect(container.querySelector('[data-browser="edge"]')).not.toBeNull();
        expect(container.querySelector('.plus-browser-frame__tab')).not.toBeNull();
        expect(container.querySelector('.plus-browser-frame__omnibox')).not.toBeNull();
        expect(container.querySelector('.fa-circle-user')).not.toBeNull();
        expect(container.querySelector('.fa-ellipsis-vertical')).toBeNull();
    });

    it('collapses when nested', () => {
        const { container } = render(
            <BrowserFrame browser="chrome"><BrowserFrame browser="safari"><p>page</p></BrowserFrame></BrowserFrame>,
        );
        expect(container.querySelectorAll('[data-browser]')).toHaveLength(1);
    });

    it('reads no numbered primitive tokens in BrowserFrame or BrowserWindow', () => {
        for (const file of [
            join(__dirname, 'BrowserFrame.scss'),
            join(__dirname, 'BrowserFrame.jsx'),
            join(__dirname, '..', 'lib', 'template-page.jsx'),
        ]) {
            const source = readFileSync(file, 'utf8');
            expect(source, file).not.toMatch(PRIMITIVE_READ);
        }
    });
});
