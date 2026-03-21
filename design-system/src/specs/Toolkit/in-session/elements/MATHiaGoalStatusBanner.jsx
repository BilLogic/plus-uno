import React from 'react';
import PropTypes from 'prop-types';
import Alert from '../../../../components/Alert/Alert';

/**
 * MATHia Goal Status Banner
 * 
 * Displays alert banners for MATHia sessions indicating whether they are
 * goal-setting or non-goal-setting sessions.
 * 
 * @param {string} type - 'dashboard' or 'modal' - determines the banner style
 * @param {string} sessionType - 'goal-setting' or 'non-goal-setting'
 * @param {boolean} dismissable - Whether the banner can be dismissed (default: true for dashboard, false for modal)
 */
const MATHiaGoalStatusBanner = ({
    type = 'dashboard',
    sessionType = 'goal-setting',
    dismissable,
    onDismiss,
    className = '',
}) => {
    // Determine dismissable based on type if not explicitly provided
    const isDismissable = dismissable !== undefined ? dismissable : type === 'dashboard';

    // Dashboard alerts have title + body, modal alerts have just body text
    const isDashboard = type === 'dashboard';

    // Content based on session type
    const contentConfig = {
        'goal-setting': {
            title: isDashboard ? 'Reminder: Goal Setting MATHia Session' : null,
            body: isDashboard
                ? 'Plan to review or set goals with the student during this session.'
                : 'This is a Goal Setting MATHia Session.',
        },
        'non-goal-setting': {
            title: isDashboard ? 'Reminder: Non-Goal Setting MATHia Session' : null,
            body: isDashboard
                ? 'No Goal Setting efforts required at this time.'
                : 'This is a Non-Goal Setting MATHia Session.',
        },
    };

    const { title, body } = contentConfig[sessionType];

    // For dashboard alerts, we need to structure content properly
    // The Alert component wraps children in .plus-alert-text body2-txt
    // But we need h5 for title, so we'll use CSS to override
    // For modal alerts, just render body text
    const alertContent = isDashboard && title ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
            <div className="h5" style={{ margin: 0, color: 'inherit' }}>
                {title}
            </div>
            <div className="body2-txt" style={{ margin: 0 }}>
                {body}
            </div>
        </div>
    ) : (
        <div className="body2-txt" style={{ margin: 0 }}>
            {body}
        </div>
    );

    return (
        <Alert
            style="primary"
            dismissable={isDismissable}
            onDismiss={onDismiss}
            className={className}
        >
            {alertContent}
        </Alert>
    );
};

MATHiaGoalStatusBanner.propTypes = {
    /** Banner type: 'dashboard' (with title) or 'modal' (simple text) */
    type: PropTypes.oneOf(['dashboard', 'modal']),
    /** Session type: 'goal-setting' or 'non-goal-setting' */
    sessionType: PropTypes.oneOf(['goal-setting', 'non-goal-setting']),
    /** Whether the banner can be dismissed */
    dismissable: PropTypes.bool,
    /** Callback when banner is dismissed */
    onDismiss: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default MATHiaGoalStatusBanner;

