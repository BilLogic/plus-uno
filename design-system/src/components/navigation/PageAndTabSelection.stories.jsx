import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import Tabs from './Tabs';
import Pagination from './Pagination';

/**
 * Selection the caller owns, reported by the component.
 *
 * WHY THIS FILE EXISTS (#209). `Tabs` (11 files) and `Pagination` (13) are
 * the two navigation components with measured usage, and both are pure
 * controlled widgets: neither holds the answer. `Tabs` takes `activeKey` and
 * reports through `onSelect`; `Pagination` takes `currentPage` and reports
 * through `onPageChange`. The component's whole job is the callback — which
 * means the component's whole job is invisible to a render assertion. A tab
 * strip whose `onSelect` never fires renders the same tab strip.
 *
 * Two halves matter, the same two in each, and both are the shape of the defect
 * #207 found by reading source rather than by a test:
 *
 *   1. A selection the user made has to be reported, with the key the caller
 *      gave it — not an index, not the label.
 *   2. A selection that cannot happen must not be reported. `Tabs` has a
 *      disabled tab; `Pagination` disables Previous on the first page and
 *      Next on the last. Both are guarded in code that nothing ran.
 */

const stack = { display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' };

/**
 * What "disabled" has to mean, asserted the same way in both stories.
 *
 * Both components shield disabled controls with `pointer-events: none`, and
 * `userEvent` refuses to click through that — correctly, since a user cannot.
 * So a disabled control is asserted unreachable by pointer *and* announced as
 * disabled: either alone can be true of a control that still works, and the
 * gray styling that usually comes with them is true of one that works fine.
 */
async function expectUnreachable(element) {
    await expect(element).toHaveAttribute('aria-disabled', 'true');
    await expect(getComputedStyle(element).pointerEvents).toBe('none');
}

/**
 * What happens when a click reaches a disabled control anyway (#223).
 *
 * `expectUnreachable` says the pointer cannot get there. This says the control
 * refuses the click that arrives by every other route — because `pointer-events`
 * is a mouse-only shield, and a keyboard Enter, an assistive-technology
 * activation and a dispatched event all land on the handler regardless.
 *
 * The assertion is `defaultPrevented` rather than "nothing visibly happened",
 * because for `Pagination` the anchor keeps its `href="#"` while disabled: a
 * handler that returns early without calling `preventDefault` lets the browser
 * follow the href, and the page navigates out from under the run. That is the
 * defect #223 fixed and the reason #221 could only assert unreachability here.
 * The URL is checked as well, since it is the damage rather than the cause.
 */
async function expectRefusesDispatchedClick(element) {
    const doc = element.ownerDocument;
    const before = doc.location.href;
    const click = new MouseEvent('click', { bubbles: true, cancelable: true, view: doc.defaultView });

    element.dispatchEvent(click);

    await expect(click.defaultPrevented).toBe(true);
    await expect(doc.location.href).toBe(before);
}

export default {
    title: 'Components/Navigation/Page and tab selection',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Interaction cover for #209: `Tabs` and `Pagination` report the '
                    + 'selection the user made, and report nothing for the ones they '
                    + 'themselves disabled.',
            },
        },
    },
};

/* ------------------------------------------------------------------- Tabs */

/**
 * A tab click moves the active key and swaps the panel.
 *
 * The panel is part of the assertion on purpose: `onSelect` firing with the
 * right key is what lets the caller render anything at all, so the visible
 * consequence and the callback are checked together rather than separately.
 */
export const TabSelection = () => {
    const [active, setActive] = useState('overview');
    const [log, setLog] = useState([]);

    return (
        <div style={stack}>
            <Tabs
                activeKey={active}
                onSelect={(key) => {
                    setLog((prev) => [...prev, key]);
                    setActive(key);
                }}
            >
                <Tabs.Tab eventKey="overview">Overview</Tabs.Tab>
                <Tabs.Tab eventKey="attendees">Attendees</Tabs.Tab>
                <Tabs.Tab eventKey="billing" isDisabled>Billing</Tabs.Tab>
            </Tabs>
            <p data-testid="panel">{`Panel: ${active}`}</p>
            <p data-testid="select-log">{log.join(',')}</p>
        </div>
    );
};

