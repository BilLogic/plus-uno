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
 *
 * `hover` AND `focus` ARE DOCUMENTATION VALUES, NOT BEHAVIOUR (#320). They
 * exist so the design's five states can be laid out side by side in a docs
 * canvas — the real hover and focus appearances come from CSS on the rendered
 * element and need no prop at all.
 *
 * Wiring them to real events is the mistake this note exists to prevent:
 * `onMouseEnter={() => setState('hover')}` re-renders the row on every pointer
 * move, and it still does not follow the keyboard, because a focus that arrives
 * by Tab never touches the pointer handler. Leave `state` on `enabled` or
 * `selected` in an application and let the stylesheet do the rest.
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
            backgroundColor: 'var(--color-primary-state-12)',
            color: 'var(--color-primary-text)',
            iconColor: 'var(--color-primary)'
        },
        selected: {
            backgroundColor: 'var(--color-primary-state-16)',
            color: 'var(--color-primary-text)',
            iconColor: 'var(--color-primary)',
            fontWeight: 400
        },
        focus: {
            backgroundColor: 'var(--color-primary-state-12)',
            color: 'var(--color-primary-text)',
            iconColor: 'var(--color-primary)',
            outline: '2px solid var(--color-primary)',
            outlineOffset: '-2px'
        },
        disabled: {
            backgroundColor: 'transparent',
            color: 'var(--color-on-surface-variant)',
            iconColor: 'var(--color-on-surface-variant)',
            // Prefer solid muted color over opacity so disabled text still meets WCAG AA
        }
    };

    const currentStateStyle = stateStyles[state] || stateStyles.enabled;
    const { iconColor, fontWeight, ...containerStyles } = currentStateStyle;

    return (
        <div
            id={id}
            className={`plus-sidebar-tab plus-sidebar-tab--${state} ${className}`}
            onClick={!disabled ? onClick : undefined}
            /*
             * #320. Enter and Space activate a `button` ELEMENT; they do not
             * activate `role="button"`. Without this handler the row was
             * announced as a button, took a tab stop, and did nothing when
             * pressed — every row of a sidebar reachable and none openable.
             * Space is prevented so the page does not scroll under the press.
             */
            onKeyDown={!disabled && onClick ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onClick(event);
                }
            } : undefined}
            role="button"
            aria-disabled={disabled || undefined}
            /*
             * #320. Which section you are in was a background colour and
             * nothing else. `aria-current="page"` is what says it to anyone
             * not looking at the colour.
             */
            aria-current={isSelected ? 'page' : undefined}
            tabIndex={disabled ? -1 : 0}
            style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                maxWidth: '164px',
                boxSizing: 'border-box',
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
