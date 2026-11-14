import React, { useEffect, useRef, useState } from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { expect, fireEvent, userEvent, within } from 'storybook/test';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { FileItem } from '@/components';
import FileUpload from './FileUpload';
import { DemoLabel } from '@/storybook-docs/lib/pattern-demo';

const formats = ['.zip', '.mp4', '.m4a', '.txt'];

export default {
    title: 'Components/Forms and inputs/File upload/File upload',
    component: FileUpload,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'File upload drop zone and picker for choosing files or folders, displaying batch upload status in the label row and chosen FileItem rows below the drop zone.',
            },
        },
    },
    argTypes: {
        children: {
            control: false,
            table: { category: 'Content' },
        },
        onChange: { table: { disable: true } },
        onDrop: { table: { disable: true } },
        onFocus: { table: { disable: true } },
        onBlur: { table: { disable: true } },
        style: { table: { disable: true } },
        label: {
            control: 'text',
            table: { category: 'Content' },
        },
        isRequired: {
            control: 'boolean',
            table: { category: 'Content' },
        },
        description: {
            control: 'text',
            table: { category: 'Content' },
        },
        buttonText: {
            control: 'text',
            table: { category: 'Content' },
        },
        allowFolders: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
        isDisabled: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
        isReadOnly: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
        validation: {
            control: 'select',
            options: ['none', 'invalid', 'valid'],
            table: { category: 'Behavior' },
        },
        validationMessage: {
            control: 'text',
            table: { category: 'Behavior' },
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        name: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        acceptedFormats: {
            table: { disable: true, category: 'Development' },
        },
    },
};

export const Overview = () => (
    <div style={{ maxWidth: 'var(--size-5400)' }}>
        <FileUpload
            id="file-upload-overview"
            label="Upload files"
            acceptedFormats={formats}
            buttonText="Choose a file"
        />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.formFile },
    },
};

export const Content = () => (
    <div style={{ maxWidth: 'var(--size-5400)' }}>
        <p className="body-default" style={{ color: 'var(--ds-text-subtle)', marginBottom: 'var(--section-stack-md)' }}>
            Label, required asterisk, accepted formats, and button copy.
        </p>
        <FileUpload
            id="file-upload-content"
            label="Upload files"
            isRequired
            acceptedFormats={formats}
            buttonText="Choose a file"
        />
    </div>
);

export const Styles = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-150)', maxWidth: 'var(--size-5400)' }}>
        <div>
            <DemoLabel>INVALID</DemoLabel>
            <FileUpload
                id="file-upload-error"
                label="Upload files"
                isRequired
                acceptedFormats={formats}
                buttonText="Choose a file"
                validation="invalid"
                validationMessage="Validation message"
            />
        </div>
        <div>
            <DemoLabel>VALID</DemoLabel>
            <FileUpload
                id="file-upload-valid"
                label="Upload files"
                isRequired
                acceptedFormats={formats}
                buttonText="Choose a file"
                validation="valid"
                validationMessage="Validation message"
            />
        </div>
    </div>
);

export const InteractionStates = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-150)', maxWidth: 'var(--size-5400)' }}>
        <div>
            <DemoLabel>DEFAULT</DemoLabel>
            <FileUpload
                id="file-upload-default"
                label="Upload files"
                isRequired
                acceptedFormats={formats}
                buttonText="Choose a file"
            />
        </div>
        <div>
            <DemoLabel>FOCUS</DemoLabel>
            <FileUpload
                id="file-upload-focus"
                label="Upload files"
                isRequired
                acceptedFormats={formats}
                buttonText="Choose a file"
            />
        </div>
        <div>
            <DemoLabel>DISABLED</DemoLabel>
            <FileUpload
                id="file-upload-disabled"
                label="Upload files"
                isRequired
                acceptedFormats={formats}
                buttonText="Choose a file"
                isDisabled
            />
        </div>
    </div>
);

const wrap = { maxWidth: 'var(--size-4000)' };
const fileInput = (canvasElement) => canvasElement.querySelector('input[type="file"]:not([webkitdirectory])');
const container = (canvasElement) => canvasElement.querySelector('.plus-file-upload-container');

