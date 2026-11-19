/** The source shown behind Show code for each live example in PageCases.jsx. */

/** The title block `PageHeader` takes today for a description line: the real `PageHeader`, with its own title styles off. */
const titleWithDescription = (title, description) => `<PageHeader
        disableTitleStyles
        title={(
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                <Heading size="lg">${title}</Heading>
                <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>${description}</p>
            </div>
        )}
    />`;

const SECTION = `<Section title="Students" views={<StudentViews />}>
    <SessionsTable />
</Section>`;

/** These cases sit on a docs page that already has an h1, so they pass `titleAs="h4"`; the snippets leave it off, as a real page does. */
const NOTE = '{/* The docs page already has an h1, so these cases render the title as an h4 (titleAs="h4"). On a real page, leave it off. */}\n';

const CASES = {
    HeaderIsTheH1: `<Page header={<PageHeader title="Students" />}>
    <Section title="Sessions" views={<StudentViews />}>
        <SessionsTable />
    </Section>
</Page>`,
    SectionsAsTitles: `<Page>
    <Section level="page" title="Students" views={<StudentViews />}>
        <SessionsTable />
    </Section>
    <Section level="page" title="Sessions" views={<StudentViews />}>
        <SessionsTable status="past" />
    </Section>
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
    OneLineDescription: `<Page header={${titleWithDescription('Students', 'Every student you tutor, with their next session.')}}>
    ${SECTION.replace(/\n/g, '\n    ')}
</Page>`,
    ParagraphUnderTitle: `<Page header={${titleWithDescription('Students', 'Every student you tutor is listed here with their grade, their site and their next session. Open a row to see the full record, ...')}}>
    ${SECTION.replace(/\n/g, '\n    ')}
</Page>`,
};

export const CODE = Object.fromEntries(
    Object.entries(CASES).map(([name, code]) => [name, code.includes('<PageHeader') ? NOTE + code : code]),
);
