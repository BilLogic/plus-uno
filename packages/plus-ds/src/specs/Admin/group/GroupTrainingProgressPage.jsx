import React, { useState } from 'react';
import { Nav, Table, Form, ProgressBar } from 'react-bootstrap';
import { Button, Card } from '../../../components';
import DashboardLayout from '@/components/layout/DashboardLayout';

const GroupTrainingProgressPage = () => {
    const [activeTab, setActiveTab] = useState('training');

    return (
        <DashboardLayout>
            <div className="d-flex flex-column gap-4">
                {/* Tabs */}
                <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                    <Nav.Item>
                        <Nav.Link eventKey="info">Group Info</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="training">Training Progress</Nav.Link>
                    </Nav.Item>
                </Nav>

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center">
                    <h2 className="h4 m-0">Group Training Progress</h2>
                    <Button style="primary" fill="outline" size="small" icon="caret-down" iconPosition="right" text="All Groups" />
                </div>

                {/* Overview Cards */}
                <div className="d-flex gap-3 overflow-auto pb-2">
                    {/* Student Need Card (Custom) */}
                    <div className="bg-white p-3 rounded border shadow-sm" style={{ minWidth: '280px' }}>
                        <div className="d-flex justify-content-between mb-2">
                            <h6 className="fw-bold m-0">Student Need</h6>
                            <i className="fas fa-info-circle text-muted"></i>
                        </div>
                        <div className="small fw-bold mb-1">Mastering Content</div>
                        <div className="small text-muted mb-3">3/3 students need support</div>
                        <div className="d-flex gap-2 align-items-end" style={{ height: '80px' }}>
                            {['S', 'M', 'A', 'R', 'T'].map((letter, i) => (
                                <div key={letter} className="d-flex flex-column align-items-center gap-1" style={{ flex: 1 }}>
                                    <div className="w-100 bg-light rounded-pill position-relative" style={{ height: '60px' }}>
                                        <div
                                            className="position-absolute bottom-0 w-100 rounded-pill"
                                            style={{
                                                height: i === 1 ? '70%' : '50%',
                                                backgroundColor: i === 1 ? 'var(--bs-primary)' : 'var(--bs-secondary)'
                                            }}
                                        ></div>
                                    </div>
                                    <small className="fw-bold text-muted">{letter}</small>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Card
                        className="flex-shrink-0"
                        style={{ width: '280px' }}
                        title="Completion Rate"
                        body={
                            <div className="d-flex flex-column align-items-center justify-content-center h-100">
                                <h3 className="fw-bold m-0">20%</h3>
                                <small className="text-muted text-center">of total lessons completed</small>
                            </div>
                        }
                    />
                    <Card
                        className="flex-shrink-0"
                        style={{ width: '280px' }}
                        title="Avg Accuracy Rate"
                        body={
                            <div className="d-flex flex-column align-items-center justify-content-center h-100">
                                <h3 className="fw-bold m-0">20%</h3>
                                <small className="text-muted text-center">average accuracy</small>
                            </div>
                        }
                    />
                </div>

                {/* Hierarchical Table */}
                <div className="bg-white rounded border overflow-hidden">
                    <div className="p-3 border-bottom bg-light fw-bold d-flex">
                        <div style={{ flex: 2 }}>Competency / Lesson</div>
                        <div style={{ flex: 1 }}>Completion</div>
                        <div style={{ flex: 1 }}>Accuracy</div>
                        <div style={{ flex: 1 }}>Rating</div>
                        <div style={{ flex: 1 }}>Time Spent</div>
                    </div>

                    {/* Level 1 Row */}
                    <div className="p-3 border-bottom d-flex align-items-center bg-light">
                        <div style={{ flex: 2 }} className="fw-bold">Social-Emotional Learning</div>
                        <div style={{ flex: 1 }}>8/16</div>
                        <div style={{ flex: 1 }}>10%</div>
                        <div style={{ flex: 1 }}>5.0/5</div>
                        <div style={{ flex: 1 }}>328 mins</div>
                    </div>

                    {/* Level 2 Row */}
                    <div className="p-3 border-bottom d-flex align-items-center ps-4 bg-white">
                        <div style={{ flex: 2 }}>Motivation to Learn</div>
                        <div style={{ flex: 1 }}>4/4</div>
                        <div style={{ flex: 1 }}>10%</div>
                        <div style={{ flex: 1 }}>5.0/5</div>
                        <div style={{ flex: 1 }}>328 mins</div>
                    </div>

                    {/* Level 3 Row */}
                    <div className="p-3 border-bottom d-flex align-items-center ps-5 bg-white">
                        <div style={{ flex: 2 }} className="text-muted">Reacting to Errors</div>
                        <div style={{ flex: 1 }}>1/4</div>
                        <div style={{ flex: 1 }}>10%</div>
                        <div style={{ flex: 1 }}>5.0/5</div>
                        <div style={{ flex: 1 }}>328 mins</div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default GroupTrainingProgressPage;
