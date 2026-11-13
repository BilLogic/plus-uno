import React from 'react';
import { HERO_HAIRLINE } from '../illustrations/paint.js';
import { HeroGround } from '../illustrations/primitives.jsx';

/**
 * The drawing surface every hero shares. The hero frame is 1000 x 400 at the
 * docs width (5:2) and a kit unit is 2px, so the frame is 500 x 200 units. A
 * drawing is composed on a centered stage of 300 x 160 units (600 x 320 px) and
 * its coordinates start at the stage's corner, so the same drawing crops to a
 * card on the overview pages. The frame's ground (the dots) is drawn by the
 * frame, not here.
 */
export const FRAME_UNITS = { w: 500, h: 200 };
export const STAGE_UNITS = { w: 300, h: 160 };

/**
 * The docked Sidebar's width on a hero frame, in units. The real Sidebar is 240
 * wide in a Frame of about 1040, and a hero frame is 260 units, so it draws 60.
 * Every hero that shows a sidebar uses this one width.
 */
export const HERO_SIDEBAR_W = 60;

/** The stage's corner inside the frame, in units: the stage sits centered. */
const STAGE_ORIGIN = {
    x: (FRAME_UNITS.w - STAGE_UNITS.w) / 2,
    y: (FRAME_UNITS.h - STAGE_UNITS.h) / 2,
};

/**
 * An SVG the size of the whole frame, with the stage's origin at (0, 0) of its
 * children. Hidden from assistive tech: the frame carries the description.
 */
export const HeroDrawing = ({ children }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${FRAME_UNITS.w} ${FRAME_UNITS.h}`}
        aria-hidden="true"
        focusable="false"
        style={{ '--stroke-hairline': HERO_HAIRLINE }}
    >
        <HeroGround.Provider value>
            <g transform={`translate(${STAGE_ORIGIN.x} ${STAGE_ORIGIN.y})`}>{children}</g>
        </HeroGround.Provider>
    </svg>
);

/**
 * One half of a split hero. The pane sets its own color mode, so the tokens it
 * paints resolve for that mode whatever the page is set to, and it follows the
 * page's contrast. Its drawing is the whole frame, shifted so each pane shows
 * its own half of one picture.
 */
export const HeroPane = ({ mode, contrast, children }) => (
    <div
        className={`sb-docs-hero__pane sb-docs-hero__pane--${mode}`}
        data-color-mode={mode}
        {...(contrast ? { 'data-contrast-mode': contrast } : {})}
    >
        {children}
    </div>
);
