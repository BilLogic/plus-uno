import React from 'react';
import PropTypes from 'prop-types';

import { Breadcrumb, PageHeader } from '@/components';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { Page, Section } from '@/templates';
import { SessionsTable, STUDENT_SESSION_CARDS, UPCOMING_SESSIONS } from '../../../patterns/Page/pageDemo.jsx';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { StudentsTable } from '@/storybook-docs/lib/view-bar.jsx';

const MAYA_UPCOMING_SESSIONS = UPCOMING_SESSIONS.filter(([time]) =>
    STUDENT_SESSION_CARDS.some(([cardTitle]) => cardTitle.startsWith(time)),
);

/**
 * Live Do / Don't breadcrumb cases on the Navigation pattern page.
 * `record={true}` shows Maya Rodriguez's record page with only her sessions;
 * `record={false}` shows the Students area page where a breadcrumb does not belong.
 */
export const BreadcrumbCase = ({ record = true }) => (
    <CaseSurface border="none" padding="none" surface={false}>
        <HeadingLevelContext.Provider value={5}>
            <Page
                header={(
                    <PageHeader
                        title={record ? 'Maya Rodriguez' : 'Students'}
                        titleAs="h4"
                        breadcrumbs={(
                            <Breadcrumb
                                label={record ? 'Record page breadcrumb' : 'Area page breadcrumb'}
                                items={record
                                    ? [
                                        { text: 'Students', href: '#students', onClick: (e) => e.preventDefault() },
                                        { text: 'Maya Rodriguez' },
                                    ]
                                    : [
                                        { text: 'Home', href: '#home', onClick: (e) => e.preventDefault() },
                                        { text: 'Students' },
                                    ]}
                            />
                        )}
                    />
                )}
            >
                {record ? (
                    <Section title="Sessions">
                        <SessionsTable rows={MAYA_UPCOMING_SESSIONS} />
                    </Section>
                ) : (
                    <Section title="All students">
                        <StudentsTable count={3} />
                    </Section>
                )}
            </Page>
        </HeadingLevelContext.Provider>
    </CaseSurface>
);

BreadcrumbCase.propTypes = {
    record: PropTypes.bool,
};
