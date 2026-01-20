import React from 'react';
import PropTypes from 'prop-types';
import './UserAvatar.scss';

/**
 * UserAvatar Component
 * 
 * Per Figma spec: node-id=111-227876
 * 
 * Colors:
 * - Initial circle: primary-08 bg (#rgba(0,101,142,0.08)), primary-text color (#00547e)
 * - Counter: danger-08 bg (#rgba(190,12,22,0.08)), danger-text color (#9b0606)
 * - Hover: on-surface-08 overlay
 */
const UserAvatar = ({
    firstChar = 'J',
    name = 'John Doe',
    counter = true,
    counterValue = 2,
    state = 'enabled',
    type = 'regular tutor',
    id,
    onClick,
    className = ''
}) => {
    const isHover = state === 'hover';

    return (
        <div
            className={`plus-user-avatar plus-user-avatar--${state} ${className}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--size-element-gap-md)',
                width: '168px',
                padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)',
                borderRadius: 'var(--size-element-radius-md)',
                backgroundColor: isHover ? 'rgba(25, 28, 30, 0.08)' : 'transparent',
                cursor: onClick ? 'pointer' : 'default'
            }}
            onClick={onClick}
            id={id}
        >
            {/* Name Section */}
            <div
                className="plus-user-avatar__name-section"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px', // spacing/space-075
                    flex: '1 1 0',
                    minWidth: 0
                }}
            >
                {/* Initial Badge - primary-08 bg, primary-text color */}
                <div
                    className="plus-user-avatar__initial"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',  // Forced width
                        height: '32px', // Forced height to match
                        borderRadius: '50%', // Perfect circle
                        backgroundColor: 'var(--color-primary-state-08, rgba(0, 101, 142, 0.08))',
                        flexShrink: 0
                    }}
                >
                    <span
                        className="body2-txt"
                        style={{
                            color: 'var(--color-primary-text, #00547e)',
                            fontWeight: 400,
                            lineHeight: 1,
                            textAlign: 'center'
                        }}
                    >
                        {firstChar}
                    </span>
                </div>

                {/* Name Text */}
                <p
                    className="body2-txt plus-user-avatar__name"
                    style={{
                        margin: 0,
                        color: 'var(--color-on-surface)',
                        fontWeight: 300,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: '1 1 0',
                        minWidth: 0
                    }}
                >
                    {name}
                </p>
            </div>

            {/* Counter Badge - danger-08 bg, danger-text color */}
            {counter && (
                <div
                    className="plus-user-avatar__counter"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '12px',
                        padding: '0 var(--size-element-pad-x-sm)',
                        borderRadius: '999px', // radius-full
                        backgroundColor: 'rgba(190, 12, 22, 0.08)', // danger-08
                        flexShrink: 0
                    }}
                >
                    <span
                        className="body3-txt"
                        style={{
                            color: '#9b0606', // danger-text
                            fontWeight: 400,
                            textAlign: 'center'
                        }}
                    >
                        {counterValue}
                    </span>
                </div>
            )}
        </div>
    );
};

UserAvatar.propTypes = {
    firstChar: PropTypes.string,
    name: PropTypes.string,
    counter: PropTypes.bool,
    counterValue: PropTypes.number,
    state: PropTypes.oneOf(['enabled', 'hover']),
    type: PropTypes.oneOf(['regular tutor', 'lead tutor', 'admin']),
    id: PropTypes.string,
    onClick: PropTypes.func,
    className: PropTypes.string
};

export default UserAvatar;
