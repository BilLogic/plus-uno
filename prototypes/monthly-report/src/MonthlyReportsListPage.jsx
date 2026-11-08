
/**
 * Monthly Reports List Page
 *
 * Overview page showing all monthly reports with completion metrics and table view.
 * Uses PageLayout and manual table styling to match Sessions Page implementation.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/specs/Universal/Pages';
import StatusTag from '@/components/labels/StatusTag';
import Button from '@/components/forms-and-inputs/Button/Button';
import Pagination from '@/components/navigation/Pagination/Pagination';
import ProgressBar from '@/components/loading/ProgressBar/ProgressBar';
import './MonthlyReportsListPage.scss';

// Mock data for monthly reports
const REPORTS_DATA = [
    { id: 1, month: 'January', dateRange: 'January 2026', status: 'Not viewed', completion: { done: 0, total: 5 } },
    { id: 2, month: 'December', dateRange: 'December 2025', status: 'Viewed', completion: { done: 5, total: 5 } },
    { id: 3, month: 'November', dateRange: 'November 2025', status: 'Viewed', completion: { done: 5, total: 5 } },
    { id: 4, month: 'October', dateRange: 'October 2025', status: 'Viewed', completion: { done: 5, total: 5 } },
    { id: 5, month: 'September', dateRange: 'September 2025', status: 'Viewed', completion: { done: 5, total: 5 } },
    { id: 6, month: 'August', dateRange: 'August 2025', status: 'Viewed', completion: { done: 5, total: 5 } },
];

const TOTAL_REPORTS = 124;
const AVG_COMPLETION = 84;
const COMPLETION_DELTA = 2;
const ITEMS_PER_PAGE = 6;

export default function MonthlyReportsListPage() {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);

    // Shell loading state for PageLayout reveal
    const [shellLoading, setShellLoading] = useState(true);
    const [shellEntered, setShellEntered] = useState(false);

    useEffect(() => {
        // Simulate initial load
        const t = setTimeout(() => {
            setShellLoading(false);
            requestAnimationFrame(() => setShellEntered(true));
        }, 500);
        return () => clearTimeout(t);
    }, []);

    // Hide scrollbar programmatically
    useEffect(() => {
        const styleId = 'monthly-reports-list-scrollbar-hide';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                #monthly-reports-list-page .plus-page-main::-webkit-scrollbar,
                #monthly-reports-list-page .plus-frame__surface::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    background: transparent !important;
                }
                #monthly-reports-list-page .plus-page-main,
                #monthly-reports-list-page .plus-frame__surface {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                }
            `;
            document.head.appendChild(style);
        }
        return () => {
            const style = document.getElementById(styleId);
            if (style) style.remove();
        };
    }, []);

    const totalPages = Math.ceil(TOTAL_REPORTS / ITEMS_PER_PAGE);

    const handleViewReport = (reportId) => {
        navigate('/monthly-report');
    };

    const handlePrevious = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    // Calculate display range
    const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, TOTAL_REPORTS);

    const getStatusBadgeStyle = (status) => {
        return (status === 'Unviewed' || status === 'Not viewed') ? 'warning' : 'success';
    };

    const getProgressAppearance = (done, total) => (done / total) * 100 >= 100 ? 'success' : 'default';

    return (
        <PageLayout
            shellLoading={shellLoading}
            shellEntered={shellEntered}
            topBarConfig={{
                breadcrumbs: [
                    { text: 'Toolkit', href: '#' },
                    { text: 'Reports', href: '#' }
                ],
                user: { name: 'Boyuan Guo', counter: null, counterValue: null, type: 'lead tutor' }
            }}
            sidebarConfig={{
                user: 'tutor',
                activeTab: 'monthly-report',
                onHomeClick: () => navigate('/home'),
                onTabClick: (id) => {
                    if (id === 'home') navigate('/home');
                    if (id === 'sessions') navigate('/sessions');
                    if (id === 'monthly-report') navigate('/monthly-reports');
                    if (id === 'lessons') navigate('/lessons');
                    if (id === 'tutors') navigate('/admin');
                }
            }}
            id="monthly-reports-list-page"
            className="plus-page-reveal"
            mainClassName="monthly-reports-content"
        >
            <div className="reports-header-row page-content-reveal" style={{ animationDelay: '0ms' }}>
                <div className="header-text">
                    <h1 className="heading-xxlarge">Monthly Reports</h1>
                    <p className="body-default text-muted" style={{ marginTop: '8px' }}>
                        Overview of your performance and session feedback.
                    </p>
                </div>
                <div className="header-stats">
                    <div className="stat-item">
                        <span className="stat-label">AVG. COMPLETION RATE</span>
                        <div className="stat-value">
                            {AVG_COMPLETION}%
                            <span className="stat-delta text-success" style={{ fontSize: '14px' }}>
                                <i className="fa-solid fa-arrow-trend-up"></i> {COMPLETION_DELTA}%
                            </span>
                        </div>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">TOTAL REPORTS</span>
                        <div className="stat-value">
                            {TOTAL_REPORTS}
                        </div>
                    </div>
                </div>
            </div>

            <div className="reports-table-container page-content-reveal" style={{ animationDelay: '100ms' }}>
                <table className="reports-table">
                    <thead>
                        <tr>
                            <th>MONTH</th>
                            <th>DATE RANGE</th>
                            <th>STATUS</th>
                            <th>FEEDBACK REVIEWED</th>
                            <th style={{ textAlign: 'right' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {REPORTS_DATA.map((report, i) => (
                            <tr
                                key={report.id}
                                onClick={() => handleViewReport(report.id)}
                            >
                                <td className="body-default">{report.month}</td>
                                <td className="body-default">{report.dateRange}</td>
                                <td>
                                    <StatusTag appearance={getStatusBadgeStyle(report.status)}>{report.status}</StatusTag>
                                </td>
                                <td>
                                    <div className="completion-cell">
                                        <div
                                            className="completion-progress-shell"
                                            style={{ '--progress-delay': `${220 + i * 80}ms` }}
                                        >
                                            <ProgressBar
                                                value={(report.completion.done / report.completion.total) * 100}
                                                appearance={getProgressAppearance(report.completion.done, report.completion.total)}
                                                ariaLabel="Report completion"
                                                className="completion-progress completion-progress--staged"
                                            />
                                        </div>
                                        <span className="body-small">
                                            {report.completion.done}/{report.completion.total}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <Button
                                        text="View"
                                        spacing="compact"
                                        iconAfter={<i className="fa-solid fa-arrow-right"></i>}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewReport(report.id);
                                        }}
                                        className="view-report-btn"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <footer className="reports-footer page-content-reveal" style={{ animationDelay: '200ms' }}>
                <span className="body-small text-muted">
                    Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{TOTAL_REPORTS}</strong> results
                </span>
                <div className="pagination-wrapper">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </footer>
        </PageLayout>
    );
}
