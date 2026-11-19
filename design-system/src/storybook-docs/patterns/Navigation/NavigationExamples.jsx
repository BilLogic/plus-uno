import React from 'react';
import { Breadcrumb, DynamicTable, PageHeader } from '@/components';
import { Page, Section } from '@/templates';

/**
 * The Navigation page's breadcrumb do and don't examples, as PLUS parts only.
 * Show code prints each one from this file; the surface that holds them lives
 * in `NavigationCases.jsx`.
 */

const MAYA_SESSIONS = [
    ['Thu 4:00 PM', 'Ms. Ortiz', 'Algebra'],
    ['Fri 3:30 PM', 'Ms. Ortiz', 'Fractions'],
    ['Sat 10:00 AM', 'Ms. Kim', 'Linear equations'],
];

const STUDENTS = [
    ['Ava Thompson', 'Grade 7', 'Oct 24'],
    ['Marcus Lee', 'Grade 8', 'Oct 23'],
    ['Sofia Ramirez', 'Grade 7', 'Oct 23'],
];

const Table = ({ head, rows, label }) => (
    <DynamicTable
        head={{ cells: head.map((content) => ({ key: content, content, isSortable: true })) }}
        rows={rows.map((cells) => ({ key: cells.join(), cells: cells.map((content) => ({ key: content, content })) }))}
        label={label}
        isFixedSize
    />
);

export const BreadcrumbOnRecordPage = () => (
    <Page
        header={(
            <PageHeader
                title="Maya Rodriguez"
                titleAs="h4"
                breadcrumbs={(
                    <Breadcrumb
                        label="Record page breadcrumb"
                        items={[
                            { text: 'Students', href: '#students', onClick: (e) => e.preventDefault() },
                            { text: 'Maya Rodriguez' },
                        ]}
                    />
                )}
            />
        )}
    >
        <Section title="Sessions">
            <Table head={['Time', 'Tutor', 'Subject']} rows={MAYA_SESSIONS} label="Sessions" />
        </Section>
    </Page>
);

export const BreadcrumbOnAreaPage = () => (
    <Page
        header={(
            <PageHeader
                title="Students"
                titleAs="h4"
                breadcrumbs={(
                    <Breadcrumb
                        label="Area page breadcrumb"
                        items={[
                            { text: 'Home', href: '#home', onClick: (e) => e.preventDefault() },
                            { text: 'Students' },
                        ]}
                    />
                )}
            />
        )}
    >
        <Section title="All students">
            <Table head={['Name', 'Grade', 'Last session']} rows={STUDENTS} label="Students" />
        </Section>
    </Page>
);
