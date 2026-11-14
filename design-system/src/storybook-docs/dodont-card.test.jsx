import React from 'react';
import { render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DoDontCaption, DoDontCard, DoDontPair } from './ds-docs-layout.jsx';
import { Do, Dont, DoDont } from './foundation-blocks.jsx';
import { MotionDemo, pair } from './illustrations/motion.jsx';

describe('DoDontPair and DoDontCard', () => {
    it('renders two raised cards with a hairline border, sunken example well on top, and filled caption block below', () => {
        const { container } = render(
            <DoDontPair
                doExample={<button type="button">Book session</button>}
                doCaption="Use one primary action per page."
                dontExample={<button type="button">Cancel</button>}
                dontCaption="Put several primary actions side by side."
            />,
        );

        const pairEl = container.querySelector('.sb-ds-dodont-pair');
        expect(pairEl).toBeTruthy();

        const cards = container.querySelectorAll('figure.sb-ds-dodont-card');
        expect(cards).toHaveLength(2);

        const [doCard, dontCard] = cards;
        expect(doCard.getAttribute('data-verdict')).toBe('do');
        expect(dontCard.getAttribute('data-verdict')).toBe('dont');

        for (const card of cards) {
            expect(card.style.backgroundColor).toBe('var(--ds-surface-raised)');
            expect(card.style.border).toBe('var(--border-default) solid var(--ds-border)');
            expect(card.style.boxShadow).toBe('var(--ds-shadow-raised)');
            expect(card.style.borderRadius).toBe('var(--card-radius)');
            expect(card.style.padding).toBe('var(--card-pad-default)');
            expect(card.style.gap).toBe('var(--section-stack-md)');

            // Well is the first child, caption block is the second child (no top header bar).
            expect(card.children).toHaveLength(2);
            const [well, caption] = card.children;
            expect(well.classList.contains('sb-ds-dodont-card__well')).toBe(true);
            expect(well.style.backgroundColor).toBe('var(--ds-surface-sunken)');
            expect(well.style.borderRadius).toBe('var(--radius-lg)');
            expect(well.style.minHeight).toBe('calc(var(--height-500) * 2)');
            expect(caption.tagName).toBe('FIGCAPTION');
            expect(caption.classList.contains('sb-ds-dodont-caption')).toBe(true);
        }

        const doCaption = doCard.querySelector('figcaption.sb-ds-dodont-caption');
        const dontCaption = dontCard.querySelector('figcaption.sb-ds-dodont-caption');

        expect(doCaption.style.backgroundColor).toBe('var(--ds-background-success-subtle)');
        expect(dontCaption.style.backgroundColor).toBe('var(--ds-background-danger-subtle)');

        for (const [caption, iconClass, labelText, bodyText] of [
            [doCaption, 'fa-circle-check', 'Do', 'Use one primary action per page.'],
            [dontCaption, 'fa-circle-xmark', "Don't", 'Put several primary actions side by side.'],
        ]) {
            expect(caption.style.borderRadius).toBe('var(--radius-lg)');
            expect(caption.style.color).toBe('var(--ds-text)');

            const icon = caption.querySelector(`i.fa-solid.${iconClass}`);
            expect(icon).toBeTruthy();
            // Icon stays in normal text color, not status icon color.
            expect(icon.style.color).not.toContain('--ds-icon-success');
            expect(icon.style.color).not.toContain('--ds-icon-danger');

            const label = within(caption).getByText(labelText);
            const body = within(caption).getByText(bodyText);
            expect(label.tagName).toBe('STRONG');
            // Caption sentence sits in the same text column as the label (aligned with the label, not under the icon).
            expect(label.parentElement).toBe(body.parentElement);
            expect(icon.closest('span')).not.toBe(label.parentElement);
        }
    });

    it('shares the same card and caption block with Foundation Do / Dont / DoDont', () => {
        const { container } = render(
            <DoDont>
                <Do caption="Follow the grid."><span>Example A</span></Do>
                <Dont caption="Break the grid."><span>Example B</span></Dont>
            </DoDont>,
        );

        expect(container.querySelector('.sb-ds-dodont-pair')).toBeTruthy();
        const cards = container.querySelectorAll('figure.sb-ds-dodont-card');
        expect(cards).toHaveLength(2);
        expect(cards[0].querySelector('figcaption.sb-ds-dodont-caption').style.backgroundColor).toBe('var(--ds-background-success-subtle)');
        expect(cards[1].querySelector('figcaption.sb-ds-dodont-caption').style.backgroundColor).toBe('var(--ds-background-danger-subtle)');
    });

    it('renders the shared DoDontCaption block under MotionDemo verdict tiles', () => {
        const scenes = pair(
            {
                id: 'demo-do',
                title: 'Immediate press',
                caption: 'Answers in the same frame.',
                viewBox: '0 0 160 100',
                initial: { x: 0 },
                landing: { x: 1 },
                draw: () => <rect x="0" y="0" width="10" height="10" fill="var(--ds-surface)" />,
                play: async () => {},
            },
            {
                id: 'demo-dont',
                title: 'Delayed press',
                caption: 'Waits before answering.',
                viewBox: '0 0 160 100',
                initial: { x: 0 },
                landing: { x: 1 },
                draw: () => <rect x="0" y="0" width="10" height="10" fill="var(--ds-surface)" />,
                play: async () => {},
            },
        );

        const { container } = render(<MotionDemo title="Press response" scenes={scenes} reduced />);
        const captions = container.querySelectorAll('figcaption.sb-ds-dodont-caption');
        expect(captions).toHaveLength(2);
        expect(captions[0].style.backgroundColor).toBe('var(--ds-background-success-subtle)');
        expect(captions[1].style.backgroundColor).toBe('var(--ds-background-danger-subtle)');
        expect(within(captions[0]).getByText('Do').tagName).toBe('STRONG');
        expect(within(captions[1]).getByText("Don't").tagName).toBe('STRONG');
    });
});
