import React, { useState } from 'react';
import { Nav, Form, Table, Pagination } from 'react-bootstrap';
import { Button, Card, Modal } from '../../../components';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DonutChart from '@/components/charts/DonutChart';

const SessionAdminPage = () => {
    const [activeTab, setActiveTab] = useState('warnings');
    const [showModal, setShowModal] = useState(false);

    const handleClose = () => setShowModal(false);
    const handleShow = () => setShowModal(true);

    // Paths from legacy code (simplified for demo)
    const greenPath = "M228.74 114.37C228.74 144.392 216.936 173.21 195.875 194.604C174.813 215.999 146.185 228.254 116.167 228.726C86.1485 229.198 57.1488 217.847 35.426 197.125C13.7032 176.402 0.999436 147.969 0.0564345 117.963C-0.886567 87.9557 10.0068 58.7812 30.3856 36.7356C50.7643 14.69 78.9942 1.54118 108.983 0.126964C138.971 -1.28725 168.313 9.14654 190.676 29.1765C213.039 49.2065 226.629 77.2263 228.514 107.189L194.271 109.343C192.952 88.3694 183.438 68.7555 167.784 54.7346C152.13 40.7136 131.591 33.41 110.599 34.3999C89.6069 35.3899 69.846 44.594 55.5809 60.0259C41.9305 150.397 48.5908 161.266 57.4814 170.156C66.3721 179.047 77.2406 185.707 89.1985 189.593C101.156 193.478 113.864 194.478 126.283 192.511C138.701 190.544 150.478 185.666 160.65 178.276C170.822 170.886 179.1 161.193 184.808 149.99C190.516 138.787 193.492 126.392 193.492 113.819H228.74Z"; // Truncated/Simplified for brevity
    const redPath = "M228.462 106.392C228.629 108.782 228.721 111.176 228.737 113.572L194.427 113.811C194.415 112.134 194.351 110.458 194.234 108.785L228.462 106.392Z";

    const chartData = [
        { title: "Student Attendance", value: "99%", label: "attended", segments: [{ path: greenPath, color: "#A1EB83" }, { path: redPath, color: "#FFDAD6" }] },
        { title: "Student Engagement", value: "99%", label: "engaged", segments: [{ path: greenPath, color: "#A1EB83" }, { path: redPath, color: "#FFDAD6" }] },
        { title: "Tutor Attendance", value: "99%", label: "attended", segments: [{ path: greenPath, color: "#A1EB83" }, { path: redPath, color: "#FFDAD6" }] },
        { title: "Check-in Completion", value: "99%", label: "checked in", segments: [{ path: greenPath, color: "#A1EB83" }, { path: redPath, color: "#FFDAD6" }] },
    ];

    return (
        <DashboardLayout>
            <div className="d-flex flex-column gap-4">
                {/* Tabs */}
                <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                    <Nav.Item><Nav.Link eventKey="warnings">Warnings</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="current">Current Tutors</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="incoming">Incoming Tutors</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="details" disabled>Details</Nav.Link></Nav.Item>
                </Nav>

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <h2 className="h4 m-0">Session Overview</h2>
                    <div className="d-flex gap-2">
                        <Form.Select size="sm" style={{ width: 'auto' }}><option>All Schools</option></Form.Select>
                        <Form.Select size="sm" style={{ width: 'auto' }}><option>All Tutors</option></Form.Select>
                        <Form.Control type="date" size="sm" defaultValue="2012-11-01" style={{ width: 'auto' }} />
                        <Form.Control type="date" size="sm" defaultValue="2012-12-20" style={{ width: 'auto' }} />
                    </div>
                </div>

                {/* Overview Cards */}
                <div className="d-flex gap-3 overflow-auto pb-2">
                    {chartData.map((data, i) => (
                        <Card
                            key={i}
                            className="flex-shrink-0"
                            style={{ width: '280px' }}
                            title={data.title}
                            body={
                                <div className="d-flex flex-column align-items-center justify-content-center h-100">
                                    <DonutChart size={180} value={data.value} label={data.label} segments={data.segments} />
                                </div>
                            }
                        />
                    ))}
                </div>

                {/* Session Details */}
                <div className="d-flex flex-column gap-3">
                    <h3 className="h4">Session Details</h3>
                    <div className="bg-white rounded border overflow-hidden">
                        <Table hover className="m-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="py-3 px-4 border-bottom">Day</th>
                                    <th className="py-3 px-4 border-bottom">Shift</th>
                                    <th className="py-3 px-4 border-bottom">School</th>
                                    <th className="py-3 px-4 border-bottom">Teacher</th>
                                    <th className="py-3 px-4 border-bottom">Attended Students</th>
                                    <th className="py-3 px-4 border-bottom">Engaged Student</th>
                                    <th className="py-3 px-4 border-bottom">Attended Tutors</th>
                                    <th className="py-3 px-4 border-bottom">Completed Checkin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...Array(10)].map((_, i) => (
                                    <tr key={i} onClick={handleShow} style={{ cursor: 'pointer' }}>
                                        <td className="py-3 px-4">DoW (00/00/00)</td>
                                        <td className="py-3 px-4">2:25 PM - 3:15 PM</td>
                                        <td className="py-3 px-4">Hogwarts</td>
                                        <td className="py-3 px-4">Snape</td>
                                        <td className="py-3 px-4">20%</td>
                                        <td className="py-3 px-4">20%</td>
                                        <td className="py-3 px-4">20%</td>
                                        <td className="py-3 px-4">20%</td>
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

            {/* Session Breakdown Modal */}
            <Modal
                show={showModal}
                onHide={handleClose}
                title="11/02/12 Session Breakdown"
                size="lg"
                body={
                    <Table hover>
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Status</th>
                                <th>Tutor Name</th>
                                <th>Type</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { name: "Amanda Novak", status: "Needs to set goals", tutor: "Ethan Cole", type: "Lead", time: "11" },
                                { name: "Ashley Brown", status: "Needs to set goals", tutor: "Martha Dunn", type: "Regular", time: "8" },
                            ].map((student, i) => (
                                <tr key={i}>
                                    <td>{student.name}</td>
                                    <td>{student.status}</td>
                                    <td>{student.tutor}</td>
                                    <td>{student.type}</td>
                                    <td>{student.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                }
            />
        </DashboardLayout>
    );
};

export default SessionAdminPage;
