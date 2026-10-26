import React, { useState } from 'react';
import { expect } from 'storybook/test';
import { Button, Input, NavTabs } from '@/components';
import { PatternCard, PatternSection } from '@/patterns';
import { tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { DemoLabel, slotContent } from '@/storybook-docs/lib/pattern-demo.jsx';

const col = { display: 'flex', flexDirection: 'column', gap: 'var(--space-200)' };

const Actions = () => (
    <>
        <Button text="Secondary" style="secondary" fill="outline" size="medium" onClick={() => {}} />
        <Button text="Primary" style="primary" fill="filled" size="medium" onClick={() => {}} />
    </>
);

const Tabs = ({ label = 'Views' }) => {
    const [active, setActive] = useState('all');
    return (
        <NavTabs mode="tabs" activeKey={active} onSelect={setActive} aria-label={label}>
            <NavTabs.Item eventKey="all">All students</NavTabs.Item>
            <NavTabs.Item eventKey="active">Active</NavTabs.Item>
            <NavTabs.Item eventKey="paused">Paused</NavTabs.Item>
        </NavTabs>
    );
};

const DefaultToolbar = () => (
    <PatternSection.Toolbar
        search={<Input label="Search students" showLabel={false} placeholder="Search students" leadingVisual="magnifying-glass" type="search" />}
        filters={(
            <>
                <Button text="Status" style="default" fill="ghost" size="medium" trailingVisual="chevron-down" onClick={() => {}} />
                <Button text="Tutor" style="default" fill="ghost" size="medium" trailingVisual="chevron-down" onClick={() => {}} />
            </>
        )}
        count="48 students"
        actions={(
            <>
                <Button text="Export" style="secondary" fill="outline" size="small" leadingVisual="download" onClick={() => {}} />
                <Button text="Add student" style="primary" fill="filled" size="small" leadingVisual="user-plus" onClick={() => {}} />
            </>
        )}
    />
);

const SelectedToolbar = () => (
    <PatternSection.Toolbar
        state="selected"
        selection="3 selected"
        bulkActions={(
            <>
                <Button text="Assign tutor" style="default" fill="ghost" size="small" onClick={() => {}} />
                <Button text="Message" style="default" fill="ghost" size="small" onClick={() => {}} />
            </>
        )}
        onClear={() => {}}
    />
);

const description = 'Optional supporting description for this section.';

/** The five `_Section header` types, plus "Add view" on the tabs row. */
function HeaderTypesDemo() {
    return (
        <div style={col}>
            <div>
                <DemoLabel>type=default</DemoLabel>
                <PatternSection title="Section title" description={description} actions={<Actions />}>
                    {slotContent('Content slot')}
                </PatternSection>
            </div>
            <div>
                <DemoLabel>type=tabs · onAddView</DemoLabel>
                <PatternSection title="Students" description={description} actions={<Actions />} tabs={<Tabs />} onAddView={() => {}}>
                    {slotContent('Content slot')}
                </PatternSection>
            </div>
            <div>
                <DemoLabel>type=toolbar · state=default</DemoLabel>
                <PatternSection title="Students" description={description} toolbar={<DefaultToolbar />}>
                    {slotContent('Table')}
                </PatternSection>
            </div>
            <div>
                <DemoLabel>type=toolbar · state=selected</DemoLabel>
                <PatternSection title="Students" description={description} toolbar={<SelectedToolbar />}>
                    {slotContent('Table')}
                </PatternSection>
            </div>
            <div>
                <DemoLabel>type=custom</DemoLabel>
                <PatternSection
                    title="This week"
                    header={(
                        <>
                            <p style={{ margin: 0, font: 'var(--heading-medium)' }}>Week of October 20</p>
                            <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>12 sessions · 3 tutors out</p>
                        </>
                    )}
                >
                    {slotContent('Content slot')}
                </PatternSection>
            </div>
            <div>
                <DemoLabel>type=tabs-only · title visually hidden</DemoLabel>
                <PatternSection type="tabs-only" title="Students" tabs={<Tabs label="Students" />}>
                    {slotContent('Content slot')}
                </PatternSection>
            </div>
        </div>
    );
}

const StatCard = ({ title, body }) => (
    <PatternCard style={{ flex: 1 }} minWidth={220}>
        <p style={{ margin: 0, font: 'var(--body-default)' }}>{title}</p>
        <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>{body}</p>
    </PatternCard>
);

/** The three body layouts. */
function LayoutsDemo() {
    return (
        <div style={col}>
            <div>
                <DemoLabel>layout=single</DemoLabel>
                <PatternSection title="Section title" description={description} actions={<Actions />}>
                    <div style={{ display: 'flex', gap: 'var(--layout-gutter)', flexWrap: 'wrap' }}>
                        <StatCard title="Sessions this week" body="12 scheduled · 2 need a tutor" />
                        <StatCard title="Attendance" body="94% across 38 students" />
                        <StatCard title="Notes due" body="3 sessions without notes" />
                    </div>
                </PatternSection>
            </div>
            <div>
                <DemoLabel>layout=split</DemoLabel>
                <PatternSection title="Section title" description={description} layout="split" side={slotContent('Side · span 4')}>
                    {slotContent('Main · span 8')}
                </PatternSection>
            </div>
            <div>
                <DemoLabel>layout=subsections</DemoLabel>
                <PatternSection title="Settings" description="Manage your tutor profile, reminders and who can see your availability." layout="subsections">
                    <PatternSection title="Profile" description="Name, photo and time zone." actions={<Actions />}>
                        {slotContent('Subsection body')}
                    </PatternSection>
                    <PatternSection title="Notifications" description="Email and text reminders.">
                        {slotContent('Subsection body')}
                    </PatternSection>
                    <PatternSection title="Privacy" description="Who can see your availability.">
                        {slotContent('Subsection body')}
                    </PatternSection>
                </PatternSection>
            </div>
        </div>
    );
}

export default {
    title: 'Foundations/Patterns/Section',
    component: PatternSection,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        actions: { table: { disable: true } },
        tabs: { table: { disable: true } },
        toolbar: { table: { disable: true } },
        header: { table: { disable: true } },
        side: { table: { disable: true } },
        footer: { table: { disable: true } },
        onAddView: { table: { disable: true } },
        padding: { table: { disable: true } },
        background: { table: { disable: true } },
        level: { control: false, table: { category: 'Design' } },
        title: { control: 'text', description: 'Section title', table: { category: 'Slots' } },
        description: { control: 'text', description: 'Optional description under the title', table: { category: 'Slots' } },
        type: {
            control: 'select',
            options: ['default', 'tabs', 'toolbar', 'custom', 'tabs-only'],
            description: 'Header type; read from the slots when left off',
            table: { category: 'Design' },
        },
        layout: {
            control: 'select',
            options: ['single', 'split', 'subsections'],
            description: 'Body layout',
            table: { category: 'Design' },
        },
        loading: { control: 'boolean', description: 'Skeleton bars in place of the header', table: { category: 'State' } },
        gap: { control: false, table: { category: 'Design' } },
        id: { control: false, table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
    },
};

export const Overview = () => (
    <PatternSection title="Section title" description={description} actions={<Actions />}>
        {slotContent('Content · cards, tables, rows or forms')}
    </PatternSection>
);

export const HeaderTypes = () => <HeaderTypesDemo />;

export const Layouts = () => <LayoutsDemo />;

export const Footer = () => (
    <PatternSection
        title="Upcoming sessions"
        description={description}
        footer={<Button text="View all" style="primary" fill="text" size="medium" onClick={() => {}} />}
    >
        {slotContent('Rows')}
    </PatternSection>
);

export const Loading = () => (
    <div style={col}>
        <div>
            <DemoLabel>type=default · loading</DemoLabel>
            <PatternSection title="Section title" description={description} loading>
                {slotContent('Content slot')}
            </PatternSection>
        </div>
        <div>
            <DemoLabel>type=toolbar · loading</DemoLabel>
            <PatternSection title="Students" description={description} toolbar={<DefaultToolbar />} loading>
                {slotContent('Table')}
            </PatternSection>
        </div>
        <div>
            <DemoLabel>type=tabs-only · loading</DemoLabel>
            <PatternSection type="tabs-only" title="Students" tabs={<Tabs label="Students" />} loading>
                {slotContent('Content slot')}
            </PatternSection>
        </div>
    </div>
);

export const Interactive = {
    args: {
        title: 'Section title',
        description,
        type: 'default',
        layout: 'single',
        loading: false,
    },
    render: (args) => {
        const bottom = args.type === 'toolbar' ? { toolbar: <DefaultToolbar /> }
            : (args.type === 'tabs' || args.type === 'tabs-only') ? { tabs: <Tabs /> }
            : args.type === 'custom' ? { header: slotContent('Custom header') }
            : {};
        return (
            <PatternSection
                title={args.title || undefined}
                description={args.description || undefined}
                actions={<Actions />}
                type={args.type}
                layout={args.layout}
                loading={args.loading}
                side={args.layout === 'split' ? slotContent('Side') : undefined}
                {...bottom}
            >
                {args.layout === 'subsections' ? (
                    <>
                        <PatternSection title="Subsection title">{slotContent('Subsection body')}</PatternSection>
                        <PatternSection title="Subsection title">{slotContent('Subsection body')}</PatternSection>
                    </>
                ) : slotContent('Content slot')}
            </PatternSection>
        );
    },
};

/**
 * In every color mode a section has no fill, its title is the body text, its
 * description the subtle text, and the selected toolbar sits on the selected
 * background. The deprecated `background="container"` still draws the well.
 */
export const ColorModes = {
    render: () => (
        <div style={col}>
            <PatternSection data-probe="plain" title="Section title" description="A short description.">
                {slotContent('Content slot')}
            </PatternSection>
            <PatternSection data-probe="toolbar" title="Students" toolbar={<SelectedToolbar />}>
                {slotContent('Table')}
            </PatternSection>
            <PatternSection data-probe="well" title="Legacy well" background="container">
                {slotContent('Content slot')}
            </PatternSection>
        </div>
    ),
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        const plain = canvasElement.querySelector('[data-probe="plain"]');
        const title = plain.querySelector('.plus-pattern-section-title');
        const desc = plain.querySelector('.plus-pattern-section-description');
        const bulk = canvasElement.querySelector('.plus-section-toolbar--selected');
        const well = canvasElement.querySelector('[data-probe="well"]');
        await inEveryColorMode(async (mode) => {
            await expect(getComputedStyle(plain).backgroundColor, `${mode}: no fill`).toBe('rgba(0, 0, 0, 0)');
            await expect(getComputedStyle(plain).paddingTop, `${mode}: no pad`).toBe('0px');
            await expect(getComputedStyle(title).color, `${mode}: the title`).toBe(tokenColor(canvasElement, '--ds-text'));
            await expect(getComputedStyle(desc).color, `${mode}: the description`).toBe(tokenColor(canvasElement, '--ds-text-subtle'));
            await expect(getComputedStyle(bulk).backgroundColor, `${mode}: the bulk bar`).toBe(tokenColor(canvasElement, '--ds-background-selected'));
            await expect(getComputedStyle(well).backgroundColor, `${mode}: the legacy well`).toBe(tokenColor(canvasElement, '--ds-surface-container'));
        });
    },
};

