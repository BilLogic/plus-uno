import React from 'react';
import PropTypes from 'prop-types';
import './PatternModal.scss';

/**
 * Modal pattern for PLUS design system.
 * Modal shell rendered inline (no portal/backdrop): header with title + close
 * button, body slot with internal scroll (`maxHeight`), and footer slot.
 * Baked-in tokens: `--color-surface-container-high` background, elevation 3,
 * modal radius/padding/gap tokens.
 * Mirrors the "Modal" slot component in the Figma design system file.
 * For a real overlay dialog (backdrop, focus trap), use the core Modal component.
 */
const PatternModal = ({
    id,
    title,
    onClose,
    footer,
    maxHeight,
    padding = 'md',
    gap = 'md',
    className = '',
    style,
    children,
    ...props
}) => {
    const reactId = React.useId();

    const classes = [
        'plus-pattern-modal',
        `plus-pattern-modal-pad-${padding}`,
        `plus-pattern-modal-gap-${gap}`,
        className,
    ].filter(Boolean).join(' ');

    const modalStyle = {
        ...style,
        maxHeight: maxHeight ?? style?.maxHeight,
    };

    // A `role="dialog"` needs an accessible name. The header title is the name
    // whenever there is one, so point `aria-labelledby` at it; a caller that
    // renders a title-less modal has to pass its own `aria-label`, which flows
    // through `...props`.
    const titleId = `${reactId}-title`;
    const labelledBy = title ? titleId : undefined;

    // The body is `overflow-y: auto`, so once a max height constrains it the
    // content scrolls — and a scrollable region that holds no focusable content
    // is unreachable by keyboard. Give it a tab stop exactly when it can
    // scroll, rather than adding one to every modal.
    const bodyScrolls = (maxHeight ?? style?.maxHeight) != null;

    return (
        <div
            id={id}
            className={classes}
            style={modalStyle}
            role="dialog"
            aria-modal="false"
            aria-labelledby={labelledBy}
            {...props}
        >
            <div className="plus-pattern-modal-header">
                {title && <h2 id={titleId} className="plus-pattern-modal-title h5">{title}</h2>}
                {onClose && (
                    <button
                        type="button"
                        className="plus-pattern-modal-close"
                        aria-label="Close"
                        onClick={onClose}
                    >
                        <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                    </button>
                )}
            </div>
            <div className="plus-pattern-modal-body" tabIndex={bodyScrolls ? 0 : undefined}>{children}</div>
            {footer && <div className="plus-pattern-modal-footer">{footer}</div>}
        </div>
    );
};

PatternModal.propTypes = {
    id: PropTypes.string,
    /** Modal title in the header row */
    title: PropTypes.node,
    /** Close handler — renders the close button when provided */
    onClose: PropTypes.func,
    /** Footer slot (typically action buttons) */
    footer: PropTypes.node,
    /** Max height constraint; the body scrolls internally past it */
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** Padding scale (modal padding tokens) */
    padding: PropTypes.oneOf(['sm', 'md', 'lg']),
    /** Gap scale between header, body, and footer (modal gap tokens) */
    gap: PropTypes.oneOf(['sm', 'md', 'lg']),
    className: PropTypes.string,
    style: PropTypes.object,
    /** Body content slot */
    children: PropTypes.node,
};

export default PatternModal;
