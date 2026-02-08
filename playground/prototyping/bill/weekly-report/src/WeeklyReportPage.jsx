import React, { useState } from 'react';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import './WeeklyReportPage.scss';

// Mock Data matching Stitch design
const REPORT_DATA = {
    userName: 'Albus',
    userFullName: 'Albus Dumbledore',
    userRole: 'Lead',
    dateRange: 'Jan 27 – Jan 31, 2026',
    weekLabel: 'Week 18',
    impact: {
        learningTime: { value: 147, unit: 'min', delta: '+22% vs last week', deltaType: 'rose' },
        skillsMastered: { value: 18, unit: 'skills', delta: '+4 vs last week', deltaType: 'success' }
    },
    stats: [
        { label: 'Sessions', value: 12, icon: 'fa-video', color: 'blue' },
        { label: 'Hours', value: 8.5, icon: 'fa-clock', color: 'purple' },
        { label: 'Students', value: 34, icon: 'fa-users', color: 'amber' },
        { label: 'Schools', value: 3, icon: 'fa-school', color: 'emerald' }
    ],
    keyInsight: 'Your busiest day was Tuesday with 4 sessions at PS 234. Students engaged 15% longer during interactive sessions.',
    timeAllocation: [
        { label: 'Active Tutoring', value: 52, color: 'primary' },
        { label: 'Goal Setting', value: 14, color: 'amber' },
        { label: 'Observing', value: 18, color: 'indigo' },
        { label: 'Troubleshooting', value: 10, color: 'rose' },
        { label: 'Other', value: 6, color: 'gray' }
    ],
    timeInsight: 'You spent 10% more time on Goal Setting this week compared to last week. Great job focusing on student objectives early in the sessions!',
    dimensions: [
        {
            id: 1,
            title: 'Interpersonal Comfort',
            subStatus: 'Greeting & rapport-building',
            icon: 'fa-user',
            iconBg: 'emerald',
            summary: 'In 4 of 8 observed help requests, you provided the answer directly. Try responding with a leading question first, like "What do you think the first step might be?" to encourage independent problem solving.',
            evidence: 'Student: I don\'t know how to do this one. — Tutor: OK so the answer here is 42, because you need to multiply 6 times 7.',
            session: 'PS 234 • Tue Jan 28 • 12:30 – 13:10'
        },
        {
            id: 2,
            title: 'Response to Help Requests',
            subStatus: 'Redirecting rather than giving answers',
            icon: 'fa-hand',
            iconBg: 'amber'
        },
        {
            id: 3,
            title: 'Prompting for Self-Explanation',
            subStatus: 'Asking students to explain their thinking',
            icon: 'fa-lightbulb',
            iconBg: 'stone'
        },
        {
            id: 4,
            title: 'Reacting to Errors',
            subStatus: 'Normalizing mistakes & guiding correction',
            icon: 'fa-exclamation-triangle',
            iconBg: 'rose'
        },
        {
            id: 5,
            title: 'Checking for Understanding',
            subStatus: 'Frequent comprehension checks',
            icon: 'fa-check-circle',
            iconBg: 'emerald'
        }
    ],
    training: [
        {
            id: 1,
            title: 'Mastering Response to Help Requests',
            description: 'Learn techniques to guide students toward the answer without providing it directly, encouraging critical thinking.',
            icon: 'fa-hand',
            iconBg: 'amber',
            status: 'Developing'
        }
    ]
};

