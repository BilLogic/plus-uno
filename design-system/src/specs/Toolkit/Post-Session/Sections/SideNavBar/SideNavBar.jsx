import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/actions/Button';

/**
 * Single side-nav tab row for the reflection flow.
 * Selected state paints the primary-16 pill — only for section tabs, not student names.
 *
 * @param {object} props
 * @param {string} props.text
 * @param {'enabled'|'selected'|'disabled'|'active-text'} [props.state='enabled']
 * @param {React.ReactNode} [props.trailingIcon]
 * @param {() => void} [props.onClick]
 */
const SideBarTab = ({
    text = 'Tab Title',
    state = 'enabled',
    trailingIcon = null,
    onClick,
}) => {
    const isSelected = state === 'selected';
    const isDisabled = state === 'disabled';
    const isActiveText = state === 'active-text';

    return (
        <div
            role="button"
            tabIndex={isDisabled ? -1 : 0}
            aria-disabled={isDisabled || undefined}
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
                className={isSelected || isActiveText ? 'body2-txt font-weight-semibold' : 'body2-txt'}
                style={{
                    flex: '1 0 0',
                    color: (isSelected || isActiveText)
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
                        opacity: isDisabled ? 0.38 : 1,
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
    state: PropTypes.oneOf(['enabled', 'selected', 'disabled', 'active-text']),
    trailingIcon: PropTypes.node,
    onClick: PropTypes.func,
};

/**
 * @param {boolean} complete
 * @returns {React.ReactNode|null}
 */
const completeIcon = (complete) =>
    complete ? (
        <i
            className="fa-solid fa-circle-check"
            style={{ color: 'var(--color-success-text, var(--color-success))' }}
            aria-hidden="true"
        />
    ) : null;

/**
 * Reflection flow side navigation (Figma Side Nav Bar — `20:24229`).
 *
 * Student name rows never get the selected pill background — only primary text
 * when that student is active (Figma students-confirmed).
 *
 * @param {object} props
 */
const SideNavBar = ({
    state = 'pre-student-add',
    students = [],
    activeTab,
    onTabClick,
    completedSections = {},
    canSubmit = false,
    onSubmit,
}) => {
    const onStudentStep = activeTab === 'student-reflection' || Boolean(activeTab?.startsWith('student-'));
    const sessionInfoDone = Boolean(completedSections['session-information']) || state !== 'pre-student-add';
    const studentDone = Boolean(completedSections['student-reflection']) || state === 'in-progress';

    /**
     * @param {boolean} selected
     * @param {boolean} [muted]
     * @returns {'selected'|'enabled'|'disabled'}
     */
    const sectionState = (selected, muted = false) => {
        if (selected) return 'selected';
        return muted ? 'disabled' : 'enabled';
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 'var(--size-section-gap-sm)',
                padding: 'var(--size-section-pad-y-sm) var(--size-section-pad-x-sm)',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: 'var(--size-border-radius-4-5, 16px)',
                width: '219px',
                maxWidth: '219px',
                alignSelf: 'flex-start',
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    width: '100%',
                }}
            >
                <SideBarTab
                    text="Session Information"
                    state={sectionState(activeTab === 'session-information')}
                    trailingIcon={completeIcon(sessionInfoDone && activeTab !== 'session-information')}
                    onClick={() => onTabClick?.('session-information')}
                />

                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <SideBarTab
                        text="Student Reflection"
                        state={sectionState(onStudentStep, !sessionInfoDone && state === 'pre-student-add')}
                        trailingIcon={completeIcon(studentDone && !onStudentStep)}
                        onClick={() => onTabClick?.(students.length ? 'student-0' : 'student-reflection')}
                    />

                    {students.length > 0 && onStudentStep && students.map((student, index) => {
                        const isActive = activeTab === `student-${index}`;
                        return (
                            <div
                                key={student.id || student.name || index}
                                style={{ paddingLeft: '32px', width: '100%' }}
                            >
                                <SideBarTab
                                    text={student.name}
                                    state={isActive ? 'active-text' : 'enabled'}
                                    trailingIcon={completeIcon(student.status === 'complete')}
                                    onClick={() => onTabClick?.(`student-${index}`)}
                                />
                            </div>
                        );
                    })}
                </div>

                <SideBarTab
                    text="Session Reflection"
                    state={sectionState(activeTab === 'session-reflection')}
                    trailingIcon={completeIcon(Boolean(completedSections['session-reflection']))}
                    onClick={() => onTabClick?.('session-reflection')}
                />
                <SideBarTab
                    text="Self Reflection"
                    state={sectionState(activeTab === 'self-reflection')}
                    trailingIcon={completeIcon(Boolean(completedSections['self-reflection']))}
                    onClick={() => onTabClick?.('self-reflection')}
                />
                <SideBarTab
                    text="Form Feedback"
                    state={sectionState(activeTab === 'form-feedback')}
                    trailingIcon={completeIcon(Boolean(completedSections['form-feedback']))}
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
                    block
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
