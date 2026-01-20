import React, { useState } from 'react';
import { Nav, Form, Table, Pagination, Badge } from 'react-bootstrap';
import { Button, Card } from '../../../components';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DonutChart from '@/components/charts/DonutChart';

const TutorsStatusWarningsPage = () => {
    const [activeTab, setActiveTab] = useState('status');

    return (
        <DashboardLayout>
            <div className="d-flex flex-column gap-4">
                {/* Tabs */}
                <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                    <Nav.Item><Nav.Link eventKey="performance">Tutor Performance</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="status">Status And Warnings</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="usage">Tool Usage</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="training">Training Progress</Nav.Link></Nav.Item>
                </Nav>

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div className="d-flex gap-2">
                        <Button style="primary" fill="outline" text="Email Tutors" />
                        <Button style="primary" fill="outline" text="Export Reflection Data" />
                    </div>
                    <div className="d-flex gap-2">
                        <Form.Select size="sm" style={{ width: 'auto' }}><option>All Schools</option></Form.Select>
                        <Form.Select size="sm" style={{ width: 'auto' }}><option>All Tutors</option></Form.Select>
                        <Form.Control type="date" size="sm" defaultValue="2025-01-10" style={{ width: 'auto' }} />
                        <Form.Control type="date" size="sm" defaultValue="2025-02-10" style={{ width: 'auto' }} />
                    </div>
                </div>

                {/* Status Overview */}
                <div className="d-flex flex-column gap-3">
                    <h3 className="h4">Status Overview</h3>
                    <div className="d-flex gap-3 overflow-auto pb-2">
                        <Card
                            className="flex-shrink-0"
                            style={{ width: '350px' }}
                            title="Status Distribution (Latest)"
                            body={<div className="text-center p-4 text-muted">Pie Chart Placeholder</div>}
                        />
                        <Card
                            className="flex-shrink-0"
                            style={{ width: '350px' }}
                            title="Status Trend (Weekly)"
                            body={<div className="text-center p-4 text-muted">Bar Chart Placeholder</div>}
                        />
                    </div>
                </div>

                {/* Status Details */}
                <div className="d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <h3 className="h4 m-0">Status Details</h3>
                        <Button style="primary" fill="outline" size="small" text="Add Tutor" />
                    </div>
                    <div className="bg-white rounded border overflow-hidden">
                        <Table hover className="m-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="py-3 px-4 border-bottom">Tutor Name</th>
                                    <th className="py-3 px-4 border-bottom">Status</th>
                                    <th className="py-3 px-4 border-bottom">Total Warnings</th>
                                    <th className="py-3 px-4 border-bottom">Mic Off</th>
                                    <th className="py-3 px-4 border-bottom">Cam Off</th>
                                    <th className="py-3 px-4 border-bottom">Absence</th>
                                    <th className="py-3 px-4 border-bottom">Late Calloff</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...Array(10)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="py-3 px-4">Floyd Miles</td>
                                        <td className="py-3 px-4"><Badge bg="warning" text="dark">Check-In Needed</Badge></td>
                                        <td className="py-3 px-4">16</td>
                                        <td className="py-3 px-4">4</td>
                                        <td className="py-3 px-4">4</td>
                                        <td className="py-3 px-4">4</td>
                                        <td className="py-3 px-4">4</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="d-flex justify-content-center">
                    <Pagination className="m-0">
                        <Pagination.Prev />
                        <Pagination.Item active>{1}</Pagination.Item>
                        <Pagination.Item>{2}</Pagination.Item>
                        <Pagination.Item>{3}</Pagination.Item>
                        <Pagination.Item>{4}</Pagination.Item>
                        <Pagination.Item>{5}</Pagination.Item>
                        <Pagination.Next />
                    </Pagination>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TutorsStatusWarningsPage;
