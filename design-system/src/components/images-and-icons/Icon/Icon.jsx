import React from 'react';
import PropTypes from 'prop-types';
import { iconClass } from '../../../lib/icon';
import './Icon.scss';

/** The token sizes in px: 12 (`--icon-sm`), 16 (`--icon-md`) and 24 (`--icon-lg`). */
export const ICON_SIZES = [12, 16, 24];

/** The icon color roles. `default` is `--ds-icon`; every other role is `--ds-icon-<role>`. */
export const ICON_COLORS = [
    'default',
    'subtle',
    'subtlest',
    'inverse',
    'brand',
    'selected',
    'disabled',
    'success',
    'warning',
    'warning-inverse',
    'danger',
    'information',
    'discovery',
];

/**
 * One Font Awesome Free glyph, drawn from its name.
 *
 * - **name** is a Free name: regular where Free has a regular weight, solid where
 *   it does not. A name that carries its family (`fa-brands fa-slack`) is kept.
 * - **size** is 12, 16 or 24, each bound to its icon size token. Without it the
 *   glyph is the small icon size, or the size the component around it sets.
 * - **color** is an icon color role. Without it the glyph takes the color around it.
 * - **label** names the icon for assistive technology. Without it the icon is
 *   hidden, so the words beside it carry the meaning.
 */
const Icon = ({ name, size, color, label, className, ...props }) => {
    if (!name) return null;
    const classes = [
        iconClass(name),
        'plus-icon',
        size && `plus-icon--size-${size}`,
        color && `plus-icon--color-${color}`,
        className,
    ].filter(Boolean).join(' ');
    // After the spread, so a caller's role or aria-hidden cannot contradict `label`.
    const accessibility = label
        ? { role: 'img', 'aria-label': label, 'aria-hidden': undefined }
        : { role: undefined, 'aria-label': undefined, 'aria-hidden': 'true' };
    return <i {...props} {...accessibility} className={classes} />;
};

Icon.propTypes = {
    /** A Font Awesome Free name, such as `calendar-days`, or a name with its family. */
    name: PropTypes.string.isRequired,
    /** The size in px, bound to an icon size token. Unset, the glyph is the small icon size, or the size the component around it sets. */
    size: PropTypes.oneOf(ICON_SIZES),
    /** An icon color role. Unset, the glyph takes the color around it. */
    color: PropTypes.oneOf(ICON_COLORS),
    /** An accessible name. Without it the icon is hidden from assistive technology. */
    label: PropTypes.string,
    /** More classes for the glyph, beside the family and name classes. */
    className: PropTypes.string,
    /** Inline styles for the glyph. */
    style: PropTypes.object,
};

export default Icon;
