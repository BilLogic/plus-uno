/**
 * Weekly Report Detail Content (Shell-Embeddable)
 * 
 * Content-only version extracted from weekly-report/src/WeeklyReportContent.jsx
 * This is the CORRECT implementation matching the target design.
 */

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button/Button';
import Badge from '@/components/Badge/Badge';
import Alert from '@/components/Alert/Alert';
import Progress from '@/components/Progress/Progress';
import { RecommendedLessons } from '@/specs/Home/Cards';
import { ShellContext } from '../context/ShellContext';
import '../../../weekly-report/src/WeeklyReportPage.scss';

// Training card images
import imgGivingEffectivePraise from '../assets/giving-effective-praise.png';
import imgReactingToErrors from '../assets/reacting-to-errors.png';
import imgPromptingStudentsToExplain from '../assets/prompting-students-to-explain.png';
import imgSupportingGrowthMindset from '../assets/supporting-growth-mindset.png';

// Mock Data - matches WeeklyReportContent.jsx exactly
const REPORT_DATA = {
    userName: 'Boyuan',
    dateRange: 'Jan 27 – Jan 31, 2026',
    weekLabel: 'Week 18',
    impact: {
        learningTime: { value: 147, unit: 'min', delta: '+22% vs last week', deltaType: 'success' },
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
        { label: 'Active Tutoring', value: 52, color: 'primary', icon: 'fa-chalkboard-user' },
        { label: 'Goal Setting', value: 14, color: 'indigo', icon: 'fa-bullseye' },
        { label: 'Observing', value: 18, color: 'teal', icon: 'fa-eye' },
        { label: 'Troubleshooting', value: 10, color: 'amber', icon: 'fa-wrench' },
        { label: 'Other', value: 6, color: 'slate', icon: 'fa-ellipsis' }
    ],
    timeInsight: 'You spent 10% more time on Goal Setting this week compared to last week. Great job focusing on student objectives early in the sessions!',
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
            iconBg: 'amber',
            status: 'Not Observed',
            summary: 'The AI did not find clear instances of student errors during the analyzed portions of this week\'s recordings. This dimension will be evaluated again when opportunities arise.',
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

// Filter training
const TRAININGS_TO_SHOW = ['1', '2', '3'];
const FILTERED_TRAINING = REPORT_DATA.training.filter(t => TRAININGS_TO_SHOW.includes(t.id));

export default function WeeklyReportDetailContent() {
    const navigate = useNavigate();
    const { setBreadcrumbs, setActiveTabOverride, setMainClassName, setTopBarUser } = useContext(ShellContext);
    const [reviewedCount, setReviewedCount] = useState(0);
    const [activeKey, setActiveKey] = useState(0);
    const [feedbackSelections, setFeedbackSelections] = useState({});
    const totalDimensions = REPORT_DATA.dimensions.length;

    // Set shell context for breadcrumbs, sidebar, and user pill
    useEffect(() => {
        setBreadcrumbs([
            { text: 'Toolkit', href: '/home' },
            { text: 'Reports', href: '/weekly-reports' },
            { text: 'Week 18' }
        ]);
        setActiveTabOverride('weekly-report');
        setMainClassName('weekly-report-page-scroller');
        // Set the user pill
        if (setTopBarUser) {
            setTopBarUser({ name: 'Boyuan Guo', type: 'lead tutor' });
        }
        return () => {
            setActiveTabOverride(null);
            setMainClassName('');
        };
    }, [setBreadcrumbs, setActiveTabOverride, setMainClassName, setTopBarUser]);

    // Hide scrollbar programmatically
    useEffect(() => {
        const styleId = 'weekly-report-scrollbar-hide';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .weekly-report-page-scroller::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    background: transparent !important;
                }
                .weekly-report-page-scroller {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                }
            `;
            document.head.appendChild(style);
        }
        return () => {
            const style = document.getElementById(styleId);
            if (style) style.remove();
        };
    }, []);

    const getState = (index) => {
        if (index < reviewedCount) return 'reviewed';
        if (index === reviewedCount) return 'under_review';
        return 'locked';
    };

    const handleFeedback = (dimId, feedbackType) => {
        setFeedbackSelections(prev => ({ ...prev, [dimId]: feedbackType }));
        setReviewedCount(prev => {
            const next = Math.min(prev + 1, totalDimensions);
            setActiveKey(next < totalDimensions ? next : prev);
            return next;
        });
    };

    const handleCardClick = (index) => {
        const state = getState(index);
        if (state === 'locked') return;
        if (activeKey !== index) {
            setActiveKey(index);
        }
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
        <div className="weekly-report">
            {/* Header */}
            <header className="report-header page-content-reveal" style={{ animationDelay: '0ms' }}>
                <div>
                    <h1 className="header-title">Your Week in Review, {REPORT_DATA.userName}</h1>
                    <div className="header-meta">
                        <span>{REPORT_DATA.dateRange}</span>
                        <span className="header-meta-dot"></span>
                        <div className="week-badge-container">
                            <Badge text={REPORT_DATA.weekLabel} style="primary" size="default" fill="tonal" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Impact Section */}
            <section className="impact-section-wrapper page-content-reveal" style={{ animationDelay: '100ms' }}>
                <h2 className="section-title">Your Impact</h2>

                <div className="impact-section">
                    {/* Hero Card */}
                    <div className="impact-hero-wrapper">
                        <div className="impact-hero-card" style={{ position: 'relative', overflow: 'hidden' }}>
                            {/* Decorative Blobs */}
                            <div className="blob-primary-large"></div>
                            <div className="blob-tertiary-medium"></div>

                            <div className="impact-hero-card-content" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <h3 className="impact-title">
                                    <i className="fa-solid fa-bolt"></i>
                                    Impact on Students
                                </h3>
                                <div className="impact-metrics">
                                    <div className="impact-metric" style={{ flex: 1 }}>
                                        <div className="metric-value-row">
                                            <span className="metric-value-xl">{REPORT_DATA.impact.learningTime.value}</span>
                                            <span className="metric-unit">{REPORT_DATA.impact.learningTime.unit}</span>
                                        </div>
                                        <div className={`delta-badge delta-badge--${REPORT_DATA.impact.learningTime.deltaType}`}>
                                            <i className="fa-solid fa-arrow-trend-up"></i>
                                            {REPORT_DATA.impact.learningTime.delta}
                                        </div>
                                        <p className="metric-label">Total Student Learning Time</p>
                                    </div>

                                    <div className="impact-divider"></div>

                                    <div className="impact-metric" style={{ flex: 1 }}>
                                        <div className="metric-value-row">
                                            <span className="metric-value-xl">{REPORT_DATA.impact.skillsMastered.value}</span>
                                            <span className="metric-unit">{REPORT_DATA.impact.skillsMastered.unit}</span>
                                        </div>
                                        <div className={`delta-badge delta-badge--${REPORT_DATA.impact.skillsMastered.deltaType}`}>
                                            <i className="fa-solid fa-arrow-trend-up"></i>
                                            {REPORT_DATA.impact.skillsMastered.delta}
                                        </div>
                                        <p className="metric-label">Concepts Mastered</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid - 2x2 layout */}
                    <div className="impact-stats-grid">
                        {REPORT_DATA.stats.map((stat, i) => (
                            <div key={i} className={`stat-card stat-card--${stat.color}`} style={{ position: 'relative', overflow: 'hidden' }}>
                                <div className={`stat-blob stat-blob--${stat.color}`}></div>
                                <div className={`stat-card-icon stat-card-icon--${stat.color}`} style={{ position: 'relative', zIndex: 1 }}>
                                    <i className={`fa-solid ${stat.icon}`}></i>
                                </div>
                                <div className="stat-card-text" style={{ position: 'relative', zIndex: 1 }}>
                                    <span className="metric-value-lg">{stat.value}</span>
                                    <span className="stat-label">{stat.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <Alert style="tertiary" dismissable={false} className="insight-alert">
                    <i className="fa-solid fa-trophy insight-alert-icon" style={{ marginRight: '12px' }}></i>
                    {REPORT_DATA.keyInsight}
                </Alert>
            </section>

            {/* Time Allocation */}
            <section className="time-allocation-section page-content-reveal" style={{ animationDelay: '200ms' }}>
                <h3 className="time-allocation-title">Time Allocation</h3>
                <div className="time-allocation-legend">
                    {REPORT_DATA.timeAllocation.map((seg, i) => (
                        <div key={i} className="legend-item">
                            <div className={`legend-dot legend-dot--${seg.color}`}></div>
                            <span className="legend-label">
                                {seg.label}: <span className="legend-value">{seg.value}%</span>
                            </span>
                        </div>
                    ))}
                </div>
                <div className="time-allocation-bar" style={{ height: '40px' }}>
                    {REPORT_DATA.timeAllocation.map((seg, i) => (
                        <div
                            key={i}
                            className={`time-allocation-segment time-allocation-segment--${seg.color}`}
                            style={{ width: `${seg.value}%` }}
                            title={`${seg.label}: ${seg.value}%`}
                        ></div>
                    ))}
                </div>
                <Alert style="tertiary" dismissable={false} className="insight-alert">
                    <i className="fa-solid fa-lightbulb insight-alert-icon" style={{ marginRight: '12px' }}></i>
                    You spent 10% more time on Goal Setting this week compared to last week. Great job focusing on student objectives early in the sessions!
                </Alert>
            </section>

            {/* Growth Insights */}
            <section className="growth-insights-section page-content-reveal" style={{ animationDelay: '300ms' }}>
                <div className="growth-insights-header">
                    <div className="growth-insights-title-column">
                        <h2 className="section-title">Growth Insights</h2>
                        <span className="powered-by">
                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                            Powered by PLUS AI Coach
                        </span>
                    </div>
                    <div className="review-progress-container">
                        <span className="review-label">Review progress</span>
                        <div className="review-bar-row">
                            <Progress
                                value={(reviewedCount / totalDimensions) * 100}
                                className="review-progress-bar"
                                style="primary"
                            />
                            <span className="review-count">{reviewedCount}/{totalDimensions}</span>
                        </div>
                    </div>
                </div>

                <div className="timeline-container">
                    {REPORT_DATA.dimensions.map((dim, index) => {
                        const state = getState(index);
                        const isExpanded = activeKey === index;
                        const isLast = index === REPORT_DATA.dimensions.length - 1;
                        const displayStatus = state === 'reviewed' ? 'Reviewed' : state === 'under_review' ? 'Under Review' : 'Locked';
                        const badgeStyle = state === 'reviewed' ? 'success' : state === 'under_review' ? 'primary' : 'neutral';

                        return (
                            <div
                                key={dim.id}
                                className={`timeline-item timeline-item--${state}`}
                                style={{ paddingBottom: isLast ? 0 : undefined }}
                            >
                                <div className={`timeline-node timeline-node--${state === 'under_review' ? 'active' : state}`}>
                                    <i className={`fa-solid ${state === 'locked' ? 'fa-lock' : state === 'reviewed' ? 'fa-check' : 'fa-eye'}`}></i>
                                </div>

                                <div
                                    className={`growth-card growth-card--${state} ${isExpanded ? 'growth-card--expanded' : ''}`}
                                    onClick={() => handleCardClick(index)}
                                    role={state !== 'locked' ? 'button' : undefined}
                                    tabIndex={state !== 'locked' ? 0 : undefined}
                                >
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
                                            <Badge style={badgeStyle} size="small">
                                                {displayStatus}
                                            </Badge>
                                            {state === 'locked' && (
                                                <span className="locked-hint">
                                                    <i className="fa-solid fa-lock"></i>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {isExpanded && state !== 'locked' && (
                                        <div className="growth-card-body">
                                            <p className="growth-card-summary">{dim.summary}</p>
                                            {dim.evidence && (
                                                <div className={`quote-block quote-block--${dim.iconBg === 'emerald' ? 'success' : dim.iconBg === 'amber' || dim.iconBg === 'rose' ? 'warning' : 'primary'}`}>
                                                    <p className="quote-text">"{dim.evidence}"</p>
                                                </div>
                                            )}
                                            {dim.session && (
                                                <div className="session-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span className="session-info body3-txt text-muted">{dim.session}</span>
                                                    <Button size="small" style="primary" fill="tonal">
                                                        <i className="fa-solid fa-play-circle" style={{ marginRight: '6px' }}></i>
                                                        View Recording
                                                    </Button>
                                                </div>
                                            )}
                                            {(state === 'under_review' || state === 'reviewed') && (
                                                <div className="feedback-row">
                                                    <p className="feedback-prompt">{state === 'reviewed' ? 'Your feedback:' : 'Was this insight helpful?'}</p>
                                                    <div className="feedback-buttons">
                                                        <Button
                                                            size="small"
                                                            style={feedbackSelections[dim.id] === 'helpful' ? 'success' : 'secondary'}
                                                            fill={feedbackSelections[dim.id] === 'helpful' ? 'tonal' : 'outline'}
                                                            onClick={(e) => { e.stopPropagation(); handleFeedback(dim.id, 'helpful'); }}
                                                        >
                                                            <i className="fa-solid fa-thumbs-up"></i> Helpful
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            style={feedbackSelections[dim.id] === 'not_helpful' ? 'secondary' : 'secondary'}
                                                            fill={feedbackSelections[dim.id] === 'not_helpful' ? 'tonal' : 'outline'}
                                                            onClick={(e) => { e.stopPropagation(); handleFeedback(dim.id, 'not_helpful'); }}
                                                        >
                                                            <i className="fa-solid fa-thumbs-down"></i> Not Helpful
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            style={feedbackSelections[dim.id] === 'inaccurate' ? 'warning' : 'warning'}
                                                            fill={feedbackSelections[dim.id] === 'inaccurate' ? 'tonal' : 'outline'}
                                                            onClick={(e) => { e.stopPropagation(); handleFeedback(dim.id, 'inaccurate'); }}
                                                        >
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

            {/* Training */}
            <section className={`training-section ${!allReviewed ? 'training-section--locked' : ''} page-content-reveal`} style={{ animationDelay: '400ms' }}>
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
                    {FILTERED_TRAINING.map((t) => (
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
