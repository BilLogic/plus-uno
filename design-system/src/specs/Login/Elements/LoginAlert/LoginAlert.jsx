import React from 'react';
import PropTypes from 'prop-types';

import Alert from '@/components/messaging/Alert';

/**
 * Dismissible primary alert banner for login session messages. The Login page
 * shows it with no title and no leading icon, so the default icon is off.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Alert message content.
 * @param {boolean} [props.dismissable=true] - Whether the alert can be dismissed.
 * @returns {React.ReactElement}
 */
export default function LoginAlertBanner({ children, dismissable = true }) {
    return (
        <Alert style="primary" leadingVisual={false} dismissable={dismissable}>
            {children}
        </Alert>
    );
}

LoginAlertBanner.propTypes = {
    children: PropTypes.node,
    dismissable: PropTypes.bool,
};