export const Default = {
    render: () => (
        <div style={wrap}>
            <FileUpload
                id="file-upload-ex-default"
                label="Upload files"
                acceptedFormats={formats}
                buttonText="Choose a file"
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expect(fileInput(canvasElement)).toHaveAttribute('accept', formats.join(','));
        await expect(within(canvasElement).getByRole('button', { name: 'Choose a file' })).toBeEnabled();
    },
};

export const AllowFolders = {
    render: () => {
        const Demo = () => {
            const [items, setItems] = useState([
                { id: 'folder-1', name: 'Week 4 recordings', kind: 'folder', status: 'done', meta: '6 files · 142 MB' },
                { id: 'zip-1', name: 'session_export.zip', kind: 'file', fileType: 'archive', status: 'done', meta: '38.4 MB' },
            ]);

            const handleDrop = (event) => {
                const droppedEntries = Array.from(event.dataTransfer?.items ?? [])
                    .map((item) => item.webkitGetAsEntry?.())
                    .filter(Boolean);

                if (droppedEntries.some((entry) => entry.isDirectory)) {
                    const next = droppedEntries.map((entry, idx) => (
                        entry.isDirectory
                            ? {
                                id: `drop-folder-${Date.now()}-${idx}`,
                                name: entry.name,
                                kind: 'folder',
                                status: 'done',
                                meta: `${entry.fileCount ?? 4} files`,
                            }
                            : {
                                id: `drop-file-${Date.now()}-${idx}`,
                                name: entry.name,
                                kind: 'file',
                                status: 'done',
                                meta: 'Uploaded',
                            }
                    ));
                    setItems((prev) => [...prev, ...next]);
                    return;
                }

                const files = Array.from(event.dataTransfer?.files ?? []);
                if (files.length > 0) {
                    setItems((prev) => [
                        ...prev,
                        ...files.map((f, idx) => ({
                            id: `drop-${Date.now()}-${idx}`,
                            name: f.name,
                            kind: 'file',
                            status: 'done',
                            meta: 'Uploaded',
                        })),
                    ]);
                }
            };

            const handleChange = (event) => {
                const files = Array.from(event.target?.files ?? []);
                if (files.length === 0) return;
                const relativeRoot = files[0]?.webkitRelativePath?.split('/')[0];
                if (relativeRoot) {
                    setItems((prev) => [
                        ...prev,
                        {
                            id: `folder-${Date.now()}`,
                            name: relativeRoot,
                            kind: 'folder',
                            status: 'done',
                            meta: `${files.length} files`,
                        },
                    ]);
                    return;
                }
                setItems((prev) => [
                    ...prev,
                    ...files.map((f, idx) => ({
                        id: `file-${Date.now()}-${idx}`,
                        name: f.name,
                        kind: 'file',
                        status: 'done',
                        meta: 'Uploaded',
                    })),
                ]);
            };

            return (
                <div style={wrap}>
                    <FileUpload
                        id="file-upload-allow-folders"
                        label="Session recordings"
                        description="Upload Zoom recordings, a folder of recordings, or a .zip export."
                        acceptedFormats={formats}
                        allowFolders
                        onDrop={handleDrop}
                        onChange={handleChange}
                    >
                        {items.map((item) => (
                            <FileItem
                                key={item.id}
                                name={item.name}
                                kind={item.kind}
                                fileType={item.fileType}
                                status={item.status}
                                meta={item.meta}
                                removal="remove"
                                onRemove={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
                            />
                        ))}
                    </FileUpload>
                </div>
            );
        };
        return <Demo />;
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvasElement.textContent).toContain('Choose files or a folder, or drop them here');
        await expect(canvas.getByRole('button', { name: 'Choose files' })).toBeEnabled();
        await expect(canvas.getByRole('button', { name: 'a folder' })).toBeEnabled();
        await expect(canvasElement.querySelector('input[type="file"][webkitdirectory]')).toBeInTheDocument();

        // Dropping a folder adds a single folder row.
        const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
        Object.defineProperty(dropEvent, 'dataTransfer', {
            value: {
                items: [
                    {
                        webkitGetAsEntry: () => ({
                            isDirectory: true,
                            name: 'Week 5 recordings',
                            fileCount: 3,
                        }),
                    },
                ],
                files: [],
            },
        });
        container(canvasElement).dispatchEvent(dropEvent);
        await expect(await canvas.findByText('Week 5 recordings')).toBeInTheDocument();
        await expect(canvas.getByText('3 files')).toBeInTheDocument();
    },
};

