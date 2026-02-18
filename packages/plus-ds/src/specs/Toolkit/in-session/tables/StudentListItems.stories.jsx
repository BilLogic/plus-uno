import React, { useState } from 'react';
import Button from '../../../../components/Button';
import Badge from '../../../../components/Badge/Badge';

export default {
    title: 'Specs/Toolkit/In-Session/Tables/Student List Items',
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: `
# Student List Items Table

A 10-column grid table used to display student information with name, status, progress tags, and action.

## Columns (10-column grid)
| Column | Span | Content |
|--------|------|---------|
| Name | 3 | Student name text |
| Status | 2 | Status badge (e.g. "Needs Motivation") |
| Progress | 3 | Student tags (Goal met, Driven, etc.) |
| Action | 2 | "View Insights" link or "No Insights Available" disabled text |

## Row States
- **Default**: No background
- **Hover**: Surface container background

## Design Tokens
- **Row radius**: \`--size-table-row-radius\`
- **Cell padding**: \`--size-table-cell-x\`, \`--size-table-cell-y\`
- **Cell gap**: \`--size-table-cell-gap\`
- **Typography**: body3-txt (12px) for cell content, body3-txt semibold for headers
- **Header text color**: \`--color-primary-text\` (Name column), \`--color-on-surface\` (other columns)
- **Sort icon**: fa-arrow-up, \`--color-on-surface-variant\`
                `
            }
        }
    },
};

/**
 * Positive signal icon (green circle-check) for student tags
 */
const positiveIcon = (
    <i
        className="fa-solid fa-circle-check"
        style={{ color: 'var(--color-success)', fontSize: '10px' }}
    />
);

/**
 * Negative signal icon (red triangle-exclamation) for student tags
 */
const negativeIcon = (
    <i
        className="fa-solid fa-triangle-exclamation"
        style={{ color: 'var(--color-danger)', fontSize: '10px' }}
    />
);

/**
 * Sort icon used in header columns
 */
const SortIcon = () => (
    <i
        className="fa-solid fa-arrow-up"
        style={{
            fontSize: 'var(--font-size-fa-b3-solid, 10px)',
            color: 'var(--color-on-surface-variant)',
        }}
    />
);

/**
 * Table Header Row
 * 10-column grid: Name(3) | Status(2) | Progress(3) | Action(2)
 * 
 * Tokens:
 * - Cell padding: --size-table-cell-x, --size-table-cell-y
 * - Cell gap: --size-table-cell-gap
 * - Header text: body3-txt semibold
 * - Name header color: --color-primary-text
 * - Other header color: --color-on-surface
 */
export const ListItemHeaderRow = () => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            width: '100%',
            height: '44px',
            borderRadius: 'var(--size-table-row-radius, 8px)',
        }}
    >
        {/* Name Header - 3 columns */}
        <div
            style={{
                gridColumn: 'span 3',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--size-table-cell-gap)',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
            }}
        >
            <span className="body3-txt font-weight-semibold" style={{ color: 'var(--color-primary-text)' }}>
                Name
            </span>
            <SortIcon />
        </div>

        {/* Status Header - 2 columns */}
        <div
            style={{
                gridColumn: 'span 2',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--size-table-cell-gap)',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
            }}
        >
            <span className="body3-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                Status
            </span>
            <SortIcon />
        </div>

        {/* Progress Header - 3 columns */}
        <div
            style={{
                gridColumn: 'span 3',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--size-table-cell-gap)',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
            }}
        >
            <span className="body3-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                Progress
            </span>
            <SortIcon />
        </div>

        {/* Action Header - 2 columns */}
        <div
            style={{
                gridColumn: 'span 2',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--size-table-cell-gap)',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
            }}
        >
            <span className="body3-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                Action
            </span>
            <SortIcon />
        </div>
    </div>
);

