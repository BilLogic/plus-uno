import React from 'react';
import { expect } from 'storybook/test';

import { TypeCard, TypeGrid } from '@/storybook-docs/lib/template-page.jsx';
import { THUMB_STAGE, FrameThumb, PageThumb, SectionThumb, FormThumb, ModalThumb, PanelThumb, PopupThumb } from './overview-thumbs.jsx';

/** The Templates overview's type grid as a test harness: `!dev` keeps it out of the sidebar. The page is Templates/Overview (TemplatesOverview.mdx). */
export default {
    title: 'Templates/Overview/Thumbnails',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

const CARDS = [
    ['Frame', FrameThumb],
    ['Page', PageThumb],
    ['Section', SectionThumb],
    ['Form', FormThumb],
    ['Modal', ModalThumb],
    ['Panel', PanelThumb],
    ['Popup', PopupThumb],
];

/** The smallest share of its box a thumbnail's picture may fill. */
const MIN_FILL = 0.9;

export const SevenCards = {
    render: () => (
        <div style={{ inlineSize: 1000 /* docs-literal: two cards across */ }}>
            <TypeGrid>
                {CARDS.map(([title, Thumb]) => (
                    <TypeCard key={title} thumb={<Thumb />} stage={THUMB_STAGE.width} title={title} thumbRatio="16 / 10">One line about the {title} template.</TypeCard>
                ))}
            </TypeGrid>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const boxes = [...canvasElement.querySelectorAll('[data-type-thumb]')];
        await expect(boxes, 'one thumbnail per template').toHaveLength(CARDS.length);
        const [first] = boxes.map((el) => el.getBoundingClientRect());
        boxes.forEach((el, i) => {
            const box = el.getBoundingClientRect();
            expect(box.width, `${CARDS[i][0]}: same thumbnail width`).toBeCloseTo(first.width, 0);
            expect(box.height, `${CARDS[i][0]}: same thumbnail height`).toBeCloseTo(first.height, 0);
            const pic = el.querySelector('[data-thumb-stage]').getBoundingClientRect();
            expect(pic.width / box.width, `${CARDS[i][0]}: fills the box's width`).toBeGreaterThanOrEqual(MIN_FILL);
            expect(pic.height / box.height, `${CARDS[i][0]}: fills the box's height`).toBeGreaterThanOrEqual(MIN_FILL);
        });
        const gaps = boxes.map((el) => el.nextElementSibling.getBoundingClientRect().top - el.getBoundingClientRect().bottom);
        gaps.forEach((gap, i) => expect(gap, `${CARDS[i][0]}: the name sits the same distance under its thumbnail`).toBeCloseTo(gaps[0], 0));
    },
};
