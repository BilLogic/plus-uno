import React from 'react';
import { PAINT } from '../illustrations/paint.js';
import { ButtonShape, CardBox, Rect, Rule, SkeletonBar } from '../illustrations/primitives.jsx';
import { usePageContrast } from '../lib/use-page-contrast.js';
import { HeroDrawing, HeroPane } from './HeroDrawing.jsx';

/**
 * Foundations · Color. One card painted by role tokens, shown in light on the
 * left and dark on the right, one picture split down the middle. Text is soft
 * skeleton bars, never words. The Primary button is the subject, the one
 * accent. Coordinates are in kit units (1 = 2px) from the stage's corner.
 */

const CARD = { x: 55, y: 25, w: 190, h: 110 };

const Card = () => {
    const { x, y } = CARD;
    return (
        <g>
            <CardBox x={x} y={y} w={CARD.w} h={CARD.h} />
            <SkeletonBar x={x + 12} y={y + 13} w={70} h={5} heading />
            <SkeletonBar x={x + 12} y={y + 25} w={130} h={4} />
            <SkeletonBar x={x + 12} y={y + 33} w={105} h={4} />
            <Rect x={x + 12} y={y + 47} w={166} h={20} fill={PAINT.fieldSurface} stroke={PAINT.fieldBorder} corner="field" />
            <SkeletonBar x={x + 18} y={y + 55} w={60} h={4} />
            <Rule x1={x} x2={x + CARD.w} y1={y + 76} y2={y + 76} />
            <ButtonShape x={x + 30} y={y + 90} w={40} />
            <ButtonShape x={x + 75} y={y + 90} w={40} appearance="primary" />
        </g>
    );
};

export const ColorHero = () => {
    const contrast = usePageContrast();
    return (
        <>
            {['light', 'dark'].map((mode) => (
                <HeroPane key={mode} mode={mode} contrast={contrast}>
                    <HeroDrawing>
                        <Card />
                    </HeroDrawing>
                </HeroPane>
            ))}
        </>
    );
};
