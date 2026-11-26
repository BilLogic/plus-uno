/**
 * `Tabs`, on Base UI's `Tabs`.
 *
 * Base UI owns the WAI-ARIA tabs pattern itself (roving tabindex, arrow-key
 * navigation, the `aria-controls`/`aria-labelledby` pairing) — these tests
 * cover this wrapper's own contract: the `eventKey`/`activeKey`/`onSelect`
 * vocabulary, the appearance/alignment classes, the narrow forms, and that arbitrary props
 * still reach the underlying tab.
 */
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Tabs from './Tabs';

const renderTabs = (props = {}) =>
    render(
        <Tabs defaultActiveKey="one" {...props}>
            <Tabs.Tab eventKey="one">One</Tabs.Tab>
            <Tabs.Tab eventKey="two">Two</Tabs.Tab>
            <Tabs.Tab eventKey="three">Three</Tabs.Tab>
        </Tabs>,
    );

describe('Tabs — roles', () => {
    it('renders a tablist whose items are tabs', () => {
        renderTabs();
        const tablist = screen.getByRole('tablist');
        expect(within(tablist).getAllByRole('tab')).toHaveLength(3);
    });

    it('marks exactly the active tab aria-selected', () => {
        renderTabs();
        const [one, two, three] = screen.getAllByRole('tab');
        expect(one).toHaveAttribute('aria-selected', 'true');
        expect(two).toHaveAttribute('aria-selected', 'false');
        expect(three).toHaveAttribute('aria-selected', 'false');
    });

    it('renders buttons, not anchors', () => {
        const { container } = renderTabs();
        expect(container.querySelectorAll('button[role="tab"]')).toHaveLength(3);
        expect(container.querySelector('a')).not.toBeInTheDocument();
    });

    it('marks a disabled tab disabled', () => {
        render(
            <Tabs defaultActiveKey="one">
                <Tabs.Tab eventKey="one">One</Tabs.Tab>
                <Tabs.Tab eventKey="two" isDisabled>
                    Two
                </Tabs.Tab>
            </Tabs>,
        );
        expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-disabled', 'true');
    });
});

describe('Tabs — panels', () => {
    const withPanels = (props = {}) =>
        render(
            <Tabs defaultActiveKey="one" {...props}>
                <Tabs.Tab eventKey="one">One</Tabs.Tab>
                <Tabs.Tab eventKey="two">Two</Tabs.Tab>
                <Tabs.Panel eventKey="one">First panel</Tabs.Panel>
                <Tabs.Panel eventKey="two">Second panel</Tabs.Panel>
            </Tabs>,
        );

    it('points each tab at its panel, and the panel back at its tab', () => {
        withPanels();
        const [one] = screen.getAllByRole('tab');
        const panel = screen.getByRole('tabpanel');
        expect(one.getAttribute('aria-controls')).toBe(panel.getAttribute('id'));
        expect(panel.getAttribute('aria-labelledby')).toBe(one.getAttribute('id'));
    });

    it('shows the active panel and hides the inactive one', () => {
        withPanels();
        expect(screen.getByText('First panel')).toBeInTheDocument();
        expect(screen.queryByText('Second panel')).not.toBeInTheDocument();
    });

    it('switches the panel when a tab is clicked', () => {
        withPanels();
        fireEvent.click(screen.getByRole('tab', { name: 'Two' }));
        expect(screen.getByText('Second panel')).toBeInTheDocument();
        expect(screen.queryByText('First panel')).not.toBeInTheDocument();
    });

    it('puts the panel in the tab sequence, so keyboard users can reach its content', () => {
        withPanels();
        expect(screen.getByRole('tabpanel')).toHaveAttribute('tabindex', '0');
    });
});

