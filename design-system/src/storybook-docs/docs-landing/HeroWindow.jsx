import React, { useId } from 'react';
import { PAINT } from '../illustrations/paint.js';
import { PageSheet, Rect, Rule, Sidebar } from '../illustrations/primitives.jsx';
import { HERO_SIDEBAR_W } from './HeroDrawing.jsx';

/**
 * The app frame as the real Frame lays it out: a window holding a docked Sidebar
 * on the sunken fill, the Page on the page surface running the full height (the
 * Frame has no top bar), and an optional docked Panel at a hairline. The parts
 * are clipped to the window's corners, so the window's one radius rounds
 * whichever part reaches a corner. `ring` is the accent around the whole window.
 */
export const AppWindow = ({ x, y, w, h, sidebar = true, panel = 0, ring = false, ringPage = false, children }) => {
    const clip = `hero-window-${useId().replace(/:/g, '')}`;
    const sw = sidebar ? HERO_SIDEBAR_W : 0;
    const page = { x: x + sw, y, w: w - sw - panel, h };
    return (
        <>
            <clipPath id={clip}>
                <Rect x={x} y={y} w={w} h={h} corner="window" />
            </clipPath>
            <PageSheet x={x} y={y} w={w} h={h} />
            <g clipPath={`url(#${clip})`} data-window-parts="">
                <Rect x={x} y={y} w={w} h={h} fill={PAINT.frameSunken} />
                <Rect x={page.x} y={page.y} w={page.w} h={page.h} fill={PAINT.pageSurface} />
                {sidebar && <Sidebar x={x} y={y} w={sw} h={h} />}
                {panel > 0 && <Rect x={x + w - panel} y={y} w={panel} h={h} fill={PAINT.panelSurface} />}
                {panel > 0 && <Rule x1={x + w - panel} x2={x + w - panel} y1={y} y2={y + h} stroke={PAINT.panelEdge} />}
            </g>
            {ring && <Rect x={x} y={y} w={w} h={h} stroke={PAINT.accent} corner="window" />}
            {ringPage && <Rect x={page.x} y={page.y} w={page.w} h={page.h} stroke={PAINT.accent} corner="window" />}
            {children?.(page)}
        </>
    );
};
