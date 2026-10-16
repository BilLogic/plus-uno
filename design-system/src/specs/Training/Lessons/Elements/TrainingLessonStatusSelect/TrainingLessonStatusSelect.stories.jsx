/**
 * TrainingLessonStatusSelect Stories
 *
 * Lesson status filter: pick any number of statuses, applied when the list closes.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=779-75384
 */

import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import TrainingLessonStatusSelect from './TrainingLessonStatusSelect';

export default {
    title: 'Specs/Training/Lessons/Elements/Training Lesson Status Select',
    component: TrainingLessonStatusSelect,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Lesson status filter: a multi Select over Assigned, In Progress, Completed and Not Started, each with its icon and count. It applies when the list closes; with nothing picked it reads "All statuses".',
            },
        },
    },
};

/**
 * Overview
 * All statuses, one status, and several statuses picked, plus the open list
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg)' }}>
            <div>
                <h4 className="h6" style={{ marginBottom: 'var(--size-element-gap-lg)' }}>All statuses</h4>
                <TrainingLessonStatusSelect />
            </div>
            <div>
                <h4 className="h6" style={{ marginBottom: 'var(--size-element-gap-lg)' }}>Completed picked</h4>
                <TrainingLessonStatusSelect selectedStatuses={['completed']} />
            </div>
            <div>
                <h4 className="h6" style={{ marginBottom: 'var(--size-element-gap-lg)' }}>In Progress and Not Started picked</h4>
                <TrainingLessonStatusSelect selectedStatuses={['in-progress', 'not-started']} />
            </div>
            <div style={{ paddingBottom: '240px' }}>
                <h4 className="h6" style={{ marginBottom: 'var(--size-element-gap-lg)' }}>Open</h4>
                <TrainingLessonStatusSelect open />
            </div>
        </div>
    )
};

/**
 * Interactive
 * Interactive status filter with change handler
 */
export const Interactive = {
    render: (args) => {
        const [statuses, setStatuses] = useState([]);

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)', minHeight: '360px' }}>
                <p className="body2-txt" style={{ marginBottom: 'var(--size-element-gap-lg)' }}>
                    Filtering by: <strong data-testid="applied">{statuses.length ? statuses.join(', ') : 'all statuses'}</strong>
                </p>
                <TrainingLessonStatusSelect
                    selectedStatuses={statuses}
                    counts={args.counts}
                    onStatusChange={setStatuses}
                />
            </div>
        );
    },
    args: {
        counts: {
            assigned: 0,
            inProgress: 0,
            completed: 5,
            notStarted: 15
        }
    }
};

Interactive.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const applied = canvas.getByTestId('applied');

    await userEvent.click(canvas.getByRole('combobox', { name: 'Lesson status' }));
    await userEvent.click(await page.findByRole('option', { name: /^Completed/ }));
    await userEvent.click(await page.findByRole('option', { name: /^Not Started/ }));
    await expect(applied).toHaveTextContent('all statuses');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(applied).toHaveTextContent('completed, not-started'));
};
