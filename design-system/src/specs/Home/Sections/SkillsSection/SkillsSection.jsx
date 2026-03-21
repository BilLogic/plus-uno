import React from 'react';
import { Section, Table, Button } from '@/components';

/**
 * Skills Section Component
 * Displays a table of user skills with progress bars.
 */
const SkillsSection = () => {
    // Skills Data
    const skillsData = [
        { name: 'UX Design', level: 'Expert', progress: 100, status: 'Completed' },
        { name: 'React Development', level: 'Intermediate', progress: 65, status: 'In Progress' },
        { name: 'Design Systems', level: 'Advanced', progress: 80, status: 'In Progress' },
        { name: 'Accessibility', level: 'Beginner', progress: 20, status: 'Started' }
    ];

    const renderProgressBar = (progress) => (
        <div style={{ width: '100%', backgroundColor: '#e0e0e0', height: '8px', borderRadius: '4px' }}>
            <div style={{
                width: `${progress}%`,
                backgroundColor: 'var(--color-primary)',
                height: '100%',
                borderRadius: '4px'
            }} />
        </div>
    );

    return (
        <Section
            background="surface"
            padding="lg"
            style={{ backgroundColor: 'white', borderRadius: '12px' }}
        >
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="h3 m-0">My Skills</h3>
                <Button btnText="Add Skill" icon="plus" btnStyle="primary" />
            </div>

            <Table
                headers={['Skill Name', 'Level', 'Progress', 'Status', 'Action']}
                rows={skillsData.map(skill => [
                    skill.name,
                    skill.level,
                    { content: renderProgressBar(skill.progress) },
                    skill.status,
                    <Button btnText="View" btnSize="small" btnStyle="secondary" />
                ])}
                hover
            />
        </Section>
    );
};

export default SkillsSection;
