
/**
 * Weekly Reports List Page
 * 
 * Overview page showing all weekly reports with completion metrics and table view.
 * Uses PageLayout and manual table styling to match Sessions Page implementation.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/specs/Universal/Pages';
import Badge from '@/components/Badge/Badge';
import Button from '@/components/Button/Button';
import Pagination from '@/components/Pagination/Pagination';
import Progress from '@/components/Progress/Progress';
import './WeeklyReportsListPage.scss';

// Mock data for weekly reports
const REPORTS_DATA = [
    { id: 1, week: 18, dateRange: 'Jan 27 – 31, 2026', status: 'Not viewed', completion: { done: 0, total: 5 } },
    { id: 2, week: 17, dateRange: 'Jan 20 – 24, 2026', status: 'Viewed', completion: { done: 5, total: 5 } },
    { id: 3, week: 16, dateRange: 'Jan 13 – 17, 2026', status: 'Viewed', completion: { done: 5, total: 5 } },
    { id: 4, week: 15, dateRange: 'Jan 06 – 10, 2026', status: 'Viewed', completion: { done: 5, total: 5 } },
    { id: 5, week: 14, dateRange: 'Dec 30, 2025 – Jan 03, 2026', status: 'Viewed', completion: { done: 5, total: 5 } },
    { id: 6, week: 13, dateRange: 'Dec 23 – 27, 2025', status: 'Viewed', completion: { done: 5, total: 5 } },
];

const TOTAL_REPORTS = 124;
const AVG_COMPLETION = 84;
const COMPLETION_DELTA = 2;
const ITEMS_PER_PAGE = 6;

export default function WeeklyReportsListPage() {
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
        const styleId = 'weekly-reports-list-scrollbar-hide';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                #weekly-reports-list-page .plus-page-main::-webkit-scrollbar,
                #weekly-reports-list-page .plus-page-content-wrapper::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    background: transparent !important;
                }
                #weekly-reports-list-page .plus-page-main,
                #weekly-reports-list-page .plus-page-content-wrapper {
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

    const handleViewReport = (weekId) => {
        navigate('/weekly-report');
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

    const getProgressColor = (done, total) => {
        const pct = (done / total) * 100;
        if (pct >= 100) return 'success';
        if (pct >= 60) return 'primary';
        return 'warning';
    };

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
                activeTab: 'weekly-report',
                onHomeClick: () => navigate('/home'),
                onTabClick: (id) => {
                    if (id === 'home') navigate('/home');
                    if (id === 'sessions') navigate('/sessions');
                    if (id === 'weekly-report') navigate('/weekly-reports');
                    if (id === 'lessons') navigate('/lessons');
                    if (id === 'tutors') navigate('/admin');
                }
            }}
            id="weekly-reports-list-page"
            className="plus-page-reveal"
            mainClassName="weekly-reports-content"
        >
            <div className="reports-header-row page-content-reveal" style={{ animationDelay: '0ms' }}>
                <div className="header-text">
                    <h1 className="h2-txt">Weekly Reports</h1>
                    <p className="body2-txt text-muted" style={{ marginTop: '8px' }}>
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
                            <th>WEEK</th>
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
                                <td className="body2-txt">Week {report.week}</td>
                                <td className="body2-txt">{report.dateRange}</td>
                                <td>
                                    <Badge
                                        text={report.status}
                                        style={getStatusBadgeStyle(report.status)}
                                        size="b3"
                                        fill="tonal"
                                    />
                                </td>
                                <td>
                                    <div className="completion-cell">
                                        <div
                                            className="completion-progress-shell"
                                            style={{ '--progress-delay': `${220 + i * 80}ms` }}
                                        >
                                            <Progress
                                                value={(report.completion.done / report.completion.total) * 100}
                                                style={getProgressColor(report.completion.done, report.completion.total)}
                                                className="completion-progress completion-progress--staged"
                                                size="small"
                                            />
                                        </div>
                                        <span className="body3-txt">
                                            {report.completion.done}/{report.completion.total}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <Button
                                        text="View"
                                        style="secondary" // or primary? InSessionPage uses secondary outline
                                        fill="outline"
                                        size="small"
                                        // InSessionPage used Button component. My design used a link.
                                        // Let's use a text button with arrow.
                                        trailingVisual={<i className="fa-solid fa-arrow-right"></i>}
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
                <span className="body3-txt text-muted">
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
