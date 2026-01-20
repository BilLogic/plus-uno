import React from 'react';
import { Container, Row, Col, Navbar, Nav, Image } from 'react-bootstrap';
import { Button } from '../Button';

const DashboardLayout = ({ children }) => {
    return (
        <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)' }}>
            {/* Sidebar Placeholder */}
            <div className="d-flex flex-column p-3 bg-white border-end" style={{ width: '280px', flexShrink: 0 }}>
                <div className="mb-4 px-2">
                    <h5 className="m-0 text-primary fw-bold">PLUS</h5>
                </div>
                <Nav className="flex-column gap-2">
                    <Nav.Link href="#" active className="d-flex align-items-center gap-2">
                        <i className="fas fa-home"></i> Home
                    </Nav.Link>
                    <Nav.Link href="#" className="d-flex align-items-center gap-2">
                        <i className="fas fa-users"></i> Group Admin
                    </Nav.Link>
                </Nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow-1 d-flex flex-column">
                {/* Top Bar */}
                <Navbar bg="white" className="border-bottom px-4 py-2 justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                        <span className="text-muted">Home</span>
                        <span className="text-muted">/</span>
                        <span className="fw-medium">Group Admin</span>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <div className="text-end">
                            <div className="fw-bold">John Doe</div>
                            <div className="small text-muted">Supervisor</div>
                        </div>
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                            J
                        </div>
                    </div>
                </Navbar>

                {/* Page Content */}
                <main className="p-4 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
