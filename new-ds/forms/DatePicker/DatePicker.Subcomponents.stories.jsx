import React, { useState } from 'react';

export default {
    title: 'Forms/DatePicker/Subcomponents',
};

// Calendar View Component
const CalendarView = () => {
    const [viewDate, setViewDate] = useState(new Date(2025, 2, 15)); // March 2025
    
    const formatMonthYear = (date) => {
        const months = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const handleNav = (dir) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + dir, 1);
        setViewDate(newDate);
    };

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days = [];
    
    // Previous month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        days.push(
            <div key={`prev-${i}`} className="plus-date-picker-calendar-day plus-date-picker-calendar-day-other-month body2-txt">
                {prevMonthLastDay - i}
            </div>
        );
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(
            <div key={`curr-${i}`} className="plus-date-picker-calendar-day body2-txt">
                {i}
            </div>
        );
    }

    // Next month days (fill to 42 cells)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
        days.push(
            <div key={`next-${i}`} className="plus-date-picker-calendar-day plus-date-picker-calendar-day-other-month body2-txt">
                {i}
            </div>
        );
    }

    return (
        <div className="plus-date-picker-calendar dropdown-menu show" style={{ position: 'relative', display: 'block' }}>
            <div className="plus-date-picker-calendar-header">
                <button type="button" className="plus-date-picker-calendar-nav" onClick={() => handleNav(-1)} aria-label="Previous month">
                    <i className="fas fa-chevron-left"></i>
                </button>
                <div className="plus-date-picker-calendar-month-year h6">
                    {formatMonthYear(viewDate)}
                </div>
                <button type="button" className="plus-date-picker-calendar-nav" onClick={() => handleNav(1)} aria-label="Next month">
                    <i className="fas fa-chevron-right"></i>
                </button>
            </div>

            <div className="plus-date-picker-calendar-weekdays">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                    <div key={d} className="plus-date-picker-calendar-weekday body3-txt">{d}</div>
                ))}
            </div>

            <div className="plus-date-picker-calendar-days">
                {days}
            </div>
        </div>
    );
};

// Date Cell States Component
const DateCellStates = () => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', maxWidth: '400px' }}>
            {/* Default State */}
            <div className="plus-date-picker-calendar-day body2-txt" style={{ minWidth: '32px', minHeight: '32px' }}>
                1
            </div>
            
            {/* Hover/Inactive Selected State */}
            <div className="plus-date-picker-calendar-day body2-txt" style={{ 
                minWidth: '32px', 
                minHeight: '32px',
                backgroundColor: 'var(--color-primary-state-08)',
                color: 'var(--color-primary)'
            }}>
                1
            </div>
            
            {/* Selected State */}
            <div className="plus-date-picker-calendar-day plus-date-picker-calendar-day-selected body2-txt" style={{ minWidth: '32px', minHeight: '32px' }}>
                1
            </div>
            
            {/* Disabled State */}
            <div className="plus-date-picker-calendar-day plus-date-picker-calendar-day-disabled body2-txt" style={{ minWidth: '32px', minHeight: '32px' }}>
                1
            </div>
        </div>
    );
};

export const Calendar = () => {
    return (
        <div className="p-4">
            <CalendarView />
        </div>
    );
};

export const DateCell = () => {
    return (
        <div className="p-4">
            <DateCellStates />
        </div>
    );
};

