import React from 'react';
import PropTypes from 'prop-types';

import { PAINT } from '@/storybook-docs/illustrations/paint.js';
import { Illustration } from '@/storybook-docs/illustrations/Illustration.jsx';
import { Rect } from '@/storybook-docs/illustrations/primitives.jsx';

/**
 * Pieces of the Templates overview. The chooser's dot is drawn from the
 * illustration kit: filled in the accent where the layer is built for the task,
 * an outline where it is not.
 */

/** The dot's size: a small mark in the cell, not a figure. */
const DOT_SIZE = 'var(--icon-sm)';

/** Text a screen reader and the agent file read, with no visible box. */
export const HIDDEN = {
    position: 'absolute',
    inlineSize: 1,
    blockSize: 1,
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
};

/** A chooser cell's dot. Its words sit beside it in a hidden span, so a screen reader and the agent file read "Yes" or "No". */
export const ChooserDot = ({ filled }) => (
    <span aria-hidden="true" style={{ display: 'inline-block', inlineSize: DOT_SIZE, verticalAlign: 'middle' }}>
        <Illustration width={8} height={8} viewBox="0 0 8 8" title={filled ? 'Yes' : 'No'} capped={false}>
            <Rect x={1} y={1} w={6} h={6} corner="icon" fill={filled ? PAINT.accent : 'none'} stroke={filled ? undefined : PAINT.annotation} />
        </Illustration>
    </span>
);

ChooserDot.propTypes = { filled: PropTypes.bool };
