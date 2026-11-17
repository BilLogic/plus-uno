import React, { useState } from 'react';
import { Button, DynamicTable, Tooltip } from '@/components';
import { PatternSection } from '@/patterns';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { DocsOverlayBoundary } from '@/storybook-docs/lib/docs-overlay-boundary.jsx';
import { STUDENTS, StudentsTable } from '@/storybook-docs/lib/view-bar.jsx';
import { LONG_NOTE, LONG_TITLE } from './overflowDemo.jsx';

/**
 * The live do and don't examples on the Overflow pattern page, composed from
 * `PatternSection`, `DynamicTable`, `StudentsTable`, `ClippedCell`, `Button`
 * and `CaseSurface`.
 */

const narrowSectionStyle = { maxInlineSize: 'var(--card-min-width-md)' };

/** Do: a long Section title wraps to a second line so the list stays named. */
export const WrappedSectionTitleCase = () => (
    <CaseSurface>
        <div style={narrowSectionStyle}>
            <PatternSection title={LONG_TITLE}>
                <StudentsTable count={2} />
            </PatternSection>
        </div>
    </CaseSurface>
);

/** Don't: cutting the Section title to one line hides what the list holds. */
export const ClippedSectionTitleCase = () => (
    <CaseSurface>
        <div style={narrowSectionStyle}>
            <PatternSection
                title={(
                    <span
                        style={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {LONG_TITLE}
                    </span>
                )}
            >
                <StudentsTable count={2} />
            </PatternSection>
        </div>
    </CaseSurface>
);

/** Do: a clipped cell opens its full text in a Tooltip on hover and focus. */
export const ClippedCellOpensTextCase = () => (
    <DocsOverlayBoundary fit={false} containHeight>
        <CaseSurface style={{ paddingBlockStart: 'calc(var(--page-pad) * 3)' }}>
            <DynamicTable
                label="Session notes"
                head={{ cells: [{ key: 'name', content: 'Student', width: '30%' }, { key: 'note', content: 'Note', width: '70%' }] }}
                rows={STUDENTS.slice(0, 3).map(([name], i) => ({
                    key: name,
                    cells: [
                        { key: `${name}-n`, content: name },
                        {
                            key: `${name}-t`,
                            content: i === 0 ? (
                                <Tooltip text={LONG_NOTE} placement="top" show>
                                    <span
                                        className="plus-table-cell-text"
                                        tabIndex={0}
                                        style={{
                                            display: 'block',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {LONG_NOTE}
                                    </span>
                                </Tooltip>
                            ) : 'On track',
                        },
                    ],
                }))}
            />
        </CaseSurface>
    </DocsOverlayBoundary>
);

/** Don't: a clipped cell without a Tooltip leaves the rest of the value unreadable. */
export const ClippedCellNoTextCase = () => (
    <CaseSurface>
        <DynamicTable
            label="Session notes"
            head={{ cells: [{ key: 'name', content: 'Student', width: '30%' }, { key: 'note', content: 'Note', width: '70%' }] }}
            rows={STUDENTS.slice(0, 3).map(([name], i) => ({
                key: name,
                cells: [
                    { key: `${name}-n`, content: name },
                    {
                        key: `${name}-t`,
                        content: i === 0 ? (
                            <span
                                className="plus-table-cell-text"
                                style={{
                                    display: 'block',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {LONG_NOTE}
                            </span>
                        ) : 'On track',
                    },
                ],
            }))}
        />
    </CaseSurface>
);

/** Do: a "Show n more" control names what is left and expands the list in place. */
export const ShowMoreWithCountCase = () => {
    const [expanded, setExpanded] = useState(false);
    return (
        <CaseSurface>
            <PatternSection
                title="Students"
                footer={(
                    <Button
                        text={expanded ? 'Show less' : 'Show 4 more'}
                        appearance="subtle"
                        spacing="compact"
                        onClick={() => setExpanded((current) => !current)}
                    />
                )}
            >
                <StudentsTable count={expanded ? 6 : 2} />
            </PatternSection>
        </CaseSurface>
    );
};

/** Don't: fading a list out hides how many items remain and gives no way to reveal them. */
export const FadedListCase = () => (
    <CaseSurface>
        <PatternSection title="Students">
            <div
                style={{
                    maskImage: 'linear-gradient(to bottom, black 35%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 35%, transparent)',
                }}
            >
                <StudentsTable count={4} />
            </div>
        </PatternSection>
    </CaseSurface>
);
