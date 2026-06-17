import React, { useState } from 'react';
import './AllSessionsTable.scss';

/* ─── Mock data ─── */
const SESSIONS = Array.from({ length: 9 }, (_, i) => ({
    id: i + 1,
    date: 'Tue, Sep 9',
    time: '1:00 PM – 1:50 PM',
    school: 'Hogwarts',
    teacher: 'Mr. Snape',
    status: 'In progress',
    tutor: '1/5',
    student: 25,
}));

/* Filter pill options */
const STATUS_OPTIONS   = ['All status',   'In progress', 'Scheduled', 'Cancelled'];
const SESSION_OPTIONS  = ['All sessions', 'Group',       'Individual'];
const TUTOR_OPTIONS    = ['All tutors',   'Me',          'Other'];
const SCHOOL_OPTIONS   = ['All schools',  'Hogwarts',    'Sunnydale'];
const WEEK_OPTIONS     = ['This week',    'Next week',   'Last week'];

function FilterDropdown({ options, value, onChange }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="filter-dropdown" onBlur={() => setOpen(false)} tabIndex={-1}>
            <button
                className="filter-dropdown__trigger"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span>{value}</span>
                <i className="fa-solid fa-chevron-down filter-dropdown__caret" aria-hidden="true" />
            </button>
            {open && (
                <ul className="filter-dropdown__menu" role="listbox">
                    {options.map((opt) => (
                        <li
                            key={opt}
                            role="option"
                            aria-selected={opt === value}
                            className={`filter-dropdown__item${opt === value ? ' filter-dropdown__item--selected' : ''}`}
                            onMouseDown={() => { onChange(opt); setOpen(false); }}
                        >
                            {opt}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function SortIcon() {
    return (
        <i
            className="fa-solid fa-arrow-up sessions-table__sort-icon"
            aria-hidden="true"
        />
    );
}

export default function AllSessionsTable() {
    const [status,   setStatus]   = useState('All status');
    const [session,  setSession]  = useState('All sessions');
    const [tutor,    setTutor]    = useState('All tutors');
    const [school,   setSchool]   = useState('All schools');
    const [week,     setWeek]     = useState('This week');

    return (
        <div className="all-sessions">
            {/* Section header + filters */}
            <div className="all-sessions__header">
                <h2 className="all-sessions__title h3">All Sessions</h2>
                <div className="all-sessions__filters">
                    <FilterDropdown options={STATUS_OPTIONS}  value={status}  onChange={setStatus}  />
                    <FilterDropdown options={SESSION_OPTIONS} value={session} onChange={setSession} />
                    <FilterDropdown options={TUTOR_OPTIONS}   value={tutor}   onChange={setTutor}   />
                    <FilterDropdown options={SCHOOL_OPTIONS}  value={school}  onChange={setSchool}  />
                    <FilterDropdown options={WEEK_OPTIONS}    value={week}    onChange={setWeek}    />
                </div>
            </div>

            {/* Table */}
            <div className="all-sessions__table-wrap">
                <table className="sessions-table">
                    <thead>
                        <tr>
                            <th className="sessions-table__th">
                                Date &amp; time (ET) <SortIcon />
                            </th>
                            <th className="sessions-table__th">
                                School &amp; teacher <SortIcon />
                            </th>
                            <th className="sessions-table__th">
                                Status <SortIcon />
                            </th>
                            <th className="sessions-table__th">
                                Tutor <SortIcon />
                            </th>
                            <th className="sessions-table__th">
                                Student <SortIcon />
                            </th>
                            <th className="sessions-table__th">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {SESSIONS.map((s) => (
                            <tr key={s.id} className="sessions-table__row">
                                <td className="sessions-table__td">
                                    <div className="sessions-table__date-primary body2-txt font-weight-bold">
                                        {s.date}
                                    </div>
                                    <div className="sessions-table__date-secondary body2-txt">
                                        {s.time}
                                    </div>
                                </td>
                                <td className="sessions-table__td">
                                    <div className="sessions-table__school body2-txt font-weight-bold">
                                        {s.school}
                                    </div>
                                    <div className="sessions-table__teacher body2-txt">
                                        {s.teacher}
                                    </div>
                                </td>
                                <td className="sessions-table__td">
                                    <span className="sessions-table__status-badge">
                                        <i className="fa-solid fa-circle-play sessions-table__status-icon" aria-hidden="true" />
                                        {s.status}
                                    </span>
                                </td>
                                <td className="sessions-table__td sessions-table__td--numeric body2-txt">
                                    {s.tutor}
                                </td>
                                <td className="sessions-table__td sessions-table__td--numeric body2-txt">
                                    {s.student}
                                </td>
                                <td className="sessions-table__td">
                                    <button className="sessions-table__details-btn body2-txt">
                                        Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
