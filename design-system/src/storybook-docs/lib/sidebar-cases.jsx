import React from 'react';
import * as Example from '@/components/navigation/Sidebar/Sidebar.examples.jsx';

/**
 * The Sidebar page's do and don't examples, staged for the docs. Each one is
 * the example from `Sidebar.examples.jsx` set in the docked Sidebar area of
 * the Frame, and `sb-unstyled` keeps Storybook's docs styles off it.
 */
const Stage = ({ children }) => (
    <div className="plus-frame__sidebar plus-frame__sidebar--docked not-prose sb-unstyled">{children}</div>
);

const staged = (Inner) => (props) => (
    <Stage>
        <Inner {...props} />
    </Stage>
);

export const NamesDo = staged(Example.NamesDo);
export const NamesDont = staged(Example.NamesDont);
export const LockDo = staged(Example.LockDo);
export const LockDont = staged(Example.LockDont);
export const TabLabelDo = staged(Example.TabLabelDo);
export const TabLabelDont = staged(Example.TabLabelDont);
