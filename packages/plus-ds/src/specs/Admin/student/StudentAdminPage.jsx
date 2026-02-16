import React, { useState } from 'react';
import { Form, Table, Pagination, Badge } from 'react-bootstrap';
import { Button, Card, Modal } from '../../../components';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StackedBarChart from '@/components/charts/StackedBarChart';

const StudentAdminPage = () => {
    const [showModal, setShowModal] = useState(false);
    const [modalTab, setModalTab] = useState('info');

    const handleClose = () => setShowModal(false);
    const handleShow = () => setShowModal(true);

    // Sample Data for Charts
    const dates = ['06/03', '06/10', '06/17', '06/24', '07/01'];
    const chartData = [
        { segments: [{ value: 12, height: '60%', color: 'var(--bs-success)' }, { value: 6, height: '30%', color: 'var(--bs-danger)' }] },
        { segments: [{ value: 16, height: '70%', color: 'var(--bs-success)' }, { value: 8, height: '20%', color: 'var(--bs-danger)' }] },
        { segments: [{ value: 12, height: '50%', color: 'var(--bs-success)' }, { value: 5, height: '25%', color: 'var(--bs-danger)' }] },
        { segments: [{ value: 12, height: '80%', color: 'var(--bs-success)' }, { value: 1, height: '10%', color: 'var(--bs-danger)' }] },
        { segments: [{ value: 12, height: '80%', color: 'var(--bs-success)' }, { value: 1, height: '10%', color: 'var(--bs-danger)' }] }
    ];

    return (
        <DashboardLayout>
            <div className="d-flex flex-column gap-4">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <h2 className="h4 m-0">Student Overview</h2>
                    <div className="d-flex gap-2">
                        <Form.Select size="sm" style={{ width: 'auto' }}><option>All Schools</option></Form.Select>
                        <Form.Select size="sm" style={{ width: 'auto' }}><option>All Tutors</option></Form.Select>
                        <Form.Control type="date" size="sm" defaultValue="2012-11-01" style={{ width: 'auto' }} />
                        <Form.Control type="date" size="sm" defaultValue="2012-12-20" style={{ width: 'auto' }} />
                    </div>
                </div>

                {/* Overview Cards */}
                <div className="d-flex gap-3 overflow-auto pb-2">
                    <Card
                        className="flex-shrink-0"
                        style={{ width: '450px' }}
                        title="Student Needs Distribution"
                        body={<StackedBarChart data={chartData} dates={dates} />}
                    />
                    <Card
                        className="flex-shrink-0"
                        style={{ width: '450px' }}
                        title="Student Attendance"
                        body={<StackedBarChart data={chartData} dates={dates} />}
                    />
                    <Card
                        className="flex-shrink-0"
                        style={{ width: '450px' }}
                        title="Student Engagement"
                        body={<StackedBarChart data={chartData} dates={dates} />}
                    />
                </div>

                {/* Student Details */}
                <div className="d-flex flex-column gap-3">
                    <h3 className="h4">Student Details</h3>
                    <div className="bg-white rounded border overflow-hidden">
                        <Table hover className="m-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="py-3 px-4 border-bottom">Student</th>
                                    <th className="py-3 px-4 border-bottom">School</th>
                                    <th className="py-3 px-4 border-bottom">Teacher</th>
                                    <th className="py-3 px-4 border-bottom">Latest Status</th>
                                    <th className="py-3 px-4 border-bottom">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...Array(10)].map((_, i) => (
                                    <tr key={i} onClick={handleShow} style={{ cursor: 'pointer' }}>
                                        <td className="py-3 px-4">Jose Dolus</td>
                                        <td className="py-3 px-4">Langley</td>
                                        <td className="py-3 px-4">Jose Mura</td>
                                        <td className="py-3 px-4"><Badge bg="warning" text="dark">Needs to set goals</Badge></td>
                                        <td className="py-3 px-4"><Button style="link" size="small" text="View goals" /></td>
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

            {/* Student Modal */}
            <Modal
                show={showModal}
                onHide={handleClose}
                title="Student Name"
                size="lg"
                body={
                    <div className="d-flex flex-column gap-3">
                        {/* Tabs */}
                        <div className="d-flex border rounded overflow-hidden">
                            <div
                                className={`flex-fill text-center p-2 cursor-pointer ${modalTab === 'info' ? 'bg-primary text-white' : 'bg-light'}`}
                                onClick={() => setModalTab('info')}
                                style={{ cursor: 'pointer' }}
                            >
                                Student Info
                            </div>
                            <div
                                className={`flex-fill text-center p-2 cursor-pointer ${modalTab === 'sessions' ? 'bg-primary text-white' : 'bg-light'}`}
                                onClick={() => setModalTab('sessions')}
                                style={{ cursor: 'pointer' }}
                            >
                                Sessions <Badge bg="light" text="dark" pill className="ms-1">20</Badge>
                            </div>
                        </div>

                        {modalTab === 'info' ? (
                            <div className="d-flex flex-column gap-3">
                                <Form.Group>
                                    <Form.Label>Preferred name</Form.Label>
                                    <Form.Control type="text" value="Name" readOnly />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control type="email" value="name@example.com" readOnly />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Student status</Form.Label>
                                    <Form.Control type="text" value="Placeholder" readOnly />
                                </Form.Group>
                                <div className="d-flex justify-content-end gap-2 border-top pt-3">
                                    <Button style="danger" fill="text" text="Delete This Student" />
                                    <Button style="secondary" fill="outline" text="Cancel" onClick={handleClose} />
                                    <Button style="primary" fill="filled" text="Save" disabled />
                                </div>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                <Form.Check type="switch" label="Show Future Sessions" />
                                <Table size="sm">
                                    <thead>
                                        <tr>
                                            <th>Day (Date)</th>
                                            <th>Shift (ET)</th>
                                            <th>School</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...Array(5)].map((_, i) => (
                                            <tr key={i}>
                                                <td>Monday (01/31/25)</td>
                                                <td>0:00 PM - 0:00 PM</td>
                                                <td><Badge bg="secondary">School</Badge></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </div>
                }
            />
        </DashboardLayout>
    );
};

export default StudentAdminPage;
