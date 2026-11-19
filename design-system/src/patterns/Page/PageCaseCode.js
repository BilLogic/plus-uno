/** The source shown behind Show code for each live example in PageCases.jsx. */

const SECTION = `<PatternSection title="Students" views={<StudentViews />}>
    <SessionsTable />
</PatternSection>`;

/** These cases sit on a docs page that already has an h1, so they pass `titleAs="h4"`; the snippets leave it off, as a real page does. */
const NOTE = '{/* The docs page already has an h1, so these cases render the title as an h4 (titleAs="h4"). On a real page, leave it off. */}\n';

const CASES = {
    HeaderIsTheH1: `<Page header={<PageHeader title="Students" />}>
    <PatternSection title="Sessions" views={<StudentViews />}>
        <SessionsTable />
    </PatternSection>
</Page>`,
    SectionsAsTitles: `<Page>
    <PatternSection level="page" title="Students" views={<StudentViews />}>
        <SessionsTable />
    </PatternSection>
    <PatternSection level="page" title="Sessions" views={<StudentViews />}>
        <SessionsTable status="past" />
    </PatternSection>
</Page>`,
    AreaPageTitleAlone: `<Page header={<PageHeader title="Students" />}>
    ${SECTION.replace(/\n/g, '\n    ')}
</Page>`,
    BreadcrumbOnAreaPage: `<Page
    header={(
        <PageHeader
            breadcrumbs={<Breadcrumb label="Breadcrumb" items={[{ text: 'Students', href: '#students' }, { text: 'Students' }]} />}
            title="Students"
        />
    )}
>
    ${SECTION.replace(/\n/g, '\n    ')}
</Page>`,
    OneLineDescription: `<Page header={<DemoPageHeader title="Students" description="Every student you tutor, with their next session." />}>
    ${SECTION.replace(/\n/g, '\n    ')}
</Page>`,
    ParagraphUnderTitle: `<Page header={<DemoPageHeader title="Students" description="Every student you tutor is listed here with their grade, their site and their next session. Open a row to see the full record, ..." />}>
    ${SECTION.replace(/\n/g, '\n    ')}
</Page>`,
};

export const CODE = Object.fromEntries(
    Object.entries(CASES).map(([name, code]) => [name, code.includes('<PageHeader') || code.includes('<DemoPageHeader') ? NOTE + code : code]),
);
