/**
 * Admin Specs Overview
 * 
 * Admin organisms for group, session, student, and tutor management.
 */

import React from 'react';

export default {
    title: 'Specs/Admin',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Admin organisms for management dashboards. Organized by: Group Admin, Session Admin, Student Admin, Tutor Admin.',
            },
        },
    },
};

/**
 * Overview
 * Admin specs organization.
 */
export const Overview = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
        <h2 className="h2" style={{ marginBottom: 'var(--size-section-pad-y-md)' }}>
            Admin Organisms
        </h2>

        <p className="body1-txt" style={{ marginBottom: 'var(--size-card-gap-lg)' }}>
            Admin organisms for management dashboards. Organized by admin type.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {[
                {
                    title: 'Group Admin',
                    items: ['GroupsTable', 'GroupInfoCard', 'GroupTrainingProgress', 'GroupAdminPage']
                },
                {
                    title: 'Session Admin',
                    items: ['SessionsTable', 'SessionBreakdownModal', 'SessionOverviewSection']
                },
                {
                    title: 'Student Admin',
                    items: ['StudentsTable', 'StudentDetailModal', 'StudentAdminContainer']
                },
                {
                    title: 'Tutor Admin',
                    items: ['TutorsTable', 'TutorOverviewModal', 'DataCard', 'TutorToolUsageSection']
                }
            ].map(section => (
                <section key={section.title} style={{
                    padding: '24px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>{section.title}</h4>
                    <ul className="body2-txt" style={{ paddingLeft: '20px', margin: 0 }}>
                        {section.items.map(item => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    </div>
);
