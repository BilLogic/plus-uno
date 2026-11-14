import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FileItem from './FileItem';

vi.mock('@fortawesome/fontawesome-free', () => ({}));

describe('FileItem', () => {
    it('renders queued status with a clock icon, "Waiting" meta, and a Cancel X button', () => {
        const onRemove = vi.fn();
        const { container } = render(
            <FileItem name="zoom_0.mp4" status="queued" onRemove={onRemove} />
        );

        expect(screen.getByText('zoom_0.mp4')).toBeInTheDocument();
        expect(screen.getByText('Waiting')).toBeInTheDocument();
        expect(container.querySelector('.fa-clock')).toBeInTheDocument();

        const cancelBtn = screen.getByRole('button', { name: 'Cancel zoom_0.mp4' });
        fireEvent.click(cancelBtn);
        expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('renders uploading status with ProgressRing, "Uploading · <n>%" meta, and Cancel X', () => {
        const onRemove = vi.fn();
        render(
            <FileItem
                name="zoom_0.mp4"
                status="uploading"
                progress={64}
                onRemove={onRemove}
            />
        );

        const ring = screen.getByRole('progressbar', { name: 'Uploading zoom_0.mp4' });
        expect(ring).toHaveAttribute('aria-valuenow', '64');
        expect(screen.getByText('Uploading · 64%')).toBeInTheDocument();

        const cancelBtn = screen.getByRole('button', { name: 'Cancel zoom_0.mp4' });
        fireEvent.click(cancelBtn);
        expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('renders done status with file-type icon, meta, optional href link, and Remove X', () => {
        const onRemove = vi.fn();
        const { container } = render(
            <FileItem
                name="session-notes.pdf"
                status="done"
                fileType="pdf"
                meta="2.4 MB"
                href="/files/session-notes.pdf"
                removal="remove"
                onRemove={onRemove}
            />
        );

        expect(container.querySelector('.fa-file-pdf')).toBeInTheDocument();
        expect(screen.getByText('2.4 MB')).toBeInTheDocument();

        const link = screen.getByRole('link', { name: 'session-notes.pdf' });
        expect(link).toHaveAttribute('href', '/files/session-notes.pdf');

        const removeBtn = screen.getByRole('button', { name: 'Remove session-notes.pdf' });
        fireEvent.click(removeBtn);
        expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('falls back to "Uploaded" meta when done and meta is omitted, and ignores href while not done', () => {
        render(
            <FileItem
                name="zoom_0.mp4"
                status="uploading"
                progress={20}
                href="/files/zoom_0.mp4"
            />
        );
        expect(screen.queryByRole('link')).toBeNull();

        render(<FileItem name="chat.txt" status="done" />);
        expect(screen.getByText('Uploaded')).toBeInTheDocument();
    });

    it('uses trash icon for removal="delete" and asks for confirmation before calling onRemove', async () => {
        const onRemove = vi.fn();
        const { container } = render(
            <FileItem
                name="signed-consent.pdf"
                status="done"
                meta="Added Nov 12"
                removal="delete"
                onRemove={onRemove}
            />
        );

        const deleteTrigger = screen.getByRole('button', { name: 'Delete signed-consent.pdf' });
        expect(container.querySelector('.fa-trash-can')).toBeInTheDocument();

        fireEvent.click(deleteTrigger);
        expect(onRemove).not.toHaveBeenCalled();

        const dialog = await screen.findByRole('dialog');
        expect(dialog).toBeInTheDocument();

        // Cancel closes without calling onRemove
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onRemove).not.toHaveBeenCalled();
        await waitFor(() => {
            expect(screen.queryByRole('dialog')).toBeNull();
        });

        // Re-open and confirm Delete
        fireEvent.click(deleteTrigger);
        await screen.findByRole('dialog');
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
        expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('renders error status with danger icon, error message, and Retry before X', () => {
        const onRetry = vi.fn();
        const onRemove = vi.fn();
        render(
            <FileItem
                name="recording.mp4"
                status="error"
                error="Connection dropped. Check your network and retry."
                onRetry={onRetry}
                onRemove={onRemove}
            />
        );

        expect(screen.getByText('Connection dropped. Check your network and retry.')).toBeInTheDocument();

        const retryBtn = screen.getByRole('button', { name: 'Retry' });
        const removeBtn = screen.getByRole('button', { name: 'Remove recording.mp4' });
        expect(
            retryBtn.compareDocumentPosition(removeBtn) & Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();

        fireEvent.click(retryBtn);
        expect(onRetry).toHaveBeenCalledTimes(1);

        fireEvent.click(removeBtn);
        expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('renders folder kind with folder icon when done, ProgressRing when uploading, and count in meta', () => {
        const { container, rerender } = render(
            <FileItem
                name="Week 4 recordings"
                kind="folder"
                status="uploading"
                progress={40}
                meta="6 files"
            />
        );

        expect(screen.getByRole('progressbar', { name: 'Uploading Week 4 recordings' })).toHaveAttribute('aria-valuenow', '40');
        expect(screen.getByText(/Uploading · 40%/)).toBeInTheDocument();
        expect(screen.getByText(/6 files/)).toBeInTheDocument();

        rerender(
            <FileItem
                name="Week 4 recordings"
                kind="folder"
                status="done"
                meta="6 files · 142 MB"
            />
        );

        expect(container.querySelector('.fa-folder')).toBeInTheDocument();
        expect(screen.getByText('6 files · 142 MB')).toBeInTheDocument();
    });

    it('preserves the file extension in a non-shrinking tail for middle truncation and provides a tooltip', async () => {
        const longName = '2026-11-12-algebra-session-recording-with-jayden-final.mp4';
        const { container } = render(
            <FileItem name={longName} status="done" meta="48 MB" />
        );

        expect(screen.getByText(longName)).toBeInTheDocument();
        const tail = container.querySelector('[data-file-item-part="name-tail"]');
        expect(tail?.textContent).toContain('.mp4');
    });

    it('draws no end action when read-only or disabled, and marks disabled rows', () => {
        const onRemove = vi.fn();
        const onRetry = vi.fn();
        const { rerender } = render(
            <FileItem
                name="zoom_0.mp4"
                status="error"
                error="Timed out. Try again."
                isReadOnly
                onRemove={onRemove}
                onRetry={onRetry}
            />
        );

        expect(screen.queryAllByRole('button')).toHaveLength(0);

        rerender(
            <FileItem
                name="zoom_0.mp4"
                status="done"
                href="/files/zoom_0.mp4"
                isDisabled
                onRemove={onRemove}
            />
        );

        expect(screen.queryAllByRole('button')).toHaveLength(0);
        expect(screen.queryByRole('link')).toBeNull();
    });
});
