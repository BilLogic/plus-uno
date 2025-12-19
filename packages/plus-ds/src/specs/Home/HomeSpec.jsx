import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { PageLayout, Section, Card, Table, Button } from '@/components';

export const HomeSpec = () => {
    // Configuration
    const topBarConfig = {
        brand: 'PLUS',
        items: [
            { text: 'Dashboard', active: true, href: '#' },
            { text: 'My Team', href: '#' },
            { text: 'Reports', href: '#' }
        ],
        // Navbar expects 'components' for extra items like User Avatar, but for now we'll match the basic API
        components: [
            { type: 'custom', content: <div className="d-flex align-items-center"><img src="assets/avatar.png" alt="User" style={{ width: 32, height: 32, borderRadius: '50%' }} /></div> }
        ]
    };

    const sidebarConfig = {
        user: 'tutor',
        onTabClick: (tab) => console.log(`Tab clicked: ${tab}`),
        onHomeClick: () => console.log('Home clicked')
    };

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

    // Learning Items
    const learningItems = [
        { title: 'Advanced React Patterns', subtitle: 'Frontend Development', image: 'https://via.placeholder.com/300x150' },
        { title: 'Figma for Developers', subtitle: 'Design', image: 'https://via.placeholder.com/300x150' },
        { title: 'Web Accessibility 101', subtitle: 'General Web', image: 'https://via.placeholder.com/300x150' }
    ];

    const Content = () => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                {/* Skills Section */}
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

                {/* Recommended Learning Section */}
                <div>
                    <h3 className="h3 mb-3">Recommended Learning</h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '24px'
                    }}>
                        {learningItems.map((item, index) => (
                            <Card
                                key={index}
                                title={item.title}
                                subtitle={item.subtitle}
                                image={item.image}
                                body="Learn the latest techniques and best practices."
                                actionButton={{
                                    text: 'Start Learning',
                                    onClick: () => console.log(`Clicked ${item.title}`)
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <PageLayout
            id="home-page"
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
        >
            <Content />
        </PageLayout>
    );
};
