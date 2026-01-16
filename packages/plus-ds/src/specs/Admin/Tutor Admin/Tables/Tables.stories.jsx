/**
 * Tables Overview
 * 
 * Displays all Tutor Admin tables in one view for comparison and overview.
 */

import React from 'react';
import TutorsPerformanceTable from './TutorsPerformanceTable/TutorsPerformanceTable';
import TutorsStatusTable from './TutorsStatusTable/TutorsStatusTable';
import TutorsToolUsageTable from './TutorsToolUsageTable/TutorsToolUsageTable';
import TutorsTrainingProgressTable from './TutorsTrainingProgressTable/TutorsTrainingProgressTable';
import TutorSessionsTable from './TutorSessionsTable/TutorSessionsTable';

const defaultTutors = [
    { id: 1, tutorName: 'Amelia Blue', signedUp: 'Yes', attendance: 92, sessions: 25, students: 18, badge: null },
    { id: 2, tutorName: 'Ava Silver', signedUp: 'Yes', attendance: 22, sessions: 34, students: 12, badge: null },
    { id: 3, tutorName: 'Elijah Orange', signedUp: 'Yes', attendance: 68, sessions: 22, students: 7, badge: 'Lead' },
    { id: 4, tutorName: 'Ethan Black', signedUp: 'Yes', attendance: 49, sessions: 65, students: 5, badge: null },
];

const statusTutors = [
    { id: 1, tutorName: 'Floyd Miles', signedUp: 'No', attendance: null, sessions: null, students: null, badge: null },
    { id: 2, tutorName: 'Floyd Miles', signedUp: 'No', attendance: null, sessions: null, students: null, badge: null },
    { id: 3, tutorName: 'Floyd Miles', signedUp: 'No', attendance: null, sessions: null, students: null, badge: null },
];

export default {
    title: 'Specs/Admin/Tutor Admin/Tables/Overview',
    parameters: {
        docs: {
            description: {
                component: `Overview of the 5 key tables in Tutor Admin.`
            }
        }
    }
};

export const AllTables = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', display: 'flex', flexDirection: 'column', gap: '48px' }}>
            <section>
                <h4 className="h4" style={{ marginBottom: '16px' }}>1. Performance Table</h4>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Figma: 258-262435
                </p>
                <TutorsPerformanceTable tutors={defaultTutors} />
            </section>

            <section>
                <h4 className="h4" style={{ marginBottom: '16px' }}>2. Status Table (Null State)</h4>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Figma: 258-262388
                </p>
                <TutorsStatusTable tutors={statusTutors} />
            </section>

            <section>
                <h4 className="h4" style={{ marginBottom: '16px' }}>3. Tool Usage Table</h4>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Figma: 1013-81092
                </p>
                <TutorsToolUsageTable />
            </section>

            <section>
                <h4 className="h4" style={{ marginBottom: '16px' }}>4. Training Progress Table</h4>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Figma: 448-93944
                </p>
                <TutorsTrainingProgressTable />
            </section>

            <section>
                <h4 className="h4" style={{ marginBottom: '16px' }}>5. Sessions Table</h4>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Figma: 1013-81141
                </p>
                <TutorSessionsTable />
            </section>
        </div>
    )
};