/**
 * Table Row Component
 * 10-column grid: Name(3) | Status(2) | Progress(3) | Action(2)
 *
 * Props:
 * - studentName: string
 * - status: 'needs-motivation' | 'needs-goals' | 'on-track' | 'exceeding'
 * - tags: array of { text, signal } where signal is 'positive' or 'negative'
 * - insightAvailable: boolean
 * - state: 'default' | 'hover' (forced state for overview)
 * - interactive: boolean
 *
 * Tokens:
 * - Row radius: --size-table-row-radius
 * - Cell padding: --size-table-cell-x, --size-table-cell-y
 * - Cell gap: --size-table-cell-gap
 * - Hover bg: --color-surface-container
 * - Name text: body3-txt, --color-on-surface
 * - Status badge: danger style
 * - Tags: warning style badges with leading icons
 * - Action: text button (primary ghost) or disabled text
 */
export const ListItemRow = ({
    studentName = 'Cameron Williamson',
    status = 'needs-motivation',
    tags = [
        { text: 'Goal met', signal: 'positive' },
        { text: 'Driven', signal: 'positive' },
    ],
    insightAvailable = true,
    state: forcedState,
    interactive = true,
}) => {
    const [currentState, setCurrentState] = useState('default');
    const effectiveState = forcedState || currentState;

    const stateStyles = {
        default: {},
        hover: {
            backgroundColor: 'var(--color-surface-container)',
        },
    };

    const handleMouseEnter = interactive && !forcedState ? () => setCurrentState('hover') : undefined;
    const handleMouseLeave = interactive && !forcedState ? () => setCurrentState('default') : undefined;

    /**
     * Status badge config
     */
    const statusConfig = {
        'needs-motivation': { text: 'Needs Motivation', style: 'danger' },
        'needs-goals': { text: 'Needs to set goals', style: 'danger' },
        'on-track': { text: 'On track', style: 'info' },
        'exceeding': { text: 'Exceeding goals', style: 'success' },
    };

    const currentStatus = statusConfig[status] || statusConfig['needs-motivation'];

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(10, 1fr)',
                width: '100%',
                height: '44px',
                borderRadius: 'var(--size-table-row-radius, 8px)',
                transition: 'background-color 0.15s ease',
                ...stateStyles[effectiveState],
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Name Cell - 3 columns */}
            <div
                style={{
                    gridColumn: 'span 3',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                    overflow: 'hidden',
                }}
            >
                <span
                    className="body3-txt"
                    style={{
                        color: 'var(--color-on-surface)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {studentName}
                </span>
            </div>

            {/* Status Cell - 2 columns */}
            <div
                style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                    overflow: 'hidden',
                }}
            >
                <Badge
                    text={currentStatus.text}
                    style={currentStatus.style}
                    size="b3"
                    className="fw-normal"
                />
            </div>

            {/* Progress/Tags Cell - 3 columns */}
            <div
                style={{
                    gridColumn: 'span 3',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                    flexWrap: 'wrap',
                }}
            >
                {tags.map((tag, index) => (
                    <Badge
                        key={index}
                        text={tag.text}
                        style="warning"
                        size="b3"
                        leadingVisual={tag.signal === 'positive' ? positiveIcon : negativeIcon}
                        className="fw-normal"
                    />
                ))}
            </div>

            {/* Action Cell - 2 columns */}
            <div
                style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                }}
            >
                {insightAvailable ? (
                    <Button
                        text="View Insights"
                        style="primary"
                        fill="ghost"
                        size="small"
                        leadingVisual="lightbulb"
                    />
                ) : (
                    <span
                        className="body3-txt"
                        style={{
                            color: 'var(--color-on-surface)',
                            opacity: 0.38,
                        }}
                    >
                        No Insights Available
                    </span>
                )}
            </div>
        </div>
    );
};

// ─── Sample Data ─────────────────────────────────────────────────

const sampleStudents = [
    {
        studentName: 'Cameron Williamson',
        status: 'needs-motivation',
        tags: [
            { text: 'Goal met', signal: 'positive' },
            { text: 'Driven', signal: 'positive' },
        ],
        insightAvailable: true,
    },
    {
        studentName: 'Cameron Williamson',
        status: 'needs-motivation',
        tags: [
            { text: 'Goal met', signal: 'positive' },
            { text: 'Driven', signal: 'positive' },
        ],
        insightAvailable: false,
    },
];

