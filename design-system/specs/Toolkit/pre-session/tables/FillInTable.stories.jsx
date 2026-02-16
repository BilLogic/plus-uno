import React, { useState } from 'react';
import Button from '../../../../../packages/plus-ds/src/components/Button/Button';
import Badge from '../../../../../packages/plus-ds/src/components/Badge';
import Checkbox from '../../../../../packages/plus-ds/src/forms/Checkbox';

export default {
    title: 'Specs/Toolkit/Pre-Session/Tables/Fill-In',
    parameters: {
        layout: 'padded',
    },
};

/**
 * Fill-In Table Header Row
 * 7-column grid layout matching Figma:
 * - Date & time: col 1-2 (span 2)
 * - School & teacher: col 3-4 (span 2)
 * - Tutor count: col 5-6 (span 2)
 * - Actions: col 7 (span 1)
 */
export const FillInTableHeaderRow = () => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            width: '100%',
            borderRadius: 'var(--size-table-radius-md)'
        }}
    >
        {/* Date & Time Header - spans 2 columns */}
        <div
            style={{
                gridColumn: 'span 2',
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                Date & time
            </span>
        </div>

        {/* School & Teacher Header - spans 2 columns */}
        <div
            style={{
                gridColumn: 'span 2',
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                School & teacher
            </span>
        </div>

        {/* Tutor Count Header - spans 2 columns */}
        <div
            style={{
                gridColumn: 'span 2',
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                Tutor count
            </span>
        </div>

        {/* Actions Header - spans 1 column */}
        <div
            style={{
                gridColumn: 'span 1',
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                Actions
            </span>
        </div>
    </div>
);

/**
 * Fill-In Table Row
 * 7-column grid layout matching Figma:
 * - Date & time: col 1-2 (span 2)
 * - School & teacher: col 3-4 (span 2)
 * - Tutor count: col 5-6 (span 2)
 * - Actions: col 7 (span 1)
 * 
 * Supports needLead prop to show "Need Lead" badge
 */
export const FillInTableRow = ({
    date,
    timeRange,
    school,
    teacher,
    tutorCount,
    needLead = false,
    state: forcedState,
    interactive = true,
    onFillIn
}) => {
    const [currentState, setCurrentState] = useState('default');
    const effectiveState = forcedState || currentState;

    const stateStyles = {
        default: {},
        hover: { backgroundColor: 'var(--color-on-surface-state-08)' },
        pressed: { backgroundColor: 'var(--color-on-surface-state-12)' }
    };

    const handleMouseEnter = interactive && !forcedState ? () => setCurrentState('hover') : undefined;
    const handleMouseLeave = interactive && !forcedState ? () => setCurrentState('default') : undefined;
    const handleMouseDown = interactive && !forcedState ? () => setCurrentState('pressed') : undefined;
    const handleMouseUp = interactive && !forcedState ? () => setCurrentState('hover') : undefined;

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                width: '100%',
                borderRadius: 'var(--size-table-radius-md)',
                cursor: interactive ? 'pointer' : 'default',
                transition: 'background-color 0.15s ease',
                ...stateStyles[effectiveState]
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
        >
            {/* Date & Time - spans 2 columns */}
            <div
                style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                    overflow: 'hidden'
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    {date}
                </span>
                <span className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface)' }}>
                    {timeRange}
                </span>
            </div>

            {/* School & Teacher - spans 2 columns */}
            <div
                style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                    overflow: 'hidden'
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    {school}
                </span>
                {teacher && (
                    <span className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface)' }}>
                        {teacher}
                    </span>
                )}
            </div>

            {/* Tutor Count - spans 2 columns */}
            <div
                style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--size-element-gap-sm)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <span className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface)' }}>
                    {tutorCount}
                </span>
                {needLead && (
                    <Badge
                        text="Need Lead"
                        style="warning"
                        size="b3"
                    />
                )}
            </div>

            {/* Actions - spans 1 column */}
            <div
                style={{
                    gridColumn: 'span 1',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <Button
                    text="Fill in"
                    style="primary"
                    fill="outline"
                    size="small"
                    onClick={onFillIn}
                />
            </div>
        </div>
    );
};

/**
 * Fill-In Modal Header Row (with checkbox)
 * 5-column grid layout for modal:
 * - Checkbox: auto
 * - Date & time: col 1-2 (span 2)
 * - School & teacher: col 3-4 (span 2)
 * - Tutor count: col 5 (span 1)
 */
export const FillInModalHeaderRow = () => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'auto repeat(5, 1fr)',
            width: '100%',
            borderRadius: 'var(--size-table-radius-md)'
        }}
    >
        {/* Checkbox Header - auto width */}
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            {/* Empty space for checkbox alignment */}
        </div>

        {/* Date & Time Header - spans 2 columns */}
        <div
            style={{
                gridColumn: 'span 2',
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                Date & time
            </span>
        </div>

        {/* School & Teacher Header - spans 2 columns */}
        <div
            style={{
                gridColumn: 'span 2',
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                School & teacher
            </span>
        </div>

        {/* Tutor Count Header - spans 1 column */}
        <div
            style={{
                gridColumn: 'span 1',
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                Tutor Count
            </span>
        </div>
    </div>
);

/**
 * Fill-In Modal Row (with checkbox)
 * 5-column grid layout for modal with checkbox selection
 */
export const FillInModalRow = ({
    date,
    timeRange,
    school,
    teacher,
    tutorCount,
    needLead = false,
    checked = false,
    state: forcedState,
    interactive = true,
    onCheckChange
}) => {
    const [currentState, setCurrentState] = useState('default');
    const [isChecked, setIsChecked] = useState(checked);
    const effectiveState = forcedState || currentState;

    const stateStyles = {
        default: {},
        hover: { backgroundColor: 'var(--color-on-surface-state-08)' },
        pressed: { backgroundColor: 'var(--color-on-surface-state-12)' }
    };

    const handleMouseEnter = interactive && !forcedState ? () => setCurrentState('hover') : undefined;
    const handleMouseLeave = interactive && !forcedState ? () => setCurrentState('default') : undefined;
    const handleMouseDown = interactive && !forcedState ? () => setCurrentState('pressed') : undefined;
    const handleMouseUp = interactive && !forcedState ? () => setCurrentState('hover') : undefined;

    const handleCheckboxChange = () => {
        setIsChecked(!isChecked);
        onCheckChange?.(!isChecked);
    };

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'auto repeat(5, 1fr)',
                width: '100%',
                borderRadius: 'var(--size-table-radius-md)',
                cursor: interactive ? 'pointer' : 'default',
                transition: 'background-color 0.15s ease',
                ...stateStyles[effectiveState]
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
        >
            {/* Checkbox - auto width */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <Checkbox
                    checked={isChecked}
                    onChange={handleCheckboxChange}
                    size="small"
                />
            </div>

            {/* Date & Time - spans 2 columns */}
            <div
                style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                    overflow: 'hidden'
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    {date}
                </span>
                <span className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface)' }}>
                    {timeRange}
                </span>
            </div>

            {/* School & Teacher - spans 2 columns */}
            <div
                style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                    overflow: 'hidden'
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    {school}
                </span>
                {teacher && (
                    <span className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface)' }}>
                        {teacher}
                    </span>
                )}
            </div>

            {/* Tutor Count - spans 1 column */}
            <div
                style={{
                    gridColumn: 'span 1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--size-element-gap-sm)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <span className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface)' }}>
                    {tutorCount}
                </span>
                {needLead && (
                    <Badge
                        text="Need Lead"
                        style="warning"
                        size="b3"
                    />
                )}
            </div>
        </div>
    );
};

/**
 * Overview Story
 * Shows all table states: default, hover, pressed
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-xl)', padding: 'var(--size-spacing-space-400)' }}>
        <section>
            <h5 className="h5 mb-4">Fill-In Table</h5>
            <p className="body2-txt mb-4" style={{ color: 'var(--color-on-surface-variant)' }}>
                7-column grid layout for fill-in sessions. Shows date & time, school & teacher, tutor count, and action button.
            </p>

            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Default State</h6>
                <FillInTableHeaderRow />
                <FillInTableRow
                    date="Tue, Sep 9"
                    timeRange="1:00 PM - 1:50 PM"
                    school="Hogwarts"
                    teacher="Mr. Snape"
                    tutorCount="1/5"
                    state="default"
                />
            </div>

            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Hover State</h6>
                <FillInTableRow
                    date="Tue, Sep 9"
                    timeRange="1:00 PM - 1:50 PM"
                    school="Hogwarts"
                    teacher="Mr. Snape"
                    tutorCount="1/5"
                    state="hover"
                />
            </div>

            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Pressed State</h6>
                <FillInTableRow
                    date="Tue, Sep 9"
                    timeRange="1:00 PM - 1:50 PM"
                    school="Hogwarts"
                    teacher="Mr. Snape"
                    tutorCount="1/5"
                    state="pressed"
                />
            </div>
        </section>

        <section>
            <h5 className="h5 mb-4">Fill-In Table with Need Lead Badge</h5>
            <p className="body2-txt mb-4" style={{ color: 'var(--color-on-surface-variant)' }}>
                Shows the "Need Lead" badge in the tutor count column when a lead tutor is needed.
            </p>

            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Default State with Need Lead</h6>
                <FillInTableHeaderRow />
                <FillInTableRow
                    date="Tue, Sep 9"
                    timeRange="1:00 PM - 1:50 PM"
                    school="Hogwarts"
                    teacher="Mr. Snape"
                    tutorCount="1/5"
                    needLead={true}
                    state="default"
                />
            </div>

            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Hover State with Need Lead</h6>
                <FillInTableRow
                    date="Tue, Sep 9"
                    timeRange="1:00 PM - 1:50 PM"
                    school="Hogwarts"
                    teacher="Mr. Snape"
                    tutorCount="1/5"
                    needLead={true}
                    state="hover"
                />
            </div>

            <div>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Pressed State with Need Lead</h6>
                <FillInTableRow
                    date="Tue, Sep 9"
                    timeRange="1:00 PM - 1:50 PM"
                    school="Hogwarts"
                    teacher="Mr. Snape"
                    tutorCount="1/5"
                    needLead={true}
                    state="pressed"
                />
            </div>
        </section>

        <section>
            <h5 className="h5 mb-4">Fill-In Modal Table (with Checkbox)</h5>
            <p className="body2-txt mb-4" style={{ color: 'var(--color-on-surface-variant)' }}>
                5-column grid layout for modal with checkbox selection. Used in modals for selecting multiple sessions.
            </p>

            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Default State (Unchecked)</h6>
                <FillInModalHeaderRow />
                <FillInModalRow
                    date="Tue, Sep 9"
                    timeRange="12:30 PM - 1:30 PM"
                    school="Hogwarts"
                    teacher="Mr. Snape"
                    tutorCount="1/5"
                    checked={false}
                    state="default"
                />
            </div>

            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Hover State (Unchecked)</h6>
                <FillInModalRow
                    date="Tue, Sep 9"
                    timeRange="12:30 PM - 1:30 PM"
                    school="Hogwarts"
                    teacher="Mr. Snape"
                    tutorCount="1/5"
                    checked={false}
                    state="hover"
                />
            </div>

            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Pressed State (Unchecked)</h6>
                <FillInModalRow
                    date="Tue, Sep 9"
                    timeRange="12:30 PM - 1:30 PM"
                    school="Hogwarts"
                    teacher="Mr. Snape"
                    tutorCount="1/5"
                    checked={false}
                    state="pressed"
                />
            </div>

            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Default State (Checked)</h6>
                <FillInModalRow
                    date="Tue, Sep 9"
                    timeRange="12:30 PM - 1:30 PM"
                    school="Hogwarts"
                    teacher="Mr. Snape"
                    tutorCount="1/5"
                    checked={true}
                    state="default"
                />
            </div>

            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Default State (Need Lead)</h6>
                <FillInModalRow
                    date="Tue, Sep 9"
                    timeRange="12:30 PM - 1:30 PM"
                    school="Hogwarts"
                    teacher="Mr. Snape"
                    tutorCount="1/5"
                    needLead={true}
                    checked={false}
                    state="default"
                />
            </div>

            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Hover State (Need Lead)</h6>
                <FillInModalRow
                    date="Tue, Sep 9"
                    timeRange="12:30 PM - 1:30 PM"
                    school="Hogwarts"
                    teacher="Mr. Snape"
                    tutorCount="1/5"
                    needLead={true}
                    checked={false}
                    state="hover"
                />
            </div>

            <div>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Pressed State (Need Lead)</h6>
                <FillInModalRow
                    date="Tue, Sep 9"
                    timeRange="12:30 PM - 1:30 PM"
                    school="Hogwarts"
                    teacher="Mr. Snape"
                    tutorCount="1/5"
                    needLead={true}
                    checked={false}
                    state="pressed"
                />
            </div>
        </section>
    </div>
);

/**
 * Interactive Story
 * Demonstrates interactive fill-in functionality
 */
export const Interactive = () => {
    const [filledInSessions, setFilledInSessions] = useState([]);

    const sampleSessions = [
        { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', needLead: false },
        { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', needLead: false },
        { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', needLead: true },
    ];

    const handleFillIn = (index) => {
        if (!filledInSessions.includes(index)) {
            setFilledInSessions([...filledInSessions, index]);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <h6 className="h6 mb-3">Fill-In Table - Interactive</h6>
            <p className="body2-txt mb-4" style={{ color: 'var(--color-on-surface-variant)' }}>
                Click "Fill in" to register for a session. Hover over rows to see state changes.
            </p>
            <FillInTableHeaderRow />
            {sampleSessions.map((session, index) => (
                <FillInTableRow
                    key={index}
                    date={session.date}
                    timeRange={session.timeRange}
                    school={session.school}
                    teacher={session.teacher}
                    tutorCount={session.tutorCount}
                    needLead={session.needLead}
                    onFillIn={() => handleFillIn(index)}
                />
            ))}
            <div style={{ marginTop: 'var(--size-spacing-space-400)', padding: 'var(--size-spacing-space-200)' }}>
                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Filled in for: {filledInSessions.length} session(s)
                </span>
            </div>
        </div>
    );
};
