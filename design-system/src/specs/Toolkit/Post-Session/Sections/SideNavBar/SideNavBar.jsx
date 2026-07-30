import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/actions/Button';

/**
 * Single side-nav tab row for the reflection flow.
 *
 * @param {object} props
 * @param {string} props.text - Tab label
 * @param {'enabled'|'selected'|'disabled'} [props.state='enabled'] - Visual state
 * @param {React.ReactNode} [props.trailingIcon] - Optional trailing icon
 * @param {() => void} [props.onClick] - Click handler
 */
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
            role="button"
            tabIndex={isDisabled ? -1 : 0}
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
            onKeyDown={(event) => {
                if (isDisabled) return;
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onClick?.();
                }
            }}
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

SideBarTab.propTypes = {
    text: PropTypes.string,
    state: PropTypes.oneOf(['enabled', 'selected', 'disabled']),
    trailingIcon: PropTypes.node,
    onClick: PropTypes.func,
};

/**
 * @param {boolean} complete
 * @returns {React.ReactNode|null}
 */
const completeIcon = (complete) =>
    complete ? (
        <i className="fa-solid fa-check" style={{ color: 'var(--color-success)' }} aria-hidden="true" />
    ) : null;

/**
 * Reflection flow side navigation (Session Information → Student → Session → Self → Form Feedback).
 *
 * @param {object} props
 * @param {'default'|'collapsed'} [props.state='default'] - Collapsed shows only the expand control
 * @param {{ name: string, status?: string }[]} [props.students=[]] - Students under Student Reflection
 * @param {string} props.activeTab - Active tab id
 * @param {(tabId: string) => void} [props.onTabClick] - Tab selection handler
 * @param {Record<string, boolean>} [props.completedSections={}] - Section completion map
 * @param {boolean} [props.canSubmit=false] - Enables the Submit button
 * @param {() => void} [props.onSubmit] - Submit handler
 */
const SideNavBar = ({
    state = 'default',
    students = [],
    activeTab,
    onTabClick,
    completedSections = {},
    canSubmit = false,
    onSubmit,
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
                    trailingIcon={completeIcon(completedSections['session-information'])}
                    onClick={() => onTabClick?.('session-information')}
                />

                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <SideBarTab
                        text="Student Reflection"
                        state={activeTab === 'student-reflection' ? 'selected' : 'enabled'}
                        trailingIcon={completeIcon(completedSections['student-reflection'])}
                        onClick={() => onTabClick?.('student-reflection')}
                    />

                    {students.map((student, index) => (
                        <div key={student.id || student.name || index} style={{ paddingLeft: '16px' }}>
                            <SideBarTab
                                text={student.name}
                                state={activeTab === `student-${index}` ? 'selected' : 'enabled'}
                                trailingIcon={completeIcon(student.status === 'complete')}
                                onClick={() => onTabClick?.(`student-${index}`)}
                            />
                        </div>
                    ))}
                </div>

                <SideBarTab
                    text="Session Reflection"
                    state={activeTab === 'session-reflection' ? 'selected' : 'enabled'}
                    trailingIcon={completeIcon(completedSections['session-reflection'])}
                    onClick={() => onTabClick?.('session-reflection')}
                />
                <SideBarTab
                    text="Self Reflection"
                    state={activeTab === 'self-reflection' ? 'selected' : 'enabled'}
                    trailingIcon={completeIcon(completedSections['self-reflection'])}
                    onClick={() => onTabClick?.('self-reflection')}
                />
                <SideBarTab
                    text="Form Feedback"
                    state={activeTab === 'form-feedback' ? 'selected' : 'enabled'}
                    trailingIcon={completeIcon(completedSections['form-feedback'])}
                    onClick={() => onTabClick?.('form-feedback')}
                />
            </div>
            <div style={{ opacity: canSubmit ? 1 : 0.38, width: '100%' }}>
                <Button
                    text="Submit"
                    style="default"
                    fill="filled"
                    size="medium"
                    disabled={!canSubmit}
                    block={true}
                    onClick={() => onSubmit?.()}
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
    completedSections: PropTypes.object,
    canSubmit: PropTypes.bool,
    onSubmit: PropTypes.func,
};

export default SideNavBar;
