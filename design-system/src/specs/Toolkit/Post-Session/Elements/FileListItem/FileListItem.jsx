import React from 'react';
import PropTypes from 'prop-types';
import { IconButton } from '@/components';
import { iconClass } from '../../../../../lib/icon';

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
            gap: 'var(--pad-x-md)',
            padding: 'var(--pad-y-md) var(--space-0625)',
            width: '100%',
            maxWidth: 'var(--col-8)',
        }}
    >
        <i
            className={iconClass('file-circle-check')}
            style={{
                color: 'var(--ds-text-subtle)',
                fontSize: 'var(--font-size-fa-body2-solid)',
                lineHeight: 'var(--font-line-height-fa-body2-solid)',
                flexShrink: 0,
            }}
            aria-hidden="true"
        />
        <span className="body2-txt" style={{ color: 'var(--ds-text-subtle)' }}>
            {name}
        </span>
        {size && (
            <span className="body2-txt" style={{ color: 'var(--ds-text-subtlest)' }}>
                {size}
            </span>
        )}
        <div style={{ marginLeft: 'auto' }}>
            <IconButton
                type="button"
                appearance="subtle"
                spacing="compact"
                label={`Remove ${name}`}
                icon="close"
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
