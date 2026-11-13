import React from 'react';
import { expect } from 'storybook/test';

import { TypeCard, TypeGrid } from '@/storybook-docs/lib/template-page.jsx';
import { GROUP_STAGE, GROUP_THUMB_RATIO } from './overview-parts.js';
import { HostPanel } from './Forms/Forms.stories.jsx';
import { PlaceFullPage } from './Empty/Empty.stories.jsx';
import { CarrierInbox } from './Notifications/Notifications.stories.jsx';
import { KeyFocusedTask } from './Navigation/Navigation.stories.jsx';

/** The Patterns overview's group cards as a test harness: `!dev` keeps it out of the sidebar. The page is Patterns/Overview (PatternsOverview.mdx). */
export default {
    title: 'Patterns/Overview/Group cards',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

/** The smallest share of its box a figure may fill. */
const MIN_FILL = 0.9;

/** The four groups, each with the figure its card shows: the same stories the page names. */
const GROUPS = [
    ['Actions and input', HostPanel, ['Common actions', 'Forms']],
    ['States', PlaceFullPage, ['Empty', 'Loading', 'Errors', 'Overflow', 'Disabled', 'Read-only']],
    ['Notifications and indicators', CarrierInbox, ['Notifications', 'Indicators']],
    ['Finding things', KeyFocusedTask, ['Navigation', 'Search', 'Filtering']],
];

export const FourCards = {
    render: () => (
        <div style={{ inlineSize: 1000 /* docs-literal: two cards across, as on the page */ }}>
            <TypeGrid>
                {GROUPS.map(([title, story, patterns]) => (
                    <TypeCard key={title} thumb={story.render()} stage={GROUP_STAGE} title={title} thumbRatio={GROUP_THUMB_RATIO}>
                        One line about the {title} group. <span style={{ display: 'block' }}>{patterns.join(' · ')}</span>
                    </TypeCard>
                ))}
            </TypeGrid>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const boxes = [...canvasElement.querySelectorAll('[data-type-thumb]')];
        await expect(boxes, 'one figure per group').toHaveLength(GROUPS.length);
        const [first] = boxes.map((el) => el.getBoundingClientRect());
        boxes.forEach((el, i) => {
            const box = el.getBoundingClientRect();
            expect(box.width, `${GROUPS[i][0]}: same figure width`).toBeCloseTo(first.width, 0);
            expect(box.height, `${GROUPS[i][0]}: same figure height`).toBeCloseTo(first.height, 0);
            const pic = el.querySelector('[data-fit-stage]').getBoundingClientRect();
            expect(Math.min(pic.height, box.height) / box.height, `${GROUPS[i][0]}: the figure fills its box`).toBeGreaterThanOrEqual(MIN_FILL);
        });
        // Cards side by side share one height, however many patterns each lists.
        const cards = boxes.map((el) => el.closest('figure').getBoundingClientRect());
        cards.forEach((card, i) => {
            const beside = cards.filter((other) => Math.abs(other.top - card.top) < 1);
            expect(beside.length, `${GROUPS[i][0]}: shares its row`).toBeGreaterThan(1);
            beside.forEach((other) => expect(card.height, `${GROUPS[i][0]}: same height as the card beside it`).toBeCloseTo(other.height, 0));
        });
    },
};
