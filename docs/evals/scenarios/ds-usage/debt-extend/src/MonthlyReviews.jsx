/**
 * MonthlyReviews
 * A tutor's monthly reviews: one row per month, with whether the review was
 * viewed and how much of its feedback was reviewed.
 */

import React, { useState } from 'react';
import StatusTag from '@/components/labels/StatusTag';
import Button from '@/components/forms-and-inputs/Button/Button';
import Pagination from '@/components/navigation/Pagination/Pagination';
import ProgressBar from '@/components/loading/ProgressBar/ProgressBar';

// Mock data for monthly reports
const REPORTS_DATA = [
    { id: 1, month: 'January', dateRange: 'January 2026', status: 'Not viewed', completion: { done: 0, total: 5 } },
    { id: 2, month: 'December', dateRange: 'December 2025', status: 'Viewed', completion: { done: 5, total: 5 } },
    { id: 3, month: 'November', dateRange: 'November 2025', status: 'Viewed', completion: { done: 5, total: 5 } },
    { id: 4, month: 'October', dateRange: 'October 2025', status: 'Not viewed', completion: { done: 2, total: 5 } },
    { id: 5, month: 'September', dateRange: 'September 2025', status: 'Viewed', completion: { done: 5, total: 5 } },
    { id: 6, month: 'August', dateRange: 'August 2025', status: 'Viewed', completion: { done: 4, total: 5 } },
];

const AVG_COMPLETION = 84;
const COMPLETION_DELTA = 2;
const ITEMS_PER_PAGE = 6;

export default function MonthlyReviews() {
    const [reports, setReports] = useState(REPORTS_DATA);
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(reports.length / ITEMS_PER_PAGE);

    const handleViewReport = (id) => {
        setReports((rows) => rows.map((r) => (r.id === id ? { ...r, status: 'Viewed' } : r)));
    };

    const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, reports.length);

    const getStatusBadgeStyle = (status) => {
        return (status === 'Unviewed' || status === 'Not viewed') ? 'warning' : 'success';
    };

    const getProgressAppearance = (done, total) => (done / total) * 100 >= 100 ? 'success' : 'default';

    return (
        <div id="monthly-reports-list-page">
            <div className="reports-header-row">
                <div className="header-text">
                    <h1 className="h2">Monthly Reviews</h1>
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
                        <div className="stat-value">{reports.length}</div>
                    </div>
                </div>
            </div>

            <div className="reports-table-container">
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
                        {reports.slice(startItem - 1, endItem).map((report) => (
                            <tr key={report.id}>
                                <td className="body2-txt">{report.month}</td>
                                <td className="body2-txt">{report.dateRange}</td>
                                <td>
                                    <StatusTag appearance={getStatusBadgeStyle(report.status)}>{report.status}</StatusTag>
                                </td>
                                <td>
                                    <div className="completion-cell">
                                        <ProgressBar
                                            value={(report.completion.done / report.completion.total) * 100}
                                            appearance={getProgressAppearance(report.completion.done, report.completion.total)}
                                            ariaLabel="Report completion"
                                            className="completion-progress"
                                        />
                                        <span className="body3-txt">
                                            {report.completion.done}/{report.completion.total}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <Button
                                        text="View"
                                        spacing="compact"
                                        iconAfter={<i className="fa-solid fa-arrow-right"></i>}
                                        onClick={() => handleViewReport(report.id)}
                                        className="view-report-btn"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <footer className="reports-footer">
                <span className="body3-txt text-muted">
                    Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{reports.length}</strong> results
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
