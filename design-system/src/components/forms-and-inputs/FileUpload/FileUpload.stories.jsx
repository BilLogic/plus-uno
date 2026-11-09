import React from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { expect, userEvent, within } from 'storybook/test';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';
import FileUpload from './FileUpload';
import { iconClass } from '../../../lib/icon';
import { DemoLabel } from '@/storybook-docs/lib/pattern-demo';

const formats = ['.zip', '.mp4', '.m4a', '.txt'];

export default {
    title: 'Components/Forms and inputs/File upload',
    component: FileUpload,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'File upload component for selecting and uploading files. Supports various states including default, focus, disabled, read-only, invalid, and valid states.',
            },
        },
    },
    argTypes: {
        children: {
            control: false,
            table: { category: 'Content' },
        },
        onClick: { table: { disable: true } },
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
        formatPreset: {
            control: 'select',
            options: ['mixed', 'documents', 'media'],
            description: 'Preset accepted file formats for the interactive demo',
            table: { category: 'Content' },
        },
        buttonText: {
            control: 'text',
            table: { category: 'Content' },
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
        source: { language: 'jsx', code: webAppSourceSnippets.formFile }
    }
};

export const Content = () => (
    <div style={{ maxWidth: 'var(--size-5400)' }}>
        <p className="body-default mb-3" style={{ color: 'var(--ds-text-subtle)' }}>
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

export const ReadOnly = () => (
    <div style={{ maxWidth: 'var(--size-4000)' }}>
        <p className="body-default mb-3" style={{ color: 'var(--ds-text-subtle)' }}>
            Read-only shows the field and the files already chosen, with no button to choose another.
        </p>
        <FileUpload
            id="file-upload-read-only"
            label="Session recording"
            description="Uploaded by the tutor after the session."
            isReadOnly
        >
            <div
                className="body-default"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--stack-md)',
                    padding: 'var(--space-025) 0',
                    color: 'var(--ds-text)',
                }}
            >
                <i className={iconClass('file')} aria-hidden="true" style={{ color: 'var(--ds-icon-subtle)' }} />
                zoom_0.mp4
            </div>
        </FileUpload>
    </div>
);

export const WithFiles = () => (
    <div style={{ maxWidth: 'var(--size-4000)' }}>
        <p className="body-default mb-3" style={{ color: 'var(--ds-text-subtle)' }}>
            Pass the chosen files as children. They sit below the button, outside the frame, as on the post-session recording upload.
        </p>
        <FileUpload
            id="file-upload-with-files"
            label="Upload session recording"
            isRequired
            description="Upload this session’s Zoom recording. Single files and .zip work too."
            buttonText="Choose a file"
        >
            {['zoom_0.mp4', 'audio_only.m4a', 'chat.txt'].map((file) => (
                <div
                    key={file}
                    className="body-default"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--stack-md)',
                        padding: 'var(--space-025) 0',
                        color: 'var(--ds-text)',
                    }}
                >
                    <i className={iconClass('file')} aria-hidden="true" style={{ color: 'var(--ds-icon-subtle)' }} />
                    {file}
                </div>
            ))}
        </FileUpload>
    </div>
);

// `formatPreset` is this story's own control, not a FileUpload prop: it picks
// the accepted formats and stays out of the component's props.
export const Interactive = ({ formatPreset, ...args }) => (
    <div style={{ maxWidth: 'var(--size-4000)' }}>
        <FileUpload
            {...args}
            acceptedFormats={{
                mixed: formats,
                documents: ['.pdf', '.docx', '.txt'],
                media: ['.mp4', '.mov', '.mp3']
            }[formatPreset] || formats}
        />
    </div>
);

Interactive.args = {
    label: 'Upload files',
    isRequired: true,
    formatPreset: 'mixed',
    buttonText: 'Choose a file',
    isDisabled: false,
    isReadOnly: false,
    validation: 'none',
    validationMessage: '',
};

/** One story per state, for the Examples tab. */
const wrap = { maxWidth: 'var(--size-4000)' };
const fileInput = (canvasElement) => canvasElement.querySelector('input[type="file"]');
const container = (canvasElement) => canvasElement.querySelector('.plus-file-upload-container');

export const Default = {
    render: () => (
        <div style={wrap}>
            <FileUpload id="file-upload-ex-default" label="Upload files" acceptedFormats={formats} buttonText="Choose a file" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expect(fileInput(canvasElement)).toHaveAttribute('accept', formats.join(','));
        await expect(within(canvasElement).getByRole('button', { name: 'Choose a file' })).toBeEnabled();
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
            <FileUpload id="file-upload-ex-disabled" label="Upload files" acceptedFormats={formats} buttonText="Choose a file" isDisabled />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expect(fileInput(canvasElement)).toBeDisabled();
        await expect(within(canvasElement).getByRole('button', { name: 'Choose a file' })).toBeDisabled();
        await expect(container(canvasElement)).toHaveClass('plus-file-upload-disabled');
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
