import React from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import './Image.scss';

export const IMAGE_SIZES = ['fixed', 'fluid'];

/**
 * Image: a decorative or meaningful bitmap, with a dark-mode variant swapped
 * in by the browser rather than by script.
 */
export const Image = ({
    src,
    srcDark,
    alt = '',
    size = 'fluid',
    testId,
    className,
    style,
    ...props
}) => {
    const image = (
        <img
            src={src}
            alt={alt}
            data-testid={testId}
            className={clsx('plus-image', `plus-image--${size}`, className)}
            style={style}
            {...props}
        />
    );

    if (!srcDark) return image;

    return (
        <picture>
            <source media="(prefers-color-scheme: dark)" srcSet={srcDark} />
            {image}
        </picture>
    );
};

Image.propTypes = {
    src: PropTypes.string.isRequired,
    /** Shown instead of `src` when the OS is in dark mode. */
    srcDark: PropTypes.string,
    /** `''` (the default) marks the image decorative. */
    alt: PropTypes.string,
    /** `fixed` keeps its natural size; `fluid` (the default) scales to its container. */
    size: PropTypes.oneOf(IMAGE_SIZES),
    testId: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default Image;
