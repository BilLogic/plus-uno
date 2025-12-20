import React from 'react';
import FileUpload from './FileUpload';

export default {
    title: 'Forms/File Upload',
    component: FileUpload,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'File upload component for selecting and uploading files. Supports various states including default, focus, disabled, error, and success validation states.'
            }
        }
    },
    argTypes: {
        label: {
            control: 'text',
            description: 'Label text for the file upload field',
            table: { category: 'Content' }
        },
        required: {
            control: 'boolean',
            description: 'Whether the field is required (shows red asterisk)',
            table: { category: 'Content' }
        },
        description: {
            control: 'text',
            description: 'Description text shown below the label',
            table: { category: 'Content' }
        },
        acceptedFormats: {
            control: 'object',
            description: 'Array of accepted file formats (e.g., [".zip", ".mp4"])',
            table: { category: 'Content' }
        },
        buttonText: {
            control: 'text',
            description: 'Text displayed on the file selection button',
            table: { category: 'Content' }
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the file upload component',
            table: { category: 'Behavior' }
        },
        validation: {
            control: 'select',
            options: ['none', 'invalid', 'success'],
            description: 'Validation state of the component',
            table: { category: 'Behavior' }
        },
        validationMessage: {
            control: 'text',
            description: 'Message displayed for validation states',
            table: { category: 'Behavior' }
        },
        id: {
            control: 'text',
            description: 'HTML ID attribute',
            table: { category: 'Development' }
        },
        className: {
            control: 'text',
            description: 'Additional CSS classes',
            table: { category: 'Development' }
        }
    }
};

/**
 * Overview
 * Comprehensive view of File Upload configurations matching Figma specifications.
 */
export const Overview = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' }}>
            {/* Default State */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Default</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Default file upload component with label, description, and file selection button.
                </p>
                <FileUpload
                    id="file-upload-default"
                    label="Upload files"
                    required
                    acceptedFormats={['.zip', '.mp4', '.m4a', '.txt']}
                    buttonText="Choose a file"
                />
            </section>

            {/* Focus/Hover State */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Focus</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    File upload component in focused state with primary border highlight.
                </p>
                <FileUpload
                    id="file-upload-focus"
                    label="Upload files"
                    required
                    acceptedFormats={['.zip', '.mp4', '.m4a', '.txt']}
                    buttonText="Choose a file"
                    onFocus={() => {}}
                />
            </section>

            {/* Disabled State */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Disabled</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Disabled file upload component with greyed out text and non-interactive button.
                </p>
                <FileUpload
                    id="file-upload-disabled"
                    label="Upload files"
                    required
                    acceptedFormats={['.zip', '.mp4', '.m4a', '.txt']}
                    buttonText="Choose a file"
                    disabled
                />
            </section>

            {/* Error State */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Error</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    File upload component in error state with red border and validation message.
                </p>
                <FileUpload
                    id="file-upload-error"
                    label="Upload files"
                    required
                    acceptedFormats={['.zip', '.mp4', '.m4a', '.txt']}
                    buttonText="Choose a file"
                    validation="invalid"
                    validationMessage="Validation message"
                />
            </section>

            {/* Success State */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Success</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    File upload component in success state with green border and validation message.
                </p>
                <FileUpload
                    id="file-upload-success"
                    label="Upload files"
                    required
                    acceptedFormats={['.zip', '.mp4', '.m4a', '.txt']}
                    buttonText="Choose a file"
                    validation="success"
                    validationMessage="Validation message"
                />
            </section>
        </div>
    );
};

/**
 * Interactive
 * Interactive example with controls for all props.
 */
export const Interactive = (args) => {
    return (
        <div style={{ maxWidth: '600px' }}>
            <FileUpload {...args} />
        </div>
    );
};

Interactive.args = {
    id: 'file-upload-interactive',
    label: 'Upload files',
    required: true,
    acceptedFormats: ['.zip', '.mp4', '.m4a', '.txt'],
    buttonText: 'Choose a file',
    disabled: false,
    validation: 'none',
    validationMessage: ''
};
