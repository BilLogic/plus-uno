import React from 'react';
import PropTypes from 'prop-types';
import { Blanket } from '@/patterns';

const PADDING = {
    md: 'var(--pad-y-md) var(--pad-x-md)',
    sm: 'var(--pad-y-sm) var(--pad-x-md)',
    none: undefined,
};

const BORDER = {
    all: {
        border: 'var(--border-width-default) solid var(--ds-border)',
        borderRadius: 'var(--radius-md)',
    },
    top: {
        borderTop: 'var(--border-width-default) solid var(--ds-border)',
    },
    none: {},
};

/**
 * Shared token-styled surface for the live do/don't `*Cases.jsx` examples on
 * template docs pages. Keeps each case unstyled by Storybook docs prose and
 * lets callers supply layout props (`ref`, `border`, `padding`, `surface`, `style`).
 */
export const CaseSurface = React.forwardRef(function CaseSurface(
    { children, border = 'all', padding = 'md', surface = true, className = '', style, ...rest },
    ref,
) {
    const classes = className ? `sb-unstyled ${className}` : 'sb-unstyled';
    return (
        <div
            ref={ref}
            className={classes}
            style={{
                inlineSize: '100%',
                ...(PADDING[padding] ? { padding: PADDING[padding] } : {}),
                ...BORDER[border],
                ...(surface ? { background: 'var(--ds-surface)' } : {}),
                ...style,
            }}
            {...rest}
        >
            {children}
        </div>
    );
});

CaseSurface.propTypes = {
    children: PropTypes.node,
    border: PropTypes.oneOf(['all', 'top', 'none']),
    padding: PropTypes.oneOf(['md', 'sm', 'none']),
    surface: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
};

/** Inline Blanket wrapper for modal and overlay do/don't case examples. */
export const CaseBlanket = ({ children, height = 300 }) => (
    <CaseSurface border="none" padding="none" surface={false}>
        <Blanket
            inline
            screenHeight={height}
            style={{
                padding: 'var(--pad-y-md) var(--pad-x-md)',
                borderRadius: 'var(--radius-md)',
            }}
        >
            {children}
        </Blanket>
    </CaseSurface>
);

CaseBlanket.propTypes = {
    children: PropTypes.node,
    height: PropTypes.number,
};
