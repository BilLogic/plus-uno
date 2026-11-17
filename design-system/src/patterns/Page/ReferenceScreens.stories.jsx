import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
    Banner, Button, EmptyState, FilterButton, FooterActions, PageHeader,
    PanelBody, PanelContainer, PanelFooter, PanelHeader, PopupSelect, SearchField, StatusTag, Tabs, TextField,
} from '@/components';
import { Frame, Page, PatternSection, PatternTable, usePanelControl } from '@/patterns';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';

export default {
    title: 'Templates/Page/Reference screens',
    tags: ['!autodocs'],
    parameters: { layout: 'fullscreen' },
};

/** A list keeps search and quick filters in the Section view bar, including when no rows match. */
export const ListWithFilters = {
    name: 'List with filters',
    tags: ['reference:list'],
    render: function ListReferenceScreen() {
        const [query, setQuery] = useState('');
        const [status, setStatus] = useState('All');
        const sessions = [
            { student: 'Ana Ruiz', status: 'Needs review' },
            { student: 'Ben Okafor', status: 'Reviewed' },
            { student: 'Chloe Tran', status: 'Needs review' },
        ];
        const rows = sessions.filter((row) => row.student.toLowerCase().includes(query.toLowerCase()) && (status === 'All' || row.status === status));
        const reset = () => { setQuery(''); setStatus('All'); };
        return (
            <Frame>
                <Page
                    header={<PageHeader title="Session review queue" />}
                    banner={<Banner appearance="announcement">Review notes are visible to the session tutor.</Banner>}
                >
                    <PatternSection title="Sessions" toolbar={
                        <div className="plus-section-view-bar" style={{ display: 'flex', alignItems: 'center', gap: 'var(--inline-md)' }}>
                            <Tabs appearance="pill" defaultActiveKey="all" aria-label="Session views"><Tabs.Tab eventKey="all">All sessions</Tabs.Tab></Tabs>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--inline-md)', marginInlineStart: 'auto' }}>
                            <SearchField placeholder="Search students" mode="active" value={query} onValueChange={setQuery} />
                            <PopupSelect label="Status" options={['All', 'Needs review', 'Reviewed']} value={status} onChange={setStatus}
                                trigger={<FilterButton text="Status" trailingMetric={status === 'All' ? undefined : 1} />} />
                            </div>
                        </div>
                    }>
                        <PatternTable empty={!rows.length} emptyState={
                            <EmptyState spacing="compact" header="No matching sessions" description="Try another search or reset the filters."
                                secondaryAction={<Button text="Reset filters" onClick={reset} />} />
                        }>
                            <thead><tr><th>Student</th><th>Status</th></tr></thead>
                            <tbody>{rows.map((row) => <tr key={row.student}>
                                <td>{row.student}</td><td><StatusTag appearance={row.status === 'Reviewed' ? 'success' : 'warning'}>{row.status}</StatusTag></td>
                            </tr>)}</tbody>
                        </PatternTable>
                    </PatternSection>
                </Page>
            </Frame>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByRole('row')).toHaveLength(4);
        await userEvent.click(canvas.getByRole('button', { name: 'Status' }));
        await userEvent.click(await within(document.body).findByRole('option', { name: 'Reviewed', exact: true }));
        await waitFor(() => expect(canvas.getAllByRole('row')).toHaveLength(2));
        await expect(canvas.getByText('Ben Okafor')).toBeVisible();
        await expect(canvas.getByRole('button', { name: /Status/ })).toHaveTextContent('1');
        const search = canvas.getByRole('searchbox', { name: 'Search students' });
        await userEvent.type(search, 'Ana');
        await expect(canvas.getByText('No matching sessions')).toBeVisible();
        await expect(canvas.queryByRole('table')).toBeNull();
        await expect(canvas.queryAllByRole('columnheader')).toHaveLength(0);
        await userEvent.click(canvas.getByRole('button', { name: 'Reset filters' }));
        await expect(canvas.getAllByRole('row')).toHaveLength(4);
    },
};

