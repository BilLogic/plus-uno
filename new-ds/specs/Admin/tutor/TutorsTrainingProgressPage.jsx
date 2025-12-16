import React, { useState } from 'react';
import { Nav, Form, Table, Pagination, ButtonGroup, ToggleButton } from 'react-bootstrap';
import { Button, Card } from '../../../components';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SmartBarChart from '@/components/charts/SmartBarChart';

const TutorsTrainingProgressPage = () => {
    const [activeTab, setActiveTab] = useState('training');
    const [viewMode, setViewMode] = useState('tutor');

    const smartData = [
        { letter: 'S', height: '60%', color: 'var(--bs-info)' },
        { letter: 'M', height: '60%', color: 'var(--bs-primary)' },
        { letter: 'A', height: '10%', color: 'var(--bs-secondary)' },
        { letter: 'R', height: '60%', color: 'var(--bs-danger)' },
        { letter: 'T', height: '60%', color: 'var(--bs-warning)' }
    ];

    return (
        <DashboardLayout>
            <div className="d-flex flex-column gap-4">
                {/* Tabs & Actions */}
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                        <Nav.Item><Nav.Link eventKey="performance">Tutor Performance</Nav.Link></Nav.Item>
                        <Nav.Item><Nav.Link eventKey="status">Status And Warnings</Nav.Link></Nav.Item>
                        <Nav.Item><Nav.Link eventKey="usage">Tool Usage</Nav.Link></Nav.Item>
                        <Nav.Item><Nav.Link eventKey="training">Training Progress</Nav.Link></Nav.Item>
                    </Nav>
                    <div className="d-flex gap-2">
                        <Button style="primary" fill="outline" text="Email Tutors" />
                        <Button style="primary" fill="outline" text="Export Reflection Data" />
                    </div>
                </div>

                {/* Training Progress Overview */}
                <div className="d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <h3 className="h4 m-0">Training Progress Overview</h3>
                        <ButtonGroup size="sm">
                            <ToggleButton
                                id="tutor-btn"
                                type="radio"
                                variant={viewMode === 'tutor' ? 'primary' : 'outline-primary'}
                                name="radio"
                                value="tutor"
                                checked={viewMode === 'tutor'}
                                onChange={(e) => setViewMode(e.currentTarget.value)}
                            >
                                By Tutor
                            </ToggleButton>
                            <ToggleButton
                                id="lesson-btn"
                                type="radio"
                                variant={viewMode === 'lesson' ? 'primary' : 'outline-primary'}
                                name="radio"
                                value="lesson"
                                checked={viewMode === 'lesson'}
                                onChange={(e) => setViewMode(e.currentTarget.value)}
                            >
                                By Lesson
                            </ToggleButton>
                        </ButtonGroup>
                    </div>

                    <div className="d-flex gap-3 overflow-auto pb-2">
                        {/* Tutor Need Card */}
                        <div className="bg-white p-3 rounded border shadow-sm" style={{ minWidth: '220px' }}>
                            <div className="d-flex justify-content-between mb-2">
                                <h6 className="fw-bold m-0 text-secondary">Tutor Need</h6>
                                <i className="fas fa-info-circle text-muted"></i>
                            </div>
                            <div className="small fw-bold mb-1 text-secondary">Advocacy</div>
                            <div className="small text-muted mb-3">is where tutors had received least training.</div>
                            <SmartBarChart data={smartData} />
                        </div>

                        <Card
                            className="flex-shrink-0"
                            style={{ width: '220px' }}
                            title="Avg Completion Rate"
                            body={
                                <div className="d-flex flex-column align-items-center justify-content-center h-100">
                                    <h3 className="fw-bold m-0">20%</h3>
                                    <small className="text-muted text-center">of total lessons completed</small>
                                </div>
                            }
                        />
                        <Card
                            className="flex-shrink-0"
                            style={{ width: '220px' }}
                            title="Tutor Badge Completions"
                            body={
                                <div className="d-flex flex-column align-items-center justify-content-center h-100">
                                    <h3 className="fw-bold m-0">20%</h3>
                                    <small className="text-muted text-center">of eligible tutors have claimed badges</small>
                                </div>
                            }
                        />
                        <Card
                            className="flex-shrink-0"
                            style={{ width: '220px' }}
                            title="Onboarding Completion"
                            body={
                                <div className="d-flex flex-column align-items-center justify-content-center h-100">
                                    <h3 className="fw-bold m-0">20%</h3>
                                    <small className="text-muted text-center">of tutors finished onboarding</small>
                                </div>
                            }
                        />
                    </div>
                </div>

                {/* Training Progress Details */}
                <div className="d-flex flex-column gap-3">
                    <h3 className="h4 m-0">Training Progress Details</h3>
                    <div className="d-flex gap-2">
                        <Form.Select size="sm" style={{ width: 'auto' }}><option>All Schools</option></Form.Select>
                        <Form.Select size="sm" style={{ width: 'auto' }}><option>All Tutors</option></Form.Select>
                    </div>
                    <div className="bg-white rounded border overflow-hidden">
                        <Table hover className="m-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="py-3 px-4 border-bottom">Tutor Name</th>
                                    <th className="py-3 px-4 border-bottom">Email</th>
                                    <th className="py-3 px-4 border-bottom">Completion</th>
                                    <th className="py-3 px-4 border-bottom">Accuracy</th>
                                    <th className="py-3 px-4 border-bottom">Badge Claimed</th>
                                    <th className="py-3 px-4 border-bottom">Time Spent</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...Array(10)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="py-3 px-4">Ben Green</td>
                                        <td className="py-3 px-4">dummy@gmail.com</td>
                                        <td className="py-3 px-4">8/18</td>
                                        <td className="py-3 px-4">30%</td>
                                        <td className="py-3 px-4">{i === 0 ? 'Yes' : (i === 1 ? 'No' : '-')}</td>
                                        <td className="py-3 px-4">328</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="d-flex justify-content-between align-items-center">
                    <div className="text-muted small">Showing 1 to 10 of 200 entries</div>
                    <Pagination className="m-0">
                        <Pagination.Prev />
                        <Pagination.Item active>{1}</Pagination.Item>
                        <Pagination.Item>{2}</Pagination.Item>
                        <Pagination.Item>{3}</Pagination.Item>
                        <Pagination.Next />
                    </Pagination>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TutorsTrainingProgressPage;
