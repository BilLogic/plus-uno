import React from 'react';
import { Breadcrumb } from '@/components';

const DashboardLayout = ({ children }) => {
    return (
        <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: 'var(--ds-surface-sunken)' }}>
            {/* Sidebar Placeholder */}
            <div className="d-flex flex-column p-3 bg-white border-end" style={{ width: '280px', flexShrink: 0 }}>
                <div className="mb-4 px-2">
                    <h5 className="m-0 text-primary fw-bold">PLUS</h5>
                </div>
                <nav className="nav flex-column gap-2">
                    <a href="#" className="nav-link active d-flex align-items-center gap-2" aria-current="page">
                        <i className="fas fa-home"></i> Home
                    </a>
                    <a href="#" className="nav-link d-flex align-items-center gap-2">
                        <i className="fas fa-users"></i> Group Admin
                    </a>
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow-1 d-flex flex-column">
                {/* The page's header row: its breadcrumb */}
                <div className="px-4 pt-3">
                    <Breadcrumb items={[{ text: 'Home', href: '#' }, { text: 'Group Admin' }]} />
                </div>

                {/* Page Content */}
                <main className="p-4 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
