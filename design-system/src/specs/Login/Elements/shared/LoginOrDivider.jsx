import React from 'react';
import PropTypes from 'prop-types';

import './login-or-divider.scss';

/**
 * Horizontal "or" divider used between auth provider buttons and secondary actions.
 *
 * @param {object} props
 * @param {string} [props.text='or'] - Divider label announced to assistive tech.
 * @returns {React.ReactElement}
 */
export function LoginOrDivider({ text = 'or' }) {
    return (
        <div className="login-or-divider" role="separator" aria-label={text}>
            <div className="login-or-divider__line" />
            <div className="login-or-divider__text body1-txt">{text}</div>
            <div className="login-or-divider__line" />
        </div>
    );
}

LoginOrDivider.propTypes = {
    text: PropTypes.string,
};
