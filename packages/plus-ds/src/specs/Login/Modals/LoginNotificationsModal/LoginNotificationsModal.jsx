import React from 'react';
import PropTypes from 'prop-types';

import Button from '@/components/Button';

import './LoginNotificationsModal.scss';

/**
 * LoginNotificationsModal
 *
 * Figma-accurate notification modal used in Login flows.
 * Variants:
 * - type="A" – CMU PLUS tutor vs other CMU user guidance
 * - type="B" – Institution name match with support email
 *
 * This is a spec-only component intended for Storybook usage. Runtime
 * implementations should wire the callbacks into real routing / state.
 */
export default function LoginNotificationsModal({
    type = 'A',
    institutionName = '{Text}',
    onPrimaryAction,
    onSecondaryAction,
    onClose,
}) {
    const handlePrimary = () => {
        if (onPrimaryAction) {
            onPrimaryAction();
        }
    };

    const handleSecondary = () => {
        if (onSecondaryAction) {
            onSecondaryAction();
        }
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };

    const isTypeB = type === 'B';

    const title = 'Are you sure?';

    const body = isTypeB ? (
        <>
            <p className="body1-txt login-modal-notification__body-paragraph">
                It looks like you entered ‘{institutionName}’, which matches an existing institution. Please
                click&nbsp;‘Register with Institution’ and select ‘{institutionName}’ from the drop-down menu on the
                following screen.
            </p>
            <p className="body1-txt login-modal-notification__body-paragraph">
                If you have any questions, feel free to reach out to us at{' '}
                <a href="mailto:help@tutors.plus" className="login-modal-notification__link">
                    help@tutors.plus
                </a>
                .
            </p>
        </>
    ) : (
        <>
            <p className="body1-txt login-modal-notification__body-paragraph">
                If you are an new CMU PLUS tutor, please select &quot;PLUS Tutoring&quot; as your institution and use
                the given access code. For help please contact us.
            </p>
            <p className="body1-txt login-modal-notification__body-paragraph">
                If you are any other CMU user (researcher, professor, etc.) who will not be tutoring for PLUS, please
                continue to register independently.
            </p>
        </>
    );

    const secondaryLabel = isTypeB ? 'Dismiss' : 'Register Independently';
    const primaryLabel = isTypeB ? 'Register with Institution' : 'Return';

    return (
        <div className="login-modal-notification">
            <div className="login-modal-notification__header">
                <p className="login-modal-notification__title h5">{title}</p>
                <button
                    type="button"
                    className="login-modal-notification__close"
                    aria-label="Close"
                    onClick={handleClose}
                >
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>
            </div>

            <div className="login-modal-notification__divider" role="separator" />

            <div className="login-modal-notification__body">{body}</div>

            <div className="login-modal-notification__divider login-modal-notification__divider--muted" />

            <div className="login-modal-notification__actions">
                <Button
                    text={secondaryLabel}
                    style="primary"
                    fill="tonal"
                    size="medium"
                    onClick={handleSecondary}
                />
                <Button
                    text={primaryLabel}
                    style="primary"
                    fill="filled"
                    size="medium"
                    onClick={handlePrimary}
                />
            </div>
        </div>
    );
}

LoginNotificationsModal.propTypes = {
    /**
     * Modal variant.
     * - "A": CMU PLUS tutor vs other CMU user guidance
     * - "B": Institution name match notification
     */
    type: PropTypes.oneOf(['A', 'B']),
    /**
     * Institution name placeholder shown in variant B messaging.
     * Defaults to `{Text}` to mirror the Figma spec.
     */
    institutionName: PropTypes.string,
    onPrimaryAction: PropTypes.func,
    onSecondaryAction: PropTypes.func,
    onClose: PropTypes.func,
};

