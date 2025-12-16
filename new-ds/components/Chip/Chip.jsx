import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Chip component for PLUS design system.
 * Similar to badges but always removable.
 */
const Chip = ({
    text,
    style = 'default',
    size = 'b1',
    id,
    onRemove,
    className = '',
    // ...other props
}) => {
    // We could implement self-removal if needed, but controlled is better.
    // However, to match the "remove()" behavior of the legacy component without forcing 
    // the user to manage state for simple cases, we can verify what's expected.
    // For now, we will rely on onRemove being called.

    // Classes
    const classes = [
        'plus-chip',
        style,
        size,
        className
    ].filter(Boolean).join(' ');

    return (
        <span id={id} className={classes}>
            <span className="plus-badge-text">{text}</span>
            <button
                type="button"
                className="plus-chip-remove"
                aria-label="Remove"
                onClick={(e) => {
                    e.stopPropagation();
                    if (onRemove) onRemove();
                }}
            >
                <i className="fas fa-xmark" aria-hidden="true" />
            </button>
        </span>
    );
};

Chip.propTypes = {
    text: PropTypes.string.isRequired,
    style: PropTypes.oneOf([
        'default', 'primary', 'secondary', 'info', 'warning', 'error', 'success'
    ]),
    size: PropTypes.oneOf([
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3'
    ]),
    id: PropTypes.string,
    onRemove: PropTypes.func, // Optional, but chip is always removable visually
    className: PropTypes.string,
};

export default Chip;
