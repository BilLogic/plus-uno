import React from 'react';
import { DoDontGrid } from '@/storybook-docs/ds-docs-layout.jsx';
import {
    DynamicAnatomy,
    DynamicStates,
    FooterTypes,
    Frames,
    dynamicPairs,
    whichTablePairs,
} from '@/storybook-docs/table-doc-examples.jsx';

/*
 * DynamicTable is planned and has no code. These stories are the live
 * examples of its rules, built from the table pattern and current components.
 */
export default {
    title: 'Components/Text and data display/Dynamic table',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A table people work with: sort a column, page through records and select rows to act on them together. Planned: it has no code yet, and the table pattern stands in for it.',
            },
        },
    },
};

/** A selection, the bulk bar in the Section header, sorted head cells and the pager. */
export const Anatomy = () => <DynamicAnatomy />;

export const FrameVariants = () => <Frames />;

export const FooterVariants = () => <FooterTypes />;

export const StateVariants = () => <DynamicStates />;

/** The seven do and don't pairs of the Dynamic table rules. */
export const DoDont = () => <DoDontGrid pairs={dynamicPairs} />;

/** The Dynamic table case of the Which table? rule. */
export const WhichTable = () => <DoDontGrid pairs={[whichTablePairs[1]]} />;
