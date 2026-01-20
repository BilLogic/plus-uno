import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import PageLayout from '@/components/PageLayout/PageLayout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import EditSessionModal from './EditSessionModal';

const SessionsPage = () => {
    const [selectedSession, setSelectedSession] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Mock session data
    const yourSessions = [
        {
            id: 1,
            title: 'Math Tutoring Session',
            subtitle: 'Monday, 3:00 PM',
            body: 'Algebra fundamentals with 5 students'
        },
        {
            id: 2,
            title: 'Reading Workshop',
            subtitle: 'Wednesday, 2:00 PM',
            body: 'Reading comprehension with 8 students'
        },
        {
            id: 3,
            title: 'Science Lab',
            subtitle: 'Friday, 4:00 PM',
            body: 'Chemistry experiments with 6 students'
        }
    ];

    const handleSessionClick = (session) => {
        setSelectedSession(session);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSession(null);
    };

    const handleCreateNewSession = () => {
        // Create a new session object for editing
        setSelectedSession({
            id: 'new',
            title: 'New Session',
            subtitle: '',
            body: ''
        });
        setIsModalOpen(true);
    };

    return (
        <>
            <PageLayout
                sidebarConfig={{
                    user: 'tutor',
                    onHomeClick: () => console.log('Home clicked'),
                    onTabClick: (tab) => console.log('Tab clicked:', tab)
                }}
                topBarConfig={{
                    brand: 'PLUS Sessions',
                    backgroundColor: 'light'
                }}
            >
                <Container fluid>
                    {/* Your Sessions Section */}
                    <div style={{ marginBottom: 'var(--size-section-pad-y-lg, 32px)' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 'var(--size-section-gap-md, 24px)'
                        }}>
                            <h2 className="h4">Your Sessions</h2>
                            <Button
                                text="Create New Session"
                                style="primary"
                                fill="filled"
                                size="medium"
                                onClick={handleCreateNewSession}
                            />
                        </div>
                        <Row>
                            {yourSessions.map((session) => (
                                <Col key={session.id} md={4} className="mb-3">
                                    <Card
                                        title={session.title}
                                        subtitle={session.subtitle}
                                        body={session.body}
                                        onClick={() => handleSessionClick(session)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </Col>
                            ))}
                        </Row>
                    </div>

                    {/* My Sessions Section */}
                    <div>
                        <h2 className="h4" style={{ marginBottom: 'var(--size-section-gap-md, 24px)' }}>
                            My Sessions
                        </h2>
                        <Card
                            title="All My Sessions"
                            body="View and manage all your tutoring sessions in one place. This section provides an overview of your session history, upcoming sessions, and session statistics."
                            paddingSize="lg"
                        />
                    </div>
                </Container>
            </PageLayout>

            {/* Edit Session Modal */}
            {isModalOpen && selectedSession && (
                <EditSessionModal
                    session={selectedSession}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};

export default SessionsPage;

