import React, { cloneElement, isValidElement, useEffect, useId, useState } from 'react';
import PropTypes from 'prop-types';
import './HintTooltip.css';

/**
 * HintTooltip: the words behind a mark. A chart mark (a target tick, a range
 * outline, a bar) carries no text beside it; this shows the words on hover and
 * on keyboard focus, and Escape hides them.
 *
 * - The child is the trigger. It gets `aria-describedby` pointing at the tip,
 *   so a screen reader hears the hint with the mark. Make the child focusable
 *   (`tabIndex={0}`) when it is not a control already.
 * - `pinned` keeps the tip open, for screenshots and the vision renders.
 * - `at` places the tip's arrow along the trigger, as a CSS length or percent
 *   (a target at 95% puts the tip over the tick).
 */
const HintTooltip = ({ hint, children, pinned = false, at = '50%', placement = 'top', className = '' }) => {
    const id = useId();
    const [open, setOpen] = useState(false);
    const shown = pinned || open;

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    const trigger = isValidElement(children)
        ? cloneElement(children, { 'aria-describedby': [children.props['aria-describedby'], id].filter(Boolean).join(' ') })
        : children;

    return (
        <span
            className={['tr-hint', shown ? 'tr-hint--open' : '', className].filter(Boolean).join(' ')}
            onPointerEnter={() => setOpen(true)}
            onPointerLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
        >
            {trigger}
            <span
                id={id}
                role="tooltip"
                className={`tr-hint__tip tr-hint__tip--${placement}`}
                style={{ '--tr-hint-at': at }}
                data-open={shown ? 'true' : 'false'}
            >
                {hint}
            </span>
        </span>
    );
};

HintTooltip.propTypes = {
    /** The words: what the mark means, e.g. "92% now, target 95% by Feb 1" */
    hint: PropTypes.node.isRequired,
    /** The trigger; it gets `aria-describedby` */
    children: PropTypes.node.isRequired,
    /** Keep the tip open (screenshots, the pinned state on a board) */
    pinned: PropTypes.bool,
    /** Where along the trigger the tip points, as a CSS length or percent */
    at: PropTypes.string,
    placement: PropTypes.oneOf(['top', 'bottom']),
    className: PropTypes.string,
};

export default HintTooltip;
