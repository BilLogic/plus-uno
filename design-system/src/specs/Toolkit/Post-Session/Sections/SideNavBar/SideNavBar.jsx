import React from 'react';
import PropTypes from 'prop-types';
import { Button, SidebarTab } from '@/components';

/**
 * @param {boolean} complete
 * @returns {React.ReactNode|null}
 */
const completeIcon = (complete) =>
    complete ? (
        <i
            className="fa-solid fa-circle-check"
            style={{ color: 'var(--ds-icon-success)' }}
            role="img"
            aria-label="Complete"
        />
    ) : null;

/**
 * Step menu for the reflection flow: the list of steps, with Submit under it.
 * It sits in the side column of the step's Section.
 *
 * A step is selected while it is open. While a student is open, Student
 * Reflection stays selected and that student's row is selected under it.
 *
 * @param {object} props
 * @param {string} [props.label='Reflection steps'] - The menu's accessible name; say which when a page holds more than one.
 */
const SideNavBar = ({
    label = 'Reflection steps',
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
        <nav
            aria-label={label}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)', minWidth: 0 }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-sm)' }}>
                <SidebarTab
                    text="Session Information"
                    leadingVisual={false}
                    state={sectionState(activeTab === 'session-information')}
                    elemAfter={completeIcon(sessionInfoDone && activeTab !== 'session-information')}
                    onClick={() => onTabClick?.('session-information')}
                />

                <SidebarTab
                    text="Student Reflection"
                    leadingVisual={false}
                    state={sectionState(onStudentStep, !sessionInfoDone)}
                    elemAfter={completeIcon(studentDone && !onStudentStep)}
                    onClick={() => onTabClick?.(students.length ? 'student-0' : 'student-reflection')}
                />

                {students.length > 0 && onStudentStep && students.map((student, index) => (
                    <SidebarTab
                        key={student.id || student.name || index}
                        text={student.name}
                        leadingVisual={false}
                        state={activeTab === `student-${index}` ? 'selected' : 'enabled'}
                        style={{ marginInlineStart: 'var(--space-100)' }}
                        onClick={() => onTabClick?.(`student-${index}`)}
                    />
                ))}

                <SidebarTab
                    text="Session Reflection"
                    leadingVisual={false}
                    state={sectionState(
                        activeTab === 'session-reflection',
                        !sessionInfoDone || !studentDone,
                    )}
                    elemAfter={completeIcon(sessionDone)}
                    onClick={() => onTabClick?.('session-reflection')}
                />
                {showSelfReflection && (
                    <SidebarTab
                        text="Self Reflection"
                        leadingVisual={false}
                        state={sectionState(
                            activeTab === 'self-reflection',
                            !sessionDone,
                        )}
                        elemAfter={completeIcon(selfDone)}
                        onClick={() => onTabClick?.('self-reflection')}
                    />
                )}
                {showFormFeedback && (
                    <SidebarTab
                        text="Form Feedback"
                        leadingVisual={false}
                        state={sectionState(
                            activeTab === 'form-feedback',
                            !sessionDone || (showSelfReflection && !selfDone),
                        )}
                        elemAfter={completeIcon(Boolean(completedSections['form-feedback']))}
                        onClick={() => onTabClick?.('form-feedback')}
                    />
                )}
            </div>

            <Button
                text="Submit"
                appearance={canSubmit ? 'primary' : 'default'}
                isDisabled={!canSubmit}
                shouldFitContainer
                onClick={() => onSubmit?.()}
            />
        </nav>
    );
};

SideNavBar.propTypes = {
    label: PropTypes.string,
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
