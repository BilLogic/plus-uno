import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import CloseButton from '@/components/forms-and-inputs/CloseButton';
import './Flag.scss';

/**
 * How long a success or info flag stays before it closes itself. Warning and
 * error flags stay until they are dismissed: they ask for something to be done.
 */
export const FLAG_AUTO_CLOSE_MS = 8000;

/**
 * Each style's icon, as Pattern/Flag draws it, and whether it is urgent:
 * an urgent flag interrupts a screen reader and stays until it is dismissed.
 */
const FLAG_STYLES = {
    danger: { icon: 'fa-circle-exclamation', urgent: true },
    warning: { icon: 'fa-triangle-exclamation', urgent: true },
    success: { icon: 'fa-circle-check', urgent: false },
    info: { icon: 'fa-circle-info', urgent: false },
    primary: { icon: 'fa-circle-info', urgent: false },
    secondary: { icon: 'fa-circle-info', urgent: false },
};

/**
 * The Popover family's Flag (Figma Pattern/Flag). One surface, 400 wide,
 * padded 16: a 16 icon in the style's icon color on the title's first line,
 * the title and its message, and the close button.
 */
export const Flag = ({
    id,
    style = 'secondary', // 'secondary' (default), 'success', 'danger', 'warning', 'info', 'primary'
    title,
    children, // Body text/content
    dismissible = true,
    show = true,
    onClose,
    delay = FLAG_AUTO_CLOSE_MS,
    autohide,
    className = '',
    headerClass = '',
    bodyClass = '',
    timestamp, // '11 mins ago' etc
    ...props
}) => {
    // A style outside the list falls back to the default, secondary.
    const toastStyle = Object.hasOwn(FLAG_STYLES, style) ? style : 'secondary';
    const { icon: iconClass, urgent: isUrgent } = FLAG_STYLES[toastStyle];

    /*
     * #325. Politeness follows the message. Every toast used to be
     * `role="alert"` with `aria-live="assertive"`, so "Saved" cut across
     * whatever a screen reader was in the middle of saying. Assertive is for
     * something that has gone wrong and changes what the user should do next;
     * everything else waits its turn. `role` and `aria-live` are set together
     * because a mismatched pair is worse than either alone.
     */
    const liveRole = isUrgent ? 'alert' : 'status';
    const livePoliteness = isUrgent ? 'assertive' : 'polite';

    /*
     * Success and info close themselves after 8 seconds; warning and error
     * stay until they are dismissed. A caller's `autohide` or `delay` wins.
     */
    const closesItself = autohide ?? !isUrgent;

    // Only the latest onClose fires; changing it mid-countdown does not
    // restart the timer, matching the previous react-bootstrap Toast timing.
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!show || !closesItself || !(delay > 0)) return undefined;
        const timer = setTimeout(() => onCloseRef.current?.(), delay);
        return () => clearTimeout(timer);
    }, [show, closesItself, delay]);

    if (!show) return null;

    return (
        <div
            id={id}
            className={`plus-flag ${toastStyle} ${className}`}
            role={liveRole}
            aria-live={livePoliteness}
            aria-atomic="true"
            {...props}
        >
            {/*
              * The icon sits on the title's first line: a box one title line
              * tall, so a wrapping title keeps it on line 1.
              */}
            <div className="plus-flag-icon">
                {/*
                  * #325. Decorative, and marked so — every other icon in
                  * these components is `aria-hidden`. The title beside it
                  * carries the meaning.
                  */}
                <i className={`fas ${iconClass}`} aria-hidden="true"></i>
            </div>
            <div className="plus-flag-content">
                <div className={`plus-flag-header ${headerClass}`}>
                    <strong className="plus-flag-title">{title}</strong>
                    {timestamp && <small className="plus-flag-timestamp">{timestamp}</small>}
                </div>
                <div className={`plus-flag-body ${bodyClass}`}>
                    {children}
                </div>
            </div>
            {/* The shared CloseButton, default tone on the flag's surface. Its
                name stays "Close", the CloseButton default. */}
            {dismissible && <CloseButton onClick={onClose} />}
        </div>
    );
};

Flag.propTypes = {
    id: PropTypes.string,
    style: PropTypes.oneOf(['secondary', 'success', 'danger', 'warning', 'info', 'primary']),
    title: PropTypes.node.isRequired,
    children: PropTypes.node.isRequired,
    dismissible: PropTypes.bool,
    show: PropTypes.bool,
    onClose: PropTypes.func,
    /** How long it stays before closing itself, in ms. 8000 by default. */
    delay: PropTypes.number,
    /** Close itself after `delay`. Defaults to true for success, info, primary and secondary, false for warning and danger. */
    autohide: PropTypes.bool,
    className: PropTypes.string,
    headerClass: PropTypes.string,
    bodyClass: PropTypes.string,
    timestamp: PropTypes.node
};

// Legacy corner names, mapped onto the logical ones.
const LEGACY_POSITIONS = {
    'top-right': 'top-end',
    'top-left': 'top-start',
    'bottom-right': 'bottom-end',
    'bottom-left': 'bottom-start',
};

/**
 * Where flags sit: bottom-left by default, fixed to the screen,
 * Popover/gap-screen 8 from its edges, stacking Popover/stack-flag 16 apart.
 */
export const FlagContainer = ({
    position = 'bottom-start', // 'top-start', 'top-center', 'top-end', 'middle-start', etc.
    containerPosition = 'fixed',
    className = '',
    children,
    ...props
}) => (
    <div
        data-position={LEGACY_POSITIONS[position] ?? position}
        data-container-position={containerPosition}
        className={`plus-flag-container ${className}`}
        {...props}
    >
        {children}
    </div>
);

FlagContainer.propTypes = {
    position: PropTypes.string,
    /** `fixed` (default) holds the stack to the screen; `absolute` or `static` to a parent. */
    containerPosition: PropTypes.string,
    className: PropTypes.string,
    children: PropTypes.node
};

export default Flag;
