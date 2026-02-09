import React from 'react';
import WeeklyReportPage from './WeeklyReportPage';
import WeeklyReportsListPage from './WeeklyReportsListPage';

export default function WeeklyReportApp({ page = 'detail' }) {
    return page === 'list' ? <WeeklyReportsListPage /> : <WeeklyReportPage />;
}
