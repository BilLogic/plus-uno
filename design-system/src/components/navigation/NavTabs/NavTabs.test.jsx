/**
 * `NavTabs` in both modes.
 *
 * #256 found the gap by trying to consume this component in the documentation's
 * own tab strip: standalone, react-bootstrap's `Nav variant="tabs"` is a
 * navigation bar styled like tabs. It produces `<a href="#" role="button">`
 * items, no `role="tablist"`, no `aria-selected`, and `tabindex="0"` on every
 * item, so a set of six tabs is six stops in the tab sequence and the selected
 * one is conveyed by colour alone.
 *
 * `mode="tabs"` is the opt-in fix. The navigation cases below are not padding:
 * three specs under `src/specs/Home` render this component as navigation today,
 * and the AC for #256 is that their markup does not move. So every tabs-mode
 * assertion has a navigation-mode twin asserting the OPPOSITE, and a change that
 * turned tab semantics on for everyone would fail this file rather than pass it.
 */
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NavTabs from './NavTabs';

/** The three-tab set most cases below use, in whichever mode is passed. */
const renderTabs = (props = {}) =>
    render(
        <NavTabs mode="tabs" defaultActiveKey="one" {...props}>
            <NavTabs.Item eventKey="one">One</NavTabs.Item>
            <NavTabs.Item eventKey="two">Two</NavTabs.Item>
            <NavTabs.Item eventKey="three">Three</NavTabs.Item>
        </NavTabs>,
    );

describe('NavTabs as navigation — the default, and what must not move', () => {
    it('renders the markup main rendered, byte for byte', () => {
        // Captured by rendering this tree against `main`'s NavTabs and diffing
        // the two `innerHTML`s. The AC for #256 is that callers who do not opt
        // in see no change, and the assertions below check properties of that
        // markup — this one checks the markup, so a change that happens to keep
        // every property true still fails here.
        //
        // It doubles as the record of what #256 found: `<a href="#"
        // role="button" tabindex="0">` on every item, no `role="tablist"`, no
        // `aria-selected`. Nothing here should be read as desirable.
        const { container } = render(
            <NavTabs alignment="justified" defaultActiveKey="one" className="extra">
                <NavTabs.Item eventKey="one">One</NavTabs.Item>
                <NavTabs.Item eventKey="two" disabled>
                    Two
                </NavTabs.Item>
                <NavTabs.Item eventKey="three" active>
                    Three
                </NavTabs.Item>
            </NavTabs>,
        );
        expect(container.innerHTML).toBe(
            '<div class="plus-nav-tabs nav-justified extra nav nav-tabs">' +
                '<div class="plus-nav-item  nav-item">' +
                '<a href="#" role="button" data-rr-ui-event-key="one" class="plus-nav-link nav-link active" tabindex="0">One</a>' +
                '</div>' +
                '<div class="plus-nav-item  nav-item">' +
                '<a role="button" data-rr-ui-event-key="two" class="plus-nav-link nav-link disabled" aria-disabled="true">Two</a>' +
                '</div>' +
                '<div class="plus-nav-item  nav-item">' +
                '<a href="#" role="button" data-rr-ui-event-key="three" class="plus-nav-link nav-link active" tabindex="0">Three</a>' +
                '</div>' +
                '</div>',
        );
    });

    it('is not a tablist, and its items are not tabs', () => {
        render(
            <NavTabs defaultActiveKey="one">
                <NavTabs.Item eventKey="one">One</NavTabs.Item>
                <NavTabs.Item eventKey="two">Two</NavTabs.Item>
            </NavTabs>,
        );
        expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
        expect(screen.queryAllByRole('tab')).toHaveLength(0);
    });

    it('leaves items as anchors, so existing callers keep their markup', () => {
        const { container } = render(
            <NavTabs defaultActiveKey="one">
                <NavTabs.Item eventKey="one">One</NavTabs.Item>
            </NavTabs>,
        );
        expect(container.querySelector('a.plus-nav-link')).toBeInTheDocument();
        expect(container.querySelector('button.plus-nav-link')).not.toBeInTheDocument();
    });

    it('does not add aria-selected, which only means something inside a tablist', () => {
        const { container } = render(
            <NavTabs defaultActiveKey="one">
                <NavTabs.Item eventKey="one">One</NavTabs.Item>
            </NavTabs>,
        );
        expect(container.querySelector('[aria-selected]')).not.toBeInTheDocument();
    });

    it('still calls onSelect with the eventKey', () => {
        const onSelect = vi.fn();
        render(
            <NavTabs defaultActiveKey="one" onSelect={onSelect}>
                <NavTabs.Item eventKey="one">One</NavTabs.Item>
                <NavTabs.Item eventKey="two">Two</NavTabs.Item>
            </NavTabs>,
        );
        fireEvent.click(screen.getByText('Two'));
        expect(onSelect).toHaveBeenCalledWith('two', expect.anything());
    });
});

