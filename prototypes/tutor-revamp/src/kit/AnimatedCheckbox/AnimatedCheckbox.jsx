import React from 'react';
import PropTypes from 'prop-types';
import './AnimatedCheckbox.css';

/**
 * AnimatedCheckbox: a native checkbox whose tick draws in when it is checked,
 * for checklists where ticking is the reward (prep items). The mark scales in
 * over 180 ms, and not at all under reduced motion.
 *
 * It has no visible label of its own: give it `label` (its accessible name),
 * or `aria-labelledby` pointing at the row's text.
 */
const AnimatedCheckbox = ({ checked, defaultChecked, onChange, label, id, disabled = false, className = '', ...rest }) => (
    <input
        id={id}
        type="checkbox"
        className={['tr-check', className].filter(Boolean).join(' ')}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={(event) => onChange?.(event.target.checked, event)}
        aria-label={label}
        disabled={disabled}
        {...rest}
    />
);

AnimatedCheckbox.propTypes = {
    checked: PropTypes.bool,
    defaultChecked: PropTypes.bool,
    /** Called with `(checked, event)` */
    onChange: PropTypes.func,
    /** Accessible name, when no `aria-labelledby` */
    label: PropTypes.string,
    id: PropTypes.string,
    disabled: PropTypes.bool,
    className: PropTypes.string,
};

export default AnimatedCheckbox;
