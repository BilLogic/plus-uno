import React, { useState } from 'react';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import Alert from '@/components/Alert';
import { RecommendedLessons } from '@/specs/Home/Cards';
import './MonthlyReportPage.scss';

// Training card images
import imgGivingEffectivePraise from '../../home-redesign/src/assets/giving-effective-praise.png';
import imgReactingToErrors from '../../home-redesign/src/assets/reacting-to-errors.png';
import imgPromptingStudentsToExplain from '../../home-redesign/src/assets/prompting-students-to-explain.png';
import imgSupportingGrowthMindset from '../../home-redesign/src/assets/supporting-growth-mindset.png';

// Mock Data matching Stitch design with FULL content
const REPORT_DATA = {
    userName: 'Albus',
    dateRange: 'January 2026',
    monthLabel: 'Jan 2026',
    impact: {
        learningTime: { value: 147, unit: 'min', delta: '+22% vs last month', deltaType: 'rose' },
        skillsMastered: { value: 18, unit: 'skills', delta: '+4 vs last month', deltaType: 'success' }
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
    timeInsight: 'You spent 10% more time on Goal Setting this month compared to last week. Great job focusing on student objectives early in the sessions!',
    dimensions: [
        {
            id: 1,
            title: 'Interpersonal Comfort',
            subStatus: 'Greeting & rapport-building',
            icon: 'fa-user',
            iconBg: 'emerald',
            status: 'Demonstrated',
            summary: 'You consistently greeted students by name, asked about their week, and established a warm tone. Observed in 11 of 12 sessions.',
            evidence: 'Hey Marcus! Good to see you again. Before we get started, how\'d that math test go? … That\'s awesome, I\'m glad you felt good about it.',
            session: 'PS 234 • Tue Jan 28, 2:32 PM • 0:00–0:45',
            lessonUrl: '#'
        },
        {
            id: 2,
            title: 'Response to Help Requests',
            subStatus: 'Redirecting rather than giving answers',
            icon: 'fa-hand',
            iconBg: 'amber',
            status: 'Developing',
            summary: 'In 4 of 8 observed help requests, you provided the answer directly. Try responding with a leading question first, like "What do you think the first step might be?"',
            evidence: 'Student: I don\'t know how to do this one. — Tutor: OK so the answer here is 42, because you need to multiply 6 times 7.',
            session: 'PS 234 • Wed Jan 29, 3:15 PM • 12:30–13:10',
            lessonUrl: '#',
            needsWork: true
        },
        {
            id: 3,
            title: 'Prompting for Self-Explanation',
            subStatus: 'Asking students to explain their thinking',
            icon: 'fa-lightbulb',
            iconBg: 'stone',
            status: 'Developing',
            summary: 'Self-explanation prompts observed in only 3 of 12 sessions. Try asking "Can you walk me through how you figured that out?"',
            evidence: 'Student answers correctly. Tutor: "Good job!" and moves to next problem, without asking how they arrived at the answer.',
            session: 'PS 234 • Thu Jan 30, 2:50 PM • 8:20–8:45',
            lessonUrl: '#',
            needsWork: true
        },
        {
            id: 4,
            title: 'Reacting to Errors',
            subStatus: 'Normalizing mistakes & guiding correction',
            icon: 'fa-exclamation-triangle',
            iconBg: 'rose',
            status: 'Not Observed',
            summary: 'The AI did not find clear instances of student errors during the analyzed portions of this month\'s recordings. This dimension will be evaluated again when opportunities arise.',
            evidence: null,
            session: null,
            lessonUrl: '#'
        },
        {
            id: 5,
            title: 'Checking for Understanding',
            subStatus: 'Frequent comprehension checks',
            icon: 'fa-check-circle',
            iconBg: 'emerald',
            status: 'Demonstrated',
            summary: 'Great job pausing after key concepts to ask "Does that make sense?" and "How would you explain this in your own words?".',
            evidence: 'So before we move on, can you tell me what the first step was?',
            session: 'PS 234 • Fri Jan 31, 4:10 PM',
            lessonUrl: '#'
        }
    ],
    training: [
        { id: '1', title: 'Mastering Response to Help Requests', category: 'Social-Emotional Learning', duration: '12 mins', badgeType: 'socio-emotional', image: imgGivingEffectivePraise, status: 'Developing' },
        { id: '2', title: 'Reacting to Errors', category: 'Advocacy', duration: '12 mins', badgeType: 'advocacy', image: imgReactingToErrors },
        { id: '3', title: 'Prompting Students to Explain', category: 'Technology Tools', duration: '12 mins', badgeType: 'technology-tools', image: imgPromptingStudentsToExplain },
        { id: '4', title: 'Supporting a Growth Mindset', category: 'Social-Emotional Learning', duration: '12 mins', badgeType: 'socio-emotional', image: imgSupportingGrowthMindset }
    ]
};

export default function MonthlyReportPage() {
    const [reviewedCount, setReviewedCount] = useState(0);
    const [activeKey, setActiveKey] = useState(0); // Which card is expanded
    const totalDimensions = REPORT_DATA.dimensions.length;

    const getState = (index) => {
        if (index < reviewedCount) return 'reviewed';
        if (index === reviewedCount) return 'under_review';
        return 'locked';
    };

    const handleFeedback = () => {
        setReviewedCount(prev => {
            const next = Math.min(prev + 1, totalDimensions);
            setActiveKey(next < totalDimensions ? next : prev); // Auto-expand next
            return next;
        });
    };

    const handleCardClick = (index) => {
        const state = getState(index);
        if (state === 'locked') return; // Can't expand locked
        setActiveKey(activeKey === index ? null : index); // Toggle
    };

    const allReviewed = reviewedCount >= totalDimensions;

    const getIconBgColor = (bg) => {
        const colors = {
            emerald: 'rgba(16, 185, 129, 0.1)',
            amber: 'rgba(245, 158, 11, 0.1)',
            stone: 'var(--color-surface-container)',
            rose: 'rgba(244, 63, 94, 0.1)'
        };
        return colors[bg] || colors.emerald;
    };

    const getIconColor = (bg) => {
        const colors = {
            emerald: 'var(--color-success)',
            amber: 'var(--color-warning)',
            stone: 'var(--color-on-surface-variant)',
            rose: 'var(--color-danger)'
        };
        return colors[bg] || colors.emerald;
    };

    return (
        <div className="monthly-report">

            {/* ============================================
                HEADER (No user pill)
                ============================================ */}
            <header className="report-header">
                <div>
                    <h1 className="header-title">Your Month in Review, {REPORT_DATA.userName}</h1>
                    <div className="header-meta">
                        <span>{REPORT_DATA.dateRange}</span>
                        <span className="header-meta-dot"></span>
                        <span className="month-badge">{REPORT_DATA.monthLabel}</span>
                    </div>
                </div>
            </header>

            {/* ============================================
                YOUR IMPACT SECTION
                ============================================ */}
            <section className="impact-section-wrapper">
                <h2 className="section-title">Your Impact</h2>

                <div className="impact-section">
                    {/* Hero Card */}
                    <div className="impact-hero-wrapper">
                        <div className="impact-hero-card">
                            <div className="impact-hero-card-content">
                                <h3 className="impact-title">
                                    <span className="impact-title-icon" aria-hidden="true">
                                        <i className="fa-solid fa-bolt"></i>
                                    </span>
                                    <span>Impact on Students</span>
                                </h3>

                                <div className="impact-metrics">
                                    <div className="impact-metric">
                                        <div className="metric-value-row">
                                            <span className="metric-value-xl">{REPORT_DATA.impact.learningTime.value}</span>
                                            <span className="metric-unit">{REPORT_DATA.impact.learningTime.unit}</span>
                                        </div>
                                        <div className="delta-badge delta-badge--rose">
                                            <i className="fa-solid fa-arrow-trend-up"></i>
                                            {REPORT_DATA.impact.learningTime.delta}
                                        </div>
                                        <p className="metric-label">Total Student Learning Time</p>
                                    </div>

                                    <div className="impact-divider"></div>

                                    <div className="impact-metric">
                                        <div className="metric-value-row">
                                            <span className="metric-value-xl">{REPORT_DATA.impact.skillsMastered.value}</span>
                                            <span className="metric-unit">{REPORT_DATA.impact.skillsMastered.unit}</span>
                                        </div>
                                        <div className="delta-badge delta-badge--success">
                                            <i className="fa-solid fa-arrow-trend-up"></i>
                                            {REPORT_DATA.impact.skillsMastered.delta}
                                        </div>
                                        <p className="metric-label">Concepts Mastered</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="impact-stats-grid">
                        {REPORT_DATA.stats.map((stat, i) => (
                            <div key={i} className={`stat-card stat-card--${stat.color}`}>
                                <div className={`stat-card-icon stat-card-icon--${stat.color}`}>
                                    <i className={`fa-solid ${stat.icon}`}></i>
                                </div>
                                <div>
                                    <span className="metric-value-lg">{stat.value}</span>
                                    <span className="stat-label">{stat.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Key Insight using Alert component */}
                <Alert style="warning" dismissable={false} className="insight-alert">
                    <i className="fa-solid fa-trophy insight-alert-icon"></i>
                    {REPORT_DATA.keyInsight}
                </Alert>
            </section>

            {/* ============================================
                TIME ALLOCATION SECTION
                ============================================ */}
            <section className="time-allocation-section">
                <h3 className="time-allocation-title">Time Allocation</h3>

                <div className="time-allocation-legend">
                    {REPORT_DATA.timeAllocation.map((seg, i) => (
                        <div key={i} className="legend-item">
                            <div className={`legend-dot legend-dot--${seg.color}`}></div>
                            <span className="legend-label">
                                {seg.label} <span className="legend-value">{seg.value}%</span>
                            </span>
                        </div>
                    ))}
                </div>

                <div className="time-allocation-bar">
                    {REPORT_DATA.timeAllocation.map((seg, i) => (
                        <div
                            key={i}
                            className={`time-allocation-segment time-allocation-segment--${seg.color}`}
                            style={{ width: `${seg.value}%` }}
                            title={`${seg.label}: ${seg.value}%`}
                        ></div>
                    ))}
                </div>

                <div className="time-insight-box">
                    <i className="fa-solid fa-lightbulb time-insight-icon"></i>
                    <p className="time-insight-text">
                        <strong>Insight:</strong> {REPORT_DATA.timeInsight}
                    </p>
                </div>
            </section>

            {/* ============================================
                GROWTH INSIGHTS SECTION
                ============================================ */}
            <section className="growth-insights-section">
                <div className="growth-insights-header">
                    <div className="growth-insights-title-row">
                        <h2 className="section-title">Growth Insights</h2>
                        <Badge style="secondary" size="small">
                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                            Powered by PLUS AI Coach
                        </Badge>
                    </div>
                    <div className="review-progress">
                        Review progress: <span className="review-progress-count">{reviewedCount} of {totalDimensions}</span>
                    </div>
                </div>

                {/* Timeline */}
                <div className="timeline-container">
                    <span className="timeline-connector" aria-hidden="true"></span>
                    {REPORT_DATA.dimensions.map((dim, index) => {
                        const state = getState(index);
                        const isExpanded = activeKey === index;
                        const isLast = index === REPORT_DATA.dimensions.length - 1;

                        return (
                            <div
                                key={dim.id}
                                className={`timeline-item timeline-item--${state}`}
                                style={{ paddingBottom: isLast ? 0 : undefined }}
                            >
                                {/* Timeline node */}
                                <div className={`timeline-node timeline-node--${state === 'under_review' ? 'active' : state}`}>
                                    <i className={`fa-solid ${state === 'locked' ? 'fa-lock' : state === 'reviewed' ? 'fa-check' : 'fa-eye'}`}></i>
                                </div>

                                {/* Card */}
                                <div
                                    className={`growth-card growth-card--${state} ${isExpanded ? 'growth-card--expanded' : ''}`}
                                    onClick={() => handleCardClick(index)}
                                    role={state !== 'locked' ? 'button' : undefined}
                                    tabIndex={state !== 'locked' ? 0 : undefined}
                                >
                                    {/* Header (always visible) */}
                                    <div className="growth-card-header">
                                        <div className="growth-card-icon" style={{
                                            background: getIconBgColor(dim.iconBg),
                                            color: getIconColor(dim.iconBg)
                                        }}>
                                            <i className={`fa-solid ${dim.icon}`}></i>
                                        </div>
                                        <div className="growth-card-title-block">
                                            <h4 className="growth-card-title">{dim.title}</h4>
                                            <p className="growth-card-subtitle">{dim.subStatus}</p>
                                        </div>
                                        <div className="growth-card-status">
                                            <Badge
                                                style={state === 'reviewed' ? 'success' : state === 'under_review' ? 'primary' : 'neutral'}
                                                size="small"
                                            >
                                                {state === 'reviewed' ? 'Reviewed' : state === 'under_review' ? 'Under Review' : 'Locked'}
                                            </Badge>
                                            {state === 'locked' && (
                                                <span className="locked-hint">
                                                    Complete previous step <i className="fa-solid fa-lock"></i>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded content */}
                                    {isExpanded && state !== 'locked' && (
                                        <div className="growth-card-body">
                                            <p className="growth-card-summary">{dim.summary}</p>

                                            {dim.evidence && (
                                                <div className="quote-block">
                                                    <p className="quote-text">"{dim.evidence}"</p>
                                                </div>
                                            )}

                                            {dim.session && (
                                                <div className="session-row">
                                                    <span className="session-info">{dim.session}</span>
                                                    <Button size="small" fill="outline">
                                                        <i className="fa-solid fa-play-circle"></i>
                                                        View Recording
                                                    </Button>
                                                </div>
                                            )}

                                            {state === 'under_review' && (
                                                <div className="feedback-row">
                                                    <p className="feedback-prompt">Was this insight helpful?</p>
                                                    <div className="feedback-buttons">
                                                        <Button size="small" fill="outline" onClick={(e) => { e.stopPropagation(); handleFeedback(); }}>
                                                            <i className="fa-solid fa-thumbs-up"></i> Helpful
                                                        </Button>
                                                        <Button size="small" fill="outline" onClick={(e) => { e.stopPropagation(); handleFeedback(); }}>
                                                            <i className="fa-solid fa-thumbs-down"></i> Not Helpful
                                                        </Button>
                                                        <Button size="small" fill="outline" style="danger" onClick={(e) => { e.stopPropagation(); handleFeedback(); }}>
                                                            <i className="fa-solid fa-exclamation-triangle"></i> Inaccurate
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ============================================
                RECOMMENDED TRAINING SECTION
                ============================================ */}
            <section className={`training-section ${!allReviewed ? 'training-section--locked' : ''}`}>
                <div className="training-header">
                    <div className="training-title-row">
                        {!allReviewed && <i className="fa-solid fa-lock training-lock-icon"></i>}
                        <h2 className="section-title">Recommended Training</h2>
                    </div>
                    {!allReviewed && (
                        <span className="training-hint">Unlock after reviewing all insights</span>
                    )}
                </div>

                <div className="training-grid">
                    {REPORT_DATA.training.map((t) => (
                        <RecommendedLessons
                            key={t.id}
                            breakpoint="XXL & above"
                            badgeType={t.badgeType}
                            title={t.title}
                            duration={t.duration}
                            status="in-progress"
                            aiRecommended={false}
                            image={t.image}
                            actionLabel="Start"
                            onReviewClick={() => { }}
                            className={!allReviewed ? 'training-card--disabled' : ''}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}