const ReviewPanel = ({ value, onSave }) => {
    const panel = usePanelControl();
    const [notes, setNotes] = useState(value);
    return (
        <PanelContainer>
            <PanelHeader title="Review notes" />
            <PanelBody>
                <TextField label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </PanelBody>
            <PanelFooter>
                <FooterActions>
                    <Button text="Discard" onClick={() => { setNotes(value); panel.setOpen(false); }} />
                    <Button text="Save notes" appearance="primary" onClick={() => { onSave(notes); panel.setOpen(false); }} />
                </FooterActions>
            </PanelFooter>
        </PanelContainer>
    );
};

const EditNotes = () => {
    const panel = usePanelControl();
    return <Button text="Edit notes" aria-expanded={panel.open} aria-controls={panel.panelId} onClick={() => panel.setOpen(true)} />;
};

/** A detail page keeps the record visible beside a docked editing Panel. */
export const DetailWithPanel = {
    name: 'Detail with panel',
    tags: ['reference:detail'],
    render: function DetailReferenceScreen() {
        const [saved, setSaved] = useState('Start with unit rates.');
        return (
            <FitStage width={1600}>
                <Frame style={{ blockSize: '100vh' }} defaultPanelOpen panelStorageKey={null}
                    panelLabel="Session review notes" panel={<ReviewPanel value={saved} onSave={setSaved} />}>
                    <Page
                        header={<PageHeader title="Ana Ruiz · Session review" actions={<EditNotes />} />}
                        banner={<Banner appearance="announcement">Saved notes are shared with the tutor.</Banner>}
                    >
                        <PatternSection title="Session summary">
                            <p>Math · Fractions and unit rates</p>
                            <StatusTag appearance="warning">Needs review</StatusTag>
                        </PatternSection>
                        <PatternSection title="Saved notes"><p role="status">{saved}</p></PatternSection>
                    </Page>
                </Frame>
            </FitStage>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const panel = () => canvas.getByRole('complementary', { name: 'Session review notes' });
        await waitFor(() => expect(panel()).toHaveClass('plus-frame__panel--docked'));
        const discard = within(panel()).getByRole('button', { name: 'Discard' });
        const save = within(panel()).getByRole('button', { name: 'Save notes' });
        await expect(discard.getBoundingClientRect().right).toBeLessThanOrEqual(save.getBoundingClientRect().left);
        await userEvent.type(canvas.getByRole('textbox', { name: 'Notes' }), ' Discard this.');
        await userEvent.click(discard);
        await waitFor(() => expect(canvas.queryByRole('complementary', { name: 'Session review notes' })).toBeNull());
        await userEvent.click(canvas.getByRole('button', { name: 'Edit notes' }));
        await expect(canvas.getByRole('textbox', { name: 'Notes' })).toHaveValue('Start with unit rates.');
        await userEvent.clear(canvas.getByRole('textbox', { name: 'Notes' }));
        await userEvent.type(canvas.getByRole('textbox', { name: 'Notes' }), 'Practice ratios next.');
        await userEvent.click(within(panel()).getByRole('button', { name: 'Save notes' }));
        await waitFor(() => expect(canvas.queryByRole('complementary', { name: 'Session review notes' })).toBeNull());
        await expect(canvas.getAllByRole('status').at(-1).textContent).toBe('Practice ratios next.');
        await userEvent.click(canvas.getByRole('button', { name: 'Edit notes' }));
        await userEvent.type(canvas.getByRole('textbox', { name: 'Notes' }), ' Discard this.');
        await userEvent.click(within(panel()).getByRole('button', { name: 'Discard' }));
        await userEvent.click(canvas.getByRole('button', { name: 'Edit notes' }));
        await expect(canvas.getByRole('textbox', { name: 'Notes' })).toHaveValue('Practice ratios next.');
    },
};
