import React from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import FileUpload from './FileUpload';

const formats = ['.zip', '.mp4', '.m4a', '.txt'];

export default {
    title: 'Forms/File Upload',
    component: FileUpload,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component:
                    'File upload component for selecting and uploading files. Supports various states including default, focus, disabled, error, and success validation states.',
            },
        },
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        label: {
            control: 'text',
            description: 'Label text for the file upload field',
            table: { category: 'Content' },
        },
        required: {
            control: 'boolean',
            description: 'Whether the field is required (shows red asterisk)',
            table: { category: 'Content' },
        },
        description: {
            control: 'text',
            description: 'Description text shown below the label',
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
            description: 'Text displayed on the file selection button',
            table: { category: 'Content' },
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the file upload component',
            table: { category: 'Behavior' },
        },
        validation: {
            control: 'select',
            options: ['none', 'invalid', 'success'],
            description: 'Validation state of the component',
            table: { category: 'Behavior' },
        },
        validationMessage: {
            control: 'text',
            description: 'Message displayed for validation states',
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
    <div style={{ maxWidth: '800px' }}>
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
        source: { language: 'html', code: webAppSourceSnippets.formFile }
    }
};

export const Content = () => (
    <div style={{ maxWidth: '800px' }}>
        <p className="body2-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
            Label, required asterisk, accepted formats, and button copy.
        </p>
        <FileUpload
            id="file-upload-content"
            label="Upload files"
            required
            acceptedFormats={formats}
            buttonText="Choose a file"
        />
    </div>
);

export const Styles = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">INVALID</span>
            <FileUpload
                id="file-upload-error"
                label="Upload files"
                required
                acceptedFormats={formats}
                buttonText="Choose a file"
                validation="invalid"
                validationMessage="Validation message"
            />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SUCCESS</span>
            <FileUpload
                id="file-upload-success"
                label="Upload files"
                required
                acceptedFormats={formats}
                buttonText="Choose a file"
                validation="success"
                validationMessage="Validation message"
            />
        </div>
    </div>
);

export const InteractionStates = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DEFAULT</span>
            <FileUpload
                id="file-upload-default"
                label="Upload files"
                required
                acceptedFormats={formats}
                buttonText="Choose a file"
            />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">FOCUS</span>
            <FileUpload
                id="file-upload-focus"
                label="Upload files"
                required
                acceptedFormats={formats}
                buttonText="Choose a file"
            />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DISABLED</span>
            <FileUpload
                id="file-upload-disabled"
                label="Upload files"
                required
                acceptedFormats={formats}
                buttonText="Choose a file"
                disabled
            />
        </div>
    </div>
);

export const Interactive = (args) => (
    <div style={{ maxWidth: '600px' }}>
        <FileUpload
            {...args}
            acceptedFormats={{
                mixed: formats,
                documents: ['.pdf', '.docx', '.txt'],
                media: ['.mp4', '.mov', '.mp3']
            }[args.formatPreset] || formats}
        />
    </div>
);

Interactive.args = {
    label: 'Upload files',
    required: true,
    formatPreset: 'mixed',
    buttonText: 'Choose a file',
    disabled: false,
    validation: 'none',
    validationMessage: '',
};
