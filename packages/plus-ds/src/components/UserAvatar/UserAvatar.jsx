import React from 'react';
import PropTypes from 'prop-types';
import Stack from 'react-bootstrap/Stack';
import { Badge } from '@/components/Badge';

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
    const typeClass = type.replace(/\s+/g, '-');

    // Background color logic mapping
    // If state is hover, we rely on CSS or a class, but for inline fallback:
    const bgStyle = state === 'hover' ? 'rgba(25, 28, 30, 0.08)' : 'var(--color-surface-container-lowest)';

    // Badge styles based on type
    const badgeMap = {
        'regular tutor': 'primary',
        'lead tutor': 'primary', // Custom override needed for colors
        'admin': 'secondary'
    };

    // For lead/admin we might need custom style overrides if they don't map to standard variants exactly
    // But assuming 'primary' and 'secondary' map to Bootstrap variants.

    const containerStyle = {
        width: '168px',
        padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)',
        borderRadius: 'var(--size-element-radius-md)',
        backgroundColor: bgStyle,
        cursor: (onClick || state === 'hover') ? 'pointer' : 'default',
        border: 'none', // Reset button borders if we used Button, but Stack is div
    };

    return (
        <Stack
            direction="horizontal"
            gap={2}
            className={`plus-user-avatar plus-user-avatar-${typeClass} plus-user-avatar-${state} ${className}`}
            style={containerStyle}
            onClick={onClick}
            id={id}
        >
            {/* Name Section as a nested Stack or just children */}
            <Stack direction="horizontal" gap={1} className="flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>
                <div className="plus-user-avatar-initial" style={{ width: '24px', height: '24px', flexShrink: 0 }}>
                    <Badge
                        text={firstChar}
                        style={badgeMap[type] || 'primary'}
                        size="b2"
                        className="p-0 w-100 h-100 rounded-circle d-flex align-items-center justify-content-center"
                    />
                </div>
                <p className="m-0 text-truncate body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                    {name}
                </p>
            </Stack>

            {counter && (
                <div className="plus-user-avatar-counter flex-shrink-0">
                    <Badge
                        text={counterValue.toString()}
                        style="danger"
                        size="b3"
                        className="py-0 px-2"
                    />
                </div>
            )}
        </Stack>
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
