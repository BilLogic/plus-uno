import React from 'react';
import PropTypes from 'prop-types';
import { expect } from 'storybook/test';
import { FullSizeContext, ScrollStage } from './fit-stage.jsx';

/**
 * A docs Do/Don't example at full size. The pair's card draws a whole screen
 * scaled into half the docs column; its "Open full size" link opens the same
 * live example here, laid out at the screen's own width in a page view (100%
 * by default, with the Fit, 50%, 75% and Full screen controls when the canvas
 * is narrower). The example is the one the card renders: only the stage changes.
 */
export const FullSize = ({ width, children }) => (
    <FullSizeContext.Provider value>
        <ScrollStage width={width}>{children}</ScrollStage>
    </FullSizeContext.Provider>
);

FullSize.propTypes = { width: PropTypes.number.isRequired, children: PropTypes.node };

/** The play every full-size story runs: the example is live and the page view sits at 100%. */
export const expectAtFullSize = async (canvasElement) => {
    const well = canvasElement.querySelector('.plus-page-view__well');
    await expect(well, 'the example sits in a page view').not.toBeNull();
    await expect(well.dataset.zoom, 'the page view opens at 100%').toBe('100');
    await expect(canvasElement.querySelector('[inert]:not([data-base-ui-inert])'), 'the example is live, not inert').toBeNull();
};

/**
 * A story that renders `Case` (the component the docs card renders) at `width`
 * in a page view. Export it as `FullSize<Name>`: the pair's link is
 * `?path=/story/<title>--full-size-<name>`.
 */
export const fullSizeStory = (Case, width, name) => ({
    name: `Full size, ${name}`,
    // The stage draws its own window or surface, so the toolbar's browser chrome stays off.
    parameters: { layout: 'padded', fullPage: false },
    render: () => (
        <FullSize width={width}>
            <Case />
        </FullSize>
    ),
    play: async ({ canvasElement }) => {
        await expectAtFullSize(canvasElement);
    },
});
