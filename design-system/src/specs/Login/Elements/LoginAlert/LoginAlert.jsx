import React from 'react';
import PropTypes from 'prop-types';

import SectionMessage from '@/components/messaging/SectionMessage';

/**
 * Dismissible primary alert banner for login session messages. The Login page
 * shows it with no title and no leading icon, so the default icon is off.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Alert message content.
 * @param {boolean} [props.dismissible=true] - Whether the alert can be dismissed.
 * @returns {React.ReactElement}
 */
export default function LoginAlertBanner({ children, dismissible = true }) {
    return (
        <SectionMessage appearance="primary" leadingVisual={false} dismissible={dismissible}>
            {children}
        </SectionMessage>
    );
}

LoginAlertBanner.propTypes = {
    children: PropTypes.node,
    dismissible: PropTypes.bool,
};
