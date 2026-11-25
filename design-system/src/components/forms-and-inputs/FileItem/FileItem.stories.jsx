import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import FileItem, {
    FILE_ITEM_KINDS,
    FILE_ITEM_REMOVALS,
    FILE_ITEM_STATUSES,
} from './FileItem';
import { expectNoSilentClip, expectInsideWell, expectFullTextReachable } from '../../_internal/overflowPlays';

const wrap = { maxWidth: '640px' /* demo frame */ };
const narrowWrap = { maxWidth: '320px' /* demo frame */ };
const rowOf = (canvasElement) => canvasElement.querySelector('.plus-file-item');
const heightOf = (el) => Math.round(el.getBoundingClientRect().height);
const leadOf = (canvasElement) => canvasElement.querySelector('.plus-file-item__start');

/** The lead is a 32 slot; a kind of item fills it with a Tile 32, a status stays bare and centered in it. */
const expectLead = async (canvasElement, { tile }) => {
    const lead = leadOf(canvasElement);
    const box = lead.getBoundingClientRect();
    await expect(Math.round(box.width), 'lead slot is 32 wide').toBe(32);
    await expect(Math.round(box.height), 'lead slot is 32 tall').toBe(32);
    await expect(Boolean(lead.querySelector('.plus-tile--32')), tile ? 'a kind of item sits in a Tile 32' : 'a status is never in a Tile').toBe(tile);
};

export default {
    title: 'Components/Forms and inputs/File upload/File item',
    component: FileItem,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A 56px row representing a chosen file or folder in a FileUpload list or a standalone attachment on a note, comment or message.',
            },
        },
    },
    argTypes: {
        onRemove: { table: { disable: true } },
        onRetry: { table: { disable: true } },
        name: {
            control: 'text',
            table: { category: 'Content' },
        },
        meta: {
            control: 'text',
            table: { category: 'Content' },
        },
        error: {
            control: 'text',
            table: { category: 'Content' },
        },
        href: {
            control: 'text',
            table: { category: 'Content' },
        },
        kind: {
            control: 'select',
            options: FILE_ITEM_KINDS,
            table: { category: 'Design' },
        },
        fileType: {
            // The prop is any string; the options are the file kinds that have an icon.
            optionsUnchecked: true,
            control: 'select',
            options: ['file', 'pdf', 'video', 'audio', 'image', 'archive', 'word', 'spreadsheet', 'presentation', 'code', 'text'],
            table: { category: 'Design' },
        },
        status: {
            control: 'select',
            options: FILE_ITEM_STATUSES,
            table: { category: 'Behavior' },
        },
        progress: {
            control: { type: 'range', min: 0, max: 100, step: 1 },
            table: { category: 'Behavior' },
        },
        removal: {
            control: 'select',
            options: FILE_ITEM_REMOVALS,
            table: { category: 'Behavior' },
        },
        isReadOnly: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
        isDisabled: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
    },
};

export const Overview = {
    render: () => (
        <div style={wrap} className="plus-file-item-list">
            <FileItem
                name="zoom_0.mp4"
                status="done"
                fileType="video"
                meta="48.2 MB"
                href="#zoom-recording"
                removal="remove"
            />
            <FileItem
                name="audio_only.m4a"
                status="uploading"
                progress={64}
                removal="cancel"
            />
            <FileItem
                name="chat_transcript.txt"
                status="queued"
                removal="cancel"
            />
            <FileItem
                name="whiteboard_export.pdf"
                status="error"
                error="That file is over 25 MB. Export a compressed PDF and retry."
                removal="remove"
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const rows = canvasElement.querySelectorAll('.plus-file-item');
        await expect(rows.length).toBe(4);
        for (const row of rows) {
            await expect(heightOf(row), 'Every FileItem row stays 56px').toBe(56);
        }
    },
};

export const Queued = {
    render: () => {
        const Demo = () => {
            const [cancelled, setCancelled] = useState(false);
            return (
                <div style={wrap}>
                    <FileItem
                        name="chat_transcript.txt"
                        status="queued"
                        meta={cancelled ? 'Canceled' : undefined}
                        removal="cancel"
                        onRemove={() => setCancelled(true)}
                    />
                </div>
            );
        };
        return <Demo />;
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(heightOf(rowOf(canvasElement))).toBe(56);
        await expect(canvas.getByText('Waiting')).toBeInTheDocument();
        await expect(canvasElement.querySelector('.fa-clock')).toBeInTheDocument();
        await expectLead(canvasElement, { tile: false });
        await userEvent.click(canvas.getByRole('button', { name: 'Cancel chat_transcript.txt' }));
        await expect(canvas.getByText('Waiting · Canceled')).toBeInTheDocument();
        await expect(heightOf(rowOf(canvasElement))).toBe(56);
    },
};

