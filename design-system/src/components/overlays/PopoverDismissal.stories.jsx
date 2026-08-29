import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import Button from '@/components/actions/Button/Button';
import Popover from './Popover';

/**
 * Getting a `Popover` shut again.
 *
 * WHY THIS FILE EXISTS (#321). react-bootstrap's `Overlay` defaults `rootClose`
 * to false, and `Popover` passed no value for it. A click-triggered popover —
 * the default trigger — therefore stayed open until the trigger itself was
 * clicked a second time: not on a click elsewhere, and not on Escape.
 *
 * A caller could not fix it from outside either. Extra props are spread onto
 * the overlay's CONTENT, not onto `OverlayTrigger`, so `rootClose` passed to
 * this component landed on the popover panel and did nothing there. The
 * behaviour was unreachable from the public API in both directions.
 *
 * This is #209's defect class in a second component: something that opens,
 * looks right in a screenshot, and cannot be closed by the route everyone
 * expects. A render assertion cannot see it — an open popover renders
 * identically whether or not a click away will dismiss it — so the cover has to
 * be an interaction.
 *
 * The popover portals out of the story canvas, so these queries run against the
 * document. The exit transition keeps the node for a frame, so disappearance is
 * waited for rather than asserted.
 */

const stack = { display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'flex-start' };

/** The overlay is a portal; `within(canvasElement)` cannot see it. */
const documentOf = (canvasElement) => within(canvasElement.ownerDocument.body);

async function expectPopoverGone(canvasElement, text) {
    await waitFor(() => expect(documentOf(canvasElement).queryByText(text)).toBeNull());
}

export default {
    title: 'Components/Overlays/Popover dismissal',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Interaction cover for #321: a click-triggered popover has to close on a '
                    + 'click away and on Escape, and a manual one has to ignore both.',
            },
        },
    },
};

/**
 * The two routes out that a click popover advertises by being a click popover.
 *
 * Both assertions fail before the fix, for the same reason: `rootClose` was off,
 * and it is what binds the outside click AND the Escape key.
 */
export const ClickAwayAndEscape = () => (
    <div style={stack}>
        <Popover trigger={<Button text="Session 12" />} title="Session 12">
            Ran 45 minutes over.
        </Popover>
        <p data-testid="pd-elsewhere">Somewhere else on the page.</p>
    </div>
);

ClickAwayAndEscape.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = documentOf(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Session 12' });

    // Route one: click away.
    await userEvent.click(trigger);
    await waitFor(() => expect(doc.getByText('Ran 45 minutes over.')).toBeTruthy());

    await userEvent.click(canvas.getByTestId('pd-elsewhere'));
    await expectPopoverGone(canvasElement, 'Ran 45 minutes over.');

    // Route two: Escape.
    await userEvent.click(trigger);
    await waitFor(() => expect(doc.getByText('Ran 45 minutes over.')).toBeTruthy());

    await userEvent.keyboard('{Escape}');
    await expectPopoverGone(canvasElement, 'Ran 45 minutes over.');
};

/**
 * And the case the default must NOT reach into.
 *
 * With `triggerType="manual"` the caller owns `show`. A root close it did not
 * ask for would dismiss a popover the caller still believes is open, which is
 * the state desync #207 found in `Dropdown` pointing the other way.
 */
export const ManualIgnoresRootClose = () => (
    <div style={stack}>
        <Popover
            trigger={<Button text="Pinned" />}
            title="Pinned"
            triggerType="manual"
            show
        >
            Stays until the caller says otherwise.
        </Popover>
        <p data-testid="pd-manual-elsewhere">Somewhere else on the page.</p>
    </div>
);

ManualIgnoresRootClose.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = documentOf(canvasElement);

    await waitFor(() => expect(doc.getByText('Stays until the caller says otherwise.')).toBeTruthy());

    await userEvent.click(canvas.getByTestId('pd-manual-elsewhere'));
    await userEvent.keyboard('{Escape}');

    // Still there. `show` is the caller's, and nothing here may overrule it.
    await expect(doc.getByText('Stays until the caller says otherwise.')).toBeTruthy();
};
