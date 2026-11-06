import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button, Modal } from '@/components';
import Popup from './Popup/Popup';

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
 * behavior was unreachable from the public API in both directions.
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

const stack = { display: 'flex', flexDirection: 'column', gap: 'var(--space-150)', alignItems: 'flex-start' };

/** The overlay is a portal; `within(canvasElement)` cannot see it. */
const documentOf = (canvasElement) => within(canvasElement.ownerDocument.body);

async function expectPopoverGone(canvasElement, text) {
    await waitFor(() => expect(documentOf(canvasElement).queryByText(text)).toBeNull());
}

export default {
    title: 'Components/Overlays and layering/Popup dismissal',
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
        <Popup trigger={<Button appearance="primary" text="Session 12" />} title="Session 12">
            Ran 45 minutes over.
        </Popup>
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
        <Popup
            trigger={<Button appearance="primary" text="Pinned" />}
            title="Pinned"
            triggerType="manual"
            show
        >
            Stays until the caller says otherwise.
        </Popup>
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

/**
 * What the TRIGGER says — the other half of #321.
 *
 * The issue listed two more gaps beside the dismissal one, and both are about
 * the trigger rather than the panel:
 *
 *   · nothing announced that a panel existed, or that it had opened. No
 *     `aria-haspopup`, no `aria-expanded`. react-bootstrap adds
 *     `aria-describedby` while the popover is shown, which points AT the
 *     content once it is open and says nothing before that.
 *   · a STRING trigger became `<span className="d-inline-block" tabIndex="0">`
 *     — a tab stop with no role and no accessible name. Reachable by keyboard,
 *     inert on Enter, and silent to a screen reader.
 *
 * Both are invisible to a render assertion and to a screenshot: the span looked
 * exactly like the text it wrapped, and a trigger with no `aria-expanded` looks
 * exactly like one that has it.
 */
export const TriggerSemantics = () => (
    <div style={stack}>
        <Popup trigger="Learn more" title="Scoring">
            Sessions are scored on the rubric agreed at intake.
        </Popup>
    </div>
);

TriggerSemantics.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = documentOf(canvasElement);

    // A string trigger is a real button, found BY ROLE and BY ITS OWN TEXT.
    // Neither query can succeed against a `span` with a tabindex: it has no
    // role to match and no accessible name to match on.
    const trigger = canvas.getByRole('button', { name: 'Learn more' });

    await expect(trigger.tagName).toBe('BUTTON');
    await expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    await expect(trigger.getAttribute('aria-expanded')).toBe('false');

    // Enter, not a click — implicit activation is a property of the `button`
    // element, and it is exactly what the old `tabIndex` span did not have.
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(doc.getByText('Sessions are scored on the rubric agreed at intake.')).toBeTruthy());

    // …and the state the trigger reports moves with it.
    await waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('true'));

    await userEvent.keyboard('{Escape}');
    await expectPopoverGone(canvasElement, 'Sessions are scored on the rubric agreed at intake.');
    await waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('false'));
};

/**
 * A Modal the popup raised does not count as "away".
 *
 * The AI chat popup raises a confirm (clear chat). The Modal portals to the
 * document, outside the popup, so Base UI hears a press in it as an outside
 * press. The popup stays open under the Modal's Blanket instead.
 */
const RaisedModal = () => {
    const [open, setOpen] = React.useState(false);
    return (
        <div style={stack}>
            <Popup trigger={<Button appearance="primary" text="Chat" />} title="Chat">
                <Button text="Clear chat" onClick={() => setOpen(true)} />
            </Popup>
            <Modal
                show={open}
                title="Clear this chat?"
                body="The popup stays open under this Modal."
                primaryButton={{ text: 'Done', onClick: () => setOpen(false) }}
                onClose={() => setOpen(false)}
            />
        </div>
    );
};

export const StaysOpenUnderModal = () => <RaisedModal />;

StaysOpenUnderModal.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = documentOf(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Chat' }));
    await userEvent.click(await doc.findByRole('button', { name: 'Clear chat' }));
    await userEvent.click(await doc.findByText('The popup stays open under this Modal.'));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(doc.queryByText('The popup stays open under this Modal.')).toBeNull());
    await expect(doc.getByRole('button', { name: 'Clear chat' }), 'Escape closed only the Modal').toBeTruthy();
    // Reopen by keyboard: focus moves into the Modal and must not close the popup either.
    doc.getByRole('button', { name: 'Clear chat' }).focus();
    await userEvent.keyboard('{Enter}');
    await doc.findByText('The popup stays open under this Modal.');
    await userEvent.click(doc.getByText('The popup stays open under this Modal.'));
    await expect(doc.getByRole('button', { name: 'Clear chat', hidden: true }), 'the popup survived a press in the Modal').toBeTruthy();
    await userEvent.click(doc.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(doc.queryByText('The popup stays open under this Modal.')).toBeNull());
    await expect(doc.getByRole('button', { name: 'Clear chat' }), 'still open after the Modal').toBeTruthy();
};
