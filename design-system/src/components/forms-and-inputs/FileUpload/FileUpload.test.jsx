import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FileUpload from './FileUpload';

vi.mock('@fortawesome/fontawesome-free', () => ({}));

describe('FileUpload', () => {
    it('renders children as the uploaded-file list below the button', () => {
        const { container } = render(
            <FileUpload label="Recording">
                <span>zoom_0.mp4</span>
            </FileUpload>
        );
        const files = container.querySelector('.plus-file-upload-files');
        expect(files).toContainElement(screen.getByText('zoom_0.mp4'));
        const button = screen.getByRole('button', { name: 'Choose a file' });
        expect(button.compareDocumentPosition(files) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('renders no file list without children', () => {
        const { container } = render(<FileUpload label="Recording" />);
        expect(container.querySelector('.plus-file-upload-files')).toBeNull();
    });

    it('frames the description and button, not the label, file list or message', () => {
        const { container } = render(
            <FileUpload
                label="Recording"
                description="PDF, up to 10 MB"
                validation="invalid"
                validationMessage="Too large"
            >
                <span>big.pdf</span>
            </FileUpload>
        );
        const field = container.querySelector('.plus-file-upload-container');
        expect(field).toHaveClass('plus-file-upload-invalid');
        expect(field).toContainElement(screen.getByText('PDF, up to 10 MB'));
        expect(field).toContainElement(screen.getByRole('button', { name: 'Choose a file' }));
        expect(field).not.toContainElement(screen.getByText('Recording'));
        expect(field).not.toContainElement(screen.getByText('big.pdf'));
        expect(field).not.toContainElement(screen.getByText('Too large'));
    });

    it('shows the description only when one is given', () => {
        const { container } = render(<FileUpload label="Recording" />);
        expect(container.querySelector('.plus-file-upload-description')).toBeNull();
    });

    it('marks a valid field and its message as valid', () => {
        const { container } = render(
            <FileUpload label="Recording" validation="valid" validationMessage="Looks good" />
        );
        expect(container.querySelector('.plus-file-upload-container')).toHaveClass('plus-file-upload-valid');
        expect(screen.getByText('Looks good').parentElement).toHaveClass('plus-file-upload-validation-valid');
        expect(screen.getByRole('button', { name: 'Choose a file' })).toBeEnabled();
    });

    it('shows the files but offers no way to choose one when read-only', () => {
        const onChange = vi.fn();
        const { container } = render(
            <FileUpload label="Recording" isReadOnly onChange={onChange}>
                <span>zoom_0.mp4</span>
            </FileUpload>
        );
        expect(screen.queryByRole('button', { name: 'Choose a file' })).toBeNull();
        expect(container.querySelector('.plus-file-upload-container')).toHaveClass('plus-file-upload-readonly');
        expect(container.querySelector('input[type="file"]')).toHaveAttribute('aria-readonly', 'true');
        expect(screen.getByText('zoom_0.mp4')).toBeInTheDocument();
    });

    it('keeps a read-only field in the tab order and does not open the picker', () => {
        const { container } = render(<FileUpload label="Recording" isReadOnly />);
        const input = container.querySelector('input[type="file"]');
        expect(input.tabIndex).toBeGreaterThanOrEqual(0);
        expect(input).not.toBeDisabled();
        const pressed = fireEvent.keyDown(input, { key: 'Enter' });
        expect(pressed).toBe(false);
    });

    it('labels the file input with a plain label element', () => {
        render(<FileUpload id="rec" label="Recording" />);
        const label = screen.getByText('Recording');
        expect(label.tagName).toBe('LABEL');
        expect(label).toHaveAttribute('for', 'rec');
        expect(label).not.toHaveClass('form-label');
    });
});
