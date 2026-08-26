import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import Modal from './Modal';

/**
 * Getting a `Modal` shut again.
 *
 * WHY THIS FILE EXISTS (#209). `Modal` is the third most-used component in the
 * repo — 33 files under `design-system/src/specs/` and `prototypes/` render it —
 * and it is controlled: the caller owns `show` and the component only reports
 * that a dismissal happened, through `onClose`. Every dismissal path is
 * therefore a callback that has to fire, and each one is a separate wire:
 * the header's close button, Escape (via react-bootstrap's `keyboard`), the
 * backdrop (via `backdrop`), and the caller's own footer buttons.
 *
 * None of that was exercised. Every story in `Modal.stories.jsx` renders
 * `renderAs="inline"`, which returns the panel markup and never mounts the
 * react-bootstrap `Modal` at all — so the overlay, the backdrop, the Escape
 * handler and the focus behaviour had no coverage of any kind, and a render
 * assertion cannot reach them: an inline panel renders identically whether or
 * not the overlay it stands in for can be closed.
 *
 * That is precisely the defect class #207 found by hand in `Dropdown` — a
 * controlled component that opens and cannot be closed, which looks correct in
 * a screenshot and in the markup.
 *
 * The modal portals to `document.body`, outside the story canvas, so these
 * queries run against the document rather than `canvasElement`.
 */

const stack = { display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'flex-start' };

/** The dialog is a portal; `within(canvasElement)` cannot see it. */
const documentOf = (canvasElement) => within(canvasElement.ownerDocument.body);

/** Exit transitions keep the node around for a frame, so wait rather than assert. */
async function expectDialogGone(canvasElement, title) {
    await waitFor(() => expect(documentOf(canvasElement).queryByText(title)).toBeNull());
}

export default {
    title: 'Components/Messaging/Modal dismissal',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Interaction cover for #209: a controlled `Modal` has to be closable by '
                    + 'every route it advertises, and has to stay open on the routes it '
                    + 'refuses.',
            },
        },
    },
};

/**
 * Every route out, one after another, against caller-owned state.
 *
 * The log is the assertion: `onClose` is the component reporting a dismissal it
 * did not itself perform, and the footer handlers are the caller's own. A modal
 * that closed its internal state without calling back would leave this empty
 * while looking, on screen, exactly right.
 */
export const EveryRouteOut = () => {
    const [open, setOpen] = useState(false);
    const [log, setLog] = useState([]);
    const close = (what) => () => {
        setLog((prev) => [...prev, what]);
        setOpen(false);
    };

    return (
        <div style={stack}>
            <button type="button" onClick={() => setOpen(true)}>Open</button>
            <Modal
                id="mdis-delete"
                show={open}
                title="Delete session"
                body="This cannot be undone."
                onClose={close('close')}
                secondaryButton={{ text: 'Cancel', onClick: close('cancel') }}
                primaryButton={{ text: 'Delete', onClick: close('delete') }}
            />
            <p data-testid="dismissal-log">{log.join(',')}</p>
        </div>
    );
};

EveryRouteOut.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = documentOf(canvasElement);
    const log = canvas.getByTestId('dismissal-log');
    const open = canvas.getByRole('button', { name: 'Open' });

    // `show={false}` renders nothing — not a hidden dialog, nothing.
    await expect(doc.queryByText('Delete session')).toBeNull();

    // 1. The header's own close button.
    await userEvent.click(open);
    await doc.findByText('Delete session');
    await userEvent.click(doc.getByRole('button', { name: 'Close modal' }));
    await expectDialogGone(canvasElement, 'Delete session');
    await expect(log).toHaveTextContent(/^close$/);

    // 2. Escape, which `keyboard` allows by default.
    await userEvent.click(open);
    await doc.findByText('Delete session');
    await userEvent.keyboard('{Escape}');
    await expectDialogGone(canvasElement, 'Delete session');
    await expect(log).toHaveTextContent(/^close,close$/);

    // 3. The footer buttons, which run the caller's handlers, not `onClose`.
    await userEvent.click(open);
    await userEvent.click(await doc.findByRole('button', { name: 'Cancel' }));
    await expectDialogGone(canvasElement, 'Delete session');
    await expect(log).toHaveTextContent(/^close,close,cancel$/);

    await userEvent.click(open);
    await userEvent.click(await doc.findByRole('button', { name: 'Delete' }));
    await expectDialogGone(canvasElement, 'Delete session');
    await expect(log).toHaveTextContent(/^close,close,cancel,delete$/);
};

/**
 * The refusals, which are the same props read the other way.
 *
 * `keyboard={false}` and `backdrop="static"` are what a modal over an
 * in-flight operation sets so that a stray Escape or a click beside the dialog
 * cannot abandon it. A component that ignored them would look identical until
 * someone lost work to it.
 */
export const StaticBackdropRefusesToClose = () => {
    const [open, setOpen] = useState(true);
    const [closes, setCloses] = useState(0);

    return (
        <div style={stack}>
            <Modal
                id="mdis-uploading"
                show={open}
                backdrop="static"
                keyboard={false}
                title="Uploading transcript"
                body="Leaving now would discard it."
                showBottomButtons={false}
                onClose={() => {
                    setCloses((n) => n + 1);
                    setOpen(false);
                }}
            />
            <p data-testid="close-count">{closes}</p>
        </div>
    );
};

StaticBackdropRefusesToClose.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = documentOf(canvasElement);
    const closes = canvas.getByTestId('close-count');

    await doc.findByText('Uploading transcript');

    // Escape is swallowed: no callback, and the dialog is still there.
    await userEvent.keyboard('{Escape}');
    await expect(closes).toHaveTextContent('0');
    await expect(doc.getByText('Uploading transcript')).toBeInTheDocument();

    // So is a click on the backdrop container beside the dialog. Dispatched on
    // the container itself because that is the target react-bootstrap tests
    // for — a click landing on the dialog is not a backdrop click at all.
    const backdrop = canvasElement.ownerDocument.querySelector('.modal');
    await expect(backdrop).not.toBeNull();
    backdrop.click();
    await expect(closes).toHaveTextContent('0');
    await expect(doc.getByText('Uploading transcript')).toBeInTheDocument();

    // The one route the caller left open still works, and still reports.
    await userEvent.click(doc.getByRole('button', { name: 'Close modal' }));
    await expectDialogGone(canvasElement, 'Uploading transcript');
    await expect(closes).toHaveTextContent('1');
};
