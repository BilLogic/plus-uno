import React, { useState } from 'react';
import { Nav, Table, Pagination } from 'react-bootstrap';
import { Button } from '../../../components';
import DashboardLayout from '@/components/layout/DashboardLayout';

const GroupInfoPage = () => {
    const [activeTab, setActiveTab] = useState('info');

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
                    <h2 className="h4 m-0">Group Info</h2>
                    <Button style="primary" fill="filled" icon="user-plus" text="Add Group" />
                </div>

                {/* Table */}
                <div className="bg-white rounded border">
                    <Table hover className="m-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="py-3 px-4 border-bottom">Group Name</th>
                                <th className="py-3 px-4 border-bottom">Group Size</th>
                                <th className="py-3 px-4 border-bottom">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...Array(10)].map((_, i) => (
                                <tr key={i}>
                                    <td className="py-3 px-4 align-middle">Math Masters</td>
                                    <td className="py-3 px-4 align-middle">4</td>
                                    <td className="py-3 px-4 align-middle">
                                        <Button style="link" size="small" icon="ellipsis-v" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
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

export default GroupInfoPage;
