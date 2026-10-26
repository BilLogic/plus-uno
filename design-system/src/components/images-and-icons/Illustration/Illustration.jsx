import React from 'react';
import PropTypes from 'prop-types';
import './Illustration.scss';
import { CHARACTER_GEOMETRY } from './characters';

import masteringContentBody from '@/assets/images/illustrations/body-mastering-content.png';
import advocacyBody from '@/assets/images/illustrations/body-advocacy.png';
import technologyBody from '@/assets/images/illustrations/body-technology.png';
import relationshipsBody from '@/assets/images/illustrations/body-relationships.png';
import socialEmotionalBody from '@/assets/images/illustrations/body-social-emotional.png';
import dotBody from '@/assets/images/illustrations/body-dot.png';
import approximatelyEqualBody from '@/assets/images/illustrations/body-approximately-equal.png';
import rootBody from '@/assets/images/illustrations/body-root.png';
import allBody from '@/assets/images/illustrations/body-all.png';
import piBody from '@/assets/images/illustrations/body-pi.png';
import equalBody from '@/assets/images/illustrations/body-equal.png';
import dividerBody from '@/assets/images/illustrations/body-divider.png';

/**
 * One of the PLUS illustration characters: a textured body with a face, arms
 * and legs drawn in line work.
 *
 * Five characters stand for the SMART areas of tutoring, and seven are math
 * characters. The body takes its color from a token and the line work from
 * `--ds-icon-subtle`, so a character follows every color and contrast mode.
 *
 * The body's stipple texture is a mask: a small picture of where the texture
 * is, filled with the token color. The line work is inline SVG.
 */

/** The five SMART characters, in SMART order, then the seven math characters. */
export const SMART_CHARACTERS = ['mastering-content', 'advocacy', 'technology', 'relationships', 'social-emotional'];

export const MATH_CHARACTERS = ['dot', 'approximately-equal', 'root', 'all', 'pi', 'equal', 'divider'];

export const ILLUSTRATION_CHARACTERS = [...SMART_CHARACTERS, ...MATH_CHARACTERS];

/** The sizes the Figma Docs name. Any number of pixels also works. */
export const ILLUSTRATION_SIZES = [48, 96, 160, 240];

const BODY_MASKS = {
    'mastering-content': masteringContentBody,
    advocacy: advocacyBody,
    technology: technologyBody,
    relationships: relationshipsBody,
    'social-emotional': socialEmotionalBody,
    dot: dotBody,
    'approximately-equal': approximatelyEqualBody,
    root: rootBody,
    all: allBody,
    pi: piBody,
    equal: equalBody,
    divider: dividerBody,
};

/** A position in the 1000 frame as a percentage of the frame. */
const pct = (units) => `${units / 10}%`;

export const Illustration = ({
    character = 'mastering-content',
    size = 96,
    title,
    className = '',
    style,
    ...rest
}) => {
    const geometry = CHARACTER_GEOMETRY[character];
    if (!geometry) return null;

    const [frameX, frameY] = geometry.frame;
    const [width, height] = geometry.viewBox;
    const [bodyX, bodyY] = geometry.body;
    const mask = `url(${BODY_MASKS[character]})`;

    // Decorative by default: a character sits beside words that already say
    // what the page is about. With a title it is one image with that name.
    const a11y = title
        ? { role: 'img', 'aria-label': title }
        : { 'aria-hidden': 'true' };

    const classes = ['plus-illustration', `plus-illustration--${character}`, className]
        .filter(Boolean)
        .join(' ');

    return (
        <span
            className={classes}
            style={{ inlineSize: `${size}px`, blockSize: `${size}px`, ...style }}
            data-character={character}
            {...a11y}
            {...rest}
        >
            <span
                className="plus-illustration__body"
                style={{
                    left: pct(bodyX),
                    top: pct(bodyY),
                    maskImage: mask,
                    WebkitMaskImage: mask,
                }}
            />
            <svg
                className="plus-illustration__lines"
                viewBox={`0 0 ${width} ${height}`}
                style={{
                    left: pct(-frameX),
                    top: pct(-frameY),
                    width: pct(width),
                    height: pct(height),
                }}
                aria-hidden="true"
                focusable="false"
            >
                {geometry.lines.map((d, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <path key={i} d={d} />
                ))}
            </svg>
        </span>
    );
};

Illustration.propTypes = {
    /** Which character. The first five are the SMART areas; the rest are math characters. */
    character: PropTypes.oneOf(ILLUSTRATION_CHARACTERS),
    /** The frame's width and height in pixels: 48, 96, 160 or 240, or any number. Limbs reach past it. */
    size: PropTypes.number,
    /** Makes the character an image with this name. Without it the character is decorative and hidden. */
    title: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default Illustration;
