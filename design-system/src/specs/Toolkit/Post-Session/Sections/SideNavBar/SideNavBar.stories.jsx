import React, { useState } from 'react';
import SideNavBar from './SideNavBar';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Sections/Side Nav Bar',
    parameters: {
        layout: 'padded',
    },
};

const SAMPLE_STUDENTS = [
    { id: 'kiera', name: 'Kiera Wintervale', status: 'complete' },
    { id: 'baxter', name: 'Baxter Ellington' },
    { id: 'milo', name: 'Milo Thorne' },
];

/**
 * Figma Side Nav Bar variants on one canvas — no Interactive subpage.
 * Students confirmed keeps Student Reflection selected while the active student is text-only.
 */
export const Overview = {
    render: function SideNavOverview() {
        const [activeTab, setActiveTab] = useState('student-0');

        return (
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--size-section-gap-lg)',
                    alignItems: 'flex-start',
                    backgroundColor: 'var(--ds-surface-sunken)',
                    padding: 'var(--size-section-pad-y-sm)',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                    <span className="body3-txt" style={{ color: 'var(--ds-text-subtle)' }}>
                        Students confirmed
                    </span>
                    <SideNavBar
                        label="Steps, students confirmed"
                        state="students-confirmed"
                        students={SAMPLE_STUDENTS}
                        activeTab={activeTab}
                        completedSections={{ 'session-information': true }}
                        onTabClick={setActiveTab}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                    <span className="body3-txt" style={{ color: 'var(--ds-text-subtle)' }}>
                        Pre-student add
                    </span>
                    <SideNavBar
                        label="Steps, pre-student add"
                        state="pre-student-add"
                        students={[]}
                        activeTab="session-information"
                        onTabClick={() => {}}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                    <span className="body3-txt" style={{ color: 'var(--ds-text-subtle)' }}>
                        In progress
                    </span>
                    <SideNavBar
                        label="Steps, in progress"
                        state="in-progress"
                        students={SAMPLE_STUDENTS}
                        activeTab="session-reflection"
                        completedSections={{
                            'session-information': true,
                            'student-reflection': true,
                        }}
                        onTabClick={() => {}}
                    />
                </div>
            </div>
        );
    },
};
