import React from 'react';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './TableExamples.jsx';
import examplesSource from './TableExamples.jsx?raw';

/**
 * The do and don't examples of the Table page: each one is an example from
 * `TableExamples.jsx`, and Show code prints the example's own source.
 */

export const CODE = showCode(examplesSource, [
    'PlainTable',
    'FramedTable',
    'FiltersInHeader',
    'SecondToolbar',
    'OneTablePerSection',
    'TwoTables',
    'DynamicRoster',
    'RosterAsStatic',
    'TreeHierarchy',
    'TreeAsExpandable',
]);

/**
 * Storybook styles every table in a docs page except inside `.sb-unstyled`,
 * which is what its own canvases use. The examples sit outside a canvas, so
 * each carries the class, and the table keeps its own borders and padding. A
 * Section's title stays out of the page outline.
 */
const unstyled = (Example) => {
    const Wrapped = () => (
        <div className="sb-unstyled">
            <HeadingLevelContext.Provider value={5}>
                <Example />
            </HeadingLevelContext.Provider>
        </div>
    );
    return Wrapped;
};

export const PlainTable = unstyled(Example.PlainTable);
export const FramedTable = unstyled(Example.FramedTable);
export const FiltersInHeader = unstyled(Example.FiltersInHeader);
export const SecondToolbar = unstyled(Example.SecondToolbar);
export const OneTablePerSection = unstyled(Example.OneTablePerSection);
export const TwoTables = unstyled(Example.TwoTables);
export const DynamicRoster = unstyled(Example.DynamicRoster);
export const RosterAsStatic = unstyled(Example.RosterAsStatic);
export const TreeHierarchy = unstyled(Example.TreeHierarchy);
export const TreeAsExpandable = unstyled(Example.TreeAsExpandable);
