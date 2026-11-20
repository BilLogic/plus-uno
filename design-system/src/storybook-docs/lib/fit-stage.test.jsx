import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FitStage, ScreenStage, TypeThumbContext } from './fit-stage.jsx';

describe('FitStage and ScreenStage in TypeCard thumbnails', () => {
    it('renders ScrollStage when scrollable outside a TypeCard thumbnail', () => {
        const { container } = render(
            <FitStage width={1024} scrollable>
                <span>Content</span>
            </FitStage>,
        );
        expect(screen.getByText('Content')).toBeInTheDocument();
        // The stage is a page view: the page keeps its own width inside a well that scrolls at 100%.
        expect(container.querySelector('.plus-page-view__well')).not.toBeNull();
        expect(screen.getByText('Content').closest('[data-fit-stage]').style.inlineSize).toBe('1024px');
    });

    it('renders unscrollable Stage inside TypeThumbContext or [data-type-thumb]', () => {
        const { container: ctxContainer } = render(
            <TypeThumbContext.Provider value={true}>
                <FitStage width={1024} scrollable>
                    <span>ThumbCtx</span>
                </FitStage>
            </TypeThumbContext.Provider>,
        );
        expect(ctxContainer.querySelector('[data-fit-stage]').style.overflow).toBe('hidden');
        expect(ctxContainer.innerHTML).not.toContain('overflow-x: auto');

        const { container: domContainer } = render(
            <div data-type-thumb="">
                <FitStage width={1024} scrollable>
                    <span>ThumbDom</span>
                </FitStage>
            </div>,
        );
        expect(domContainer.querySelector('[data-fit-stage]').style.overflow).toBe('hidden');
        expect(domContainer.innerHTML).not.toContain('overflow-x: auto');
    });

    it('renders fluid FitStage at 100% outside thumbnails and at stage width inside thumbnails', () => {
        const { container: liveContainer } = render(
            <FitStage width={1024} scrollable fluid>
                <span>FluidLive</span>
            </FitStage>,
        );
        expect(liveContainer.querySelector('[data-fit-stage]').style.inlineSize).toBe('100%');
        expect(liveContainer.innerHTML).not.toContain('overflow-x: auto');

        const { container: thumbContainer } = render(
            <TypeThumbContext.Provider value={true}>
                <FitStage width={1024} scrollable fluid>
                    <span>FluidThumb</span>
                </FitStage>
            </TypeThumbContext.Provider>,
        );
        expect(thumbContainer.querySelector('[data-stage-layout]').style.inlineSize).toBe('1024px');
    });

    it('keeps ScreenStage unscrollable inside TypeThumbContext', () => {
        const { container } = render(
            <TypeThumbContext.Provider value={true}>
                <ScreenStage width={1024} scrollable>
                    <span>ScreenThumb</span>
                </ScreenStage>
            </TypeThumbContext.Provider>,
        );
        expect(container.innerHTML).not.toContain('overflow-x: auto');
        expect(screen.getByText('ScreenThumb').parentElement.style.inlineSize).toBe('1024px');
    });
});
