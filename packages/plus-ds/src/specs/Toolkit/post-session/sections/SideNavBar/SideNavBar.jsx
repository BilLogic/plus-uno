import React from 'react';
import PropTypes from 'prop-types';
import Button from '../../../../../components/Button';

const SideBarTab = ({
    text = 'Tab Title',
    state = 'enabled',
    trailingIcon = null,
    onClick,
}) => {
    const isSelected = state === 'selected';
    const isDisabled = state === 'disabled';

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 16px',
                width: '100%',
                cursor: isDisabled ? 'default' : 'pointer',
                borderRadius: isSelected ? 'var(--size-legacy-radius-3, 6px)' : undefined,
                backgroundColor: isSelected ? 'var(--color-primary-state-16)' : undefined,
            }}
            onClick={!isDisabled ? onClick : undefined}
        >
            <span
                className={isSelected ? 'body2-txt font-weight-semibold' : 'body2-txt'}
                style={{
                    flex: '1 0 0',
                    color: isSelected
                        ? 'var(--color-primary-text)'
                        : 'var(--color-on-surface)',
                    opacity: isDisabled ? 0.38 : 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {text}
            </span>
            {trailingIcon && (
                <span
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: 'var(--color-on-surface-variant)',
                    }}
                >
                    {trailingIcon}
                </span>
            )}
        </div>
    );
};

const SideNavBar = ({
    state = 'default',
    students = [],
    activeTab,
    onTabClick,
}) => {
    const isCollapsed = state === 'collapsed';

    if (isCollapsed) {
        return (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 0', borderRadius: '16px' }}>
                <Button style="primary" fill="tonal" size="medium" leadingVisual="bars" />
            </div>
        );
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-section-gap-sm, 8px)',
                padding: 'var(--size-section-pad-y-sm, 16px) var(--size-section-pad-x-sm, 16px)',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: '16px',
                minWidth: '240px',
                width: '240px',
                alignSelf: 'flex-start',
                flexShrink: 0,
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <SideBarTab
                    text="Session Information"
                    state={activeTab === 'session-information' ? 'selected' : 'enabled'}
                    onClick={() => onTabClick?.('session-information')}
                />

                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <SideBarTab
                        text="Student Reflection"
                        state={activeTab === 'student-reflection' ? 'selected' : 'enabled'}
                        onClick={() => onTabClick?.('student-reflection')}
                    />

                    {students.map((student, index) => (
                        <div key={index} style={{ paddingLeft: '16px' }}>
                            <SideBarTab
                                text={student.name}
                                state={activeTab === `student-${index}` ? 'selected' : 'enabled'}
                                trailingIcon={student.status === 'complete' ? <i className="fa-solid fa-check" style={{ color: 'var(--color-success)' }}></i> : null}
                                onClick={() => onTabClick?.(`student-${index}`)}
                            />
                        </div>
                    ))}
                </div>

                <SideBarTab
                    text="Session Reflection"
                    state={activeTab === 'session-reflection' ? 'selected' : 'enabled'}
                    onClick={() => onTabClick?.('session-reflection')}
                />
                <SideBarTab
                    text="Self Reflection"
                    state={activeTab === 'self-reflection' ? 'selected' : 'enabled'}
                    onClick={() => onTabClick?.('self-reflection')}
                />
            </div>
            {/* Submit Button with correct Figma opacity (38%) */}
            <div style={{ opacity: activeTab !== 'submission' ? 0.38 : 1, width: '100%' }}>
                <Button
                    text="Submit"
                    style="default"
                    fill="filled"
                    size="medium"
                    disabled={activeTab !== 'submission'}
                    block={true}
                    onClick={() => onTabClick?.('submission')}
                />
            </div>
        </div>
    );
};

SideNavBar.propTypes = {
    state: PropTypes.string,
    students: PropTypes.array,
    activeTab: PropTypes.string,
    onTabClick: PropTypes.func,
};

export default SideNavBar;
