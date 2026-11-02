import React from 'react';
import PropTypes from 'prop-types';
import './Code.scss';

/**
 * An inline chip for a short piece of code inside a sentence. It is a `code`
 * element in the code typeface at 0.875 of the text around it, on a neutral
 * fill, so it follows a paragraph or a heading without a size of its own.
 */
const Code = ({ children, className = '' }) => (
    <code className={['plus-code', className].filter(Boolean).join(' ')}>
        {children}
    </code>
);

Code.propTypes = {
    /** The code, as text. */
    children: PropTypes.node,
    /** Extra classes for placement, such as spacing. */
    className: PropTypes.string,
};

export default Code;
