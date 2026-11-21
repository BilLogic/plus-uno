import React from 'react';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './SectionExamples.jsx';
import examplesSource from './SectionExamples.jsx?raw';

/**
 * The do and don't examples of the Section template page: each one is an
 * example from `SectionExamples.jsx`, kept off Storybook's docs styles and
 * below the page outline here, and Show code prints the example's own source.
 */

export const CODE = showCode(examplesSource, [
    'CardStandsAlone',
    'SectionRepeatsCard',
    'TitleRowAboveHeaderRows',
    'TitleInViewsRow',
    'ActionsInTitleRow',
    'ActionsInTwoHomes',
    'RightSideInOrder',
    'RightSideCrowded',
    'CardOwnsSave',
    'FooterCommits',
]);

/** The printed source of the page's live stories: each is an example from `SectionExamples.jsx`, staged by the story. */
export const STORY_CODE = showCode(examplesSource, [
    'SectionAnatomy',
    'SearchableStudents',
    'LoadingSearchAndFilters',
    'LoadingViews',
    'LoadingFullHeader',
    'TitleHidden',
    'DetailExpand',
    'ListType',
    'ReflectionQueue',
    'MainAndSide',
    'FullHeaderRows',
    'FiltersApplied',
    'NoViews',
    'ViewsOnly',
    'ManyFilters',
    'WrappedFilters',
    'RowsSelected',
    'NarrowHeader',
    'SubsectionHeader',
    'SideAtEnd',
    'FilterSideStudents',
    'FilterSideStudentsCompact',
    'FilterSideStudentsNarrow',
    'EmptyInTable',
    'ReflectionsAnatomy',
]);

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

export const TitleRowAboveHeaderRows = unstyled(Example.TitleRowAboveHeaderRows);
export const TitleInViewsRow = unstyled(Example.TitleInViewsRow);
export const CardStandsAlone = unstyled(Example.CardStandsAlone);
export const SectionRepeatsCard = unstyled(Example.SectionRepeatsCard);
export const ActionsInTitleRow = unstyled(Example.ActionsInTitleRow);
export const ActionsInTwoHomes = unstyled(Example.ActionsInTwoHomes);
export const RightSideInOrder = unstyled(Example.RightSideInOrder);
export const RightSideCrowded = unstyled(Example.RightSideCrowded);
export const CardOwnsSave = unstyled(Example.CardOwnsSave);
export const FooterCommits = unstyled(Example.FooterCommits);
