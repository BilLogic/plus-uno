import React from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import './Image.scss';

export const IMAGE_FITS = ['natural', 'container'];

/** Deprecated `size` values, mapped to their `fit`. Remove with `size` after one release. */
const SIZE_TO_FIT = { fixed: 'natural', fluid: 'container' };

/** @deprecated Use `IMAGE_FITS`. */
export const IMAGE_SIZES = Object.keys(SIZE_TO_FIT);

/**
 * Image: a decorative or meaningful bitmap, with a dark variant that follows
 * the app's color mode.
 */
export const Image = ({
    src,
    srcDark,
    alt = '',
    fit,
    size,
    testId,
    className,
    style,
    ...props
}) => {
    const resolvedFit = fit ?? SIZE_TO_FIT[size] ?? size ?? 'container';
    const render = (source, variant) => (
        <img
            key={variant}
            src={source}
            alt={alt}
            data-testid={variant === 'light' || !srcDark ? testId : undefined}
            className={clsx(
                'plus-image',
                `plus-image--${resolvedFit}`,
                srcDark && `plus-image--${variant}`,
                className,
            )}
            style={style}
            {...props}
        />
    );

    if (!srcDark) return render(src, 'light');

    return (
        <>
            {render(src, 'light')}
            {render(srcDark, 'dark')}
        </>
    );
};

Image.propTypes = {
    src: PropTypes.string.isRequired,
    /** Shown instead of `src` when the app's color mode is dark. */
    srcDark: PropTypes.string,
    /** `''` (the default) marks the image decorative. */
    alt: PropTypes.string,
    /** `natural` keeps its natural size; `container` (the default) scales to its container. */
    fit: PropTypes.oneOf(IMAGE_FITS),
    /** @deprecated Use `fit`: `fixed` is `natural`, `fluid` is `container`. */
    size: PropTypes.oneOf(IMAGE_SIZES),
    testId: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default Image;
