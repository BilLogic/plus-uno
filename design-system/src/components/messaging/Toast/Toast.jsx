import React, { useLayoutEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Toast as BootstrapToast, ToastContainer as BootstrapToastContainer } from 'react-bootstrap';
import './Toast.scss';

export const Toast = ({
    id,
    style = 'secondary', // 'secondary' (default), 'success', 'danger', 'warning', 'info', 'primary'
    title,
    children, // Body text/content
    dismissible = true,
    show,
    onClose,
    delay = 5000,
    autohide = true,
    className = '',
    headerClass = '',
    bodyClass = '',
    timestamp, // '11 mins ago' etc
    ...props
}) => {
    // Icon mapping
    const iconMap = {
        'danger': 'fa-triangle-exclamation',
        'success': 'fa-circle-check',
        'info': 'fa-circle-info',
        'warning': 'fa-circle-exclamation',
        'primary': 'fa-circle',
        'secondary': 'fa-circle',
        'default': 'fa-circle'
    };

    const iconClass = iconMap[style] || 'fa-circle';

    /*
     * #325. Politeness follows the message. Every toast used to be
     * `role="alert"` with `aria-live="assertive"`, so "Saved" cut across
     * whatever a screen reader was in the middle of saying. Assertive is for
     * something that has gone wrong and changes what the user should do next;
     * everything else waits its turn. `role` and `aria-live` are set together
     * because a mismatched pair is worse than either alone.
     */
    const isUrgent = style === 'danger' || style === 'warning';
    const liveRole = isUrgent ? 'alert' : 'status';
    const livePoliteness = isUrgent ? 'assertive' : 'polite';

    /*
     * And why this is an effect rather than three props.
     *
     * react-bootstrap's Toast writes `role="alert"`, `aria-live="assertive"` and
     * `aria-atomic="true"` onto its `div` AFTER spreading `...props`:
     *
     *     const toast = jsx("div", { ...props, ref, className, role: "alert",
     *                                "aria-live": "assertive", "aria-atomic": "true" });
     *
     * So passing them is silently ignored — which means the explicit
     * `role="alert"` this component used to pass was never doing anything
     * either; it only looked like the source of the behaviour. Setting them on
     * the node we are handed is the one place the value can actually change.
     * Measured: the assertion in `ToastPoliteness.stories.jsx` fails without it.
     */
    const toastRef = useRef(null);

    useLayoutEffect(() => {
        const node = toastRef.current;
        if (!node) return;
        node.setAttribute('role', liveRole);
        node.setAttribute('aria-live', livePoliteness);
    }, [liveRole, livePoliteness]);

    return (
        <BootstrapToast
            ref={toastRef}
            id={id}
            className={`plus-toast ${style} ${className}`}
            show={show}
            onClose={onClose}
            delay={delay}
            autohide={delay > 0 && autohide}
            {...props}
        >
            <BootstrapToast.Header
                closeButton={false}
                className={`plus-toast-header ${headerClass}`}
            >
                <div className="plus-toast-icon">
                    {/*
                      * #325. Decorative, and now marked so — every other icon in
                      * these components is `aria-hidden` and this one was not.
                      * The title beside it carries the meaning.
                      */}
                    <i className={`fas ${iconClass}`} aria-hidden="true"></i>
                </div>
                <strong className="plus-toast-title">{title}</strong>
                {timestamp && <small className="plus-toast-timestamp">{timestamp}</small>}
                {dismissible && (
                    <button
                        type="button"
                        className="plus-toast-close"
                        aria-label="Close"
                        onClick={onClose}
                    >
                        <i className="fas fa-xmark"></i>
                    </button>
                )}
            </BootstrapToast.Header>
            <div className="plus-toast-divider"></div>
            <BootstrapToast.Body className={`plus-toast-body ${bodyClass}`}>
                {children}
            </BootstrapToast.Body>
        </BootstrapToast>
    );
};

Toast.propTypes = {
    id: PropTypes.string,
    style: PropTypes.oneOf(['secondary', 'success', 'danger', 'warning', 'info', 'primary']),
    title: PropTypes.node.isRequired,
    children: PropTypes.node.isRequired,
    dismissible: PropTypes.bool,
    show: PropTypes.bool,
    onClose: PropTypes.func,
    delay: PropTypes.number,
    autohide: PropTypes.bool,
    className: PropTypes.string,
    headerClass: PropTypes.string,
    bodyClass: PropTypes.string,
    timestamp: PropTypes.node
};

export const ToastContainer = ({
    position = 'top-end', // 'top-start', 'top-center', 'top-end', 'middle-start', etc.
    className = '',
    children,
    ...props
}) => {
    // Map legacy positions if needed
    const mapPosition = (pos) => {
        if (pos === 'top-right') return 'top-end';
        if (pos === 'top-left') return 'top-start';
        if (pos === 'bottom-right') return 'bottom-end';
        if (pos === 'bottom-left') return 'bottom-start';
        return pos;
    };

    return (
        <BootstrapToastContainer
            position={mapPosition(position)}
            className={`plus-toast-container ${className}`}
            {...props}
        >
            {children}
        </BootstrapToastContainer>
    );
};

ToastContainer.propTypes = {
    position: PropTypes.string,
    className: PropTypes.string,
    children: PropTypes.node
};

export default Toast;
