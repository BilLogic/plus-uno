import React, { useState } from 'react';
import { NavTabs, Modal, Table, Button, Badge, Alert } from '@plus-ds/components';
import { Checkbox } from '@plus-ds/forms';
import { ArrowRight, ArrowLeft } from 'react-bootstrap-icons';
import './FillInModal.scss';

const ALL_SESSIONS = [
    { id: 101, date: "Tue, Sep 9", time: "12:30 PM - 1:30 PM", school: "Hogwarts", teacher: "Mr. Snape", capacity: "1/5", leads: "0/1", isRecommended: false },
    { id: 102, date: "Tue, Sep 9", time: "1:30 PM - 2:30 PM", school: "Hogwarts", teacher: "Prof. McGonagall", capacity: "3/5", leads: "1/1", isRecommended: false },
    { id: 103, date: "Wed, Sep 10", time: "9:00 AM - 10:00 AM", school: "Beauxbatons", teacher: "Mme. Maxime", capacity: "0/5", leads: "0/1", isRecommended: false },
    { id: 104, date: "Wed, Sep 10", time: "10:00 AM - 11:00 AM", school: "Durmstrang", teacher: "Mr. Karkaroff", capacity: "2/5", leads: "0/1", isRecommended: false },
    { id: 105, date: "Thu, Sep 11", time: "11:00 AM - 12:00 PM", school: "Hogwarts", teacher: "Prof. Flitwick", capacity: "4/5", leads: "1/1", isRecommended: false },
];

const RECOMMENDED_SESSIONS = [
    { id: 201, date: "Mon, Sep 15", time: "10:00 AM - 11:00 AM", school: "Hogwarts", teacher: "Prof. Sprout", capacity: "1/5", leads: "0/1", isRecommended: true },
    { id: 202, date: "Mon, Sep 15", time: "1:00 PM - 2:00 PM", school: "Hogwarts", teacher: "Mr. Snape", capacity: "2/5", leads: "0/1", isRecommended: true },
];

export default function FillInModal({ show, onHide, recommendedCount, onComplete }) {
    const [activeTab, setActiveTab] = useState('recommended');
    const [selectedIds, setSelectedIds] = useState([]);

    if (!show) return null;

    const handleToggle = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleContinue = () => {
        const allOptions = [...ALL_SESSIONS, ...RECOMMENDED_SESSIONS];
        const selectedSessions = allOptions.filter(s => selectedIds.includes(s.id));
        onComplete(selectedSessions);
        setSelectedIds([]);
    };

    const currentData = activeTab === 'all' ? ALL_SESSIONS : RECOMMENDED_SESSIONS;

    const tableHeaders = [
        { text: '', width: '48px', align: 'center' },
        { text: 'Date & time', width: '30%' },
        { text: 'School & teacher', width: '35%' },
        { text: 'Tutor Capacity', width: '30%' }
    ];

    const tableRows = currentData.map(session => [
        <div key="check" className="d-flex justify-content-center">
            <Checkbox
                id={`check-${session.id}`}
                checked={selectedIds.includes(session.id)}
                onChange={() => handleToggle(session.id)}
            />
        </div>,
        <div key="date">
            <div className="fw-medium">{session.date}</div>
            <div className="text-muted small">{session.time}</div>
        </div>,
        <div key="school">
            <div className="fw-medium">{session.school}</div>
            <div className="text-muted small">{session.teacher}</div>
        </div>,
        <div key="capacity">
            <div className="fw-medium mb-1">{session.capacity} (Leads: {session.leads})</div>
            <Badge text="No lead" style="secondary" size="b3" />
        </div>
    ]);

    return (
        <div className="custom-modal-backdrop" onClick={onHide}>
            <div onClick={(e) => e.stopPropagation()}>
                <Modal
                    title="Fill in for session (one-time)"
                    type="default"
                    width={800}
                    onClose={onHide}
                    showBottomButtons
                    primaryButton={{
                        text: `Continue (${selectedIds.length} selected)`,
                        onClick: handleContinue,
                        style: 'primary',
                        disabled: selectedIds.length === 0
                    }}
                    secondaryButton={{
                        text: 'Close',
                        onClick: onHide,
                        style: 'secondary',
                        fill: 'outline'
                    }}
                >
                    <div className="fill-in-modal-content">
                        <Alert style="warning" dismissable={false} className="border-0 border-bottom rounded-0 m-0">
                            <strong>One-time Fill-ins:</strong> Help cover specific sessions that need additional tutors. These are individual sessions, not recurring commitments.
                        </Alert>

                        <NavTabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="px-4 pt-3 border-bottom">
                            <NavTabs.Item eventKey="all">
                                All available <Badge text="36" style="secondary" size="b3" className="ms-2" />
                            </NavTabs.Item>
                            <NavTabs.Item eventKey="recommended">
                                Recommended
                                {recommendedCount > 0 && <Badge text={recommendedCount.toString()} style="danger" className="ms-2" />}
                            </NavTabs.Item>
                        </NavTabs>

                        <div className="modal-body-custom">
                            <Table headers={tableHeaders} rows={tableRows} hover />

                            <div className="pagination-row">
                                <span>Showing 1 to {currentData.length} of {activeTab === 'all' ? '36' : recommendedCount} entries</span>
                                <div className="d-flex align-items-center gap-2">
                                    <Button style="secondary" fill="outline" size="small"><ArrowLeft size={12} /></Button>
                                    <Button style="primary" size="small" text="1" />
                                    <Button style="secondary" fill="outline" size="small" text="2" />
                                    <span className="text-muted px-1">...</span>
                                    <Button style="secondary" fill="outline" size="small" text="10" />
                                    <Button style="secondary" fill="outline" size="small"><ArrowRight size={12} /></Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
}
