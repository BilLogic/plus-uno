import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/actions/Button';
import aiCoachImage from '@/assets/images/home/ai-coach-notification.png';
import './UpdateNotification.scss';

/**
 * Update Notification modal — Home “Meet your AI Coach!” announcement.
 * Figma node `7283:416854`.
 *
 * @param {object} props
 * @param {string} [props.id]
 * @param {boolean} [props.show=false]
 * @param {() => void} props.onClose
 * @param {() => void} [props.onWatchTutorial]
 * @param {() => void} [props.onTryAiCoach]
 * @param {boolean} [props.noOverlay=false]
 * @param {boolean} [props.containOverlay=false]
 * @param {string} [props.className]
 * @param {React.CSSProperties} [props.style]
 */
const UpdateNotification = ({
    id,
    show = false,
    onClose,
    onWatchTutorial,
    onTryAiCoach,
    noOverlay = false,
    containOverlay = false,
    className = '',
    style,
}) => {
    if (!show) return null;

    const overlayClass = [
        noOverlay
            ? 'plus-update-notification-overlay-inline'
            : 'plus-update-notification-overlay',
        !noOverlay && containOverlay ? 'plus-update-notification-overlay--contained' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={overlayClass} onClick={!noOverlay ? onClose : undefined}>
            <div
                id={id}
                className={`plus-update-notification ${className}`}
                style={style}
                role="dialog"
                aria-modal={!noOverlay}
                aria-labelledby={`${id || 'update-notification'}-title`}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="plus-update-notification__close"
                    aria-label="Close"
                    onClick={onClose}
                >
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>

                <div className="plus-update-notification__grid">
                    <div className="plus-update-notification__media">
                        <img src={aiCoachImage} alt="" />
                    </div>

                    <div className="plus-update-notification__body">
                        <div className="plus-update-notification__copy">
                            <h4
                                id={`${id || 'update-notification'}-title`}
                                className="h4 font-weight-semibold plus-update-notification__title"
                            >
                                Meet your AI Coach!
                            </h4>
                            <p className="body2-txt plus-update-notification__description">
                                We&apos;re excited to introduce AI Coach, a new feature in PLUS that
                                supports your growth as a tutor. Some tutors may now see feedback
                                and growth insights based on real tutoring moments. Watch the short
                                explainer video to learn more.
                            </p>
                        </div>

                        <div className="plus-update-notification__actions">
                            <Button
                                text="Watch tutorial"
                                leadingVisual="play"
                                style="secondary"
                                fill="tonal"
                                size="medium"
                                onClick={onWatchTutorial}
                            />
                            <Button
                                text="Try AI Coach"
                                leadingVisual="chart-bar"
                                style="primary"
                                fill="filled"
                                size="medium"
                                onClick={onTryAiCoach}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

UpdateNotification.propTypes = {
    id: PropTypes.string,
    show: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    onWatchTutorial: PropTypes.func,
    onTryAiCoach: PropTypes.func,
    noOverlay: PropTypes.bool,
    containOverlay: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default UpdateNotification;
