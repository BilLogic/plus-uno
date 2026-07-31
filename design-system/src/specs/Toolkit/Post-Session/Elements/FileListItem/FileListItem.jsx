import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/actions/Button';

/**
 * Uploaded file row (Figma Elements · File List Item `10750:475180`).
 * Leading icon is Font Awesome Solid/B2 `file-circle-check` — do not put body-*
 * text classes on the `<i>` (they override FA’s font-family and show a tofu square).
 *
 * @param {object} props
 * @param {string} props.name
 * @param {string} [props.size]
 * @param {() => void} [props.onRemove]
 */
const FileListItem = ({ name, size = '', onRemove }) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--size-element-pad-x-md)',
            padding: 'var(--size-element-pad-y-md) var(--size-element-gap-md)',
            width: '100%',
            maxWidth: 'var(--col-8)',
        }}
    >
        <i
            className="fa-solid fa-file-circle-check"
            style={{
                color: 'var(--color-on-surface-variant)',
                fontSize: 'var(--font-size-fa-body2-solid)',
                lineHeight: 'var(--font-line-height-fa-body2-solid)',
                flexShrink: 0,
            }}
            aria-hidden="true"
        />
        <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
            {name}
        </span>
        {size && (
            <span className="body2-txt" style={{ color: 'var(--color-outline-variant)' }}>
                {size}
            </span>
        )}
        <div style={{ marginLeft: 'auto' }}>
            <Button
                type="button"
                style="default"
                fill="ghost"
                size="small"
                title={`Remove ${name}`}
                aria-label={`Remove ${name}`}
                leadingVisual="close"
                onClick={onRemove}
            />
        </div>
    </div>
);

FileListItem.propTypes = {
    name: PropTypes.string.isRequired,
    size: PropTypes.string,
    onRemove: PropTypes.func,
};

export default FileListItem;
