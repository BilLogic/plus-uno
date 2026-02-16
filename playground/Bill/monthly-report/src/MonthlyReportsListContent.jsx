/**
 * MonthlyReportsListContent
 * Content-only version of MonthlyReportsListPage for use inside ShellLayout.
 * No PageLayout wrapper — uses ShellContext to update TopBar/Layout config.
 */

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '@/components/Badge/Badge';
import Button from '@/components/Button/Button';
import Pagination from '@/components/Pagination/Pagination';
import Progress from '@/components/Progress/Progress';
import { ShellContext } from '../../home-redesign/src/context/ShellContext';
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

export default function MonthlyReportsListContent() {
    const navigate = useNavigate();
    const { setBreadcrumbs, setMainClassName, setFloatingContent } = useContext(ShellContext);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasEntered, setHasEntered] = useState(false);

    // Set shell context on mount
    useEffect(() => {
        setBreadcrumbs([
            { text: 'Toolkit', href: '/home' },
            { text: 'Reviews', href: '/monthly-reports' }
        ]);
        setMainClassName('monthly-reports-content');
        setFloatingContent(null);
    }, [setBreadcrumbs, setMainClassName, setFloatingContent]);

    useEffect(() => {
        requestAnimationFrame(() => setHasEntered(true));
    }, []);

    // Hide scrollbar programmatically
    useEffect(() => {
        const styleId = 'monthly-reports-list-scrollbar-hide';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .monthly-reports-content::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                }
                .monthly-reports-content {
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
        <div
            id="monthly-reports-list-page"
            className={`reveal-root ${hasEntered ? 'has-entered' : ''}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
            }}
        >
            <style>{`
                @keyframes revealIn {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .reveal-root .reveal-section {
                    opacity: 0;
                }
                .reveal-root.has-entered .reveal-section {
                    animation: revealIn 1.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
                .reveal-root .reveal-row {
                    opacity: 0;
                }
                .reveal-root.has-entered .reveal-row {
                    animation: revealIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
                @media (prefers-reduced-motion: reduce) {
                    .reveal-root .reveal-section,
                    .reveal-root .reveal-row {
                        opacity: 1;
                        animation: none !important;
                    }
                }
            `}</style>
            <div className="reports-header-row reveal-section" style={{ animationDelay: '0ms' }}>
                <div className="header-text">
                    <h1 className="h2-txt">Monthly Reviews</h1>
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

            <div className="reports-table-container reveal-section" style={{ animationDelay: '200ms' }}>
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
                                className="reveal-row"
                                style={{ animationDelay: `${400 + i * 80}ms` }}
                                onClick={() => handleViewReport(report.id)}
                            >
                                <td className="body2-txt">{report.month}</td>
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
                                            style={{ '--progress-delay': `${520 + i * 80}ms` }}
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
                                        style="secondary"
                                        fill="outline"
                                        size="small"
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

            <footer className="reports-footer reveal-section" style={{ animationDelay: '900ms' }}>
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
        </div>
    );
}