/**
 * Split: at 960 the main column takes span 8 and the side span 4 of the
 * 12-column grid; at 600 the side drops below its minimum, so they stack.
 */
export const SplitLayout = {
    render: () => (
        <div style={col}>
            <div data-probe="wide" style={{ width: 960 }}>
                <PatternSection title="Wide" layout="split" side={slotContent('Side')}>{slotContent('Main')}</PatternSection>
            </div>
            <div data-probe="narrow" style={{ width: 600 }}>
                <PatternSection title="Narrow" layout="split" side={slotContent('Side')}>{slotContent('Main')}</PatternSection>
            </div>
        </div>
    ),
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        const gutter = tokenLength(canvasElement, '--layout-gutter');
        const box = (probe, part) => canvasElement.querySelector(`[data-probe="${probe}"] .plus-pattern-section-${part}`).getBoundingClientRect();
        const W = 960;
        const span = (n) => (n * (W - 11 * gutter)) / 12 + (n - 1) * gutter;
        await expect(box('wide', 'main').width, 'main is span 8').toBeCloseTo(span(8), 0);
        await expect(box('wide', 'side').width, 'side is span 4').toBeCloseTo(span(4), 0);
        await expect(box('wide', 'side').top, 'side beside main').toBeCloseTo(box('wide', 'main').top, 0);
        await expect(box('narrow', 'side').top, 'side stacks under main').toBeGreaterThan(box('narrow', 'main').bottom);
        await expect(box('narrow', 'main').width, 'main spans the section').toBeCloseTo(600, 0);
    },
};

/** Header to body is Section/stack-md; the tabs row sits Section/stack-sm under the title row. */
export const Spacing = {
    render: () => (
        <PatternSection title="Students" description={description} tabs={<Tabs />}>
            {slotContent('Content slot')}
        </PatternSection>
    ),
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        const q = (s) => canvasElement.querySelector(s).getBoundingClientRect();
        await expect(q('.plus-pattern-section-content').top - q('.plus-pattern-section-header').bottom, 'header to body')
            .toBeCloseTo(tokenLength(canvasElement, '--section-stack-md'), 0);
        await expect(q('.plus-pattern-section-tabs').top - q('.plus-pattern-section-title-row').bottom, 'title row to tabs')
            .toBeCloseTo(tokenLength(canvasElement, '--section-stack-sm'), 0);
        await expect(q('.plus-pattern-section-description').top - q('.plus-pattern-section-title').bottom, 'title to description')
            .toBeCloseTo(tokenLength(canvasElement, '--element-stack-sm'), 0);
    },
};
