import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import BrowserFrame from './BrowserFrame';
import { PageView } from './PageView';

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

    it('puts a labeled view control on a drawn frame and none on a bare one', () => {
        const bare = render(<BrowserFrame browser="none"><p>page</p></BrowserFrame>);
        expect(bare.queryByRole('group', { name: 'Page zoom' })).toBeNull();
        bare.unmount();
        render(<div className="sbdocs"><BrowserFrame browser="chrome" view="always"><p>page</p></BrowserFrame></div>);
        const group = screen.getByRole('group', { name: 'Page zoom' });
        expect(within(group).getByRole('button', { name: 'Fit' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'Full screen' })).toBeInTheDocument();
    });

    it('changes the zoom from the control', async () => {
        const user = userEvent.setup();
        const { container } = render(<div className="sbdocs"><BrowserFrame browser="chrome" view="always"><p>page</p></BrowserFrame></div>);
        expect(container.querySelector('.plus-page-view__well')).toHaveAttribute('data-zoom', 'fit');
        await user.click(screen.getByRole('button', { name: '50%' }));
        expect(container.querySelector('.plus-page-view__well')).toHaveAttribute('data-zoom', '50');
        expect(screen.getByRole('button', { name: '50%' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'Fit' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('turns the same page into a full-screen layer, closes on Escape and returns focus', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <main><aside>side</aside><BrowserFrame browser="chrome" view="always"><p>page</p></BrowserFrame></main>,
        );
        const trigger = screen.getByRole('button', { name: 'Full screen' });
        await user.click(trigger);
        const dialog = await screen.findByRole('dialog', { name: 'Full screen preview' });
        expect(dialog).toHaveAccessibleDescription('Press Escape to exit.');
        // One page, not a second copy.
        expect(screen.getAllByText('page')).toHaveLength(1);
        expect(container.querySelector('aside')).toHaveAttribute('inert');
        expect(screen.getByLabelText('Page preview, scrollable')).toHaveAttribute('tabindex', '0');
        await user.keyboard('{Escape}');
        await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(container.querySelector('aside')).not.toHaveAttribute('inert');
        await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Full screen' })).toHaveFocus());
    });

    it('names no scroll region while the page fits', async () => {
        const user = userEvent.setup();
        render(<div className="sbdocs"><BrowserFrame browser="chrome" view="always"><p>page</p></BrowserFrame></div>);
        await user.click(screen.getByRole('button', { name: '100%' }));
        expect(screen.queryByLabelText('Page preview, scrollable')).toBeNull();
    });

    it('passes an inner page view through, so one control shows', () => {
        render(
            <BrowserFrame browser="chrome" view="always">
                <PageView mode="always"><p>page</p></PageView>
            </BrowserFrame>,
        );
        expect(screen.getAllByRole('group', { name: 'Page zoom' })).toHaveLength(1);
    });

    it('keeps the page at real size outside a docs page', () => {
        const { container } = render(<BrowserFrame browser="chrome" view="always"><p>page</p></BrowserFrame>);
        expect(container.querySelector('.plus-page-view__well')).toHaveAttribute('data-zoom', '100');
    });

    it('draws no control on a frame whose page fits its column', () => {
        render(<BrowserFrame browser="chrome"><p>page</p></BrowserFrame>);
        expect(screen.queryByRole('group', { name: 'Page zoom' })).toBeNull();
    });

    it('draws no control for a stage that fits its column', () => {
        render(<PageView mode="auto"><p>fits</p></PageView>);
        expect(screen.queryByRole('group', { name: 'Page zoom' })).toBeNull();
    });

    it('reads no numbered primitive tokens in BrowserFrame or BrowserWindow', () => {
        for (const file of [
            join(__dirname, 'BrowserFrame.scss'),
            join(__dirname, 'BrowserFrame.jsx'),
            join(__dirname, 'PageView.scss'),
            join(__dirname, 'PageView.jsx'),
            join(__dirname, '..', 'lib', 'template-page.jsx'),
        ]) {
            const source = readFileSync(file, 'utf8');
            expect(source, file).not.toMatch(PRIMITIVE_READ);
        }
    });
});
