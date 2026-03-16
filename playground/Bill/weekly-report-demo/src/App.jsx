import React, { useState } from 'react';
import WeeklyReportContent from './WeeklyReportContent';
import Button from '@/components/Button/Button';

export default function App() {
    const [view, setView] = useState('index');

    if (view === 'index') {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: '24px',
                fontFamily: 'Instrument Sans, sans-serif'
            }}>
                <h1 style={{ marginBottom: '24px' }}>Weekly Review Demo</h1>
                <Button
                    text="View Weekly Report"
                    size="large"
                    style="primary"
                    fill="solid"
                    onClick={() => setView('report')}
                />
            </div>
        );
    }

    return (
        <div className="plus-app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f6f8fa' }}>
            <header style={{ background: 'white', padding: '16px 24px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
                <Button
                    style="secondary"
                    fill="ghost"
                    size="small"
                    onClick={() => setView('index')}
                    leadingVisual={<i className="fa-solid fa-arrow-left"></i>}
                    text="Back"
                />
                <div style={{ marginLeft: '16px', fontWeight: '600' }}>Weekly Review Demo</div>
            </header>

            <main className="plus-page-main" style={{ flex: 1, padding: '0 24px 48px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <WeeklyReportContent />
            </main>
        </div>
    );
}
