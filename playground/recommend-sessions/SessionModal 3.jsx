import React, { useState } from 'react'
import Modal from '@plus-ds/components/Modal/Modal.jsx'
import Button from '@plus-ds/components/Button/index.js'
import NavTabs from '@plus-ds/components/NavTabs/NavTabs.jsx'
import RecommendTutorsView from './RecommendTutorsView.jsx'

import { Badge } from '@plus-ds/components'

export default function SessionModal({ session, onClose }) {
    const [activeTab, setActiveTab] = useState('info') // 'info', 'attendees', 'recruit'

    const renderTabs = () => (
        <div style={{ marginBottom: '16px' }}>
            <NavTabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <NavTabs.Item eventKey="info">Session info</NavTabs.Item>
                <NavTabs.Item eventKey="attendees">
                    Attendees <Badge size="b3" style="tertiary" className="ms-1">20</Badge>
                </NavTabs.Item>
            </NavTabs>
        </div>
    )

    const renderSessionInfo = () => (
        <div className="supervisor-session-info" style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '0 0 16px 0', border: '1px solid var(--color-outline-variant, #e0e0e0)', marginBottom: '24px' }}>
            {renderTabs()}
            <div className="session-details-grid" style={{ padding: '0 24px' }}>
                <div className="detail-item-new">
                    <span className="info-icon"><i className="fa-solid fa-clock" style={{ color: 'var(--color-primary)' }} aria-hidden="true" /></span>
                    <div>
                        <div className="label">Time</div>
                        <div className="value">1:30 PM – 2:20 PM (Thursday)</div>
                    </div>
                </div>
                <div className="detail-item-new">
                    <span className="info-icon"><i className="fa-solid fa-chalkboard-user" style={{ color: 'var(--color-primary)' }} aria-hidden="true" /></span>
                    <div>
                        <div className="label">Teacher</div>
                        <div className="value">{session.teacher}</div>
                    </div>
                </div>
                <div className="detail-item-new">
                    <span className="info-icon"><i className="fa-solid fa-users" style={{ color: 'var(--color-primary)' }} aria-hidden="true" /></span>
                    <div>
                        <div className="label">Tutor Count</div>
                        <div className="value">5/5 (Leads: 1/1)</div>
                    </div>
                </div>
                <div className="detail-item-new">
                    <span className="info-icon"><i className="fa-solid fa-graduation-cap" style={{ color: 'var(--color-primary)' }} aria-hidden="true" /></span>
                    <div>
                        <div className="label">Student Count</div>
                        <div className="value">25</div>
                    </div>
                </div>
                <div className="detail-item-new">
                    <span className="info-icon"><i className="fa-solid fa-video" style={{ color: 'var(--color-primary)' }} aria-hidden="true" /></span>
                    <div>
                        <div className="label">Session Link</div>
                        <div className="value"><a href="#" style={{ color: 'var(--color-primary)' }}>Zoom</a></div>
                    </div>
                </div>
                <div className="detail-item-new">
                    <span className="info-icon"><i className="fa-solid fa-key" style={{ color: 'var(--color-primary)' }} aria-hidden="true" /></span>
                    <div>
                        <div className="label">Session Passcode</div>
                        <div className="value">123 456 789</div>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050
        }}>
            <Modal
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span>{session.school} - 8/14/2025</span>
                        <span style={{ color: 'var(--color-primary)', cursor: 'pointer', marginRight: '32px' }}>
                            <i className="fa-solid fa-gear" aria-hidden="true" />
                        </span>
                    </div>
                }
                onClose={onClose}
                width={640}
                showBottomButtons={false}
            >
                {activeTab === 'info' && renderSessionInfo()}
                {activeTab === 'attendees' && (
                    <div className="supervisor-session-info" style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '0 0 16px 0', border: '1px solid var(--color-outline-variant, #e0e0e0)', marginBottom: '24px' }}>
                        {renderTabs()}
                        <div style={{ padding: '0 24px' }}>
                            <p>Attendee list goes here...</p>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '16px' }}>
                    <Button text="Request Call-off" style="danger" fill="outline" />
                    <Button text="Join session" style="primary" fill="filled" block leadingVisual={<span style={{ marginRight: '8px' }}>🎥</span>} />
                </div>
            </Modal>
        </div>
    )
}
