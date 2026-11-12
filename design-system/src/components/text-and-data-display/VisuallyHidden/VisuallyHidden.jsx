import React from 'react';
import PropTypes from 'prop-types';

/**
 * Text that assistive technology reads and nobody sees: a one-pixel, clipped
 * span taken out of the flow. It is the `.visually-hidden` class `main.scss`
 * defines, which the rest of the system already uses by class name, given a
 * component so the caller never types the class. It paints nothing, so it takes no tokens.
 */
const VisuallyHidden = ({ children, id, role }) => (
    <span className="visually-hidden" id={id} role={role}>
        {children}
    </span>
);

VisuallyHidden.propTypes = {
    /** The text screen readers announce. */
    children: PropTypes.node,
    /** An id other elements can point at with `aria-labelledby` or `aria-describedby`. */
    id: PropTypes.string,
    /** An ARIA role for the span, such as `status` for a live region. */
    role: PropTypes.string,
};

export default VisuallyHidden;
