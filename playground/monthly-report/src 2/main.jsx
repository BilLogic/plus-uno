import React from 'react';
import ReactDOM from 'react-dom/client';
import MonthlyReportApp from './App';
import '../../home-redesign/src/index.css'; // Use existing styles

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <MonthlyReportApp />
    </React.StrictMode>
);
