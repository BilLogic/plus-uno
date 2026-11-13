import React from 'react';
import { CardBox } from '../illustrations/primitives.jsx';

/**
 * One cell of an overview bento: a Card box on the raised pair, its contents
 * drawn inside. Big things take big cells and small things small ones; the
 * subject's cell takes the accent ring. `name` and the size are on the group,
 * so a test can read the layout without measuring.
 */
export const BentoCell = ({ name, x, y, w, h, accent = false, children }) => (
    <g data-cell={name} data-w={w} data-h={h}>
        <CardBox x={x} y={y} w={w} h={h} accent={accent} />
        {children}
    </g>
);
