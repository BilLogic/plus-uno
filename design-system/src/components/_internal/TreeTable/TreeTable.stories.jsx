import React from 'react';
import { DoDontGrid } from '@/storybook-docs/ds-docs-layout.jsx';
import {
    CourseTree,
    Toggles,
    TreeEmpty,
    treePairs,
    whichTablePairs,
} from '@/storybook-docs/table-doc-examples.jsx';

/*
 * TreeTable is planned and has no code. These stories are the live examples
 * of its rules, built from the table pattern and current components.
 */
export default {
    title: 'Components/Text and data display/Tree table',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A table for records that contain other records, such as a course with its units and lessons. Planned: it has no code yet, and the table pattern stands in for it.',
            },
        },
    },
};

/** A course, its units and their lessons, with a loading parent. */
export const Anatomy = () => <CourseTree loadingUnit />;

export const ToggleVariants = () => <Toggles />;

export const EmptyState = () => <TreeEmpty />;

/** The four do and don't pairs of the Tree table rules. */
export const DoDont = () => <DoDontGrid pairs={treePairs} />;

/** The Tree table case of the Which table? rule. */
export const WhichTable = () => <DoDontGrid pairs={[whichTablePairs[2]]} />;
