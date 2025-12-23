import React from 'react';
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

    return (
        <BootstrapToast
            id={id}
            className={`plus-toast ${style} ${className}`}
            show={show}
            onClose={onClose}
            delay={delay}
            autohide={delay > 0 && autohide}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            {...props}
        >
            <BootstrapToast.Header
                closeButton={false}
                className={`plus-toast-header ${headerClass}`}
            >
                <div className="plus-toast-icon">
                    <i className={`fas ${iconClass}`}></i>
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
