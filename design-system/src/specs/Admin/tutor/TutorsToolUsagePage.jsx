import React, { useState } from 'react';
import { Nav, Form, Table, Pagination, Badge } from 'react-bootstrap';
import { Button, Card } from '../../../components';
import DashboardLayout from '@/components/layout/DashboardLayout';

const TutorsToolUsagePage = () => {
    const [activeTab, setActiveTab] = useState('usage');

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

                {/* Tool Usage Overview */}
                <div className="d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <h3 className="h4 m-0">Tool Usage</h3>
                        <div className="d-flex gap-2">
                            <Form.Select size="sm" style={{ width: 'auto' }}><option>All Schools</option></Form.Select>
                            <Form.Select size="sm" style={{ width: 'auto' }}><option>All Tutors</option></Form.Select>
                            <Form.Control type="date" size="sm" defaultValue="2025-01-10" style={{ width: 'auto' }} />
                            <Form.Control type="date" size="sm" defaultValue="2025-02-10" style={{ width: 'auto' }} />
                        </div>
                    </div>

                    <div className="d-flex gap-3 overflow-auto pb-2">
                        {['Recording Upload (Daily)', 'Reflection Completion (Weekly)', 'Help Center visits (Weekly)', 'Dashboard Adoption (Daily)', 'Dashboard Adoption (Weekly)'].map((title, i) => (
                            <Card
                                key={i}
                                className="flex-shrink-0"
                                style={{ width: '300px' }}
                                title={title}
                                body={<div className="text-center p-4 text-muted">Chart Placeholder</div>}
                            />
                        ))}
                    </div>
                </div>

                {/* Tool Usage Details */}
                <div className="d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <h3 className="h4 m-0">Tool Usage Details</h3>
                        <div className="d-flex gap-2">
                            <Button style="primary" fill="outline" size="small" icon="user-plus" text="Add Tutor" />
                            <Button style="primary" fill="outline" size="small" icon="download" text="Export CSV" />
                        </div>
                    </div>
                    <div className="bg-white rounded border overflow-hidden">
                        <Table hover className="m-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="py-3 px-4 border-bottom">Tutor Name</th>
                                    <th className="py-3 px-4 border-bottom">Help Center Visits</th>
                                    <th className="py-3 px-4 border-bottom">Recording</th>
                                    <th className="py-3 px-4 border-bottom">Reflection</th>
                                    <th className="py-3 px-4 border-bottom">Dashboard Adoption</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { name: 'Jane Smith', visits: 'Yes', rec: '85%', ref: '92%', adopt: 'Yes' },
                                    { name: 'Alice Brown', visits: 'No', rec: '75%', ref: '80%', adopt: 'No' },
                                ].map((row, i) => (
                                    <tr key={i}>
                                        <td className="py-3 px-4">{row.name}</td>
                                        <td className="py-3 px-4"><Badge bg={row.visits === 'Yes' ? 'success' : 'secondary'}>{row.visits}</Badge></td>
                                        <td className="py-3 px-4">{row.rec}</td>
                                        <td className="py-3 px-4">{row.ref}</td>
                                        <td className="py-3 px-4"><Badge bg={row.adopt === 'Yes' ? 'success' : 'secondary'}>{row.adopt}</Badge></td>
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

export default TutorsToolUsagePage;