// ─── Stories ─────────────────────────────────────────────────────

/**
 * Overview
 * Shows the complete table with header and all row states:
 * - Default row with insights available
 * - Default row with no insights available
 * - Hover row with insights available
 * - Hover row with no insights available
 */
export const Overview = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)',
            padding: 'var(--size-section-gap-lg)',
            backgroundColor: 'var(--color-surface-variant)',
            minHeight: '100vh',
        }}
    >
        <div>
            <h5 className="text-muted mb-2">Student List Items Table</h5>
            <p className="text-muted small mb-0">
                10-column grid table showing student name, status, progress tags, and action. Includes default and hover row states.
            </p>
        </div>

        {/* Full Table */}
        <div
            style={{
                backgroundColor: 'var(--color-surface-container-lowest)',
                borderRadius: 'var(--size-card-radius-sm)',
                padding: 'var(--size-card-pad-y-lg) var(--size-card-pad-x-lg)',
            }}
        >
            <ListItemHeaderRow />

            {/* Default - Insights Available */}
            <ListItemRow
                studentName="Cameron Williamson"
                status="needs-motivation"
                tags={[
                    { text: 'Goal met', signal: 'positive' },
                    { text: 'Driven', signal: 'positive' },
                ]}
                insightAvailable={true}
                state="default"
                interactive={false}
            />

            {/* Default - No Insights */}
            <ListItemRow
                studentName="Cameron Williamson"
                status="needs-motivation"
                tags={[
                    { text: 'Goal met', signal: 'positive' },
                    { text: 'Driven', signal: 'positive' },
                ]}
                insightAvailable={false}
                state="default"
                interactive={false}
            />

            {/* Hover - Insights Available */}
            <ListItemRow
                studentName="Cameron Williamson"
                status="needs-motivation"
                tags={[
                    { text: 'Goal met', signal: 'positive' },
                    { text: 'Driven', signal: 'positive' },
                ]}
                insightAvailable={true}
                state="hover"
                interactive={false}
            />

            {/* Hover - No Insights */}
            <ListItemRow
                studentName="Cameron Williamson"
                status="needs-motivation"
                tags={[
                    { text: 'Goal met', signal: 'positive' },
                    { text: 'Driven', signal: 'positive' },
                ]}
                insightAvailable={false}
                state="hover"
                interactive={false}
            />
        </div>

        {/* Row States Breakdown */}
        <div className="d-flex flex-column" style={{ gap: 'var(--size-section-gap-md)' }}>
            <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>
                Row States Breakdown
            </h6>

            <div className="d-flex flex-column" style={{ gap: 'var(--size-element-gap-md)' }}>
                <div>
                    <span className="small text-muted d-block mb-1">Default — Insights Available</span>
                    <div
                        style={{
                            backgroundColor: 'var(--color-surface-container-lowest)',
                            borderRadius: 'var(--size-card-radius-sm)',
                            padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                        }}
                    >
                        <ListItemRow
                            studentName="Cameron Williamson"
                            status="needs-motivation"
                            tags={[
                                { text: 'Goal met', signal: 'positive' },
                                { text: 'Driven', signal: 'positive' },
                            ]}
                            insightAvailable={true}
                            state="default"
                            interactive={false}
                        />
                    </div>
                </div>

                <div>
                    <span className="small text-muted d-block mb-1">Default — No Insights Available</span>
                    <div
                        style={{
                            backgroundColor: 'var(--color-surface-container-lowest)',
                            borderRadius: 'var(--size-card-radius-sm)',
                            padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                        }}
                    >
                        <ListItemRow
                            studentName="Cameron Williamson"
                            status="needs-motivation"
                            tags={[
                                { text: 'Goal met', signal: 'positive' },
                                { text: 'Driven', signal: 'positive' },
                            ]}
                            insightAvailable={false}
                            state="default"
                            interactive={false}
                        />
                    </div>
                </div>

                <div>
                    <span className="small text-muted d-block mb-1">Hover — Insights Available</span>
                    <div
                        style={{
                            backgroundColor: 'var(--color-surface-container-lowest)',
                            borderRadius: 'var(--size-card-radius-sm)',
                            padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                        }}
                    >
                        <ListItemRow
                            studentName="Cameron Williamson"
                            status="needs-motivation"
                            tags={[
                                { text: 'Goal met', signal: 'positive' },
                                { text: 'Driven', signal: 'positive' },
                            ]}
                            insightAvailable={true}
                            state="hover"
                            interactive={false}
                        />
                    </div>
                </div>

                <div>
                    <span className="small text-muted d-block mb-1">Hover — No Insights Available</span>
                    <div
                        style={{
                            backgroundColor: 'var(--color-surface-container-lowest)',
                            borderRadius: 'var(--size-card-radius-sm)',
                            padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                        }}
                    >
                        <ListItemRow
                            studentName="Cameron Williamson"
                            status="needs-motivation"
                            tags={[
                                { text: 'Goal met', signal: 'positive' },
                                { text: 'Driven', signal: 'positive' },
                            ]}
                            insightAvailable={false}
                            state="hover"
                            interactive={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

/**
 * Interactive
 * Fully interactive table with hover states, varied student data, and tag combinations
 */
export const Interactive = () => {
    const [students, setStudents] = useState([
        {
            id: 1,
            studentName: 'Cameron Williamson',
            status: 'needs-motivation',
            tags: [
                { text: 'Goal met', signal: 'positive' },
                { text: 'Driven', signal: 'positive' },
            ],
            insightAvailable: true,
        },
        {
            id: 2,
            studentName: 'Jane Cooper',
            status: 'needs-motivation',
            tags: [
                { text: 'Goal Not Met', signal: 'negative' },
                { text: 'unengaged', signal: 'negative' },
            ],
            insightAvailable: false,
        },
        {
            id: 3,
            studentName: 'Robert Fox',
            status: 'on-track',
            tags: [
                { text: 'Goal met', signal: 'positive' },
                { text: 'Driven', signal: 'positive' },
                { text: 'Accomplished', signal: 'positive' },
            ],
            insightAvailable: true,
        },
        {
            id: 4,
            studentName: 'Esther Howard',
            status: 'needs-goals',
            tags: [
                { text: 'Goal Not Met', signal: 'negative' },
                { text: 'developing', signal: 'negative' },
            ],
            insightAvailable: false,
        },
        {
            id: 5,
            studentName: 'Leslie Alexander',
            status: 'exceeding',
            tags: [
                { text: 'Goal met', signal: 'positive' },
                { text: 'Accomplished', signal: 'positive' },
                { text: 'Driven', signal: 'positive' },
            ],
            insightAvailable: true,
        },
    ]);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                backgroundColor: 'var(--color-surface-variant)',
                padding: 'var(--size-section-gap-lg)',
                minHeight: '100vh',
            }}
        >
            <div style={{ marginBottom: 'var(--size-section-gap-md)' }}>
                <h5 className="text-muted mb-2">Interactive Student List Items</h5>
                <p className="text-muted small mb-0">
                    Hover over rows to see the hover state. Rows with insights show a "View Insights" link; others show disabled text.
                </p>
            </div>

            <div
                style={{
                    backgroundColor: 'var(--color-surface-container-lowest)',
                    borderRadius: 'var(--size-card-radius-sm)',
                    padding: 'var(--size-card-pad-y-lg) var(--size-card-pad-x-lg)',
                }}
            >
                <ListItemHeaderRow />
                {students.map((student) => (
                    <ListItemRow
                        key={student.id}
                        studentName={student.studentName}
                        status={student.status}
                        tags={student.tags}
                        insightAvailable={student.insightAvailable}
                        interactive={true}
                    />
                ))}
            </div>
        </div>
    );
};
