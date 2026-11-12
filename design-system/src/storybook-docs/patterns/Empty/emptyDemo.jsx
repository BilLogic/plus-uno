import React from 'react';

import { Button, EmptyState } from '@/components';
import { PatternCard, PatternSection } from '@/patterns';
import { DemoPageHeader } from '../../../patterns/Page/pageDemo.jsx';
import { GonePanel } from '../../../patterns/Panel/panelDemo.jsx';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import { ViewBar } from '@/storybook-docs/lib/view-bar.jsx';

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

const noop = () => {};

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
        action: <Button text="Add students" appearance="primary" onClick={noop} />,
    },
    matches: {
        icon: 'magnifying-glass',
        header: 'No students match these filters',
        description: 'Nothing matches Grade 6 and Math. Reset the filters to see every student.',
        action: <Button text="Reset filters" appearance="default" onClick={noop} />,
    },
    done: {
        icon: 'circle-check',
        header: 'Every reflection is reviewed',
        description: "New ones arrive after Friday's sessions.",
        action: null,
    },
    cant: {
        icon: 'triangle-exclamation',
        header: "Couldn't load sessions",
        description: 'Something went wrong on our side. Try again in a moment.',
        action: <Button text="Try again" appearance="primary" onClick={noop} />,
    },
    noAccess: {
        icon: 'lock',
        header: 'Only supervisors can see session notes',
        description: 'Ask your supervisor to add you.',
        action: null,
    },
};

/** One empty state in the words its type takes. `kind` also takes `noAccess`, the Can't show type with nobody to retry. */
export const EmptyType = ({ kind, spacing = 'default', action = true }) => {
    const copy = COPY[kind];
    return (
        <EmptyState
            spacing={spacing}
            icon={copy.icon}
            header={copy.header}
            description={copy.description}
            primaryAction={action ? copy.action ?? undefined : undefined}
        />
    );
};

/** A page whose content has nothing to show: the block under the page header. */
export const FullPage = () => (
    <BrowserWindow address="app.plus.org/groups/algebra-b" height={WINDOW}>
        <div style={{ padding: 'var(--page-pad)', boxSizing: 'border-box' }}>
            <DemoPageHeader title="Algebra B" description="Tuesdays and Thursdays, 4:00 PM" />
            <EmptyType kind="first" />
        </div>
    </BrowserWindow>
);

/** A Section whose table is empty: the empty state replaces the whole table; the view bar above stays. */
export const InTable = ({ kind = 'first' }) => (
    <div style={{ padding: 'var(--page-pad)', boxSizing: 'border-box' }}>
        <PatternSection title="Students" description="Algebra B" tabs={<ViewBar views={['All students']} filters={null} />}>
            <EmptyType kind={kind} spacing="compact" />
        </PatternSection>
    </div>
);

/** A card with nothing to show: compact, the block centered in the card. */
export const InCard = () => (
    <div style={{ padding: 'var(--page-pad)', boxSizing: 'border-box' }}>
        <PatternCard title="Reflections">
            <EmptyType kind="done" spacing="compact" />
        </PatternCard>
    </div>
);

/** The Details Panel when its record was removed: the block at the top of the body with a way back. */
export const InPanel = () => (
    <div style={{ padding: 'var(--page-pad)', boxSizing: 'border-box' }}>
        <GonePanel />
    </div>
);
