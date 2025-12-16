import React from 'react';
import PropTypes from 'prop-types';
import Nav from 'react-bootstrap/Nav';

/**
 * SidebarTab component for PLUS design system.
 * Universal element component for sidebar navigation tabs.
 * Uses React Bootstrap Nav.Link as base.
 */
const SidebarTab = ({
    text,
    icon,
    state = 'enabled',
    leadingVisual = true,
    trailingVisual = false,
    id,
    onClick,
    className = '',
    style
}) => {
    // Map 'state' to Bootstrap/Nav props
    const disabled = state === 'disabled';
    const active = state === 'selected';

    // Additional classes for specific states if not covered by standard Bootstrap
    // 'hover' and 'focus' are usually handled by CSS pseudo-classes on the element, 
    // but if we need to force it (for storybook demo), we might need a utility class.
    const stateClass = state === 'hover' ? 'hover' : state === 'focus' ? 'focus' : '';

    return (
        <Nav.Link
            as="div" // Render as div to match legacy structure if needed, or keep as 'a'/button. Legacy used div.
            // Using 'div' with role='button' is safer for now to avoid anchor styling conflicts unless we want them.
            // Actually, Nav.Link renders an anchor by default. If we use 'as="div"', we lose some a11y unless we add it back.
            // Let's us 'div' but add role button to match legacy behavior strictly while using RB styles.
            id={id}
            className={`plus-sidebar-tab ${stateClass} d-flex align-items-center gap-2 ${className}`}
            active={active}
            disabled={disabled}
            onClick={!disabled ? onClick : undefined}
            style={{
                width: '184px',
                padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)',
                borderRadius: 'var(--size-modal-radius-md)',
                ...style
            }}
            role="button"
            tabIndex={disabled ? -1 : 0}
        >
            {leadingVisual && icon && (
                <div className="d-flex align-items-center justify-content-center" style={{ width: '11px', flexShrink: 0 }}>
                    <i className={`fas fa-${icon}`} style={{ fontSize: 'var(--font-size-fa-body2-solid)' }} />
                </div>
            )}

            <div className="body2-txt flex-grow-1 text-truncate">
                {text}
            </div>

            {trailingVisual && (
                <div className="d-flex align-items-center justify-content-center">
                    <i className="fas fa-icons text-muted" />
                </div>
            )}
        </Nav.Link>
    );
};

SidebarTab.propTypes = {
    text: PropTypes.string.isRequired,
    icon: PropTypes.string,
    state: PropTypes.oneOf(['enabled', 'hover', 'selected', 'disabled', 'focus']),
    leadingVisual: PropTypes.bool,
    trailingVisual: PropTypes.bool,
    id: PropTypes.string,
    onClick: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default SidebarTab;
