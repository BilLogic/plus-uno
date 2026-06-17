import React from 'react';
import './StatCards.scss';

const STATS = [
    {
        label: "Today's sessions",
        value: 1,
        icon: 'fa-calendar-days',
        iconStyle: 'fa-solid',
    },
    {
        label: 'Pending call-offs',
        value: 2,
        icon: 'fa-hourglass-half',
        iconStyle: 'fa-solid',
    },
    {
        label: 'Open for fill-ins',
        value: 23,
        icon: 'fa-right-to-bracket',
        iconStyle: 'fa-solid',
    },
];

export default function StatCards() {
    return (
        <div className="stat-cards">
            {STATS.map((stat) => (
                <div key={stat.label} className="stat-card">
                    <div className="stat-card__top">
                        <span className="stat-card__label body2-txt">{stat.label}</span>
                        <i className={`${stat.iconStyle} ${stat.icon} stat-card__icon`} aria-hidden="true" />
                    </div>
                    <div className="stat-card__value">{stat.value}</div>
                </div>
            ))}
        </div>
    );
}
