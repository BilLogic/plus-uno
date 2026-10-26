import React, { useId, useState } from 'react';
import PropTypes from 'prop-types';
import './Disclosure.css';

/**
 * Disclosure: a row that shows one line and reveals the rest on demand.
 *
 * - The row's text is a button (`aria-expanded`, `aria-controls`) with a
 *   chevron at the end that turns when open.
 * - `leading` sits before the button and outside it, so a checkbox there stays
 *   its own control (never a control inside a button).
 * - `muted` strikes the title through, for a done checklist item.
 * - Controlled with `open` + `onOpenChange`, or uncontrolled with `defaultOpen`.
 * - Rows in a list divide with a hairline; there is no side stripe.
 */
const Disclosure = ({ title, leading, children, open, defaultOpen = false, onOpenChange, muted = false, titleId, className = '' }) => {
    const uid = useId();
    const [inner, setInner] = useState(defaultOpen);
    const isOpen = open ?? inner;
    const panelId = `${uid}-panel`;
    const toggle = () => {
        if (open === undefined) setInner(!isOpen);
        onOpenChange?.(!isOpen);
    };
    return (
        <div className={['tr-disclosure', isOpen ? 'tr-disclosure--open' : '', muted ? 'tr-disclosure--muted' : '', className].filter(Boolean).join(' ')}>
            <div className="tr-disclosure__row">
                {leading}
                <button type="button" className="tr-disclosure__toggle" aria-expanded={isOpen} aria-controls={panelId} onClick={toggle}>
                    <span id={titleId} className="tr-disclosure__title">{title}</span>
                    <i className="fa-solid fa-chevron-down tr-disclosure__chevron" aria-hidden="true" />
                </button>
            </div>
            <div id={panelId} className="tr-disclosure__panel" hidden={!isOpen}>
                {children}
            </div>
        </div>
    );
};

Disclosure.propTypes = {
    /** The one line that always shows */
    title: PropTypes.node.isRequired,
    /** A control before the title, outside the toggle: a checkbox */
    leading: PropTypes.node,
    /** What the row reveals */
    children: PropTypes.node,
    open: PropTypes.bool,
    defaultOpen: PropTypes.bool,
    /** Called with the next open state */
    onOpenChange: PropTypes.func,
    /** Strike the title through (a done item) */
    muted: PropTypes.bool,
    /** Id for the title, so a leading checkbox can be labelled by it */
    titleId: PropTypes.string,
    className: PropTypes.string,
};

export default Disclosure;
