import React, { useState } from 'react';

import { FilterMenu, IconButton, Tag, TagGroup } from '@/components';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { PatternSection } from '@/patterns';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { HeaderSearch, categoryFilters } from '@/storybook-docs/lib/section-header.jsx';
import { StudentsTable, ViewPills } from '@/storybook-docs/lib/view-bar.jsx';
import { CATEGORIES, QuickFilter, narrow } from './filteringDemo.jsx';

/**
 * Live Do / Don't cases on the Filtering pattern page, composed from
 * `PatternSection` and its header props, `ViewPills`, `QuickFilter`, `FilterMenu`,
 * `TagGroup`, and `StudentsTable`.
 */

const useQuickFilters = (initial = {}) => {
    const [value, setValue] = useState({ grade: [], school: [], subject: [], tutor: [], ...initial });
    const pick = (id, next) => setValue((current) => ({ ...current, [id]: next }));
    return [value, pick];
};

const QUICK = (ids) => ids.map((id) => CATEGORIES[id]);

const FilteringCaseSection = ({
    views = ['All students'],
    activeView,
    onViewChange,
    viewsNode,
    search = false,
    filters,
    format,
    rows,
    limit,
    beforeTable,
}) => {
    const [query, setQuery] = useState('');
    const viewFiltered = activeView === 'Needs follow-up'
        ? rows.filter((_, index) => index % 2 === 1)
        : rows;
    const searched = query.trim()
        ? viewFiltered.filter(([name]) => name.toLowerCase().includes(query.trim().toLowerCase()))
        : viewFiltered;
    const visibleRows = limit ? searched.slice(0, limit) : searched;

    return (
        <CaseSurface border="none" padding="md" surface={false}>
            <HeadingLevelContext.Provider value={4}>
                <PatternSection
                    title="Students"
                    views={viewsNode ?? <ViewPills views={views} activeView={activeView} onViewChange={onViewChange} />}
                    format={format}
                    search={search ? <HeaderSearch value={query} onValueChange={setQuery} /> : undefined}
                    filters={filters}
                >
                    {beforeTable ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                            {beforeTable}
                            <StudentsTable rows={visibleRows} columns={['Name', 'Grade', 'School']} />
                        </div>
                    ) : (
                        <StudentsTable rows={visibleRows} columns={['Name', 'Grade', 'School']} />
                    )}
                </PatternSection>
            </HeadingLevelContext.Provider>
        </CaseSurface>
    );
};

/** Live Do: one filter tier per bar (three quick filters, no Filter icon). */
export const OneTierCase = () => {
    const [value, pick] = useQuickFilters();
    return (
        <FilteringCaseSection
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
            filters={categoryFilters(QUICK(['grade', 'school']), value, pick)}
            format={(
                <FilterMenu
                    categories={[CATEGORIES.subject, CATEGORIES.tutor]}
                    value={menuValue}
                    onApply={setMenuValue}
                    layout="side-by-side"
                />
            )}
            rows={narrow({ ...value, ...menuValue })}
            limit={3}
        />
    );
};

/** Live Do: views at the start of the bar; Search and filters at the end. */
export const FiltersAtEndCase = () => {
    const [view, setView] = useState('All students');
    const [value, pick] = useQuickFilters();
    return (
        <FilteringCaseSection
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

/** Live Don't: filters squeezed beside the views at the start of the bar. */
export const FiltersAmongViewsCase = () => {
    const [view, setView] = useState('All students');
    const [value, pick] = useQuickFilters();
    return (
        <FilteringCaseSection
            search
            viewsNode={(
                <>
                    <ViewPills views={['All students', 'Needs follow-up']} activeView={view} onViewChange={setView} />
                    {['grade', 'school'].map((id) => (
                        <QuickFilter key={id} category={CATEGORIES[id]} value={value} onPick={pick} placement="bottom-start" />
                    ))}
                </>
            )}
            activeView={view}
            rows={narrow(value)}
            limit={3}
        />
    );
};

/** Live Do: active count shown directly on the Filter icon's selected fill. */
export const CountOnIconCase = () => {
    const [value, setValue] = useState({ grade: ['Grade 7'], school: ['Lincoln Middle'] });
    return (
        <FilteringCaseSection
            format={(
                <FilterMenu
                    categories={[CATEGORIES.grade, CATEGORIES.school]}
                    value={value}
                    onApply={setValue}
                    layout="side-by-side"
                />
            )}
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
            format={(
                <FilterMenu
                    categories={[CATEGORIES.grade, CATEGORIES.school]}
                    value={value}
                    onApply={(next) => setTags([...next.grade, ...next.school])}
                    layout="side-by-side"
                    trigger={<IconButton icon="filter" label="Filters" appearance="subtle" />}
                />
            )}
            rows={narrow(value)}
            beforeTable={tags.length > 0 ? (
                <TagGroup label="Applied filters">
                    {tags.map((tag) => (
                        <Tag
                            key={tag}
                            text={tag}
                            isRemovable
                            onAfterRemoveAction={() => setTags((current) => current.filter((item) => item !== tag))}
                        />
                    ))}
                </TagGroup>
            ) : null}
        />
    );
};
