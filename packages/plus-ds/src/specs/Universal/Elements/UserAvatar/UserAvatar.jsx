/**
 * UserAvatar Component
 * 
 * User avatar with name and notification counter.
 * Figma Spec: node-id=111-227876
 */

import React from 'react';
import PropTypes from 'prop-types';

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
                    gap: '6px',
                    flex: '1 1 0',
                    minWidth: 0
                }}
            >
                {/* Initial Badge */}
                <div
                    className="plus-user-avatar__initial"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
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

            {/* Counter Badge */}
            {counter && (
                <div
                    className="plus-user-avatar__counter"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '12px',
                        padding: '0 var(--size-element-pad-x-sm)',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(190, 12, 22, 0.08)',
                        flexShrink: 0
                    }}
                >
                    <span
                        className="body3-txt"
                        style={{
                            color: '#9b0606',
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
