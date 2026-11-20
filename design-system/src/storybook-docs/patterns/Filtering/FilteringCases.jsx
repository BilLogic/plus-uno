import React, { useState } from 'react';

import { FilterButton, FilterMenu } from '@/components';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { HeaderSearch, categoryFilters } from '@/storybook-docs/lib/section-header.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import { StudentsTable, ViewPills } from '@/storybook-docs/lib/view-bar.jsx';
import { CATEGORIES, appliedCount, filterTrigger, narrow } from './filteringDemo.jsx';
import * as Example from './FilteringExamples.jsx';
import examplesSource from './FilteringExamples.jsx?raw';

/**
 * Live Do / Don't cases on the Filtering pattern page: each one is an example
 * from `FilteringExamples.jsx`. The data, the filtering and the controlled
 * triggers live here and go into the example as `slots`, so Show code prints
 * only the Section a consumer writes.
 */

export const CODE = showCode(examplesSource, ['OneTier', 'TwoTiers', 'FiltersAtEnd', 'FiltersAmongViews', 'CountOnIcon', 'TagRow']);

const useQuickFilters = (initial = {}) => {
    const [value, setValue] = useState({ grade: [], school: [], subject: [], tutor: [], ...initial });
    const pick = (id, next) => setValue((current) => ({ ...current, [id]: next }));
    return [value, pick];
};

const QUICK = (ids) => ids.map((id) => CATEGORIES[id]);

/** The example, with its views, search and filters made live and the narrowed rows as its table. */
const FilteringCaseSection = ({
    example: Frame,
    views = ['All students'],
    activeView,
    onViewChange,
    viewsNode,
    search = false,
    filters,
    rows,
    limit,
    ...rest
}) => {
    const [query, setQuery] = useState('');
    const viewFiltered = activeView === 'Needs follow-up'
        ? rows.filter((_, index) => index % 2 === 1)
        : rows;
    const searched = query.trim()
        ? viewFiltered.filter(([name]) => name.toLowerCase().includes(query.trim().toLowerCase()))
        : viewFiltered;
    const visibleRows = limit ? searched.slice(0, limit) : searched;
    const slots = {
        views: viewsNode ?? <ViewPills views={views} activeView={activeView} onViewChange={onViewChange} />,
        ...(search ? { search: <HeaderSearch value={query} onValueChange={setQuery} /> } : {}),
        ...(filters ? { filters } : {}),
    };

    return (
        <CaseSurface border="none" padding="md" surface={false}>
            <HeadingLevelContext.Provider value={4}>
                <Frame slots={slots} {...rest}>
                    <StudentsTable rows={visibleRows} columns={['Name', 'Grade', 'School']} />
                </Frame>
            </HeadingLevelContext.Provider>
        </CaseSurface>
    );
};

/** Live Do: one filter tier per bar (three quick filters, no Filter button). */
export const OneTierCase = () => {
    const [value, pick] = useQuickFilters();
    return (
        <FilteringCaseSection
            example={Example.OneTier}
            filters={categoryFilters(QUICK(['grade', 'school', 'subject']), value, pick)}
            rows={narrow(value)}
            limit={3}
        />
    );
};

/** Live Don't: mixing quick filters with a Filter icon in the same bar. */
export const TwoTiersCase = () => {
    const [value, pick] = useQuickFilters({ grade: ['Grade 7'] });
    const [menuValue, setMenuValue] = useState({ subject: [], tutor: [] });
    return (
        <FilteringCaseSection
            example={Example.TwoTiers}
            filters={[
                ...categoryFilters(QUICK(['grade', 'school']), value, pick),
                ...filterTrigger(appliedCount(menuValue), (trigger) => (
                    <FilterMenu
                        categories={[CATEGORIES.subject, CATEGORIES.tutor]}
                        value={menuValue}
                        onApply={setMenuValue}
                        layout="side-by-side"
                        trigger={trigger}
                    />
                )),
            ]}
            rows={narrow({ ...value, ...menuValue })}
            limit={3}
        />
    );
};

/** Live Do: views in the second row; Search and the filters in the third. */
export const FiltersAtEndCase = () => {
    const [view, setView] = useState('All students');
    const [value, pick] = useQuickFilters();
    return (
        <FilteringCaseSection
            example={Example.FiltersAtEnd}
            views={['All students', 'Needs follow-up']}
            activeView={view}
            onViewChange={setView}
            search
            filters={categoryFilters(QUICK(['grade', 'school']), value, pick)}
            rows={narrow(value)}
            limit={3}
        />
    );
};

/** Live Don't: the same triggers squeezed beside the views, in the views row instead of the third. */
export const FiltersAmongViewsCase = () => {
    const [view, setView] = useState('All students');
    const [value, pick] = useQuickFilters();
    return (
        <FilteringCaseSection
            example={Example.FiltersAmongViews}
            search
            viewsNode={(
                <>
                    <ViewPills views={['All students', 'Needs follow-up']} activeView={view} onViewChange={setView} />
                    {categoryFilters(QUICK(['grade', 'school']), value, pick, { placement: 'bottom-start' }).map(({ key, menu, ...trigger }) => (
                        <React.Fragment key={key}>{menu(<FilterButton {...trigger} />)}</React.Fragment>
                    ))}
                </>
            )}
            activeView={view}
            rows={narrow(value)}
            limit={3}
        />
    );
};

/** Live Do: the active count shown on the Filter button's selected fill. */
export const CountOnIconCase = () => {
    const [value, setValue] = useState({ grade: ['Grade 7'], school: ['Lincoln Middle'] });
    return (
        <FilteringCaseSection
            example={Example.CountOnIcon}
            filters={filterTrigger(appliedCount(value), (trigger) => (
                <FilterMenu
                    categories={[CATEGORIES.grade, CATEGORIES.school]}
                    value={value}
                    onApply={setValue}
                    layout="side-by-side"
                    trigger={trigger}
                />
            ))}
            rows={narrow(value)}
        />
    );
};

/** Live Don't: a row of tags under the bar repeating what is on. */
export const TagRowCase = () => {
    const [tags, setTags] = useState(['Grade 7', 'Lincoln Middle']);
    const value = {
        grade: tags.filter((tag) => CATEGORIES.grade.options.includes(tag)),
        school: tags.filter((tag) => CATEGORIES.school.options.includes(tag)),
    };
    return (
        <FilteringCaseSection
            example={Example.TagRow}
            tags={tags}
            onRemove={(tag) => setTags((current) => current.filter((item) => item !== tag))}
            filters={filterTrigger(appliedCount(value), (trigger) => (
                <FilterMenu
                    categories={[CATEGORIES.grade, CATEGORIES.school]}
                    value={value}
                    onApply={(next) => setTags([...next.grade, ...next.school])}
                    layout="side-by-side"
                    trigger={trigger}
                />
            ))}
            rows={narrow(value)}
        />
    );
};
