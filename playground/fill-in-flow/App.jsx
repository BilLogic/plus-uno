import React, { useState } from 'react';
import { NavTabs, Card, Table, Toast, Dropdown, Button, Badge, Alert } from '@plus-ds/components';
import { ToastContainer } from 'react-bootstrap'; // Fallback for positioning container only
import { Calendar as CalendarIcon, Clock, Share, Box, Check, CheckCircleFill, ExclamationCircleFill, XCircleFill } from 'react-bootstrap-icons';
import TopBar from '@/specs/Universal/Sections/TopBar/TopBar';
import FillInModal from './FillInModal';
import './App.scss';

const initialSessions = [
    { id: 1, date: "Tue, Sep 9", time: "12:30 PM - 1:30 PM", school: "Hogwarts", teacher: "Mr. Snape", status: "Scheduled", statusType: "success" },
    { id: 2, date: "Tue, Sep 9", time: "12:30 PM - 1:30 PM", school: "Hogwarts", teacher: "Mr. Snape", status: "Starting soon", statusType: "warning" },
    { id: 3, date: "Tue, Sep 9", time: "12:30 PM - 1:30 PM", school: "Hogwarts", teacher: "Mr. Snape", status: "Scheduled", statusType: "success" },
    { id: 4, date: "Tue, Sep 9", time: "12:30 PM - 1:30 PM", school: "Hogwarts", teacher: "Mr. Snape", status: "Cancelled", statusType: "danger" }
];

export default function App() {
    const [sessions, setSessions] = useState(initialSessions);
    const [showModal, setShowModal] = useState(false);
    const [recommendedCount, setRecommendedCount] = useState(2);
    const [openFillInsCount, setOpenFillInsCount] = useState(23);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    const handleFillInComplete = (selectedSessions) => {
        const recommendedSelected = selectedSessions.filter(s => s.isRecommended).length;

        setRecommendedCount(prev => Math.max(0, prev - recommendedSelected));
        setOpenFillInsCount(prev => Math.max(0, prev - selectedSessions.length));

        const newSessions = selectedSessions.map(session => ({
            ...session,
            status: "Scheduled",
            statusType: "success"
        }));

        setSessions([...sessions, ...newSessions]);
        setShowModal(false);
        setToastMessage(`Successfully signed up for ${selectedSessions.length} session(s).`);
        setShowToast(true);
    };

    const getStatusIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircleFill className="me-1" />;
            case 'warning': return <ExclamationCircleFill className="me-1" />;
            case 'danger': return <XCircleFill className="me-1" />;
            default: return null;
        }
    };

    const tableHeaders = [
        { text: 'Date & time', width: '25%' },
        { text: 'School & teacher', width: '35%' },
        { text: 'Status', width: '25%' },
        { text: 'Actions', width: '15%' }
    ];

    const tableRows = sessions.map(session => [
        <div key="date">
            <div className="fw-medium">{session.date}</div>
            <div className="text-muted small">{session.time}</div>
        </div>,
        <div key="school">
            <div className="fw-medium">{session.school}</div>
            <div className="text-muted small">{session.teacher}</div>
        </div>,
        <div key="status" className="status-indicator">
            <Badge
                text={session.status}
                style={session.statusType}
                leadingVisual={getStatusIcon(session.statusType)}
            />
        </div>,
        <Button key="actions" text="Details" style="secondary" fill="outline" size="small" />
    ]);

    return (
        <div className="app-container">
            <TopBar
                mode="expanded"
                breadcrumbs={[
                    { text: 'Home', href: '#' },
                    { text: 'Sessions' }
                ]}
                user={{
                    name: 'John Doe',
                    type: 'regular tutor',
                    counter: true,
                    counterValue: 2
                }}
            />

            <main className="main-content">
                <Alert style="info" dismissable className="mb-4 d-flex align-items-start">
                    <div className="d-flex flex-column gap-1">
                        <strong>Update on your call-off request</strong>
                        <span>There's an update to your recent call-off request. Please visit the Call-offs tab to review the latest status and details.</span>
                    </div>
                </Alert>

                <div className="header-action-row">
                    <h1>Your Sessions</h1>
                    <Button
                        style="primary"
                        onClick={() => setShowModal(true)}
                    >
                        <div className="d-flex align-items-center gap-2">
                            <CalendarIcon />
                            Fill in
                            {recommendedCount > 0 && (
                                <Badge text={recommendedCount.toString()} style="danger" />
                            )}
                        </div>
                    </Button>
                </div>

                <div className="summary-cards-row">
                    <Card
                        body={
                            <div>
                                <div className="card-title-row">
                                    <span>Today's sessions</span>
                                    <CalendarIcon />
                                </div>
                                <div className="card-value">1</div>
                            </div>
                        }
                    />
                    <Card
                        body={
                            <div>
                                <div className="card-title-row">
                                    <span>Pending call-offs</span>
                                    <Clock />
                                </div>
                                <div className="card-value">2</div>
                            </div>
                        }
                    />
                    <Card
                        body={
                            <div>
                                <div className="card-title-row">
                                    <span>Open for fill-ins</span>
                                    <Share />
                                </div>
                                <div className="card-value">{openFillInsCount}</div>
                            </div>
                        }
                    />
                </div>

                <NavTabs activeKey="my-sessions" className="mb-4">
                    <NavTabs.Item eventKey="my-sessions">My sessions <Badge text="3" style="secondary" size="b3" className="ms-2" /></NavTabs.Item>
                    <NavTabs.Item eventKey="sign-ups">Sign-ups <Badge text="3" style="secondary" size="b3" className="ms-2" /></NavTabs.Item>
                    <NavTabs.Item eventKey="call-offs">Call-offs <Badge text="3" style="secondary" size="b3" className="ms-2" /></NavTabs.Item>
                    <NavTabs.Item eventKey="reflections">Reflections <Badge text="20" style="secondary" size="b3" className="ms-2" /></NavTabs.Item>
                </NavTabs>

                <div className="table-header-row">
                    <h2>My Sessions</h2>
                    <div className="table-filters">
                        <Dropdown buttonText="All schools" items={[{ text: 'Hogwarts' }, { text: 'Beauxbatons' }]} style="secondary" fill="outline" />
                        <Dropdown buttonText="This week" items={[{ text: 'This week' }, { text: 'Next week' }]} style="secondary" fill="outline" />
                    </div>
                </div>

                <div style={{ backgroundColor: 'var(--color-surface-container-lowest)', borderRadius: 'var(--size-element-radius-md)', border: '1px solid var(--color-outline-variant)', overflow: 'hidden' }}>
                    <Table headers={tableHeaders} rows={tableRows} hover />
                </div>
            </main>

            <FillInModal
                show={showModal}
                onHide={() => setShowModal(false)}
                recommendedCount={recommendedCount}
                onComplete={handleFillInComplete}
            />

            <ToastContainer position="bottom-center" className="p-3" style={{ position: 'fixed', zIndex: 1060 }}>
                <Toast show={showToast} onClose={() => setShowToast(false)} style="success" autohide delay={3000}>
                    <div className="d-flex align-items-center gap-2">
                        <Check size={20} />
                        {toastMessage}
                    </div>
                </Toast>
            </ToastContainer>
        </div>
    );
}
