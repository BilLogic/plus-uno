import React, { useState, useMemo } from 'react';
import StatusTag from '@/components/labels/StatusTag';
import Button from '@/components/forms-and-inputs/Button';
import {
    initialAssignment,
    moveStudent,
    addStudent,
    setAbsent,
    studentsOf,
} from './roomNumbering.js';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/In-Session/Elements/Room Numbering',
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Room Numbering v2 (Session Counts & Room Indicators, Jul 2026). Each tutor owns a frozen block of consecutive room numbers sized `assigned + buffer` (3/2/1 by tutor count). Students take the lowest free number in their block; freed numbers recycle; a full block borrows the lowest free number elsewhere and the row is flagged out-of-range. Logic lives in `roomNumbering.js` (unit-tested).',
            },
        },
    },
};

const ROSTER = () => [
    { id: 'savannah', name: 'Savannah', students: [
        { id: 'ava', name: 'Ava' }, { id: 'ben', name: 'Ben' }, { id: 'chloe', name: 'Chloe' }, { id: 'ethan', name: 'Ethan' },
    ] },
    { id: 'maya', name: 'Maya', students: [
        { id: 'mia', name: 'Mia' }, { id: 'noor', name: 'Noor' }, { id: 'omar', name: 'Omar' }, { id: 'liam', name: 'Liam' },
    ] },
    { id: 'noah', name: 'Noah', students: [
        { id: 'raj', name: 'Raj' }, { id: 'sara', name: 'Sara' }, { id: 'tom', name: 'Tom' }, { id: 'uma', name: 'Uma' },
    ] },
    { id: 'priya', name: 'Priya', students: [
        { id: 'val', name: 'Val' }, { id: 'wen', name: 'Wen' }, { id: 'xander', name: 'Xander' }, { id: 'yara', name: 'Yara' },
    ] },
];

/** A single student row with its room-number chip. */
const StudentRow = ({ s }) => (
    <div className="d-flex align-items-center justify-content-between" style={{ gap: 'var(--space-0625)', padding: '4px 0' }}>
        <span className="body3-txt" style={{ color: s.absent ? 'var(--ds-text-subtle)' : 'var(--ds-text)', textDecoration: s.absent ? 'line-through' : 'none' }}>
            {s.name}{s.absent ? ' (absent)' : ''}
        </span>
        {s.room != null && (
            <StatusTag appearance={s.outOfRange ? 'warning' : 'neutral'} leadingVisual={<i className="fa-solid fa-door-open" aria-hidden="true"></i>} className="fw-normal" title={s.outOfRange ? `Borrowed from another block — Zoom breakout room: ${s.room}` : `Zoom breakout room: ${s.room}`}>{String(s.room)}</StatusTag>
        )}
    </div>
);

const TutorColumn = ({ state, tutorId }) => {
    const tutor = state.tutors[tutorId];
    const block = state.blocks[tutorId];
    const students = studentsOf(state, tutorId);
    return (
        <div style={{
            flex: '1 1 0', minWidth: 150,
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 'var(--size-card-radius-sm)',
            background: 'var(--ds-surface)',
            padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
        }}>
            <div className="d-flex align-items-center justify-content-between" style={{ marginBottom: 8 }}>
                <span className="body2-txt" style={{ fontWeight: 600 }}>{tutor.name}</span>
                <span className="body3-txt" style={{ color: 'var(--ds-text-subtle)' }}>
                    {block ? `rooms ${block.start}–${block.end}` : 'inherited'}
                </span>
            </div>
            {students.map((s) => <StudentRow key={s.id} s={s} />)}
        </div>
    );
};

export const Interactive = () => {
    const [assigned, setAssigned] = useState(false);
    const [state, setState] = useState(null);
    const [zoeAdded, setZoeAdded] = useState(false);

    const roomCount = state?.roomCount;

    const runAssignment = () => { setState(initialAssignment(ROSTER())); setAssigned(true); };
    const reset = () => { setState(null); setAssigned(false); setZoeAdded(false); };

    const moveEthan = () => setState((s) => moveStudent(s, 'ethan', 'maya'));
    const addZoe = () => { setState((s) => addStudent(s, 'zoe', 'savannah', 'Zoe')); setZoeAdded(true); };
    const absentLiam = () => setState((s) => setAbsent(s, 'liam', true));
    const overflowMaya = () => setState((s) => {
        let n = s;
        ['o1', 'o2', 'o3', 'o4'].forEach((id, i) => { n = addStudent(n, id, 'maya', `Extra ${i + 1}`); });
        return n;
    });

    const outOfRangeCount = useMemo(
        () => state ? Object.values(state.assignments).filter((a) => a.outOfRange).length : 0,
        [state]
    );

    return (
        <div className="d-flex flex-column" style={{ gap: 'var(--size-section-gap-md)', maxWidth: 900 }}>
            {/* Header — room count badge (waiting vs active) */}
            <div className="d-flex align-items-center" style={{ gap: 'var(--space-0625)' }}>
                <span className="body2-txt" style={{ fontWeight: 600 }}>Room count</span>
                <StatusTag appearance={'neutral'} leadingVisual={<i className="fa-solid fa-door-open" aria-hidden="true"></i>} className="fw-normal" title={assigned ? "Rooms to create in Zoom (includes each tutor's buffer)" : 'Assign students to tutors to size breakout rooms'}>{assigned ? String(roomCount) : '—'}</StatusTag>
                <span className="body3-txt" style={{ color: 'var(--ds-icon-subtle)' }}>
                    {assigned ? `frozen · buffer ${state.buffer}/tutor` : 'waiting — lead has not run assignment'}
                    {outOfRangeCount > 0 ? ` · ${outOfRangeCount} out-of-range` : ''}
                </span>
            </div>

            {/* Controls */}
            <div className="d-flex flex-wrap" style={{ gap: 'var(--stack-md)' }}>
                {!assigned ? (
                    <Button text="Run initial assignment" appearance="primary" spacing="compact" iconBefore="wand-magic-sparkles" onClick={runAssignment} />
                ) : (
                    <>
                        <Button text="Move Ethan → Maya" spacing="compact" onClick={moveEthan} />
                        <Button text="Add Zoe → Savannah" spacing="compact" isDisabled={zoeAdded} onClick={addZoe} />
                        <Button text="Mark Liam absent" spacing="compact" onClick={absentLiam} />
                        <Button text="Overflow Maya (borrow)" spacing="compact" onClick={overflowMaya} />
                        <Button text="Reset" appearance="subtle" spacing="compact" onClick={reset} />
                    </>
                )}
            </div>

            {/* Tutor columns */}
            {assigned && (
                <div className="d-flex flex-wrap" style={{ gap: 'var(--space-0625)' }}>
                    {state.order.map((tid) => <TutorColumn key={tid} state={state} tutorId={tid} />)}
                </div>
            )}
        </div>
    );
};