describe('Tabs — keyboard', () => {
    // `activateOnFocus` moves selection via an internal effect, one tick after
    // the keydown handler moves roving focus — hence the `waitFor`s below.
    it('moves selection and focus together on ArrowRight', async () => {
        renderTabs();
        const tabs = screen.getAllByRole('tab');
        tabs[0].focus();
        fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
        await waitFor(() => expect(tabs[1]).toHaveAttribute('aria-selected', 'true'));
        expect(tabs[1]).toHaveFocus();
    });

    it('wraps from the last tab to the first', async () => {
        renderTabs({ defaultActiveKey: 'three' });
        const tabs = screen.getAllByRole('tab');
        tabs[2].focus();
        fireEvent.keyDown(tabs[2], { key: 'ArrowRight' });
        await waitFor(() => expect(tabs[0]).toHaveAttribute('aria-selected', 'true'));
    });

    it('reaches a disabled tab with the arrow keys but does not select it', async () => {
        // Base UI's own choice, unlike the old hand-rolled strip (which walked
        // past a disabled tab entirely): a disabled tab stays in the arrow-key
        // path so its existence is discoverable, but `activateOnFocus` never
        // selects it.
        render(
            <Tabs defaultActiveKey="one">
                <Tabs.Tab eventKey="one">One</Tabs.Tab>
                <Tabs.Tab eventKey="two" isDisabled>
                    Two
                </Tabs.Tab>
                <Tabs.Tab eventKey="three">Three</Tabs.Tab>
            </Tabs>,
        );
        const tabs = screen.getAllByRole('tab');
        tabs[0].focus();
        fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
        await waitFor(() => expect(tabs[1]).toHaveFocus());
        expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
        expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    });
});

describe('Tabs — selection', () => {
    it('calls onSelect with the eventKey when a tab is clicked', () => {
        const onSelect = vi.fn();
        renderTabs({ onSelect });
        fireEvent.click(screen.getByRole('tab', { name: 'Three' }));
        expect(onSelect).toHaveBeenCalledWith('three', expect.anything());
    });

    it('follows activeKey when the caller controls it, and does not self-select', () => {
        const onSelect = vi.fn();
        const { rerender } = render(
            <Tabs activeKey="one" onSelect={onSelect}>
                <Tabs.Tab eventKey="one">One</Tabs.Tab>
                <Tabs.Tab eventKey="two">Two</Tabs.Tab>
            </Tabs>,
        );
        fireEvent.click(screen.getByRole('tab', { name: 'Two' }));
        expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true');
        expect(onSelect).toHaveBeenCalledWith('two', expect.anything());

        rerender(
            <Tabs activeKey="two" onSelect={onSelect}>
                <Tabs.Tab eventKey="one">One</Tabs.Tab>
                <Tabs.Tab eventKey="two">Two</Tabs.Tab>
            </Tabs>,
        );
        expect(screen.getAllByRole('tab')[1]).toHaveAttribute('aria-selected', 'true');
    });
});

describe('Tabs — appearance', () => {
    it('applies the appearance class to the root', () => {
        const { container } = renderTabs({ appearance: 'pill' });
        expect(container.firstChild).toHaveClass('plus-tabs--appearance-pill');
    });

    it('has one size: no spacing or size prop', () => {
        const { container } = renderTabs();
        expect(container.firstChild).toHaveClass('plus-tabs--appearance-default');
        expect(container.firstChild.className).not.toMatch(/plus-tabs--spacing/);
        expect(Tabs.propTypes.size).toBeUndefined();
        expect(Tabs.propTypes.spacing).toBeUndefined();
    });

    it('applies the alignment class to the tablist', () => {
        renderTabs({ alignment: 'center' });
        expect(screen.getByRole('tablist')).toHaveClass('plus-tabs-list--center');
    });

    it('passes arbitrary props through to the underlying tab', () => {
        render(
            <Tabs defaultActiveKey="one">
                <Tabs.Tab eventKey="one" data-testid="custom-tab">
                    One
                </Tabs.Tab>
            </Tabs>,
        );
        expect(screen.getByTestId('custom-tab')).toBeInTheDocument();
    });
});

