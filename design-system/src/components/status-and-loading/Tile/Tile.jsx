import React from 'react';
import PropTypes from 'prop-types';
import './Tile.scss';

/**
 * A square that frames an icon, a logo or an image.
 *
 * Tool logos, school crests, lesson thumbnails and the icon beside a list item
 * all sit in the same frame, so they line up wherever they appear. The size is
 * one scale for every kind of content, and the corners are a quarter of it.
 */

export const TILE_SIZES = [16, 20, 24, 32, 40, 48];

export const TILE_CONTENTS = ['icon', 'logo', 'image'];

export const TILE_APPEARANCES = ['subtle', 'bold'];

/**
 * The color names follow `Tag`: a tile's color is a category, never a status.
 * `white` is for logos, which carry their own colors and mostly want a plain
 * ground. The name-to-token map is in `Tile.scss`.
 */
export const TILE_COLORS = ['grey', 'blue', 'green', 'purple', 'magenta', 'yellow', 'teal', 'white'];

/**
 * A string icon is a Font Awesome Free name (`book-open`, drawn solid) or a full
 * class list (`fa-brands fa-figma`). Anything else is rendered as given.
 */
const renderIcon = (icon) => {
    if (typeof icon !== 'string') return icon;
    const className = icon.includes('fa-') ? icon : `fa-solid fa-${icon}`;
    return <i className={className} aria-hidden="true" />;
};

export const Tile = ({
    content = 'icon',
    size = 32,
    appearance = 'subtle',
    color,
    icon,
    src,
    children,
    hasBorder = false,
    label,
    className = '',
    ...rest
}) => {
    // A logo with no color chosen sits on white; everything else on grey. An
    // icon has no white ground, since the glyph would take no color from it.
    let resolvedColor = color ?? (content === 'logo' ? 'white' : 'grey');
    if (content !== 'logo' && resolvedColor === 'white') resolvedColor = 'grey';

    const classes = [
        'plus-tile',
        `plus-tile--${size}`,
        `plus-tile--${content}`,
        content === 'icon' ? `plus-tile--${appearance}` : '',
        `plus-tile--${resolvedColor}`,
        hasBorder ? 'plus-tile--bordered' : '',
        className,
    ].filter(Boolean).join(' ');

    // Decorative by default: a tile sits beside a name that already says what
    // it is. With a label it becomes one image with that name, and what is
    // inside it stays hidden so the square is announced once, not twice.
    const a11y = label
        ? { role: 'img', 'aria-label': label }
        : { 'aria-hidden': 'true' };

    // Logo and image hold the `media` slot of the Figma set: in code, the
    // picture itself, as `children` or as `src`.
    const picture = children ?? (src ? <img src={src} alt="" /> : null);

    let media = null;
    if (content === 'icon') {
        media = <span className="plus-tile__icon">{renderIcon(icon)}</span>;
    } else if (content === 'logo') {
        media = <span className="plus-tile__logo" aria-hidden={label ? 'true' : undefined}>{picture}</span>;
    } else if (content === 'image') {
        media = <span className="plus-tile__image" aria-hidden={label ? 'true' : undefined}>{picture}</span>;
    }

    return (
        <span className={classes} {...a11y} {...rest}>
            {media}
        </span>
    );
};

Tile.propTypes = {
    /** What the tile frames. Icons and logos are inset; an image fills and crops. */
    content: PropTypes.oneOf(TILE_CONTENTS),
    /** 16, 20, 24, 32, 40 or 48, for every kind of content. */
    size: PropTypes.oneOf(TILE_SIZES),
    /** Icons only. `subtle` is the color's container; `bold` is the solid color. */
    appearance: PropTypes.oneOf(TILE_APPEARANCES),
    /** A category color, as on `Tag`. `white` is for logos. Defaults to white for a logo, grey otherwise. */
    color: PropTypes.oneOf(TILE_COLORS),
    /** `icon` only: a Font Awesome Free name (`book-open`), a class list, or a node. */
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /** `logo` or `image`: the picture's URL. */
    src: PropTypes.string,
    /** `logo` or `image`: the picture as a node, in place of `src`. */
    children: PropTypes.node,
    /** Adds a 1px outline-variant border inside the tile. */
    hasBorder: PropTypes.bool,
    /** Makes the tile an image with this name. Without it the tile is decorative and hidden. */
    label: PropTypes.string,
    className: PropTypes.string,
};

export default Tile;