export const WithFiles = {
    render: () => (
        <div style={wrap}>
            <FileUpload
                id="file-upload-with-files"
                label="Upload session recording"
                isRequired
                description="Upload this session’s Zoom recording. Single files and .zip work too."
                acceptedFormats={formats}
                buttonText="Choose a file"
            >
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
                    name="chat.txt"
                    status="queued"
                    removal="cancel"
                />
                <FileItem
                    name="raw_capture.mp4"
                    status="error"
                    error="That file is over 500 MB. Trim or compress it and retry."
                    removal="remove"
                />
            </FileUpload>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const rows = canvasElement.querySelectorAll('.plus-file-item');
        await expect(rows.length).toBe(4);
        for (const row of rows) {
            await expect(Math.round(row.getBoundingClientRect().height)).toBe(56);
        }
        await expect(canvas.getByText('Uploading 2 of 4')).toBeInTheDocument();
    },
};

export const UploadingBatch = {
    render: () => (
        <div style={wrap}>
            <FileUpload
                id="file-upload-batch"
                label="Session recordings"
                description="MP4, M4A, TXT or ZIP, up to 500 MB per file."
                acceptedFormats={formats}
                allowFolders
            >
                <FileItem name="session_1_zoom.mp4" status="done" fileType="video" meta="42.1 MB" />
                <FileItem name="session_2_zoom.mp4" status="uploading" progress={64} />
                <FileItem name="session_3_zoom.mp4" status="queued" />
                <FileItem name="session_4_zoom.mp4" status="queued" />
                <FileItem name="session_5_zoom.mp4" status="queued" />
                <FileItem name="session_6_zoom.mp4" status="queued" />
            </FileUpload>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Uploading 2 of 6')).toBeInTheDocument();
        const bars = canvas.getAllByRole('progressbar');
        await expect(bars).toHaveLength(1);
        await expect(bars[0]).toHaveAttribute('aria-label', 'Uploading session_2_zoom.mp4');
    },
};

export const DragOver = {
    render: () => {
        const Demo = () => {
            const rootRef = useRef(null);
            useEffect(() => {
                const dropZone = rootRef.current?.querySelector('.plus-file-upload-container');
                if (dropZone) {
                    fireEvent.dragEnter(dropZone);
                }
            }, []);
            return (
                <div ref={rootRef} style={wrap}>
                    <FileUpload
                        id="file-upload-drag-over"
                        label="Session recordings"
                        description="MP4, M4A, TXT or ZIP, up to 500 MB."
                        acceptedFormats={formats}
                        allowFolders
                    />
                </div>
            );
        };
        return <Demo />;
    },
    play: async ({ canvasElement }) => {
        const zone = container(canvasElement);
        zone.style.transition = 'none';
        fireEvent.dragEnter(zone);
        await expect(zone).toHaveClass('plus-file-upload-drag-over');
        await expect(getComputedStyle(zone).borderTopColor).toBe(tokenColor(canvasElement, '--ds-border-brand'));
    },
};

export const ReadOnly = {
    render: () => (
        <div style={wrap}>
            <FileUpload
                id="file-upload-read-only"
                label="Session recording"
                description="Uploaded by the tutor after the session."
                isReadOnly
            >
                <FileItem
                    name="zoom_0.mp4"
                    status="done"
                    fileType="video"
                    meta="48.2 MB"
                    href="#zoom-recording"
                />
            </FileUpload>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryAllByRole('button')).toHaveLength(0);
        await expect(container(canvasElement)).toHaveClass('plus-file-upload-readonly');
    },
};

