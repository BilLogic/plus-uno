/**
 * `Tabs`, on Base UI's `Tabs`.
 *
 * Base UI owns the WAI-ARIA tabs pattern itself (roving tabindex, arrow-key
 * navigation, the `aria-controls`/`aria-labelledby` pairing) — these tests
 * cover this wrapper's own contract: the `eventKey`/`activeKey`/`onSelect`
 * vocabulary, the appearance/size/alignment classes, and that arbitrary props
 * still reach the underlying tab.
 */
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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
    it('applies the appearance and size classes to the root', () => {
        const { container } = renderTabs({ appearance: 'pill', size: 'compact' });
        const root = container.firstChild;
        expect(root).toHaveClass('plus-tabs--pill');
        expect(root).toHaveClass('plus-tabs--compact');
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
