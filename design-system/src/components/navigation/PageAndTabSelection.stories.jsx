import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import NavTabs from './NavTabs';
import Pagination from './Pagination';

/**
 * Selection the caller owns, reported by the component.
 *
 * WHY THIS FILE EXISTS (#209). `NavTabs` (11 files) and `Pagination` (13) are
 * the two navigation components with measured usage, and both are pure
 * controlled widgets: neither holds the answer. `NavTabs` takes `activeKey` and
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
 *   2. A selection that cannot happen must not be reported. `NavTabs` has a
 *      `disabled` item; `Pagination` disables Previous on the first page and
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
 * grey styling that usually comes with them is true of one that works fine.
 */
async function expectUnreachable(element) {
    await expect(element).toHaveAttribute('aria-disabled', 'true');
    await expect(getComputedStyle(element).pointerEvents).toBe('none');
}

export default {
    title: 'Components/Navigation/Page and tab selection',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Interaction cover for #209: `NavTabs` and `Pagination` report the '
                    + 'selection the user made, and report nothing for the ones they '
                    + 'themselves disabled.',
            },
        },
    },
};

/* ----------------------------------------------------------------- NavTabs */

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
            <NavTabs
                activeKey={active}
                onSelect={(key) => {
                    setLog((prev) => [...prev, key]);
                    setActive(key);
                }}
            >
                <NavTabs.Item eventKey="overview">Overview</NavTabs.Item>
                <NavTabs.Item eventKey="attendees">Attendees</NavTabs.Item>
                <NavTabs.Item eventKey="billing" disabled>Billing</NavTabs.Item>
            </NavTabs>
            <p data-testid="panel">{`Panel: ${active}`}</p>
            <p data-testid="select-log">{log.join(',')}</p>
        </div>
    );
};

TabSelection.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = canvas.getByTestId('panel');
    const log = canvas.getByTestId('select-log');

    // An item with no `href` is a button, not a link — react-bootstrap's Anchor
    // gives a trivial href button semantics rather than leaving it unreachable.
    const overview = canvas.getByRole('button', { name: 'Overview' });
    const attendees = canvas.getByRole('button', { name: 'Attendees' });
    const billing = canvas.getByRole('button', { name: 'Billing' });

    await expect(overview).toHaveClass('active');
    await expect(attendees).not.toHaveClass('active');

    await userEvent.click(attendees);
    await expect(log).toHaveTextContent(/^attendees$/);
    await expect(panel).toHaveTextContent('Panel: attendees');
    await expect(attendees).toHaveClass('active');
    await expect(overview).not.toHaveClass('active');

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
 * last stay reachable behind an ellipsis, which is the only reason `maxVisible`
 * exists and is otherwise asserted nowhere.
 */
export const PageSelection = () => {
    const [page, setPage] = useState(1);
    const [log, setLog] = useState([]);

    return (
        <div style={stack}>
            <Pagination
                id="pts-pages"
                type="text"
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

    // On page 1 there is nowhere back to go, so Previous is unreachable rather
    // than merely styled grey. Unlike the disabled tab above it is not clicked
    // past the shield: this anchor keeps its `href="#"` when disabled, so a
    // dispatched click follows it and navigates the page out from under the run.
    const previous = canvas.getByRole('link', { name: 'Previous' });
    await expectUnreachable(previous);
    await expect(previous).toHaveAttribute('tabindex', '-1');
    await expect(log.textContent).toBe('');

    // A page number reports itself, and becomes the current page.
    await userEvent.click(canvas.getByRole('link', { name: '3' }));
    await expect(log).toHaveTextContent(/^3$/);
    await expect(canvas.getByRole('link', { name: '3' })).toHaveAttribute('aria-current', 'page');

    // Next and Previous step by one from wherever the caller now is.
    await userEvent.click(canvas.getByRole('link', { name: 'Next' }));
    await expect(log).toHaveTextContent(/^3,4$/);
    await userEvent.click(canvas.getByRole('link', { name: 'Previous' }));
    await expect(log).toHaveTextContent(/^3,4,3$/);

    // The window keeps both ends reachable rather than stranding page 20.
    await expect(canvas.getByRole('link', { name: '20' })).toBeInTheDocument();
    await expect(canvas.getAllByText('...').length).toBeGreaterThan(0);

    // The far end refuses in the same way the near end did.
    await userEvent.click(canvas.getByRole('link', { name: '20' }));
    await expect(log).toHaveTextContent(/^3,4,3,20$/);
    const next = canvas.getByRole('link', { name: 'Next' });
    await expectUnreachable(next);
    await expect(next).toHaveAttribute('tabindex', '-1');
};
