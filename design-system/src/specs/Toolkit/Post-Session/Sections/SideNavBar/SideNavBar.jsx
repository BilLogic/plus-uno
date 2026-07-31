import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/actions/Button';
import './SideNavBar.scss';

/**
 * Single side-nav tab row for the reflection flow.
 * Selected state paints the primary-16 pill — only for section tabs, not student names.
 *
 * @param {object} props
 * @param {string} props.text
 * @param {'enabled'|'selected'|'disabled'|'active-text'} [props.state='enabled']
 * @param {'section'|'student'} [props.variant='section']
 * @param {React.ReactNode} [props.trailingIcon]
 * @param {() => void} [props.onClick]
 */
const SideBarTab = ({
    text = 'Tab Title',
    state = 'enabled',
    variant = 'section',
    trailingIcon = null,
    onClick,
}) => {
    const isSelected = state === 'selected';
    const isDisabled = state === 'disabled';
    const isActiveText = state === 'active-text';

    const className = [
        'post-session-side-nav-tab',
        variant === 'student' ? 'post-session-side-nav-tab--student' : '',
        isSelected ? 'post-session-side-nav-tab--selected' : '',
        isDisabled ? 'post-session-side-nav-tab--disabled' : '',
        isActiveText ? 'post-session-side-nav-tab--active-text' : '',
    ].filter(Boolean).join(' ');

    return (
        <div
            role="button"
            tabIndex={isDisabled ? -1 : 0}
            aria-disabled={isDisabled || undefined}
            aria-current={isSelected || isActiveText ? 'step' : undefined}
            className={className}
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
                className={[
                    'post-session-side-nav-tab__label',
                    isSelected || isActiveText ? 'body2-txt font-weight-semibold' : 'body2-txt',
                ].join(' ')}
            >
                {text}
            </span>
            {trailingIcon && (
                <span className="post-session-side-nav-tab__icon" aria-hidden="true">
                    {trailingIcon}
                </span>
            )}
        </div>
    );
};

SideBarTab.propTypes = {
    text: PropTypes.string,
    state: PropTypes.oneOf(['enabled', 'selected', 'disabled', 'active-text']),
    variant: PropTypes.oneOf(['section', 'student']),
    trailingIcon: PropTypes.node,
    onClick: PropTypes.func,
};

/**
 * @param {boolean} complete
 * @returns {React.ReactNode|null}
 */
const completeIcon = (complete) =>
    complete ? (
        <i className="fa-solid fa-circle-check" aria-hidden="true" />
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
    showSelfReflection = true,
    showFormFeedback = true,
}) => {
    const onStudentStep = activeTab === 'student-reflection' || Boolean(activeTab?.startsWith('student-'));
    const sessionInfoDone = Boolean(completedSections['session-information']) || state !== 'pre-student-add';
    const studentDone = Boolean(completedSections['student-reflection']);
    const sessionDone = Boolean(completedSections['session-reflection']);
    const selfDone = Boolean(completedSections['self-reflection']);

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
        <div className="post-session-side-nav">
            <div className="post-session-side-nav__tabs">
                <SideBarTab
                    text="Session Information"
                    state={sectionState(activeTab === 'session-information')}
                    trailingIcon={completeIcon(sessionInfoDone && activeTab !== 'session-information')}
                    onClick={() => onTabClick?.('session-information')}
                />

                <div className="post-session-side-nav__student-stack">
                    <SideBarTab
                        text="Student Reflection"
                        state={sectionState(
                            onStudentStep || activeTab === 'student-reflection',
                            !sessionInfoDone,
                        )}
                        trailingIcon={completeIcon(studentDone && !onStudentStep)}
                        onClick={() => onTabClick?.(students.length ? 'student-0' : 'student-reflection')}
                    />

                    {students.length > 0 && onStudentStep && students.map((student, index) => {
                        const isActive = activeTab === `student-${index}`;
                        return (
                            <SideBarTab
                                key={student.id || student.name || index}
                                text={student.name}
                                variant="student"
                                state={isActive ? 'active-text' : 'enabled'}
                                onClick={() => onTabClick?.(`student-${index}`)}
                            />
                        );
                    })}
                </div>

                <SideBarTab
                    text="Session Reflection"
                    state={sectionState(
                        activeTab === 'session-reflection',
                        !sessionInfoDone || !studentDone,
                    )}
                    trailingIcon={completeIcon(sessionDone)}
                    onClick={() => onTabClick?.('session-reflection')}
                />
                {showSelfReflection && (
                    <SideBarTab
                        text="Self Reflection"
                        state={sectionState(
                            activeTab === 'self-reflection',
                            !sessionDone,
                        )}
                        trailingIcon={completeIcon(selfDone)}
                        onClick={() => onTabClick?.('self-reflection')}
                    />
                )}
                {showFormFeedback && (
                    <SideBarTab
                        text="Form Feedback"
                        state={sectionState(
                            activeTab === 'form-feedback',
                            !sessionDone || (showSelfReflection && !selfDone),
                        )}
                        trailingIcon={completeIcon(Boolean(completedSections['form-feedback']))}
                        onClick={() => onTabClick?.('form-feedback')}
                    />
                )}
            </div>

            <div className="post-session-side-nav__submit">
                <Button
                    text="Submit"
                    style={canSubmit ? 'primary' : 'default'}
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
    showSelfReflection: PropTypes.bool,
    showFormFeedback: PropTypes.bool,
};

export default SideNavBar;