export default function WeeklyReportPage() {
    const [reviewedCount, setReviewedCount] = useState(0);
    const totalDimensions = REPORT_DATA.dimensions.length;

    const getState = (index) => {
        if (index < reviewedCount) return 'reviewed';
        if (index === reviewedCount) return 'under_review';
        return 'locked';
    };

    const handleFeedback = (helpful) => {
        setReviewedCount(prev => Math.min(prev + 1, totalDimensions));
    };

    const allReviewed = reviewedCount >= totalDimensions;

    return (
        <div className="weekly-report" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 40px 48px' }}>

            {/* ============================================
                HEADER
                ============================================ */}
            <header className="report-header">
                <div>
                    <h1 className="header-title">Your Week in Review, {REPORT_DATA.userName}</h1>
                    <div className="header-meta">
                        <span>{REPORT_DATA.dateRange}</span>
                        <span className="header-meta-dot"></span>
                        <span className="week-badge">{REPORT_DATA.weekLabel}</span>
                    </div>
                </div>
                <div className="user-pill">
                    <div className="user-avatar">A</div>
                    <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 500, color: 'var(--color-on-surface)' }}>{REPORT_DATA.userFullName}</span>
                        <span className="user-role-badge">{REPORT_DATA.userRole}</span>
                    </div>
                </div>
            </header>

            {/* ============================================
                YOUR IMPACT SECTION
                ============================================ */}
            <section style={{ marginBottom: '48px' }}>
                <div className="section-header">
                    <h2 className="section-title">Your Impact</h2>
                </div>

                {/* Hero Card + Stats Grid */}
                <div className="impact-section">
                    {/* Hero Card (66%) */}
                    <div className="impact-hero-wrapper">
                        <div className="impact-hero-card">
                            <div className="impact-hero-card-content">
                                <h3 style={{
                                    fontSize: '18px',
                                    fontWeight: 700,
                                    color: 'var(--color-on-surface-variant)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    marginBottom: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <i className="fa-solid fa-bolt" style={{ color: '#f43f5e' }}></i>
                                    Impact on Students
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '48px', height: '100%' }}>
                                    {/* Learning Time */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                            <span className="metric-value-xl">{REPORT_DATA.impact.learningTime.value}</span>
                                            <span className="metric-unit">{REPORT_DATA.impact.learningTime.unit}</span>
                                        </div>
                                        <div className="delta-badge delta-badge--rose" style={{ marginTop: '8px' }}>
                                            <i className="fa-solid fa-arrow-trend-up" style={{ marginRight: '4px', fontSize: '12px' }}></i>
                                            {REPORT_DATA.impact.learningTime.delta}
                                        </div>
                                        <p className="metric-label">Total Student Learning Time</p>
                                    </div>

                                    {/* Divider */}
                                    <div style={{ width: '1px', height: '96px', background: 'var(--color-outline-variant)', alignSelf: 'center' }}></div>

                                    {/* Skills Mastered */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                            <span className="metric-value-xl">{REPORT_DATA.impact.skillsMastered.value}</span>
                                            <span className="metric-unit">{REPORT_DATA.impact.skillsMastered.unit}</span>
                                        </div>
                                        <div className="delta-badge delta-badge--success" style={{ marginTop: '8px' }}>
                                            <i className="fa-solid fa-arrow-trend-up" style={{ marginRight: '4px', fontSize: '12px' }}></i>
                                            {REPORT_DATA.impact.skillsMastered.delta}
                                        </div>
                                        <p className="metric-label">Concepts Mastered</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid (33%) */}
                    <div className="impact-stats-grid">
                        {REPORT_DATA.stats.map((stat, i) => (
                            <div key={i} className={`stat-card stat-card--${stat.color}`}>
                                <div className={`stat-card-icon stat-card-icon--${stat.color}`}>
                                    <i className={`fa-solid ${stat.icon}`}></i>
                                </div>
                                <div>
                                    <span className="metric-value-lg">{stat.value}</span>
                                    <span style={{
                                        display: 'block',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: 'var(--color-on-surface-variant)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        marginTop: '4px'
                                    }}>{stat.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Key Insight Callout */}
                <div className="insight-callout" style={{ marginBottom: '48px' }}>
                    <div className="insight-callout-icon">
                        <i className="fa-solid fa-trophy" style={{ fontSize: '20px' }}></i>
                    </div>
                    <p className="insight-callout-text">{REPORT_DATA.keyInsight}</p>
                </div>
            </section>

            {/* ============================================
                TIME ALLOCATION SECTION
                ============================================ */}
            <section style={{
                background: 'var(--color-surface-container-lowest)',
                borderRadius: 'var(--size-card-radius-sm)',
                border: '1px solid var(--color-outline-variant)',
                padding: '32px',
                marginBottom: '48px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '24px' }}>
                    Time Allocation
                </h3>

                {/* Legend */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                    {REPORT_DATA.timeAllocation.map((seg, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                            <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: seg.color === 'primary' ? 'var(--color-primary)'
                                    : seg.color === 'amber' ? '#fbbf24'
                                        : seg.color === 'indigo' ? '#a5b4fc'
                                            : seg.color === 'rose' ? '#fb7185'
                                                : '#e5e7eb'
                            }}></div>
                            <span style={{ fontWeight: 500, color: 'var(--color-on-surface)' }}>
                                {seg.label} <span style={{ fontWeight: 400, color: 'var(--color-on-surface-variant)' }}>{seg.value}%</span>
                            </span>
                        </div>
                    ))}
                </div>

                {/* Bar */}
                <div className="time-allocation-bar" style={{ marginBottom: '32px' }}>
                    {REPORT_DATA.timeAllocation.map((seg, i) => (
                        <div
                            key={i}
                            className={`time-allocation-segment time-allocation-segment--${seg.color}`}
                            style={{ width: `${seg.value}%` }}
                            title={`${seg.label}: ${seg.value}%`}
                        ></div>
                    ))}
                </div>

                {/* Insight Box */}
                <div className="time-insight-box">
                    <i className="fa-solid fa-lightbulb" style={{ color: 'var(--color-primary)', fontSize: '18px', marginTop: '2px' }}></i>
                    <p style={{ fontSize: '14px', color: '#1e3a5f', lineHeight: 1.6 }}>
                        <strong style={{ color: 'var(--color-primary)' }}>Insight:</strong> {REPORT_DATA.timeInsight}
                    </p>
                </div>
            </section>

            {/* ============================================
                GROWTH INSIGHTS SECTION
                ============================================ */}
            <section style={{ marginBottom: '48px' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    marginBottom: '16px',
                    borderBottom: '1px solid var(--color-outline-variant)',
                    paddingBottom: '8px'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <h2 className="section-title">Growth Insights</h2>
                            <Badge style="secondary" size="small">
                                <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: '4px', fontSize: '10px' }}></i>
                                Powered by PLUS AI Coach
                            </Badge>
                        </div>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--color-on-surface-variant)', fontWeight: 500 }}>
                        Review progress: <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{reviewedCount} of {totalDimensions}</span>
                    </div>
                </div>

                {/* Timeline */}
                <div className="timeline-container">
                    {REPORT_DATA.dimensions.map((dim, index) => {
                        const state = getState(index);
                        const isLast = index === REPORT_DATA.dimensions.length - 1;

                        return (
                            <div
                                key={dim.id}
                                className={`timeline-item timeline-item--${state}`}
                                style={{ paddingBottom: isLast ? 0 : '48px' }}
                            >
                                {/* Timeline node */}
                                <div className={`timeline-node timeline-node--${state === 'under_review' ? 'active' : state}`}>
                                    <i className={`fa-solid ${state === 'locked' ? 'fa-lock' : state === 'reviewed' ? 'fa-check' : 'fa-eye'}`}
                                        style={{ color: state === 'under_review' ? 'var(--color-primary)' : state === 'reviewed' ? 'white' : '#9ca3af' }}></i>
                                </div>

                                {/* Card */}
                                {state === 'under_review' ? (
                                    <div className="growth-card growth-card--active">
                                        <div style={{ padding: '24px 32px' }}>
                                            {/* Header */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <div style={{
                                                        width: '48px',
                                                        height: '48px',
                                                        borderRadius: '12px',
                                                        background: 'rgba(16, 185, 129, 0.1)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#10b981'
                                                    }}>
                                                        <i className={`fa-solid ${dim.icon}`} style={{ fontSize: '18px' }}></i>
                                                    </div>
                                                    <div>
                                                        <h4 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-on-surface)' }}>{dim.title}</h4>
                                                        <p style={{ fontSize: '14px', color: 'var(--color-on-surface-variant)', marginTop: '2px' }}>{dim.subStatus}</p>
                                                    </div>
                                                </div>
                                                <Badge style="primary" size="small">Under Review</Badge>
                                            </div>

                                            {/* Summary */}
                                            <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--color-on-surface)', marginBottom: '24px' }}>
                                                {dim.summary}
                                            </p>

                                            {/* Quote */}
                                            {dim.evidence && (
                                                <div className="quote-block">
                                                    <p className="quote-text">"{dim.evidence}"</p>
                                                </div>
                                            )}

                                            {/* Session info */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                fontSize: '12px',
                                                color: 'var(--color-on-surface-variant)',
                                                borderBottom: '1px solid var(--color-outline-variant)',
                                                paddingBottom: '16px',
                                                marginBottom: '16px'
                                            }}>
                                                <span>{dim.session}</span>
                                                <Button size="small" variant="ghost">
                                                    <i className="fa-solid fa-play-circle" style={{ marginRight: '6px' }}></i>
                                                    View Recording
                                                </Button>
                                            </div>

                                            {/* Feedback */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                                                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-on-surface)' }}>
                                                    Was this insight helpful?
                                                </p>
                                                <div style={{ display: 'flex', gap: '12px' }}>
                                                    <button className="feedback-btn" onClick={() => handleFeedback(true)}>
                                                        <i className="fa-solid fa-thumbs-up"></i> Helpful
                                                    </button>
                                                    <button className="feedback-btn" onClick={() => handleFeedback(false)}>
                                                        <i className="fa-solid fa-thumbs-down"></i> Not Helpful
                                                    </button>
                                                    <button className="feedback-btn feedback-btn--negative" onClick={() => handleFeedback(false)}>
                                                        <i className="fa-solid fa-exclamation-triangle"></i> Inaccurate
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`growth-card ${state === 'locked' ? 'growth-card--locked' : ''}`}>
                                        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', filter: state === 'locked' ? 'grayscale(1)' : 'none' }}>
                                                <div style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '12px',
                                                    background: dim.iconBg === 'amber' ? 'rgba(245, 158, 11, 0.1)'
                                                        : dim.iconBg === 'stone' ? '#e7e5e4'
                                                            : dim.iconBg === 'rose' ? 'rgba(244, 63, 94, 0.1)'
                                                                : 'rgba(16, 185, 129, 0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: dim.iconBg === 'amber' ? '#f59e0b'
                                                        : dim.iconBg === 'stone' ? '#78716c'
                                                            : dim.iconBg === 'rose' ? '#f43f5e'
                                                                : '#10b981'
                                                }}>
                                                    <i className={`fa-solid ${dim.icon}`} style={{ fontSize: '18px' }}></i>
                                                </div>
                                                <div>
                                                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: state === 'locked' ? '#9ca3af' : 'var(--color-on-surface)' }}>{dim.title}</h4>
                                                    <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '2px' }}>{dim.subStatus}</p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                                <Badge style={state === 'reviewed' ? 'success' : 'neutral'} size="small">
                                                    {state === 'reviewed' ? 'Reviewed' : 'Locked'}
                                                </Badge>
                                                {state === 'locked' && (
                                                    <span style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        Complete previous step <i className="fa-solid fa-lock" style={{ fontSize: '10px' }}></i>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ============================================
                RECOMMENDED TRAINING SECTION (Locked until all reviewed)
                ============================================ */}
            <section className={!allReviewed ? 'training-section--locked' : ''}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!allReviewed && <i className="fa-solid fa-lock" style={{ color: '#9ca3af' }}></i>}
                        <h2 className="section-title">Recommended Training</h2>
                    </div>
                    {!allReviewed && (
                        <span style={{ fontSize: '14px', color: '#9ca3af', fontStyle: 'italic' }}>
                            Unlock after reviewing all insights
                        </span>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    {REPORT_DATA.training.map((t) => (
                        <div key={t.id} className="training-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div style={{
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    color: '#f59e0b'
                                }}>
                                    <i className={`fa-solid ${t.icon}`}></i>
                                </div>
                                <Badge style="warning" size="small">{t.status}</Badge>
                            </div>
                            <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '8px' }}>{t.title}</h4>
                            <p style={{ fontSize: '14px', color: 'var(--color-on-surface-variant)', lineHeight: 1.6, marginBottom: '24px', flex: 1 }}>{t.description}</p>
                            <Button variant="primary" style={{ width: '100%' }} disabled={!allReviewed}>Start Module</Button>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
