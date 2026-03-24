import React from 'react';
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
        acceptedFormats: {
            control: 'object',
            description: 'Array of accepted file formats (e.g., [".zip", ".mp4"])',
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
            control: 'text',
            description: 'HTML ID attribute',
            table: { category: 'Development' },
        },
        className: {
            control: 'text',
            description: 'Additional CSS classes',
            table: { category: 'Development' },
        },
    },
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
        <FileUpload
            id="file-upload-error"
            label="Upload files"
            required
            acceptedFormats={formats}
            buttonText="Choose a file"
            validation="invalid"
            validationMessage="Validation message"
        />
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
);

export const InteractionStates = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
        <FileUpload
            id="file-upload-default"
            label="Upload files"
            required
            acceptedFormats={formats}
            buttonText="Choose a file"
        />
        <FileUpload
            id="file-upload-focus"
            label="Upload files"
            required
            acceptedFormats={formats}
            buttonText="Choose a file"
            onFocus={() => {}}
        />
        <FileUpload
            id="file-upload-disabled"
            label="Upload files"
            required
            acceptedFormats={formats}
            buttonText="Choose a file"
            disabled
        />
    </div>
);

export const Interactive = (args) => (
    <div style={{ maxWidth: '600px' }}>
        <FileUpload {...args} />
    </div>
);

Interactive.args = {
    id: 'file-upload-interactive',
    label: 'Upload files',
    required: true,
    acceptedFormats: formats,
    buttonText: 'Choose a file',
    disabled: false,
    validation: 'none',
    validationMessage: '',
};
