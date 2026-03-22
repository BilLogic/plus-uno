import React, { useState } from 'react'
import Button from '@plus-ds/components/Button/index.js'
import Table from '@plus-ds/components/Table/Table.jsx'
import { Badge, NavTabs, Dropdown, Toast } from '@plus-ds/components'
import { ToastContainer } from '@plus-ds/components/Toast/Toast.jsx'
import { TopBar } from '@plus-ds/specs/Universal/Sections'
import { StatCard } from '@plus-ds/specs/Toolkit/pre-session/cards/OverviewCard.stories'
import SessionModal from './SessionModal.jsx'
import RecommendModal from './RecommendModal.jsx'
import './App.scss'

const mockSessions = [
    { id: 1, date: 'Tue, Sep 9', time: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Live', statusStyle: 'success', statusIcon: 'circle-play' },
    { id: 2, date: 'Tue, Sep 9', time: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Starting soon', statusStyle: 'warning', statusIcon: 'clock' },
    { id: 3, date: 'Tue, Sep 9', time: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Scheduled', statusStyle: 'info', statusIcon: 'circle-check' },
    { id: 4, date: 'Tue, Sep 9', time: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Cancelled', statusStyle: 'danger', statusIcon: 'circle-exclamation' },
]

export default function App() {
    const [selectedSession, setSelectedSession] = useState(null)
    const [showRecommendModal, setShowRecommendModal] = useState(false)
    const [showSuccessToast, setShowSuccessToast] = useState(false)

    const tableHeaders = ['Date & time ↑', 'School & teacher ↑', 'Status', 'Actions'];
    const tableRows = mockSessions.map(session => [
        <div key="datetime">
            <div style={{ fontFamily: 'var(--font-family-body)', fontWeight: 500, fontSize: 'var(--font-size-body3)' }}>{session.date}</div>
            <div style={{ fontSize: 'var(--font-size-body3)', color: 'var(--color-on-surface-variant)' }}>{session.time}</div>
        </div>,
        <div key="school">
            <div style={{ fontFamily: 'var(--font-family-body)', fontWeight: 500, fontSize: 'var(--font-size-body3)' }}>{session.school}</div>
            <div style={{ fontSize: 'var(--font-size-body3)', color: 'var(--color-on-surface-variant)' }}>{session.teacher}</div>
        </div>,
        <Badge key="status" style={session.statusStyle} size="b3" leadingVisual={<i className={`fa-solid fa-${session.statusIcon}`}></i>}>
            {session.status}
        </Badge>,
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Button
                key="action"
                text="Details"
                style="secondary"
                fill="outline"
                size="medium"
                onClick={() => setSelectedSession(session)}
            />
        </div>
    ]);

    return (
        <div style={{
            backgroundColor: 'var(--color-surface-container-low)',
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)'
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                width: '100%',
                maxWidth: '768px',
                backgroundColor: 'var(--color-surface)',
                boxShadow: 'var(--elevation-shadow-1)',
                borderRadius: 'var(--size-card-radius-md)',
                overflow: 'hidden'
            }}>
                {/* Supervisor Top Nav */}
                <TopBar
                    mode="expanded"
                    breadcrumbs={[
                        { text: 'Home', href: '#' },
                        { text: 'Sessions', href: '#' }
                    ]}
                    user={{
                        name: 'John Doe',
                        counter: true,
                        counterValue: 2,
                        type: 'regular tutor'
                    }}
                    style={{ borderBottom: '2px solid var(--color-outline-variant, #e0e0e0)', backgroundColor: 'white' }}
                />

                <main className="prototype-main" style={{ flex: '1 1 auto', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg)' }}>
                    {/* Alert Banner */}
                    <div style={{
                        backgroundColor: 'var(--color-primary-container-state-16)',
                        border: '1px solid var(--color-primary)',
                        borderRadius: 'var(--size-modal-radius-md)',
                        padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                        display: 'flex',
                        position: 'relative'
                    }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                            <span className="h6" style={{ color: 'var(--color-on-surface)' }}>
                                Update on your call-off request
                            </span>
                            <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                                There's an update to your recent call-off request. Please visit the Call-offs tab to review the latest status and details.
                            </span>
                        </div>
                        <i className="fa-solid fa-xmark close-alert" style={{ color: 'var(--color-on-surface-variant)', cursor: 'pointer', padding: 'var(--size-element-pad-y-sm)' }}></i>
                    </div>

                    {/* Header Actions Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 className="h4" style={{ color: 'var(--color-on-surface)', margin: 0 }}>Your Sessions</h4>
                        <div style={{ display: 'flex', gap: 'var(--size-element-gap-sm)', alignItems: 'center' }}>
                            <Button
                                text="+ Recommend Session"
                                style="secondary"
                                fill="outline"
                                onClick={() => setShowRecommendModal(true)}
                            />
                            <Button
                                text="Fill in"
                                style="primary"
                                fill="filled"
                                leadingVisual={<i className="fa-solid fa-calendar-plus" />}
                                onClick={() => setSelectedSession(mockSessions[0])}
                            />
                        </div>
                    </div>

                    {/* Statistics Cards using imported reference component */}
                    <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)' }}>
                        <StatCard title="Today's sessions" value="1" icon="fa-solid fa-calendar-day" />
                        <StatCard title="Pending call-offs" value="2" icon="fa-solid fa-hourglass-half" />
                        <StatCard title="Open for fill-ins" value="23" icon="fa-solid fa-right-to-bracket" />
                    </div>

                    {/* Navigation Tabs */}
                    <div>
                        <NavTabs activeKey="my-sessions" onSelect={() => { }}>
                            <NavTabs.Item eventKey="my-sessions">
                                My sessions <Badge size="b3" style="primary" className="ms-1">3</Badge>
                            </NavTabs.Item>
                            <NavTabs.Item eventKey="sign-ups">
                                Sign-ups <Badge size="b3" style="tertiary" className="ms-1">3</Badge>
                            </NavTabs.Item>
                            <NavTabs.Item eventKey="call-offs">
                                Call-offs <Badge size="b3" style="tertiary" className="ms-1">3</Badge>
                            </NavTabs.Item>
                            <NavTabs.Item eventKey="reflections">
                                Reflections <Badge size="b3" style="tertiary" className="ms-1">20</Badge>
                            </NavTabs.Item>
                        </NavTabs>
                    </div>

                    <div className="sessions-table-container">
                        <div className="table-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--size-section-gap-md)' }}>
                            <h2 className="h5" style={{ margin: 0, color: 'var(--color-on-surface)' }}>My Sessions</h2>
                            <div style={{ display: 'flex', gap: 'var(--size-element-gap-sm)' }}>
                                <Dropdown
                                    buttonText="All schools"
                                    style="secondary"
                                    fill="outline"
                                    items={[{ text: 'All schools', selected: true }, { text: 'Hogwarts' }, { text: 'Lincoln High' }]}
                                />
                                <Dropdown
                                    buttonText="This week"
                                    style="secondary"
                                    fill="outline"
                                    items={[{ text: 'This week', selected: true }, { text: 'Next week' }, { text: 'This month' }]}
                                />
                            </div>
                        </div>
                        <Table
                            headers={tableHeaders}
                            rows={tableRows}
                            hover={true}
                        />
                    </div>
                </main>

                {selectedSession && (
                    <SessionModal
                        session={selectedSession}
                        onClose={() => setSelectedSession(null)}
                    />
                )}
                {showRecommendModal && (
                    <RecommendModal
                        onClose={() => setShowRecommendModal(false)}
                        onRecommendSuccess={() => {
                            setShowRecommendModal(false);
                            setShowSuccessToast(true);
                            setTimeout(() => setShowSuccessToast(false), 3000);
                        }}
                    />
                )}

                <ToastContainer position="bottom-center" className="p-3" style={{ position: 'fixed', zIndex: 1100, bottom: 'var(--size-section-gap-lg)' }}>
                    <Toast
                        show={showSuccessToast}
                        onClose={() => setShowSuccessToast(false)}
                        title="Success"
                        style="success"
                        autohide={true}
                        delay={3000}
                    >
                        Recommendation sent successfully
                    </Toast>
                </ToastContainer>
            </div>
        </div>
    )
}