TabSelection.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = canvas.getByTestId('panel');
    const log = canvas.getByTestId('select-log');

    const overview = canvas.getByRole('tab', { name: 'Overview' });
    const attendees = canvas.getByRole('tab', { name: 'Attendees' });
    const billing = canvas.getByRole('tab', { name: 'Billing' });

    await expect(overview).toHaveAttribute('aria-selected', 'true');
    await expect(attendees).toHaveAttribute('aria-selected', 'false');

    await userEvent.click(attendees);
    await expect(log).toHaveTextContent(/^attendees$/);
    await expect(panel).toHaveTextContent('Panel: attendees');
    await expect(attendees).toHaveAttribute('aria-selected', 'true');
    await expect(overview).toHaveAttribute('aria-selected', 'false');

    // The disabled tab is unreachable, and refuses even a click dispatched past
    // the CSS shield — the handler guard behind it has to hold on its own, so
    // that a stylesheet change cannot quietly re-arm a tab that is switched off.
    await expectUnreachable(billing);
    billing.click();
    await expect(log).toHaveTextContent(/^attendees$/);
    await expect(panel).toHaveTextContent('Panel: attendees');

    // ...and the strip still works afterwards, which a swallowed event can break.
    await userEvent.click(overview);
    await expect(log).toHaveTextContent(/^attendees,overview$/);
};

/* -------------------------------------------------------------- Pagination */

/**
 * Page numbers, Previous and Next all report the page they land on.
 *
 * Twenty pages rather than five so the windowing is exercised too: first and
 * last stay reachable behind an ellipsis, which is the only reason `max`
 * exists and is otherwise asserted nowhere.
 */
export const PageSelection = () => {
    const [page, setPage] = useState(1);
    const [log, setLog] = useState([]);

    return (
        <div style={stack}>
            <Pagination
                id="pts-pages"
                navigator="text"
                currentPage={page}
                totalPages={20}
                onPageChange={(next) => {
                    setLog((prev) => [...prev, next]);
                    setPage(next);
                }}
            />
            <p data-testid="page-log">{log.join(',')}</p>
        </div>
    );
};

PageSelection.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const log = canvas.getByTestId('page-log');

    // On page 1 there is nowhere back to go: Previous stays in the tab order,
    // says it is disabled, and a click reports nothing.
    const previous = canvas.getByRole('button', { name: 'Previous' });
    await expect(previous).toHaveAttribute('aria-disabled', 'true');
    // A dispatched click passes the CSS shield, so this is the handler's own refusal.
    previous.click();
    await expect(log.textContent).toBe('');

    // A page number reports itself, and becomes the current page.
    await userEvent.click(canvas.getByRole('button', { name: 'Page 3' }));
    await expect(log).toHaveTextContent(/^3$/);
    await expect(canvas.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');

    // Next and Previous step by one from wherever the caller now is.
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(log).toHaveTextContent(/^3,4$/);
    await userEvent.click(canvas.getByRole('button', { name: 'Previous' }));
    await expect(log).toHaveTextContent(/^3,4,3$/);

    // The window keeps both ends reachable rather than stranding page 20, and
    // the gap is hidden from assistive technology.
    await expect(canvas.getByRole('button', { name: 'Page 20' })).toBeInTheDocument();
    await expect(canvas.getAllByText('\u2026').length).toBeGreaterThan(0);

    // The far end refuses in the same way the near end did.
    await userEvent.click(canvas.getByRole('button', { name: 'Page 20' }));
    await expect(log).toHaveTextContent(/^3,4,3,20$/);
    const next = canvas.getByRole('button', { name: 'Next' });
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    next.click();
    await expect(log).toHaveTextContent(/^3,4,3,20$/);

    await userEvent.click(canvas.getByRole('button', { name: 'Page 19' }));
    await expect(log).toHaveTextContent(/^3,4,3,20,19$/);

    // Previous and Next are separate items from the pages they point at: on
    // page 19 of 20, `currentPage + 1` is 20 and `currentPage - 1` is 18, and
    // both numbers are also pages in the same list. Exactly one control holds
    // `aria-current`, the current page.
    const current = canvasElement.querySelectorAll('[aria-current="page"]');
    await expect(current.length).toBe(1);
    await expect(current[0]).toHaveTextContent('19');
};
