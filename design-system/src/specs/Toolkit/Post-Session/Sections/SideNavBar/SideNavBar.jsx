import React from 'react';
import PropTypes from 'prop-types';
import { Button, ProgressTracker, SidebarTab } from '@/components';

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
     * @param {boolean} current
     * @param {boolean} done
     * @param {boolean} [blocked]
     * @returns {'current'|'visited'|'disabled'|'unvisited'}
     */
    const statusFor = (current, done, blocked = false) => {
        if (current) return 'current';
        if (done) return 'visited';
        if (blocked) return 'disabled';
        return 'unvisited';
    };

    const beforeStudents = [
        {
            id: 'session-information',
            label: 'Session Information',
            status: statusFor(activeTab === 'session-information', sessionInfoDone),
            onClick: () => onTabClick?.('session-information'),
        },
        {
            id: 'student-reflection',
            label: 'Student Reflection',
            status: statusFor(onStudentStep, studentDone, !sessionInfoDone),
            onClick: () => onTabClick?.(students.length ? 'student-0' : 'student-reflection'),
        },
    ];

    const afterStudents = [
        {
            id: 'session-reflection',
            label: 'Session Reflection',
            status: statusFor(
                activeTab === 'session-reflection',
                sessionDone,
                !sessionInfoDone || !studentDone,
            ),
            onClick: () => onTabClick?.('session-reflection'),
        },
        ...(showSelfReflection ? [{
            id: 'self-reflection',
            label: 'Self Reflection',
            status: statusFor(activeTab === 'self-reflection', selfDone, !sessionDone),
            onClick: () => onTabClick?.('self-reflection'),
        }] : []),
        ...(showFormFeedback ? [{
            id: 'form-feedback',
            label: 'Form Feedback',
            status: statusFor(
                activeTab === 'form-feedback',
                Boolean(completedSections['form-feedback']),
                !sessionDone || (showSelfReflection && !selfDone),
            ),
            onClick: () => onTabClick?.('form-feedback'),
        }] : []),
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)', minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-sm)' }}>
                <ProgressTracker orientation="vertical" spacing="compact" items={beforeStudents} label={label} />

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

                <ProgressTracker
                    orientation="vertical"
                    spacing="compact"
                    items={afterStudents}
                    label={`${label}, continued`}
                />
            </div>

            <Button
                text="Submit"
                appearance={canSubmit ? 'primary' : 'default'}
                isDisabled={!canSubmit}
                shouldFitContainer
                onClick={() => onSubmit?.()}
            />
        </div>
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
