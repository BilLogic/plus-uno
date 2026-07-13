import React from 'react';
import PropTypes from 'prop-types';
import './SidebarTab.scss';

/**
 * SidebarTab Component
 * 
 * Sidebar navigation tab with state-based styling.
 * Per Figma spec: node-id=111-227838
 * 
 * Colors per Figma:
 * - enabled: transparent bg, on-surface text, ON-SURFACE-VARIANT icon (#3f484a)
 * - hover: primary-12 bg, primary-text color (#00547e), primary icon (#0472a8)
 * - selected: primary-16 bg, primary-text color (#00547e), primary icon (#0472a8)
 * - disabled: transparent bg, on-surface text, 0.38 opacity
 * - focus: primary-12 bg, primary-text color, 2px outline
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
    const disabled = state === 'disabled';
    const isSelected = state === 'selected';
    const isHover = state === 'hover';
    const isFocus = state === 'focus';

    // State-based colors per Figma spec
    const stateStyles = {
        enabled: {
            backgroundColor: 'transparent',
            color: 'var(--color-on-surface)',
            iconColor: 'var(--color-on-surface-variant)' // FIX: changed from -primary-text to on-surface-variant
        },
        hover: {
            backgroundColor: 'rgba(0, 101, 142, 0.12)', // primary-12
            color: 'var(--color-primary-text)',
            iconColor: 'var(--color-primary)'
        },
        selected: {
            backgroundColor: 'rgba(0, 101, 142, 0.16)', // primary-16
            color: 'var(--color-primary-text)',
            iconColor: 'var(--color-primary)',
            fontWeight: 400
        },
        focus: {
            backgroundColor: 'rgba(0, 101, 142, 0.12)', // primary-12
            color: 'var(--color-primary-text)',
            iconColor: 'var(--color-primary)',
            outline: '2px solid var(--color-primary)',
            outlineOffset: '-2px'
        },
        disabled: {
            backgroundColor: 'transparent',
            color: 'var(--color-on-surface)',
            iconColor: 'var(--color-on-surface-variant)',
            opacity: 0.38
        }
    };

    const currentStateStyle = stateStyles[state] || stateStyles.enabled;
    const { iconColor, fontWeight, ...containerStyles } = currentStateStyle;

    return (
        <div
            id={id}
            className={`plus-sidebar-tab plus-sidebar-tab--${state} ${className}`}
            onClick={!disabled ? onClick : undefined}
            role="button"
            tabIndex={disabled ? -1 : 0}
            style={{
                display: 'flex',
                alignItems: 'center',
                width: '184px',
                padding: 'var(--size-element-pad-y-lg) var(--size-element-pad-x-lg)',
                gap: 'var(--size-element-gap-md)',
                borderRadius: 'var(--size-modal-radius-md)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s ease',
                ...containerStyles,
                ...style
            }}
        >
            {leadingVisual && icon && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '11px',
                        flexShrink: 0
                    }}
                >
                    <i
                        className={`fas fa-${icon}`}
                        style={{
                            fontSize: '12px',
                            color: iconColor
                        }}
                    />
                </div>
            )}

            <span
                className="body2-txt"
                style={{
                    flexGrow: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: fontWeight || 300,
                    textAlign: 'left'
                }}
            >
                {text}
            </span>

            {trailingVisual && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-icons" style={{ color: 'var(--color-on-surface-variant)', fontSize: '12px' }} />
                </div>
            )}
        </div>
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