describe('NavTabs mode="tabs" — roles', () => {
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

    it('renders buttons, not anchors — no href="#" to push a history entry', () => {
        const { container } = renderTabs();
        expect(container.querySelectorAll('button[role="tab"]')).toHaveLength(3);
        expect(container.querySelector('a')).not.toBeInTheDocument();
        expect(container.querySelector('[href]')).not.toBeInTheDocument();
    });

    it('gives every tab type="button", so a tab inside a form does not submit it', () => {
        const { container } = renderTabs();
        const tabs = container.querySelectorAll('[role="tab"]');
        expect(tabs).toHaveLength(3);
        for (const tab of tabs) {
            expect(tab).toHaveAttribute('type', 'button');
        }
    });

    it('does not let an intervening element come between the tablist and its tabs', () => {
        // ARIA requires the tablist to own the tabs. The `.plus-nav-item` wrapper
        // carries the -1px overlap that sits the tab on the container border, so
        // it cannot simply be dropped; it is marked presentational instead.
        const { container } = renderTabs();
        const wrapper = container.querySelector('.plus-nav-item');
        expect(wrapper).toHaveAttribute('role', 'presentation');
    });
});

describe('NavTabs mode="tabs" — panels', () => {
    const withPanels = (props = {}) =>
        render(
            <NavTabs mode="tabs" defaultActiveKey="one" {...props}>
                <NavTabs.Item eventKey="one">One</NavTabs.Item>
                <NavTabs.Item eventKey="two">Two</NavTabs.Item>
                <NavTabs.Panel eventKey="one">First panel</NavTabs.Panel>
                <NavTabs.Panel eventKey="two">Second panel</NavTabs.Panel>
            </NavTabs>,
        );

    it('points each tab at its panel, and the panel back at its tab', () => {
        withPanels();
        const [one] = screen.getAllByRole('tab');
        const panel = screen.getByRole('tabpanel');
        expect(one.getAttribute('aria-controls')).toBe(panel.getAttribute('id'));
        expect(panel.getAttribute('aria-labelledby')).toBe(one.getAttribute('id'));
    });

    it('renders only the active panel — hidden panels would duplicate ids and headings', () => {
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

    it('omits aria-controls rather than dangling it when no panel is rendered', () => {
        // A tab pointing at an id that is not in the document is worse than a
        // tab with no pointer: assistive technology follows it to nothing.
        renderTabs();
        const tabs = screen.getAllByRole('tab');
        // Without this the loop below passes on zero tabs, which is what an
        // unimplemented `mode="tabs"` renders.
        expect(tabs).toHaveLength(3);
        for (const tab of tabs) {
            expect(tab).not.toHaveAttribute('aria-controls');
        }
    });

    it('puts the panel in the tab sequence, so keyboard users can reach its content', () => {
        withPanels();
        expect(screen.getByRole('tabpanel')).toHaveAttribute('tabindex', '0');
    });
});

describe('NavTabs mode="tabs" — roving tabindex and arrow keys', () => {
    it('puts exactly one tab in the tab sequence', () => {
        renderTabs();
        const tabs = screen.getAllByRole('tab');
        expect(tabs.filter((t) => t.getAttribute('tabindex') === '0')).toHaveLength(1);
        expect(tabs.filter((t) => t.getAttribute('tabindex') === '-1')).toHaveLength(2);
    });

    it('moves selection and focus together on ArrowRight', () => {
        renderTabs();
        const tabs = screen.getAllByRole('tab');
        fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
        expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
        expect(tabs[1]).toHaveFocus();
    });

    it('wraps from the last tab to the first, and from the first back to the last', () => {
        renderTabs({ defaultActiveKey: 'three' });
        const tabs = screen.getAllByRole('tab');
        fireEvent.keyDown(tabs[2], { key: 'ArrowRight' });
        expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

        fireEvent.keyDown(tabs[0], { key: 'ArrowLeft' });
        expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    });

    it('moves to the ends on Home and End', () => {
        renderTabs({ defaultActiveKey: 'two' });
        const tabs = screen.getAllByRole('tab');
        fireEvent.keyDown(tabs[1], { key: 'End' });
        expect(tabs[2]).toHaveAttribute('aria-selected', 'true');

        fireEvent.keyDown(tabs[2], { key: 'Home' });
        expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('leaves other keys to the browser — Tab must still leave the strip', () => {
        renderTabs();
        const tabs = screen.getAllByRole('tab');
        fireEvent.keyDown(tabs[0], { key: 'Tab' });
        expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('skips a disabled tab rather than selecting something unfocusable', () => {
        // A disabled <button> cannot take focus, so landing selection on one
        // would move the selection and strand the focus behind it.
        render(
            <NavTabs mode="tabs" defaultActiveKey="one">
                <NavTabs.Item eventKey="one">One</NavTabs.Item>
                <NavTabs.Item eventKey="two" disabled>
                    Two
                </NavTabs.Item>
                <NavTabs.Item eventKey="three">Three</NavTabs.Item>
            </NavTabs>,
        );
        const tabs = screen.getAllByRole('tab');
        fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
        expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
        expect(tabs[2]).toHaveFocus();
    });

    it('does nothing when every other tab is disabled', () => {
        render(
            <NavTabs mode="tabs" defaultActiveKey="one">
                <NavTabs.Item eventKey="one">One</NavTabs.Item>
                <NavTabs.Item eventKey="two" disabled>
                    Two
                </NavTabs.Item>
            </NavTabs>,
        );
        const tabs = screen.getAllByRole('tab');
        fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
        expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    });
});

describe('NavTabs mode="tabs" — the strip stays reachable', () => {
    // Four ways the single tab stop can be lost or duplicated. Each one takes
    // the whole strip out of the keyboard's reach, or puts it in twice, and
    // none of them is visible on screen.

    it('keeps a stop when the selected tab is disabled', () => {
        render(
            <NavTabs mode="tabs" defaultActiveKey="two">
                <NavTabs.Item eventKey="one">One</NavTabs.Item>
                <NavTabs.Item eventKey="two" disabled>
                    Two
                </NavTabs.Item>
            </NavTabs>,
        );
        const stops = screen.getAllByRole('tab').filter((t) => t.getAttribute('tabindex') === '0');
        expect(stops).toHaveLength(1);
        // A disabled <button> cannot take focus, so a stop on one is a stop
        // nobody can reach — the strip would be skipped by Tab entirely.
        expect(stops[0]).not.toBeDisabled();
    });

    it('keeps one stop when several items are marked active', () => {
        // `active` is an appearance prop — the InteractionStates story sets it
        // on four items at once. It must not decide the tab sequence.
        render(
            <NavTabs mode="tabs" defaultActiveKey="one">
                <NavTabs.Item eventKey="one" active>
                    One
                </NavTabs.Item>
                <NavTabs.Item eventKey="two" active>
                    Two
                </NavTabs.Item>
            </NavTabs>,
        );
        const tabs = screen.getAllByRole('tab');
        expect(tabs.filter((t) => t.getAttribute('tabindex') === '0')).toHaveLength(1);
        // ...while both still LOOK selected, which is what the prop is for.
        expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
        expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });

    it('keeps a stop when active={false} is put on the selected tab', () => {
        render(
            <NavTabs mode="tabs" defaultActiveKey="one">
                <NavTabs.Item eventKey="one" active={false}>
                    One
                </NavTabs.Item>
                <NavTabs.Item eventKey="two">Two</NavTabs.Item>
            </NavTabs>,
        );
        expect(
            screen.getAllByRole('tab').filter((t) => t.getAttribute('tabindex') === '0'),
        ).toHaveLength(1);
    });

    it('keeps a stop when activeKey names no item at all', () => {
        // A strip rendered before its selection is known, or an activeKey whose
        // item has since been removed.
        render(
            <NavTabs mode="tabs" activeKey="gone">
                <NavTabs.Item eventKey="one">One</NavTabs.Item>
                <NavTabs.Item eventKey="two">Two</NavTabs.Item>
            </NavTabs>,
        );
        expect(
            screen.getAllByRole('tab').filter((t) => t.getAttribute('tabindex') === '0'),
        ).toHaveLength(1);
    });

    it('sends ArrowLeft to the last tab when nothing is selected', () => {
        // `findIndex` returns -1 for an unknown key, and -1 - 1 wraps two short
        // of the end. ArrowRight hid the bug, because -1 + 1 is 0.
        renderTabs({ defaultActiveKey: undefined });
        const tabs = screen.getAllByRole('tab');
        fireEvent.keyDown(tabs[0], { key: 'ArrowLeft' });
        expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    });

    it('does not leave a non-tab child bare inside the tablist', () => {
        // A tablist's children have to be tabs. An unwrapped dropdown toggle in
        // there trips axe's `aria-required-children`.
        const { container } = render(
            <NavTabs mode="tabs" defaultActiveKey="one">
                <NavTabs.Item eventKey="one">One</NavTabs.Item>
                <NavTabs.Dropdown title="More" id="d">
                    <NavTabs.Dropdown.Item eventKey="a">A</NavTabs.Dropdown.Item>
                </NavTabs.Dropdown>
            </NavTabs>,
        );
        for (const child of container.querySelector('[role="tablist"]').children) {
            expect(child.getAttribute('role')).toBe('presentation');
        }
        // ...and it is still not part of the tab set.
        expect(screen.getAllByRole('tab')).toHaveLength(1);
    });
});

describe('NavTabs mode="tabs" — selection', () => {
    it('calls onSelect with the eventKey when a tab is clicked', () => {
        const onSelect = vi.fn();
        renderTabs({ onSelect });
        fireEvent.click(screen.getByRole('tab', { name: 'Three' }));
        expect(onSelect).toHaveBeenCalledWith('three', expect.anything());
    });

    it('calls onSelect when the arrow keys move selection', () => {
        const onSelect = vi.fn();
        renderTabs({ onSelect });
        fireEvent.keyDown(screen.getAllByRole('tab')[0], { key: 'ArrowRight' });
        expect(onSelect).toHaveBeenCalledWith('two', expect.anything());
    });

    it('follows activeKey when the caller controls it, and does not self-select', () => {
        const onSelect = vi.fn();
        const { rerender } = render(
            <NavTabs mode="tabs" activeKey="one" onSelect={onSelect}>
                <NavTabs.Item eventKey="one">One</NavTabs.Item>
                <NavTabs.Item eventKey="two">Two</NavTabs.Item>
            </NavTabs>,
        );
        fireEvent.click(screen.getByRole('tab', { name: 'Two' }));
        // The caller did not move activeKey, so the tab did not move either.
        expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true');
        expect(onSelect).toHaveBeenCalledWith('two', expect.anything());

        rerender(
            <NavTabs mode="tabs" activeKey="two" onSelect={onSelect}>
                <NavTabs.Item eventKey="one">One</NavTabs.Item>
                <NavTabs.Item eventKey="two">Two</NavTabs.Item>
            </NavTabs>,
        );
        expect(screen.getAllByRole('tab')[1]).toHaveAttribute('aria-selected', 'true');
    });
});
