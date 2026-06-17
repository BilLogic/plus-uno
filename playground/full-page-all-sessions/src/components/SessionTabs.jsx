import React from 'react';
import './SessionTabs.scss';

const TABS = [
    { id: 'my-sessions',  label: 'My sessions',  count: 3 },
    { id: 'sign-ups',     label: 'Sign-ups',      count: 3 },
    { id: 'fill-ins',     label: 'Fill-ins',      count: 3 },
    { id: 'call-offs',    label: 'Call-offs',     count: 3 },
    { id: 'reflections',  label: 'Reflections',   count: null },
];

export default function SessionTabs({ activeTab, onTabChange }) {
    return (
        <div className="session-tabs" role="tablist" aria-label="Session views">
            {TABS.map((tab) => (
                <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    className={`session-tabs__tab${activeTab === tab.id ? ' session-tabs__tab--active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    <span className="session-tabs__label">{tab.label}</span>
                    {tab.count !== null && (
                        <span className="session-tabs__badge">{tab.count}</span>
                    )}
                </button>
            ))}
        </div>
    );
}