export const Uploading0 = {
    render: () => (
        <div style={wrap}>
            <FileItem
                name="zoom_0.mp4"
                status="uploading"
                progress={0}
                removal="cancel"
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(heightOf(rowOf(canvasElement))).toBe(56);
        await expect(canvas.getByRole('progressbar', { name: 'Uploading zoom_0.mp4' })).toHaveAttribute('aria-valuenow', '0');
        await expect(canvas.getByText('Uploading · 0%')).toBeInTheDocument();
    },
};

export const Uploading40 = {
    render: () => (
        <div style={wrap}>
            <FileItem
                name="zoom_0.mp4"
                status="uploading"
                progress={40}
                removal="cancel"
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(heightOf(rowOf(canvasElement))).toBe(56);
        await expect(canvas.getByRole('progressbar', { name: 'Uploading zoom_0.mp4' })).toHaveAttribute('aria-valuenow', '40');
        await expectLead(canvasElement, { tile: false });
        await expect(Math.round(canvas.getByRole('progressbar').getBoundingClientRect().width), 'ring is 24').toBe(24);
        await expect(canvas.getByText('Uploading · 40%')).toBeInTheDocument();
    },
};

export const Uploading80 = {
    render: () => (
        <div style={wrap}>
            <FileItem
                name="zoom_0.mp4"
                status="uploading"
                progress={80}
                removal="cancel"
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(heightOf(rowOf(canvasElement))).toBe(56);
        await expect(canvas.getByRole('progressbar', { name: 'Uploading zoom_0.mp4' })).toHaveAttribute('aria-valuenow', '80');
        await expect(canvas.getByText('Uploading · 80%')).toBeInTheDocument();
    },
};

