import React from 'react';

const INSETS = {
    sm: { padding: 'var(--pad-y-sm) var(--pad-x-sm)', borderRadius: 'var(--radius-sm)' },
    md: { padding: 'var(--pad-y-lg) var(--pad-x-md)', borderRadius: 'var(--radius-md)' },
    lg: { padding: 'var(--pad-x-lg)', borderRadius: 'var(--radius-md)' },
};

/**
 * The colored ground a story sets a part on: an inverse or filled part needs a
 * bold surface to read against, and that surface is staging, not something the
 * part ships with. The story passes the ground's tokens; the ground owns the
 * fill, the text color on it, the radius and the padding, so the story's own
 * source stays layout.
 *
 * @param {string} [background] - a background token name, e.g. `--ds-background-brand-bold`; omit for no fill
 * @param {string} [text] - the text token on that fill; unset, text sits subtle
 * @param {'sm' | 'md' | 'lg'} [inset] - padding and radius of the ground
 * @param {boolean} [inline] - shrink to the content
 * @param {object} [style] - layout only: how the parts inside sit
 */
export function Ground({ background, text, inset = 'lg', inline = false, style, children, ...rest }) {
    return (
        <div
            {...rest}
            style={{
                display: inline ? 'inline-flex' : undefined,
                ...INSETS[inset],
                background: background ? `var(${background})` : undefined,
                color: text ? `var(${text})` : 'var(--ds-text-subtle)',
                ...style,
            }}
        >
            {children}
        </div>
    );
}
