import React from 'react';
import MonthlyReportPage from './MonthlyReportPage';
import MonthlyReportsListPage from './MonthlyReportsListPage';

export default function MonthlyReportApp({ page = 'detail' }) {
    return page === 'list' ? <MonthlyReportsListPage /> : <MonthlyReportPage />;
}
