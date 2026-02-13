import React from 'react';

export default {
    title: 'Specs/Toolkit/Pre-Session/Cards/Delete Modal Session Card',
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

// ─── Column Header ───────────────────────────────────────────

const ColumnHeader = ({ label, showSort = true }) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--size-element-gap-sm)',
            padding: 'var(--size-element-pad-y-lg) var(--size-element-pad-x-md)',
        }}
    >
        <span
            className="body2-txt"
            style={{
                color: 'var(--color-on-surface)',
                fontWeight: 400,
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
            }}
        >
            {label}
        </span>
        {showSort && (
            <i
                className="fa-solid fa-arrow-up"
                style={{
                    fontSize: 'var(--font-size-fa-b1-solid)',
                    lineHeight: 'var(--font-line-height-fa-b1-solid)',
                    color: 'var(--color-on-surface-variant)',
                }}
            />
        )}
    </div>
);

// ─── Data Cell ───────────────────────────────────────────────

const DataCell = ({ value }) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
            overflow: 'hidden',
        }}
    >
        <span
            className="body2-txt"
            style={{
                color: 'var(--color-on-surface)',
                fontWeight: 300,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            }}
        >
            {value}
        </span>
    </div>
);

// ─── Delete Modal Session Card ───────────────────────────────

/**
 * Delete Modal Session Card
 * A card displaying session details in a compact 4-column table format.
 * Used within the delete session modal to show which session will be deleted.
 *
 * Columns: Date, Time, School, Teacher (Placeholder)
 *
 * Tokens:
 * - Card background: --color-surface-container-low
 * - Card border: --color-outline-variant, --size-section-border
 * - Card padding: --size-card-pad-x-sm
 * - Card radius: --size-modal-radius-md
 * - Table header: body2-txt regular, --color-on-surface
 * - Table data: body2-txt light, --color-on-surface
 * - Sort icon: fa-arrow-up, --color-on-surface-variant
 * - Cell padding: --size-element-pad-y-lg / --size-element-pad-x-md (header),
 *                 --size-table-cell-y / --size-table-cell-x (data)
 */
export const DeleteModalSessionCard = ({
    date = 'Tue, Sep 9',
    time = '12:30 – 1:30 PM',
    school = 'Hogwarts',
    teacher = 'Mr. Snape',
}) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: 'var(--size-card-pad-x-sm)',
            backgroundColor: 'var(--color-surface-container-low)',
            border: 'var(--size-section-border) solid var(--color-outline-variant)',
            borderRadius: 'var(--size-modal-radius-md)',
            width: '100%',
        }}
    >
        {/* Header Row */}
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                width: '100%',
                borderRadius: 'var(--size-element-radius-sm)',
            }}
        >
            <ColumnHeader label="Date" />
            <ColumnHeader label="Time" />
            <ColumnHeader label="School" />
            <ColumnHeader label="Placeholder" />
        </div>

        {/* Data Row */}
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                width: '100%',
                borderRadius: 'var(--size-element-radius-sm)',
            }}
        >
            <DataCell value={date} />
            <DataCell value={time} />
            <DataCell value={school} />
            <DataCell value={teacher} />
        </div>
    </div>
);