describe('Tabs — overflow collapse', () => {
    // jsdom has no layout: each hidden tab copy is 100px, More 60px, the row 380px.
    // Three tabs and More fit (360), a fourth does not, so three tabs show and two fold.
    let restore;
    beforeEach(() => {
        const rect = Element.prototype.getBoundingClientRect;
        const client = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
        Element.prototype.getBoundingClientRect = function width() {
            const w = this.hasAttribute('data-tab-ghost') ? 100 : this.hasAttribute('data-tab-more-ghost') ? 60 : 0;
            return { width: w, height: 0, top: 0, left: 0, right: w, bottom: 0, x: 0, y: 0, toJSON() {} };
        };
        Object.defineProperty(Element.prototype, 'clientWidth', {
            configurable: true,
            get() { return this.classList?.contains('plus-tabs') ? 380 : 0; },
        });
        restore = () => {
            Element.prototype.getBoundingClientRect = rect;
            if (client) Object.defineProperty(Element.prototype, 'clientWidth', client);
            else delete Element.prototype.clientWidth;
        };
    });
    afterEach(() => restore());

    const renderFolded = (props = {}) => render(
        <Tabs defaultActiveKey="a" {...props}>
            {['a', 'b', 'c', 'd', 'e'].map((k) => <Tabs.Tab key={k} eventKey={k}>{`Tab ${k}`}</Tabs.Tab>)}
            <Tabs.Panel eventKey="e">Panel e</Tabs.Panel>
        </Tabs>,
    );

    it('shows the tabs that fit and names the hidden count on More', () => {
        renderFolded();
        const tabs = screen.getAllByRole('tab');
        expect(tabs.map((t) => t.textContent)).toEqual(['Tab a', 'Tab b', 'Tab c', expect.stringContaining('More')]);
        expect(screen.getByRole('tab', { name: 'More, 2 more tabs' })).toBeInTheDocument();
    });

    it('lists every hidden tab by name and selects one from the menu', async () => {
        const onSelect = vi.fn();
        const user = userEvent.setup();
        renderFolded({ onSelect });
        await user.click(screen.getByRole('tab', { name: /^More/ }));
        const rows = await screen.findAllByRole('menuitemradio');
        expect(rows.map((r) => r.textContent)).toEqual(['Tab d', 'Tab e']);
        await user.click(rows[1]);
        expect(onSelect).toHaveBeenCalledWith('e', undefined);
        await waitFor(() => expect(screen.queryAllByRole('menu')).toHaveLength(0));
        expect(screen.getByRole('tab', { name: /^More/ })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByText('Panel e')).toBeInTheDocument();
    });

    it('moves from the last visible tab to More and back with the arrow keys', async () => {
        const user = userEvent.setup();
        renderFolded();
        const more = screen.getByRole('tab', { name: /^More/ });
        screen.getByRole('tab', { name: 'Tab c' }).focus();
        await user.keyboard('{ArrowRight}');
        expect(more).toHaveFocus();
        await user.keyboard('{ArrowLeft}');
        expect(screen.getByRole('tab', { name: 'Tab c' })).toHaveFocus();
    });

    it('loops through More: the first tab steps back onto it, End and Home bracket the strip', async () => {
        const user = userEvent.setup();
        renderFolded();
        const more = screen.getByRole('tab', { name: /^More/ });
        screen.getByRole('tab', { name: 'Tab a' }).focus();
        await user.keyboard('{ArrowLeft}');
        expect(more).toHaveFocus();
        await user.keyboard('{Home}');
        expect(screen.getByRole('tab', { name: 'Tab a' })).toHaveFocus();
        await user.keyboard('{End}');
        expect(more).toHaveFocus();
    });

    it('wraps instead of folding when overflow is wrap or the strip is justified', () => {
        renderFolded({ overflow: 'wrap' });
        expect(screen.queryByRole('tab', { name: /^More/ })).toBeNull();
        expect(screen.getAllByRole('tab')).toHaveLength(5);
    });

    it('has no More when every tab fits', () => {
        render(
            <Tabs defaultActiveKey="a">
                <Tabs.Tab eventKey="a">A</Tabs.Tab>
                <Tabs.Tab eventKey="b">B</Tabs.Tab>
            </Tabs>,
        );
        expect(screen.queryByRole('tab', { name: /^More/ })).toBeNull();
    });
});

