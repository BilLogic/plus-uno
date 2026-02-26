import React from 'react';

export default {
    title: 'Specs/Toolkit/Pre-Session/Tables/Fill Ins',
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

/**
 * Fill Ins Table Header Row
 * Columns: Date & time, School & teacher, Tutor Count.
 * For use in Confirm Fill-in / Confirmation modal (read-only session list).
 */
export const FillInsTableHeaderRow = () => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 1fr',
            width: '100%',
            borderRadius: 'var(--size-table-radius-md)',
        }}
    >
        <div style={{ padding: 'var(--size-table-cell-y) var(--size-table-cell-x)' }}>
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                Date & time
            </span>
        </div>
        <div style={{ padding: 'var(--size-table-cell-y) var(--size-table-cell-x)' }}>
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                School & teacher
            </span>
        </div>
        <div style={{ padding: 'var(--size-table-cell-y) var(--size-table-cell-x)' }}>
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                Tutor Count
            </span>
        </div>
    </div>
);

/**
 * Fill Ins Table Row (read-only)
 * Displays one session: date/time, school/teacher, tutor count. No checkbox, no actions.
 * For use in Confirm Fill-in / Confirmation modal.
 */
export const FillInsTableRow = ({ date, timeRange, school, teacher, tutorCount }) => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 1fr',
            width: '100%',
            borderRadius: 'var(--size-table-radius-md)',
        }}
    >
        <div
            style={{
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 'var(--size-table-cell-gap)',
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                {date}
            </span>
            <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                {timeRange}
            </span>
        </div>
        <div
            style={{
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 'var(--size-table-cell-gap)',
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                {school}
            </span>
            <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                {teacher}
            </span>
        </div>
        <div
            style={{
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                {tutorCount}
            </span>
        </div>
    </div>
);
