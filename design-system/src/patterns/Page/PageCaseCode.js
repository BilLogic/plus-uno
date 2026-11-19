/** The source shown behind Show code for each live example in PageCases.jsx. */

const SECTION = `<PatternSection title="Students" views={<StudentViews />}>
    <SessionsTable />
</PatternSection>`;

export const CODE = {
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
