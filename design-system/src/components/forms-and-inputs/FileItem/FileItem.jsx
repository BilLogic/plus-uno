import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import Button from '@/components/forms-and-inputs/Button';
import IconButton from '@/components/forms-and-inputs/IconButton';
import Icon from '@/components/images-and-icons/Icon';
import ProgressRing from '@/components/loading/ProgressRing';
import Link from '@/components/navigation/Link';
import Popup from '@/components/overlays-and-layering/Popup';
import Tooltip from '@/components/overlays-and-layering/Tooltip';
import VisuallyHidden from '@/components/text-and-data-display/VisuallyHidden';
import FileUploadContext from '../_internal/FileUploadContext';
import './FileItem.scss';

export const FILE_ITEM_STATUSES = ['queued', 'uploading', 'done', 'error'];
export const FILE_ITEM_KINDS = ['file', 'folder'];
export const FILE_ITEM_REMOVALS = ['cancel', 'remove', 'delete'];

const TYPE_ICON_MAP = {
    pdf: 'file-pdf',
    video: 'file-video',
    mp4: 'file-video',
    mov: 'file-video',
    webm: 'file-video',
    mkv: 'file-video',
    avi: 'file-video',
    audio: 'file-audio',
    mp3: 'file-audio',
    m4a: 'file-audio',
    wav: 'file-audio',
    ogg: 'file-audio',
    aac: 'file-audio',
    flac: 'file-audio',
    image: 'file-image',
    png: 'file-image',
    jpg: 'file-image',
    jpeg: 'file-image',
    gif: 'file-image',
    webp: 'file-image',
    svg: 'file-image',
    bmp: 'file-image',
    archive: 'file-zipper',
    zip: 'file-zipper',
    tar: 'file-zipper',
    gz: 'file-zipper',
    rar: 'file-zipper',
    '7z': 'file-zipper',
    word: 'file-word',
    doc: 'file-word',
    docx: 'file-word',
    spreadsheet: 'file-excel',
    xls: 'file-excel',
    xlsx: 'file-excel',
    csv: 'file-excel',
    presentation: 'file-powerpoint',
    ppt: 'file-powerpoint',
    pptx: 'file-powerpoint',
    code: 'file-code',
    js: 'file-code',
    jsx: 'file-code',
    ts: 'file-code',
    tsx: 'file-code',
    json: 'file-code',
    html: 'file-code',
    css: 'file-code',
    py: 'file-code',
    text: 'file-lines',
    txt: 'file-lines',
    md: 'file-lines',
    rtf: 'file-lines',
    vtt: 'file-lines',
    srt: 'file-lines',
    file: 'file',
};

function resolveTypeIcon(fileType, name) {
    if (fileType) {
        const normalized = String(fileType).trim().toLowerCase().replace(/^\./, '');
        if (TYPE_ICON_MAP[normalized]) return TYPE_ICON_MAP[normalized];
        if (normalized.startsWith('video/')) return 'file-video';
        if (normalized.startsWith('audio/')) return 'file-audio';
        if (normalized.startsWith('image/')) return 'file-image';
        if (normalized === 'application/pdf') return 'file-pdf';
        if (normalized.includes('zip') || normalized.includes('compressed')) return 'file-zipper';
        if (normalized.startsWith('text/')) return 'file-lines';
    }
    if (typeof name === 'string') {
        const dot = name.lastIndexOf('.');
        if (dot > 0 && dot < name.length - 1) {
            const ext = name.slice(dot + 1).toLowerCase();
            if (TYPE_ICON_MAP[ext]) return TYPE_ICON_MAP[ext];
        }
    }
    return 'file';
}

/**
 * Splits a file or folder name into `[head, tail]` so CSS ellipsis on `head`
 * truncates in the middle while keeping the extension (and the last few
 * characters before it on long names) visible at the end.
 */
export function splitMiddleName(rawName, kind = 'file') {
    const text = String(rawName ?? '');
    if (!text) return { head: '', tail: '' };

    if (kind !== 'folder') {
        const dot = text.lastIndexOf('.');
        if (dot > 0 && dot < text.length - 1) {
            const stem = text.slice(0, dot);
            const ext = text.slice(dot);
            const keepFromStem = stem.length > 8 ? 4 : 0;
            return {
                head: keepFromStem > 0 ? stem.slice(0, -keepFromStem) : stem,
                tail: (keepFromStem > 0 ? stem.slice(-keepFromStem) : '') + ext,
            };
        }
    }

    if (text.length > 16) {
        return { head: text.slice(0, -6), tail: text.slice(-6) };
    }
    return { head: text, tail: '' };
}

