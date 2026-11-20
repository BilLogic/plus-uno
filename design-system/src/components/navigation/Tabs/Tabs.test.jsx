/**
 * `Tabs`, on Base UI's `Tabs`.
 *
 * Base UI owns the WAI-ARIA tabs pattern itself (roving tabindex, arrow-key
 * navigation, the `aria-controls`/`aria-labelledby` pairing) — these tests
 * cover this wrapper's own contract: the `eventKey`/`activeKey`/`onSelect`
 * vocabulary, the appearance/spacing/alignment classes, and that arbitrary props
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
    it('applies the appearance and spacing classes to the root', () => {
        const { container } = renderTabs({ appearance: 'pill', spacing: 'compact' });
        const root = container.firstChild;
        expect(root).toHaveClass('plus-tabs--appearance-pill');
        expect(root).toHaveClass('plus-tabs--spacing-compact');
    });

    it('defaults to default spacing and declares no size prop', () => {
        const { container } = renderTabs();
        expect(container.firstChild).toHaveClass('plus-tabs--appearance-default');
        expect(Tabs.propTypes.size).toBeUndefined();
        expect(Tabs.propTypes.spacing).toBeDefined();
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
