import React from 'react';
import { DoDontGrid } from '@/storybook-docs/ds-docs-layout.jsx';
import {
    Frames,
    RowSizes,
    StaticRowStates,
    CellStates,
    MessageRows,
    CellPresets,
    StudentTable,
    staticPairs,
    whichTablePairs,
} from '@/storybook-docs/table-doc-examples.jsx';

/*
 * StaticTable is planned and has no code. These stories are the live
 * examples of its rules, built from the table pattern and current components.
 */
export default {
    title: 'Components/Text and data display/Static table',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A fixed display grid for records people read and compare across columns. Planned: it has no code yet, and the table primitive and the table pattern stand in for it.',
            },
        },
    },
};

/** A table with a title column, a number column and a summary row. */
export const Anatomy = () => <StudentTable summary />;

export const FrameVariants = () => <Frames />;

export const RowSizeVariants = () => <RowSizes />;

export const CellRecipes = () => <CellPresets />;

export const RowStates = () => <StaticRowStates />;

export const CellStateExamples = () => <CellStates />;

export const MessageRowTypes = () => <MessageRows />;

/** The six do and don't pairs of the Static table rules. */
export const DoDont = () => <DoDontGrid pairs={staticPairs} />;

/** The Static table case of the Which table? rule. */
export const WhichTable = () => <DoDontGrid pairs={[whichTablePairs[0]]} />;