/**
 * `FileItem` — one 56px row representing a file or a folder in a `FileUpload`
 * list or as a standalone attachment on a note, comment or message.
 *
 * Anatomy (`start`, `label`, `description`, `end`) is structured for reuse:
 * a 20px lead status/type indicator, middle-truncated name with a full-name
 * tooltip, one status/meta line, and at most one removal control (preceded by
 * Retry on `error`).
 */
const FileItem = ({
    name,
    meta,
    status,
    progress,
    error,
    kind = 'file',
    fileType,
    removal,
    onRemove,
    onRetry,
    href,
    isReadOnly = false,
    isDisabled = false,
    id,
    className = '',
    ...props
}) => {
    const fieldContext = useContext(FileUploadContext);
    const readOnly = Boolean(isReadOnly || fieldContext?.isReadOnly);
    const disabled = Boolean(isDisabled || fieldContext?.isDisabled);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const resolvedStatus = FILE_ITEM_STATUSES.includes(status) ? status : 'done';
    const resolvedKind = FILE_ITEM_KINDS.includes(kind) ? kind : 'file';
    const defaultRemoval = resolvedStatus === 'queued' || resolvedStatus === 'uploading' ? 'cancel' : 'remove';
    const resolvedRemoval = FILE_ITEM_REMOVALS.includes(removal) ? removal : defaultRemoval;

    const numericProgress = Number(progress);
    const clampedProgress = Number.isFinite(numericProgress)
        ? Math.round(Math.min(Math.max(numericProgress, 0), 100))
        : 0;

    // Lead slot (20px)
    let leadNode;
    if (resolvedStatus === 'queued') {
        leadNode = <Icon name="clock" size={16} color={disabled ? 'disabled' : 'subtlest'} />;
    } else if (resolvedStatus === 'uploading') {
        leadNode = (
            <ProgressRing
                value={clampedProgress}
                size={20}
                label={`Uploading ${name}`}
            />
        );
    } else if (resolvedStatus === 'error') {
        leadNode = <Icon name="circle-exclamation" size={16} color={disabled ? 'disabled' : 'danger'} />;
    } else if (resolvedKind === 'folder') {
        leadNode = <Icon name="folder" size={16} color={disabled ? 'disabled' : 'subtle'} />;
    } else {
        leadNode = (
            <Icon
                name={resolveTypeIcon(fileType, name)}
                size={16}
                color={disabled ? 'disabled' : 'subtle'}
            />
        );
    }

    // Meta line
    let metaContent;
    if (resolvedStatus === 'error') {
        metaContent = error ?? meta ?? 'Upload failed. Try again.';
    } else if (resolvedStatus === 'queued') {
        metaContent = meta ? <>Waiting · {meta}</> : 'Waiting';
    } else if (resolvedStatus === 'uploading') {
        const uploadingText = `Uploading · ${clampedProgress}%`;
        metaContent = meta ? <>{uploadingText} · {meta}</> : uploadingText;
    } else {
        metaContent = meta ?? 'Uploaded';
    }

    // Middle-truncated name + full name in Tooltip
    const { head, tail } = splitMiddleName(name, resolvedKind);
    const canOpen = Boolean(href) && resolvedStatus === 'done' && !disabled;

    const nameInner = (
        <>
            <VisuallyHidden>{name}</VisuallyHidden>
            <span className="plus-file-item__name-visual" aria-hidden="true">
                <span className="plus-file-item__name-head" data-file-item-part="name-head">{head}</span>
                {tail && (
                    <span className="plus-file-item__name-tail" data-file-item-part="name-tail">{tail}</span>
                )}
            </span>
        </>
    );

    const nameElement = canOpen ? (
        <Link href={href} appearance="subtle" className="plus-file-item__name plus-file-item__link">
            {nameInner}
        </Link>
    ) : (
        <span className="plus-file-item__name">
            {nameInner}
        </span>
    );

    // End actions
    const showActions = !readOnly && !disabled;
    const handleConfirmDelete = (event) => {
        setConfirmOpen(false);
        onRemove?.(event);
    };

    let removalControl = null;
    if (showActions) {
        if (resolvedRemoval === 'delete') {
            const confirmTitle = resolvedKind === 'folder' ? 'Delete folder?' : 'Delete attachment?';
            removalControl = (
                <Popup
                    title={confirmTitle}
                    placement="bottom-end"
                    show={confirmOpen}
                    onToggle={setConfirmOpen}
                    trigger={(
                        <IconButton
                            icon="trash-can"
                            label={`Delete ${name}`}
                            appearance="subtle"
                            spacing="compact"
                        />
                    )}
                >
                    <div className="plus-file-item__confirm">
                        <p className="plus-file-item__confirm-text">
                            This will permanently delete {name}.
                        </p>
                        <div className="plus-file-item__confirm-actions">
                            <Button
                                appearance="subtle"
                                spacing="compact"
                                onClick={() => setConfirmOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                appearance="danger"
                                spacing="compact"
                                onClick={handleConfirmDelete}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </Popup>
            );
        } else {
            const actionVerb = resolvedRemoval === 'cancel' ? 'Cancel' : 'Remove';
            removalControl = (
                <IconButton
                    icon="xmark"
                    label={`${actionVerb} ${name}`}
                    appearance="subtle"
                    spacing="compact"
                    onClick={onRemove}
                />
            );
        }
    }

    return (
        <div
            id={id}
            data-file-item-status={resolvedStatus}
            aria-disabled={disabled || undefined}
            className={clsx(
                'plus-file-item',
                `plus-file-item--${resolvedStatus}`,
                {
                    'plus-file-item--folder': resolvedKind === 'folder',
                    'plus-file-item--readonly': readOnly,
                    'plus-file-item--disabled': disabled,
                },
                className
            )}
            {...props}
        >
            <span className="plus-file-item__start">
                {leadNode}
            </span>

            <div className="plus-file-item__body">
                <div className="plus-file-item__label">
                    <Tooltip text={name} placement="top">
                        {nameElement}
                    </Tooltip>
                </div>
                <div
                    className={clsx('plus-file-item__description', {
                        'plus-file-item__description--error': resolvedStatus === 'error' && !disabled,
                    })}
                >
                    {metaContent}
                </div>
            </div>

            {showActions && (
                <div className="plus-file-item__end">
                    {resolvedStatus === 'error' && (
                        <Button
                            appearance="subtle"
                            spacing="compact"
                            onClick={onRetry}
                        >
                            Retry
                        </Button>
                    )}
                    {removalControl}
                </div>
            )}
        </div>
    );
};

FileItem.displayName = 'FileItem';

FileItem.propTypes = {
    /** File or folder display name. Truncates in the middle so the extension stays visible, with the full name in a tooltip. */
    name: PropTypes.string.isRequired,
    /** Secondary metadata such as file size (`"14.2 MB"`), folder item count (`"6 files"`), or saved date (`"Added Nov 12"`). */
    meta: PropTypes.node,
    /** Current upload lifecycle state of the item. */
    status: PropTypes.oneOf(FILE_ITEM_STATUSES).isRequired,
    /** Upload percent from 0 to 100 while `status` is `uploading`. */
    progress: PropTypes.number,
    /** One-sentence cause and fix shown on `status="error"`. */
    error: PropTypes.node,
    /** `file` (default) or `folder` (uses the folder icon when done and shows file count in `meta`). */
    kind: PropTypes.oneOf(FILE_ITEM_KINDS),
    /** Explicit file category or extension (`pdf`, `video`, `audio`, `image`, `archive`, `word`, `spreadsheet`, `presentation`, `code`, `text`, `file`). Inferred from `name` when omitted. */
    fileType: PropTypes.string,
    /** `cancel` (in-flight upload X), `remove` (unsaved form X), or `delete` (saved attachment trash icon that confirms first). */
    removal: PropTypes.oneOf(FILE_ITEM_REMOVALS),
    /** Called when the user cancels, removes, or confirms deleting the item. */
    onRemove: PropTypes.func,
    /** Called when the user presses Retry on an `error` item. */
    onRetry: PropTypes.func,
    /** Destination URL that opens a completed (`status="done"`) file. */
    href: PropTypes.string,
    /** Hides all end actions while keeping full contrast, for read-only views and static attachments. */
    isReadOnly: PropTypes.bool,
    /** Hides end actions, disables opening links, and dims the row. */
    isDisabled: PropTypes.bool,
    /** Element id on the row container. */
    id: PropTypes.string,
    /** Extra class names added to the row container. */
    className: PropTypes.string,
};

export default FileItem;
