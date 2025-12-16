import React, { useState } from 'react';
import { Container, Row, Col, Nav, Table, Pagination, Form } from 'react-bootstrap';
import { Button, Card, Modal } from '../../components';

const TutorsOverviewPage = () => {
    const [activeTab, setActiveTab] = useState('performance');
    const [showModal, setShowModal] = useState(false);

    const handleClose = () => setShowModal(false);
    const handleShow = () => setShowModal(true);

    return (
        <Container fluid className="p-4">
            {/* Header / Top Bar would go here (part of Layout) */}

            {/* Page Content */}
            <div className="d-flex flex-column gap-4">

                {/* Header & Actions */}
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                        <Nav.Item>
                            <Nav.Link eventKey="performance">Tutor Performance</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="status">Status And Warnings</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="tools">Tool Usage</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="training">Training Progress</Nav.Link>
                        </Nav.Item>
                    </Nav>

                    <div className="d-flex gap-2">
                        <Button style="primary" fill="outline" text="Email Tutors" />
                        <Button style="primary" fill="outline" text="Export Reflection Data" />
                    </div>
                </div>

                {/* Performance Overview Section */}
                <section className="d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <h3>Performance Overview</h3>
                        <div className="d-flex gap-2">
                            <Form.Select size="sm" style={{ width: 'auto' }}>
                                <option>All Schools</option>
                            </Form.Select>
                            <Form.Select size="sm" style={{ width: 'auto' }}>
                                <option>All Tutors</option>
                            </Form.Select>
                            <Form.Control type="date" size="sm" defaultValue="2025-01-10" style={{ width: 'auto' }} />
                            <Form.Control type="date" size="sm" defaultValue="2025-02-10" style={{ width: 'auto' }} />
                        </div>
                    </div>

                    <div className="d-flex gap-3 overflow-auto pb-2">
                        <Card
                            className="flex-shrink-0"
                            style={{ width: '300px' }}
                            title="Attendance"
                            body={<div className="text-center p-3 bg-light rounded">Pie Chart Placeholder</div>}
                        />
                        <Card
                            className="flex-shrink-0"
                            style={{ width: '300px' }}
                            title="Sign-Up Rate"
                            body={<div className="text-center p-3 bg-light rounded">Pie Chart Placeholder</div>}
                        />
                    </div>
                </section>

                {/* Performance Details Section */}
                <section className="d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <h3>Performance Details</h3>
                        <Button style="primary" fill="outline" size="small" icon="user-plus" text="Add Tutor" onClick={handleShow} />
                    </div>

                    <div className="table-responsive">
                        <Table hover>
                            <thead>
                                <tr>
                                    <th>Tutor Name</th>
                                    <th>Signed Up</th>
                                    <th>Attendance</th>
                                    <th>Sessions</th>
                                    <th>Students</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { name: 'Amelia Blue', signedUp: 'Yes', attendance: '92%', sessions: 25, students: 18 },
                                    { name: 'Ava Silver', signedUp: 'Yes', attendance: '22%', sessions: 34, students: 12 },
                                    { name: 'Elijah Orange', signedUp: 'Yes', attendance: '68%', sessions: 22, students: 7 },
                                ].map((tutor, idx) => (
                                    <tr key={idx}>
                                        <td>{tutor.name}</td>
                                        <td>{tutor.signedUp}</td>
                                        <td>{tutor.attendance}</td>
                                        <td>{tutor.sessions}</td>
                                        <td>{tutor.students}</td>
                                        <td><Button style="link" size="small" icon="ellipsis-v" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>

                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <small className="text-muted">Showing 1 to 10 of 200 entries</small>
                        <Pagination>
                            <Pagination.First />
                            <Pagination.Prev />
                            <Pagination.Item active>{1}</Pagination.Item>
                            <Pagination.Item>{2}</Pagination.Item>
                            <Pagination.Item>{3}</Pagination.Item>
                            <Pagination.Next />
                            <Pagination.Last />
                        </Pagination>
                    </div>
                </section>
            </div>

            {/* Modal Example */}
            <Modal
                show={showModal}
                onHide={handleClose}
                title="Add New Tutor"
                body={<p>Form to add a new tutor would go here.</p>}
                primaryAction={{ text: 'Save Tutor', onClick: handleClose }}
                secondaryAction={{ text: 'Cancel', onClick: handleClose }}
            />
        </Container>
    );
};

export default TutorsOverviewPage;
