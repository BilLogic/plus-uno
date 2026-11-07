import React from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import './SplitButton.scss';

/**
 * Split button: a primary action joined to a chevron that opens a menu of
 * related actions. Composed from two children — a `Button` for the action and
 * an `IconButton` (chevron) for the menu trigger — each carrying its own
 * appearance, spacing and state; `SplitButton` only draws the seam between
 * them and groups them for assistive tech.
 */
export const SplitButton = ({ children, className, testId, ...props }) => (
    <div
        role="group"
        className={clsx('plus-split-btn', className)}
        data-testid={testId}
        {...props}
    >
        {children}
    </div>
);

SplitButton.propTypes = {
    /** Two Button-family elements: the primary action and the menu trigger. */
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    /** Maps to `data-testid`, for test queries. */
    testId: PropTypes.string,
};

export default SplitButton;