export const DoneRemove = {
    render: () => {
        const onRemove = fn();
        return (
            <div style={wrap}>
                <FileItem
                    name="session_notes.pdf"
                    status="done"
                    fileType="pdf"
                    meta="2.4 MB"
                    href="#session-notes"
                    removal="remove"
                    onRemove={onRemove}
                />
            </div>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(heightOf(rowOf(canvasElement))).toBe(56);
        await expect(canvasElement.querySelector('.fa-file-pdf')).toBeInTheDocument();
        await expectLead(canvasElement, { tile: true });
        await expect(canvas.getByRole('link', { name: 'session_notes.pdf' })).toHaveAttribute('href', '#session-notes');
        await expect(canvas.getByRole('button', { name: 'Remove session_notes.pdf' })).toBeEnabled();
    },
};

export const DoneDelete = {
    render: () => {
        const Demo = () => {
            const [deletedCount, setDeletedCount] = useState(0);
            return (
                <div style={wrap}>
                    <FileItem
                        name="signed_consent.pdf"
                        status="done"
                        fileType="pdf"
                        meta={deletedCount > 0 ? 'Deleted' : 'Added Nov 12'}
                        removal="delete"
                        onRemove={() => setDeletedCount((n) => n + 1)}
                    />
                </div>
            );
        };
        return <Demo />;
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const docBody = within(canvasElement.ownerDocument.body);
        await expect(heightOf(rowOf(canvasElement))).toBe(56);

        const trigger = canvas.getByRole('button', { name: 'Delete signed_consent.pdf' });
        await expect(canvasElement.querySelector('.fa-trash-can')).toBeInTheDocument();

        // Clicking trash opens confirmation without calling onRemove yet.
        await userEvent.click(trigger);
        await expect(await docBody.findByRole('dialog')).toBeInTheDocument();
        await expect(canvas.getByText('Added Nov 12')).toBeInTheDocument();

        // Cancel dismisses without deleting.
        await userEvent.click(docBody.getByRole('button', { name: 'Cancel' }));
        await waitFor(() => expect(docBody.queryByRole('dialog')).toBeNull());
        await expect(canvas.getByText('Added Nov 12')).toBeInTheDocument();

        // Confirming Delete invokes onRemove while keeping 56px height.
        await userEvent.click(trigger);
        await docBody.findByRole('dialog');
        await userEvent.click(docBody.getByRole('button', { name: 'Delete' }));
        await expect(canvas.getByText('Deleted')).toBeInTheDocument();
        await expect(heightOf(rowOf(canvasElement))).toBe(56);
    },
};

export const ErrorWithRetry = {
    render: () => {
        const Demo = () => {
            const [retried, setRetried] = useState(false);
            return (
                <div style={wrap}>
                    <FileItem
                        name="zoom_0.mp4"
                        status={retried ? 'uploading' : 'error'}
                        progress={retried ? 12 : undefined}
                        error="Connection dropped during upload. Check your network and retry."
                        removal="remove"
                        onRetry={() => setRetried(true)}
                    />
                </div>
            );
        };
        return <Demo />;
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(heightOf(rowOf(canvasElement))).toBe(56);

        const errorText = canvas.getByText('Connection dropped during upload. Check your network and retry.');
        await expect(getComputedStyle(errorText).color).toBe(tokenColor(canvasElement, '--ds-text-danger'));

        const retryBtn = canvas.getByRole('button', { name: 'Retry' });
        const removeBtn = canvas.getByRole('button', { name: 'Remove zoom_0.mp4' });
        await expect(Boolean(retryBtn.compareDocumentPosition(removeBtn) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);

        await userEvent.click(retryBtn);
        await expect(canvas.getByRole('progressbar', { name: 'Uploading zoom_0.mp4' })).toHaveAttribute('aria-valuenow', '12');
        await expect(heightOf(rowOf(canvasElement))).toBe(56);
    },
};

export const FolderUploading = {
    render: () => (
        <div style={wrap}>
            <FileItem
                name="Week 4 recordings"
                kind="folder"
                status="uploading"
                progress={64}
                meta="6 files"
                removal="cancel"
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(heightOf(rowOf(canvasElement))).toBe(56);
        await expect(canvas.getByRole('progressbar', { name: 'Uploading Week 4 recordings' })).toHaveAttribute('aria-valuenow', '64');
        await expect(canvas.getByText('Uploading · 64% · 6 files')).toBeInTheDocument();
    },
};

export const FolderDone = {
    render: () => (
        <div style={wrap}>
            <FileItem
                name="Week 4 recordings"
                kind="folder"
                status="done"
                meta="6 files · 142 MB"
                removal="remove"
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(heightOf(rowOf(canvasElement))).toBe(56);
        await expect(canvasElement.querySelector('.fa-folder')).toBeInTheDocument();
        await expectLead(canvasElement, { tile: true });
        await expect(canvas.getByText('6 files · 142 MB')).toBeInTheDocument();
    },
};

export const ReadOnly = {
    render: () => (
        <div style={wrap}>
            <FileItem
                name="zoom_0.mp4"
                status="done"
                fileType="video"
                meta="48.2 MB"
                href="#zoom-recording"
                isReadOnly
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(heightOf(rowOf(canvasElement))).toBe(56);
        await expect(canvas.queryAllByRole('button')).toHaveLength(0);
        await expect(canvas.getByRole('link', { name: 'zoom_0.mp4' })).toBeInTheDocument();
    },
};

export const Disabled = {
    render: () => (
        <div style={wrap}>
            <FileItem
                name="zoom_0.mp4"
                status="done"
                fileType="video"
                meta="48.2 MB"
                href="#zoom-recording"
                isDisabled
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const row = rowOf(canvasElement);
        await expect(heightOf(row)).toBe(56);
        await expect(row).toHaveAttribute('aria-disabled', 'true');
        await expectLead(canvasElement, { tile: true });
        await expect(canvas.queryAllByRole('button')).toHaveLength(0);
        await expect(canvas.queryByRole('link')).toBeNull();
        await inEveryColorModeOf(canvasElement, async () => {
            const tile = canvasElement.querySelector('.plus-file-item__start .plus-tile');
            await expect(getComputedStyle(tile).backgroundColor, 'the lead Tile takes the disabled ground').toBe(tokenColor(canvasElement, '--ds-background-disabled'));
            await expect(getComputedStyle(tile).color, 'the lead Tile icon takes the disabled color').toBe(tokenColor(canvasElement, '--ds-icon-disabled'));
        });
    },
};

/** Truncate in the middle: a long file name keeps its start and its extension, and its full name opens in a Tooltip on hover and focus. */
export const Overflow = {
    render: () => {
        const longFileName = '2026-11-12-algebra-session-recording-with-jayden-final-edited-export.mp4';
        return (
            <div style={narrowWrap}>
                <FileItem
                    name={longFileName}
                    status="done"
                    fileType="video"
                    meta="112 MB"
                    removal="remove"
                />
            </div>
        );
    },
    play: async ({ canvasElement }) => {
        const fullName = '2026-11-12-algebra-session-recording-with-jayden-final-edited-export.mp4';
        const row = rowOf(canvasElement);
        const head = canvasElement.querySelector('[data-file-item-part="name-head"]');
        const tail = canvasElement.querySelector('[data-file-item-part="name-tail"]');

        await expect(heightOf(row)).toBe(56);
        await expect(px(getComputedStyle(row).height)).toBe(56);
        await expectNoSilentClip(row);
        await expectInsideWell(row, canvasElement.firstElementChild);
        await expect(tail.textContent).toContain('.mp4');
        await expect(head.scrollWidth).toBeGreaterThan(head.clientWidth);
        await expect(tail.getBoundingClientRect().right).toBeLessThanOrEqual(row.getBoundingClientRect().right);

        await expectFullTextReachable(canvasElement, canvasElement.querySelector('.plus-file-item__name'), fullName);
    },
};

export const Interactive = {
    render: (args) => (
        <div style={wrap}>
            <FileItem {...args} />
        </div>
    ),
    args: {
        name: 'zoom_0.mp4',
        meta: '48.2 MB',
        status: 'uploading',
        progress: 64,
        error: 'Connection dropped. Check your network and retry.',
        kind: 'file',
        fileType: 'video',
        removal: 'cancel',
        href: '',
        isReadOnly: false,
        isDisabled: false,
    },
};
