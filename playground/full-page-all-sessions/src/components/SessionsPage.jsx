import React, { useState } from 'react';
import StatCards from './StatCards';
import SessionTabs from './SessionTabs';
import AllSessionsTable from './AllSessionsTable';
import './SessionsPage.scss';

export default function SessionsPage({ activeTab, onTabChange }) {
    return (
        <div className="sessions-page">
            {/* Page header */}
            <div className="sessions-page__header">
                <h1 className="sessions-page__title h2">Your Sessions</h1>
                <button className="sessions-page__fill-in-btn">
                    <i className="fa-solid fa-calendar-days" />
                    <span>Fill in</span>
                </button>
            </div>

            {/* Stat summary cards */}
            <StatCards />

            {/* Tab navigation */}
            <SessionTabs activeTab={activeTab} onTabChange={onTabChange} />

            {/* All Sessions table block */}
            <AllSessionsTable />
        </div>
    );
}