export const Required = {
    render: () => (
        <div style={wrap}>
            <FileUpload id="file-upload-ex-required" label="Upload files" isRequired acceptedFormats={formats} buttonText="Choose a file" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelector('[aria-label="required"]')).toBeInTheDocument();
    },
};

export const Invalid = {
    render: () => (
        <div style={wrap}>
            <FileUpload
                id="file-upload-ex-invalid"
                label="Upload files"
                acceptedFormats={formats}
                buttonText="Choose a file"
                validation="invalid"
                validationMessage="That file is too large. Choose one under 10 MB."
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expect(fileInput(canvasElement)).toHaveAttribute('aria-invalid', 'true');
        const message = within(canvasElement).getByText('That file is too large. Choose one under 10 MB.');
        await expect(getComputedStyle(message.closest('.plus-file-upload-validation')).color).toBe(tokenColor(canvasElement, '--ds-text-danger'));
    },
};

export const Valid = {
    render: () => (
        <div style={wrap}>
            <FileUpload
                id="file-upload-ex-valid"
                label="Upload files"
                acceptedFormats={formats}
                buttonText="Choose a file"
                validation="valid"
                validationMessage="File added."
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const message = within(canvasElement).getByText('File added.');
        await expect(getComputedStyle(message.closest('.plus-file-upload-validation')).color).toBe(tokenColor(canvasElement, '--ds-text-success'));
    },
};

export const Disabled = {
    render: () => (
        <div style={wrap}>
            <FileUpload
                id="file-upload-ex-disabled"
                label="Upload files"
                acceptedFormats={formats}
                buttonText="Choose a file"
                isDisabled
            >
                <FileItem name="zoom_0.mp4" status="done" fileType="video" meta="48.2 MB" />
            </FileUpload>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(fileInput(canvasElement)).toBeDisabled();
        await expect(canvas.getByRole('button', { name: 'Choose a file' })).toBeDisabled();
        await expect(container(canvasElement)).toHaveClass('plus-file-upload-disabled');
        await expect(canvas.queryByRole('button', { name: /remove/i })).toBeNull();
    },
};

/** Focusing the field outlines the whole container with the focus ring. */
export const KeyboardFocus = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={wrap}>
            <FileUpload id="file-upload-ex-focus" label="Upload files" acceptedFormats={formats} buttonText="Choose a file" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        container(canvasElement).style.transition = 'none';
        await userEvent.tab();
        await expect(container(canvasElement)).toHaveClass('plus-file-upload-focused');
        await expect(getComputedStyle(container(canvasElement)).boxShadow).toContain(tokenColor(canvasElement, '--ds-border-focused'));
    },
};

/** An invalid field keeps its danger border and still draws the focus ring. */
export const InvalidFocus = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={wrap}>
            <FileUpload
                id="file-upload-ex-invalid-focus"
                label="Upload files"
                acceptedFormats={formats}
                buttonText="Choose a file"
                validation="invalid"
                validationMessage="Choose a smaller file."
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        container(canvasElement).style.transition = 'none';
        await userEvent.tab();
        const style = getComputedStyle(container(canvasElement));
        await expect(style.boxShadow).toContain(tokenColor(canvasElement, '--ds-border-focused'));
        await expect(style.borderTopColor).toBe(tokenColor(canvasElement, '--ds-border-danger'));
    },
};

export const Interactive = (args) => (
    <div style={wrap}>
        <FileUpload
            {...args}
            acceptedFormats={formats}
        />
    </div>
);

Interactive.args = {
    label: 'Upload files',
    isRequired: true,
    description: '',
    buttonText: 'Choose a file',
    allowFolders: false,
    isDisabled: false,
    isReadOnly: false,
    validation: 'none',
    validationMessage: '',
};

const radiusOf = (root, selector) => getComputedStyle(root.querySelector(selector)).borderTopLeftRadius;
Overview.play = async ({ canvasElement }) => {
    await expect(radiusOf(canvasElement, '.plus-file-upload-container'), 'Drop zone radius is 12').toBe('12px');
};