describe('Tabs — narrow', () => {
    const VIEWS = ['Active', 'Inactive', 'All'];
    const renderViews = (props = {}) => render(
        <Tabs appearance="pill" defaultActiveKey="Active" {...props}>
            {VIEWS.map((k) => <Tabs.Tab key={k} eventKey={k}>{k}</Tabs.Tab>)}
            {VIEWS.map((k) => <Tabs.Panel key={k} eventKey={k}>{`${k} list`}</Tabs.Panel>)}
        </Tabs>,
    );

    it('menu: shows only the selected pill, a menu button with a chevron', () => {
        renderViews({ overflow: 'menu' });
        expect(screen.queryByRole('tablist')).toBeNull();
        const trigger = screen.getByRole('button', { name: 'Active' });
        expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(trigger.querySelector('.fa-angle-down')).not.toBeNull();
        expect(screen.getByText('Active list')).toBeInTheDocument();
    });

    it('menu: lists every view, the selected one checked, and picking one selects it', async () => {
        const onSelect = vi.fn();
        const user = userEvent.setup();
        renderViews({ overflow: 'menu', onSelect });
        await user.click(screen.getByRole('button', { name: 'Active' }));
        const rows = await screen.findAllByRole('menuitemradio');
        expect(rows.map((r) => r.textContent)).toEqual(VIEWS);
        expect(rows.map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);
        expect(rows[0].querySelector('.fa-check')).not.toBeNull();
        await user.click(rows[1]);
        expect(onSelect).toHaveBeenCalledWith('Inactive', undefined);
        await waitFor(() => expect(screen.queryAllByRole('menu')).toHaveLength(0));
        expect(screen.getByRole('button', { name: 'Inactive' })).toBeInTheDocument();
        expect(screen.getByText('Inactive list')).toBeInTheDocument();
    });

    it('menu: opens from the keyboard', async () => {
        const user = userEvent.setup();
        renderViews({ overflow: 'menu' });
        screen.getByRole('button', { name: 'Active' }).focus();
        await user.keyboard('{Enter}');
        expect(await screen.findAllByRole('menuitemradio')).toHaveLength(3);
    });

    it('scroll: keeps every tab in one row with no More', () => {
        const { container } = renderViews({ appearance: 'default', overflow: 'scroll' });
        expect(container.firstChild).toHaveClass('plus-tabs--scroll');
        expect(screen.getAllByRole('tab')).toHaveLength(3);
        expect(screen.queryByRole('tab', { name: /^More/ })).toBeNull();
    });

    describe('auto (the default), measured on the row it sits in', () => {
        let restore;
        beforeEach(() => {
            const client = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
            Object.defineProperty(Element.prototype, 'clientWidth', {
                configurable: true,
                get() {
                    const room = this.dataset?.room;
                    return room ? Number(room) : 0;
                },
            });
            restore = () => {
                if (client) Object.defineProperty(Element.prototype, 'clientWidth', client);
                else delete Element.prototype.clientWidth;
            };
        });
        afterEach(() => restore());

        const inRow = (room, props) => render(
            <div data-room={room}>
                <Tabs defaultActiveKey="Active" {...props}>
                    {VIEWS.map((k) => <Tabs.Tab key={k} eventKey={k}>{k}</Tabs.Tab>)}
                </Tabs>
            </div>,
        );

        it('auto, under 768: a pill strip becomes the view menu', () => {
            inRow(600, { appearance: 'pill' });
            expect(screen.queryByRole('tablist')).toBeNull();
            expect(screen.getByRole('button', { name: 'Active' })).toHaveAttribute('aria-haspopup', 'menu');
        });

        it('auto, under 768: an underline strip scrolls', () => {
            const { container } = inRow(600, {});
            expect(container.querySelector('.plus-tabs')).toHaveClass('plus-tabs--scroll');
            expect(screen.getAllByRole('tab')).toHaveLength(3);
        });

        it('from 768 up it folds into More, as collapse does', () => {
            const { container } = inRow(1024, { appearance: 'pill' });
            expect(screen.getByRole('tablist')).toBeInTheDocument();
            expect(container.querySelector('.plus-tabs')).toHaveClass('plus-tabs--collapse');
        });

        it('does not narrow a justified strip, or one whose overflow is set', () => {
            const { unmount } = inRow(600, { appearance: 'pill', alignment: 'justified' });
            expect(screen.getByRole('tablist')).toBeInTheDocument();
            unmount();
            const { container } = inRow(600, { appearance: 'pill', overflow: 'collapse' });
            expect(screen.getByRole('tablist')).toBeInTheDocument();
            expect(container.querySelector('.plus-tabs')).toHaveClass('plus-tabs--collapse');
        });
    });
});
