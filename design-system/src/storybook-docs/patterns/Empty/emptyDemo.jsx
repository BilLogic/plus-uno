import React, { useState } from 'react';

import { Button, EmptyState } from '@/components';
import { Page, PatternCard, PatternSection } from '@/patterns';
import { DemoPageHeader, SessionsTable } from '../../../patterns/Page/pageDemo.jsx';
import { GonePanel } from '../../../patterns/Panel/panelDemo.jsx';
import { ResetExampleButton } from '@/storybook-docs/lib/reset-example.jsx';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import { HeaderSearch, SectionActions, categoryFilters } from '@/storybook-docs/lib/section-header.jsx';
import { StudentsTable, ViewPills } from '@/storybook-docs/lib/view-bar.jsx';
import { CATEGORIES } from '../Filtering/filteringDemo.jsx';

/**
 * The Empty pattern's examples: the real EmptyState in the four types and the
 * four places it sits. Nothing here draws an empty state of its own.
 *
 *   EmptyType     one of the four types, in the words it takes
 *   EMPTY_TYPES   the four types' ids and names
 *   FullPage      a page whose content has nothing to show
 *   InTable       a Section whose empty state replaces the whole table
 *   InCard        a card holding a compact empty state
 *   InPanel       the Details Panel for a record that was removed
 */

/** The width a picture lays out at, in px: docs geometry. */
export const STAGE = 1024; // docs-literal

/** The width the four type pictures lay out at, so their words stay legible at card size. Docs geometry, in px. */
export const TYPE_STAGE = 600; // docs-literal

/** The width a card and a Panel picture lay out at: near their real widths. Docs geometry, in px. */
export const SMALL_STAGE = 520; // docs-literal

/** Docs geometry, in px: the page window's height. */
const WINDOW = 400; // docs-literal

/** The four types, by id, with the name each shows on the page. */
export const EMPTY_TYPES = [
    ['first', 'First use'],
    ['matches', 'No matches'],
    ['done', 'All done'],
    ['cant', "Can't show"],
];

/** The words each type takes: what belongs here, why it is empty, and the next step. */
const COPY = {
    first: {
        icon: 'user-group',
        header: 'No students in this group yet',
        description: 'Add students to schedule sessions and track their progress.',
        actionLabel: 'Add students',
        appearance: 'primary',
    },
    matches: {
        icon: 'magnifying-glass',
        header: 'No students match these filters',
        description: 'Nothing matches Grade 6 and Math. Reset the filters to see every student.',
        actionLabel: 'Reset filters',
        appearance: 'default',
    },
    done: {
        icon: 'circle-check',
        header: 'Every reflection is reviewed',
        description: "New ones arrive after Friday's sessions.",
        actionLabel: null,
    },
    cant: {
        icon: 'triangle-exclamation',
        header: "Couldn't load students",
        description: 'Something went wrong on our side. Try again in a moment.',
        actionLabel: 'Try again',
        appearance: 'primary',
    },
    noAccess: {
        icon: 'lock',
        header: 'Only supervisors can see session notes',
        description: 'Ask your supervisor to add you.',
        actionLabel: null,
    },
};

/** One empty state in the words its type takes. `kind` also takes `noAccess`, the Can't show type with nobody to retry. */
export const EmptyType = ({ kind, spacing = 'default', action = true, onAction }) => {
    const [acted, setActed] = useState(false);
    const copy = COPY[kind];

    if (acted && !onAction) {
        return (
            <PatternSection
                title="Students"
                description="Lincoln Middle"
                actions={<ResetExampleButton onReset={() => setActed(false)} />}
            >
                <StudentsTable count={3} sortable />
            </PatternSection>
        );
    }

    const handleAction = onAction ?? (() => setActed(true));
    const primaryAction = action && copy.actionLabel
        ? <Button text={copy.actionLabel} appearance={copy.appearance} spacing={spacing} onClick={handleAction} />
        : undefined;

    return (
        <EmptyState
            spacing={spacing}
            icon={copy.icon}
            header={copy.header}
            description={copy.description}
            primaryAction={primaryAction}
        />
    );
};

/** A page whose content has nothing to show: the block under the page header. */
export const FullPage = () => (
    <BrowserWindow address="app.plus.org/groups/algebra-b" height={WINDOW}>
        <Page header={<DemoPageHeader title="Lincoln Middle" description="Tuesdays and Thursdays, 4:00 PM" />}>
            <EmptyType kind="first" />
        </Page>
    </BrowserWindow>
);

const NO_MATCHES_FILTERS = { grade: ['Grade 6'], subject: ['Math'] };
const CLEARED_FILTERS = { grade: [], subject: [] };

/** A Section whose table is empty: the empty state replaces the whole table; the header rows above stay. */
export const InTable = ({ kind = 'first' }) => {
    const [view, setView] = useState('All students');
    const [resolved, setResolved] = useState(false);
    const [filters, setFilters] = useState(NO_MATCHES_FILTERS);
    const showingRows = resolved || view !== 'All students';
    const pickFilter = (id, next) => {
        const updated = { ...filters, [id]: next };
        setFilters(updated);
        if (updated.grade.length === 0 || updated.subject.length === 0) setResolved(true);
    };

    const changeView = (next) => {
        setView(next);
        setResolved(false);
        if (kind === 'matches' && next === 'All students') setFilters(NO_MATCHES_FILTERS);
    };

    return (
        <div style={{ padding: 'var(--page-pad)', boxSizing: 'border-box' }}>
            <PatternSection
                title="Students"
                description="Lincoln Middle"
                actions={<SectionActions />}
                views={<ViewPills views={['All students', 'Needs follow-up']} activeView={view} onViewChange={changeView} />}
                search={kind === 'matches' ? <HeaderSearch /> : undefined}
                filters={kind === 'matches' ? categoryFilters([CATEGORIES.grade, CATEGORIES.subject], resolved ? CLEARED_FILTERS : filters, pickFilter) : undefined}
                onClearAll={() => { setResolved(true); setFilters(CLEARED_FILTERS); }}
            >
                {showingRows ? (
                    <StudentsTable count={4} view={view} sortable />
                ) : (
                    <EmptyType
                        kind={kind}
                        spacing="compact"
                        onAction={() => {
                            setResolved(true);
                            if (kind === 'matches') setFilters(CLEARED_FILTERS);
                        }}
                    />
                )}
            </PatternSection>
        </div>
    );
};

/** A card with nothing to show: compact, the block centered in the card. */
export const InCard = () => (
    <div style={{ padding: 'var(--page-pad)', boxSizing: 'border-box' }}>
        <PatternCard title="Reflections">
            <EmptyType kind="done" spacing="compact" />
        </PatternCard>
    </div>
);

/** The Details Panel when its record was removed: the block at the top of the body with a way back. */
export const InPanel = () => {
    const [returned, setReturned] = useState(false);

    return (
        <div style={{ padding: 'var(--page-pad)', boxSizing: 'border-box' }}>
            {returned ? (
                <PatternSection
                    title="Sessions"
                    description="This week"
                    actions={<ResetExampleButton onReset={() => setReturned(false)} />}
                >
                    <SessionsTable />
                </PatternSection>
            ) : (
                <GonePanel onClose={() => setReturned(true)} />
            )}
        </div>
    );
};
