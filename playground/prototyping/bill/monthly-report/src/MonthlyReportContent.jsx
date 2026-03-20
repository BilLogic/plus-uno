import React, { useState, useEffect, useContext, useRef } from 'react';
import Button from '@/components/Button/Button';
import Badge from '@/components/Badge/Badge';
import Alert from '@/components/Alert/Alert';
import Progress from '@/components/Progress/Progress';
import Accordion from '@/components/Accordion/Accordion';
import Input from '@/forms/Input';
import { RecommendedLessons } from '@/specs/Home/Cards';
import { ShellContext } from '../../home-redesign/src/context/ShellContext';
import './MonthlyReportPage.scss';

// Training card images
import imgGivingEffectivePraise from '../../home-redesign/src/assets/giving-effective-praise.png';
import imgReactingToErrors from '../../home-redesign/src/assets/reacting-to-errors.png';
import imgPromptingStudentsToExplain from '../../home-redesign/src/assets/prompting-students-to-explain.png';
import imgSupportingGrowthMindset from '../../home-redesign/src/assets/supporting-growth-mindset.png';

// Mock Data
// Mock Data Variants
const REPORT_VARIANTS = {
    'Jan 2026': {
        monthLabel: 'Jan 2026',
        userName: 'Boyuan',
        dateRange: 'January 2026',
        impact: {
            learningTime: { value: 147, unit: 'min', delta: '+22% vs last month', deltaType: 'success' },
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
            { label: 'Active Tutoring', value: 52, color: 'primary', icon: 'fa-chalkboard-user' },
            { label: 'Goal Setting', value: 14, color: 'indigo', icon: 'fa-bullseye' },
            { label: 'Observing', value: 18, color: 'teal', icon: 'fa-eye' },
            { label: 'Troubleshooting', value: 10, color: 'amber', icon: 'fa-wrench' },
            { label: 'Other', value: 6, color: 'slate', icon: 'fa-ellipsis' }
        ],
        peerAverage: [
            { label: 'Active Tutoring', value: 45, color: 'primary' },
            { label: 'Goal Setting', value: 10, color: 'indigo' },
            { label: 'Observing', value: 25, color: 'teal' },
            { label: 'Troubleshooting', value: 15, color: 'amber' },
            { label: 'Other', value: 5, color: 'slate' }
        ],
        timeInsight: 'You spent 10% more time on Goal Setting this month compared to last month. Great job focusing on student objectives early in the sessions!',
        dimensions: [
            { id: 1, title: 'Interpersonal Comfort', trainingId: '4', subStatus: 'Greeting & rapport-building', icon: 'fa-user', iconBg: 'emerald', status: 'Demonstrated', summary: 'You consistently greeted students by name, asked about their week, and established a warm tone. Observed in 11 of 12 sessions.', evidence: 'Hey Marcus! Good to see you again. Before we get started, how\'d that math test go? … That\'s awesome, I\'m glad you felt good about it.', session: 'PS 234 • Tue Jan 28, 2:32 PM • 0:00–0:45', lessonUrl: '#' },
            { id: 2, title: 'Response to Help Requests', trainingId: '1', subStatus: 'Redirecting rather than giving answers', icon: 'fa-hand', iconBg: 'amber', status: 'Developing', summary: 'In 4 of 8 observed help requests, you provided the answer directly. Try responding with a leading question first, like "What do you think the first step might be?"', evidence: 'Student: I don\'t know how to do this one. — Tutor: OK so the answer here is 42, because you need to multiply 6 times 7.', session: 'PS 234 • Wed Jan 29, 3:15 PM • 12:30–13:10', lessonUrl: '#', needsWork: true },
            { id: 3, title: 'Prompting for Self-Explanation', trainingId: '3', subStatus: 'Asking students to explain their thinking', icon: 'fa-lightbulb', iconBg: 'stone', status: 'Developing', summary: 'Self-explanation prompts observed in only 3 of 12 sessions. Try asking "Can you walk me through how you figured that out?"', evidence: 'Student answers correctly. Tutor: "Good job!" and moves to next problem, without asking how they arrived at the answer.', session: 'PS 234 • Thu Jan 30, 2:50 PM • 8:20–8:45', lessonUrl: '#', needsWork: true },
            { id: 4, title: 'Reacting to Errors', trainingId: '2', subStatus: 'Normalizing mistakes & guiding correction', icon: 'fa-exclamation-triangle', iconBg: 'amber', status: 'Not Observed', summary: 'The AI did not find clear instances of student errors during the analyzed portions of this month\'s recordings. This dimension will be evaluated again when opportunities arise.', evidence: null, session: null, lessonUrl: '#' },
            { id: 5, title: 'Checking for Understanding', trainingId: '1', subStatus: 'Frequent comprehension checks', icon: 'fa-check-circle', iconBg: 'emerald', status: 'Demonstrated', summary: 'Great job pausing after key concepts to ask "Does that make sense?" and "How would you explain this in your own words?".', evidence: 'So before we move on, can you tell me what the first step was?', session: 'PS 234 • Fri Jan 31, 4:10 PM', lessonUrl: '#' }
        ],
        goalProgress: [
            { id: 1, abbr: 'LH', abbrColor: '#3b82f6', school: 'Lincoln High', teacher: 'Mrs. Smith', students: [{ initials: 'JI', color: '#ef4444' }, { initials: 'AL', color: '#f59e0b' }, { initials: 'RI', color: '#10b981' }, { initials: 'SI', color: '#eab308' }], extraStudents: 2, progressGoal: 85, progressDelta: '+5%', progressDeltaType: 'success', effortGoal: 92, effortDelta: '+2%', effortDeltaType: 'success' },
            { id: 2, abbr: 'WA', abbrColor: '#10b981', school: 'Washington Academy', teacher: 'Mr. Johnson', students: [{ initials: 'MI', color: '#f59e0b' }, { initials: 'EV', color: '#10b981' }, { initials: 'LI', color: '#8b5cf6' }], extraStudents: 3, progressGoal: 72, progressDelta: '-3%', progressDeltaType: 'danger', effortGoal: 78, effortDelta: '+1%', effortDeltaType: 'success' },
            { id: 3, abbr: 'RV', abbrColor: '#f59e0b', school: 'River Valley HS', teacher: 'Ms. Davis', students: [{ initials: 'JI', color: '#3b82f6' }, { initials: 'KI', color: '#f59e0b' }, { initials: 'TV', color: '#10b981' }, { initials: 'NI', color: '#8b5cf6' }], extraStudents: 4, progressGoal: 94, progressDelta: '0%', progressDeltaType: 'neutral', effortGoal: 88, effortDelta: '-2%', effortDeltaType: 'danger' }
        ]
    },
    'Dec 2025': {
        monthLabel: 'Dec 2025',
        userName: 'Boyuan',
        dateRange: 'December 2025',
        impact: {
            learningTime: { value: 45, unit: 'min', delta: '-12% vs last month', deltaType: 'neutral' },
            skillsMastered: { value: 3, unit: 'skills', delta: '-2 vs last month', deltaType: 'neutral' }
        },
        stats: [
            { label: 'Sessions', value: 2, icon: 'fa-video', color: 'blue' },
            { label: 'Hours', value: 1.5, icon: 'fa-clock', color: 'purple' },
            { label: 'Students', value: 4, icon: 'fa-users', color: 'amber' },
            { label: 'Schools', value: 1, icon: 'fa-school', color: 'emerald' }
        ],
        keyInsight: null, // No key insight for low data
        timeAllocation: [
            { label: 'Active Tutoring', value: 20, color: 'primary', icon: 'fa-chalkboard-user' },
            { label: 'Goal Setting', value: 10, color: 'indigo', icon: 'fa-bullseye' },
            { label: 'Observing', value: 60, color: 'teal', icon: 'fa-eye' },
            { label: 'Troubleshooting', value: 5, color: 'amber', icon: 'fa-wrench' },
            { label: 'Other', value: 5, color: 'slate', icon: 'fa-ellipsis' }
        ],
        peerAverage: [],
        timeInsight: null,
        dimensions: [], // Empty for low data
        isLowData: true,
        goalProgress: []
    },
    'Nov 2025': {
        monthLabel: 'Nov 2025',
        userName: 'Boyuan',
        dateRange: 'November 2025',
        impact: {
            learningTime: { value: 120, unit: 'min', delta: '+10% vs last month', deltaType: 'success' },
            skillsMastered: { value: 12, unit: 'skills', delta: '+2 vs last month', deltaType: 'success' }
        },
        stats: [
            { label: 'Sessions', value: 10, icon: 'fa-video', color: 'blue' },
            { label: 'Hours', value: 7.5, icon: 'fa-clock', color: 'purple' },
            { label: 'Students', value: 28, icon: 'fa-users', color: 'amber' },
            { label: 'Schools', value: 2, icon: 'fa-school', color: 'emerald' }
        ],
        keyInsight: 'Great effort this month! While there are several areas for growth, remember that mastering new techniques takes time.',
        timeAllocation: [
            { label: 'Active Tutoring', value: 40, color: 'primary', icon: 'fa-chalkboard-user' },
            { label: 'Goal Setting', value: 20, color: 'indigo', icon: 'fa-bullseye' },
            { label: 'Observing', value: 30, color: 'teal', icon: 'fa-eye' }, // High observing
            { label: 'Troubleshooting', value: 5, color: 'amber', icon: 'fa-wrench' },
            { label: 'Other', value: 5, color: 'slate', icon: 'fa-ellipsis' }
        ],
        peerAverage: [],
        timeInsight: 'You spent significantly more time observing than peers. Let\'s work on engaging students faster.',
        dimensions: [
            { id: 1, title: 'Wait Time', trainingId: '1', subStatus: 'Giving students thinking time', icon: 'fa-hourglass-start', iconBg: 'rose', status: 'Area for Growth', summary: 'You often intervene too quickly after asking a question. Try counting to 5 in your head before offering a hint.', evidence: 'Tutor: "What is 5x5?" (1 second pause) "It\'s 25, right?"', session: 'PS 101 • Mon Nov 10, 3:00 PM', lessonUrl: '#', startHere: true },
            { id: 2, title: 'Check for Understanding', trainingId: '1', subStatus: 'Verifying comprehension', icon: 'fa-check-circle', iconBg: 'amber', status: 'Developing', summary: 'You explained the concept clearly but moved on without confirming the student understood.', evidence: null, session: 'PS 101 • Tue Nov 11, 4:00 PM', lessonUrl: '#' },
            { id: 3, title: 'Scaffolding', trainingId: '6', subStatus: 'Breaking down problems', icon: 'fa-layer-group', iconBg: 'amber', status: 'Developing', summary: 'When the student was stuck, you gave the answer instead of breaking it down into smaller steps.', evidence: null, session: 'PS 102 • Wed Nov 12, 2:30 PM', lessonUrl: '#' }
        ],
        isHighImprovement: true,
        goalProgress: []
    }
};

const TRAININGS_TO_SHOW = ['1', '2', '3'];
const STAT_KEYS = ['sessions', 'hours', 'students', 'schools'];

/**
 * MonthlyReportContent: Content-only version for use inside ShellLayout.
 * Uses ShellContext to update TopBar breadcrumbs and mainClassName.
 */
export default function MonthlyReportContent() {
    const { setBreadcrumbs, setMainClassName } = useContext(ShellContext);
    // Read month from URL parameter (e.g., /monthly-report?month=December%202025)
    const urlParams = new URLSearchParams(window.location.search);
    const monthFromUrl = urlParams.get('month');

    // Map full date range (e.g., "December 2025") to month key (e.g., "Dec 2025")
    const getMonthKeyFromDateRange = (dateRange) => {
        const mapping = {
            'January 2026': 'Jan 2026',
            'December 2025': 'Dec 2025',
            'November 2025': 'Nov 2025',
            'October 2025': 'Oct 2025',
            'September 2025': 'Sep 2025',
            'August 2025': 'Aug 2025'
        };
        return mapping[dateRange] || 'Jan 2026';
    };

    const initialMonth = monthFromUrl ? getMonthKeyFromDateRange(monthFromUrl) : 'Jan 2026';
    const [month, setMonth] = useState(initialMonth);

    // Accordion control for auto-expand when all insights reviewed
    const [accordionActiveKeys, setAccordionActiveKeys] = useState([]); // Start with both collapsed

    // Derive reportData from selected month
    const reportData = REPORT_VARIANTS[month];
    const totalDimensions = reportData.dimensions.length;

    const [reviewedCount, setReviewedCount] = useState(0);
    const [activeKey, setActiveKey] = useState(0);
    const [feedbackSelections, setFeedbackSelections] = useState({});
    const [feedbackText, setFeedbackText] = useState({});
    const [savedFeedbackText, setSavedFeedbackText] = useState({}); // New state to track committed/saved text
    const [hasEntered, setHasEntered] = useState(false);
    const [hasPlayedDataAnim, setHasPlayedDataAnim] = useState(false);
    const [isDataAnimActive, setIsDataAnimActive] = useState(false);
    const [animatedImpact, setAnimatedImpact] = useState({
        learningTime: 0,
        skillsMastered: 0,
        sessions: 0,
        hours: 0,
        students: 0,
        schools: 0
    });
    const [animatedTimeAlloc, setAnimatedTimeAlloc] = useState(reportData.timeAllocation.map(() => 0));
    const [animatedReviewPct, setAnimatedReviewPct] = useState(0);
    const prefersReducedMotionRef = useRef(false);
    const training = [
        { id: '1', title: 'Mastering Response to Help Requests', category: 'Social-Emotional Learning', duration: '12 mins', badgeType: 'socio-emotional', image: imgGivingEffectivePraise },
        { id: '2', title: 'Reacting to Errors', category: 'Advocacy', duration: '12 mins', badgeType: 'advocacy', image: imgReactingToErrors },
        { id: '3', title: 'Prompting Students to Explain', category: 'Technology Tools', duration: '12 mins', badgeType: 'technology-tools', image: imgPromptingStudentsToExplain }
    ];

    // Filter training cards - in growth mode, show only training for the "Start Here" insight
    const getRelevantTraining = () => {
        if (reportData.isHighImprovement && reportData.dimensions) {
            const focusInsight = reportData.dimensions.find(d => d.startHere);
            if (focusInsight && focusInsight.trainingId) {
                return training.filter(t => t.id === focusInsight.trainingId);
            }
        }
        return training.filter(t => TRAININGS_TO_SHOW.includes(t.id));
    };
    const FILTERED_TRAINING = getRelevantTraining();

    // Update shell context on mount and when month changes
    useEffect(() => {
        setBreadcrumbs([
            { text: 'Toolkit', href: '/' },
            { text: 'Reviews', href: '/monthly-reports' },
            { text: month }
        ]);
        setMainClassName('monthly-report-page-scroller');
    }, [setBreadcrumbs, setMainClassName, month]);

    // Auto-expand training accordion after all insights reviewed (normal mode only)
    // Note: reportData.isHighImprovement is kept in deps to maintain consistent array size
    useEffect(() => {
        if (reviewedCount === totalDimensions && totalDimensions > 0 && !reportData.isHighImprovement) {
            // Normal mode only, expand after all insights reviewed
            setAccordionActiveKeys(['0']);
        }
    }, [reportData.isHighImprovement, reviewedCount, totalDimensions]);

    useEffect(() => {
        requestAnimationFrame(() => setHasEntered(true));
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        prefersReducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);

    useEffect(() => {
        if (!hasEntered || hasPlayedDataAnim) return;

        const impactTargets = {
            learningTime: reportData.impact.learningTime.value,
            skillsMastered: reportData.impact.skillsMastered.value,
            sessions: reportData.stats[0].value,
            hours: reportData.stats[1].value,
            students: reportData.stats[2].value,
            schools: reportData.stats[3].value
        };
        const timeAllocTargets = reportData.timeAllocation.map((seg) => seg.value);
        const peerAllocTargets = reportData.peerAverage.map((seg) => seg.value);
        const reviewTarget = (reviewedCount / totalDimensions) * 100;

        if (prefersReducedMotionRef.current) {
            setAnimatedImpact(impactTargets);
            setAnimatedTimeAlloc(timeAllocTargets);
            setAnimatedReviewPct(reviewTarget);
            setHasPlayedDataAnim(true);
            return;
        }

        const timerIds = [];
        const rafIds = [];

        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        const tweenNumber = ({ from = 0, to = 0, duration = 900, onUpdate }) => {
            const start = performance.now();
            const step = (now) => {
                const progress = Math.min((now - start) / duration, 1);
                const value = from + (to - from) * easeOutCubic(progress);
                onUpdate(value);
                if (progress < 1) {
                    const rafId = requestAnimationFrame(step);
                    rafIds.push(rafId);
                }
            };
            const rafId = requestAnimationFrame(step);
            rafIds.push(rafId);
        };

        setIsDataAnimActive(true);

        timerIds.push(window.setTimeout(() => {
            tweenNumber({
                to: impactTargets.learningTime,
                onUpdate: (value) => setAnimatedImpact((prev) => ({ ...prev, learningTime: value }))
            });
            tweenNumber({
                to: impactTargets.skillsMastered,
                onUpdate: (value) => setAnimatedImpact((prev) => ({ ...prev, skillsMastered: value }))
            });
        }, 0));

        timerIds.push(window.setTimeout(() => {
            STAT_KEYS.forEach((key) => {
                tweenNumber({
                    to: impactTargets[key],
                    onUpdate: (value) => setAnimatedImpact((prev) => ({ ...prev, [key]: value }))
                });
            });
        }, 120));

        timerIds.push(window.setTimeout(() => {
            setAnimatedTimeAlloc(timeAllocTargets);
        }, 220));

        timerIds.push(window.setTimeout(() => {
            tweenNumber({
                to: reviewTarget,
                onUpdate: (value) => setAnimatedReviewPct(value)
            });
        }, 320));

        timerIds.push(window.setTimeout(() => {
            setAnimatedImpact(impactTargets);
            setAnimatedTimeAlloc(timeAllocTargets);
            setAnimatedReviewPct(reviewTarget);
            setIsDataAnimActive(false);
            setHasPlayedDataAnim(true);
        }, 1400));

        return () => {
            timerIds.forEach((timerId) => window.clearTimeout(timerId));
            rafIds.forEach((rafId) => cancelAnimationFrame(rafId));
        };
    }, [hasEntered, hasPlayedDataAnim, reviewedCount, totalDimensions]);

    // Hide scrollbar programmatically
    useEffect(() => {
        const styleId = 'monthly-report-scrollbar-hide';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                #spa-shell .plus-page-main::-webkit-scrollbar,
                #spa-shell .plus-page-content-wrapper::-webkit-scrollbar,
                #home-redesign-page .plus-page-main::-webkit-scrollbar,
                #home-redesign-page .plus-page-content-wrapper::-webkit-scrollbar,
                .monthly-report-page-scroller::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    background: transparent !important;
                }
                #spa-shell .plus-page-main,
                #spa-shell .plus-page-content-wrapper,
                #home-redesign-page .plus-page-main,
                #home-redesign-page .plus-page-content-wrapper,
                .monthly-report-page-scroller {
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
        // In growth mode, lock insights that don't have "Start Here" badge
        if (reportData.isHighImprovement) {
            const dimension = reportData.dimensions[index];
            if (!dimension.startHere) return 'locked';
        }

        if (index < reviewedCount) return 'reviewed';
        if (index === reviewedCount) return 'under_review';
        return 'locked';
    };

    const handleFeedback = (dimId, feedbackType) => {
        setFeedbackSelections(prev => ({ ...prev, [dimId]: feedbackType }));

        // If helpful, advance immediately. If not, wait for text input.
        if (feedbackType === 'helpful') {
            // Find index of this dimension
            const index = reportData.dimensions.findIndex(d => d.id === dimId);

            // Only advance if this is the current item under review
            if (index === reviewedCount) {
                setReviewedCount(prev => {
                    const next = Math.min(prev + 1, totalDimensions);
                    setActiveKey(next < totalDimensions ? next : prev);
                    return next;
                });
            }
        }
    };

    const handleFeedbackSubmit = (dimId) => {
        // Save the feedback text as committed
        setSavedFeedbackText(prev => ({ ...prev, [dimId]: feedbackText[dimId] }));

        // Find index of this dimension
        const index = reportData.dimensions.findIndex(d => d.id === dimId);

        // Only advance if this is the current item under review
        if (index === reviewedCount) {
            setReviewedCount(prev => {
                const next = Math.min(prev + 1, totalDimensions);
                setActiveKey(next < totalDimensions ? next : prev);
                return next;
            });
        }
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

    const formatStatValue = (key, value) => {
        if (key === 'hours') return value.toFixed(1);
        return String(Math.round(value));
    };

    return (
        <div className={`monthly-report reveal-root ${hasEntered ? 'has-entered' : ''} ${isDataAnimActive ? 'data-anim-active' : ''}`}>
            <style>{`
                @keyframes revealIn {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .reveal-root .reveal-section {
                    opacity: 0;
                }
                .reveal-root.has-entered .reveal-section {
                    animation: revealIn 1.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
                @media (prefers-reduced-motion: reduce) {
                    .reveal-root .reveal-section {
                        opacity: 1;
                        animation: none !important;
                    }
                }
            `}</style>
            {/* Header */}
            <header className="report-header reveal-section" style={{ animationDelay: '0ms' }}>
                <div>
                    <h1 className="header-title">Your Month in Review, {reportData.userName}</h1>
                    <div className="header-meta">
                        <div className="month-badge-container">
                            <Badge text={reportData.monthLabel} style="primary" size="default" fill="tonal" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Impact Section */}
            <section className="impact-section-wrapper reveal-section" style={{ animationDelay: '200ms' }}>
                <h2 className="section-title">Your Impact</h2>
                <div className="impact-section">
                    <div className="impact-hero-wrapper">
                        <div className="impact-hero-card">
                            <div className="blob-primary-large"></div>
                            <div className="blob-tertiary-medium"></div>
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
                                            <span className="metric-value-xl">{Math.round(animatedImpact.learningTime)}</span>
                                            <span className="metric-unit">{reportData.impact.learningTime.unit}</span>
                                        </div>
                                        <p className="metric-label data-anim-enter" style={{ '--text-delay': '380ms' }}>Total Student Learning Time</p>
                                    </div>
                                    <div className="impact-divider"></div>
                                    <div className="impact-metric">
                                        <div className="metric-value-row">
                                            <span className="metric-value-xl">{Math.round(animatedImpact.skillsMastered)}</span>
                                            <span className="metric-unit">{reportData.impact.skillsMastered.unit}</span>
                                        </div>
                                        <p className="metric-label data-anim-enter" style={{ '--text-delay': '430ms' }}>Concepts Mastered</p>
                                    </div>
                                </div>
                                {reportData.keyInsight && (
                                    <Alert style="tertiary" dismissable={false} className="insight-alert">
                                        <i className="fa-solid fa-trophy insight-alert-icon"></i>
                                        {reportData.keyInsight}
                                    </Alert>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="impact-stats-grid">
                        {reportData.stats.map((stat, i) => (
                            <div
                                key={i}
                                className={`stat-card stat-card--${stat.color}`}
                            >
                                <div className={`stat-blob stat-blob--${stat.color}`}></div>
                                <div className={`stat-card-icon stat-card-icon--${stat.color}`}>
                                    <i className={`fa-solid ${stat.icon}`}></i>
                                </div>
                                <div className="stat-card-text">
                                    <span className="metric-value-lg">{formatStatValue(STAT_KEYS[i], animatedImpact[STAT_KEYS[i]])}</span>
                                    <span className="stat-label">{stat.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Time Allocation */}
            <section className="time-allocation-section reveal-section" style={{ animationDelay: '400ms' }}>
                <div className="time-allocation-header">
                    <div>
                        <h3 className="time-allocation-title data-anim-enter" style={{ '--text-delay': '380ms' }}>Time Allocation with Students</h3>
                        <p className="time-allocation-subtitle data-anim-enter" style={{ '--text-delay': '400ms' }}>
                            Breakdown of your session time by activity.
                        </p>
                    </div>
                </div>
                {/* Your Breakdown */}
                <div className="time-allocation-bar-group">
                    <div className="time-allocation-bar-header">
                        <span className="time-allocation-bar-label data-anim-enter" style={{ '--text-delay': '440ms' }}>Your Breakdown</span>
                        <span className="time-allocation-bar-total data-anim-enter" style={{ '--text-delay': '440ms' }}>Total: 100%</span>
                    </div>
                    <div className={`time-allocation-bar ${isDataAnimActive ? 'time-allocation-bar--animate' : ''}`}>
                        {reportData.timeAllocation.map((seg, i) => (
                            <div
                                key={i}
                                className={`time-allocation-segment time-allocation-segment--${seg.color}`}
                                style={{
                                    '--segment-target': `${seg.value}%`,
                                    '--segment-delay': `${220 + i * 70}ms`,
                                    width: `${animatedTimeAlloc[i]}%`
                                }}
                                title={`${seg.label}: ${seg.value}%`}
                            >
                                {seg.value >= 8 && <span className="segment-label">{seg.value}%</span>}
                            </div>
                        ))}
                    </div>
                </div>
                {/* Peer Average */}
                {/* Recommended Range Nudge */}
                <div style={{ marginTop: 'var(--size-element-gap-xs)' }}>
                    <Alert style="tertiary" dismissable={false} className="insight-alert data-anim-enter data-anim-enter--insight">
                        <i className="fa-solid fa-lightbulb insight-alert-icon" style={{ marginRight: 'var(--size-element-gap-sm)' }}></i>
                        <span>
                            We noticed you spent <strong>18%</strong> of your session time Observing, which is above our recommended range (8-12%).
                            Consider transitioning into guided questioning earlier to keep students actively reasoning.
                        </span>
                    </Alert>
                </div>
            </section>

            {/* Growth Insights - Only show if we have dimension data */}
            {reportData.dimensions && reportData.dimensions.length > 0 && (
                <section className="growth-insights-section reveal-section" style={{ animationDelay: '600ms' }}>

                    <div className="growth-insights-header">
                        <div className="growth-insights-title-column">
                            <h2 className="section-title">Growth Insights</h2>
                            <span className="powered-by">
                                <i className="fa-solid fa-wand-magic-sparkles"></i>
                                Powered by PLUS AI Coach
                            </span>
                        </div>
                        {!reportData.isLowData && (
                            <div className="review-progress-container">
                                <span className="review-label">Review progress</span>
                                <div className="review-bar-row">
                                    <div className="review-progress-track">
                                        <Progress
                                            value={hasPlayedDataAnim ? (reviewedCount / totalDimensions) * 100 : animatedReviewPct}
                                            className={`review-progress-bar ${isDataAnimActive ? 'review-progress-bar--intro' : ''}`}
                                            style="primary"
                                        />
                                    </div>
                                    <span className="review-count">{reviewedCount}/{totalDimensions}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* November Growth Banner - appears between title and insights */}
                    {reportData.isHighImprovement && (
                        <Alert style="success" dismissable={false} className="insight-alert">
                            <div style={{ marginBottom: 0 }}>
                                <i className="fa-solid fa-seedling insight-alert-icon"></i>
                                This month has several areas for development. Remember, growth takes time and practice—let's focus on one skill at a time. Start with the insight marked "Start Here" below.
                            </div>
                        </Alert>
                    )}

                    {/* December Empty State */}
                    {reportData.isLowData ? (
                        <Alert style="tertiary" dismissable={false}>
                            <i className="fa-solid fa-info-circle insight-alert-icon"></i>
                            <div>
                                <strong>Limited data this month.</strong> We need at least 5 recorded sessions to generate personalized growth insights. Keep up the great work, and we'll have more detailed feedback for you next month!
                            </div>
                        </Alert>
                    ) : (

                        <div className="timeline-container">
                            <span className="timeline-connector" aria-hidden="true" style={{ zIndex: 0, left: '31px' }}></span>
                            {reportData.dimensions.map((dim, index) => {
                                const state = getState(index);
                                const isExpanded = activeKey === index;
                                const displayStatus = state === 'reviewed' ? 'Reviewed' : state === 'under_review' ? 'Under Review' : 'Locked';
                                const badgeStyle = state === 'reviewed' ? 'success' : state === 'under_review' ? 'primary' : 'neutral';

                                return (
                                    <div
                                        key={dim.id}
                                        className={`timeline-item timeline-item--${state}`}
                                    >
                                        <div
                                            className={`timeline-node timeline-node--${state === 'under_review' ? 'active' : state}`}
                                            style={state === 'locked' ? { backgroundColor: '#f6f8fa', opacity: 1, zIndex: 10 } : { zIndex: 10, backgroundColor: '#fff' }}
                                        >
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
                                                    <h4 className="growth-card-title">
                                                        {dim.title}
                                                        {dim.startHere && (
                                                            <span style={{ marginLeft: 'var(--size-element-gap-sm)', display: 'inline-block' }}>
                                                                <Badge style="primary" size="small" fill="tonal">
                                                                    <i className="fa-solid fa-arrow-right" style={{ marginRight: '4px' }}></i>
                                                                    Start Here
                                                                </Badge>
                                                            </span>
                                                        )}
                                                    </h4>
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
                                                            {dim.session && (
                                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                    <span className="session-info body3-txt text-muted">
                                                                        <i className="fa-solid fa-video" style={{ marginRight: '8px' }}></i>
                                                                        {dim.session}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {(state === 'under_review' || state === 'reviewed') && (
                                                        <div className="feedback-row">
                                                            <p className="feedback-prompt">{state === 'reviewed' ? (feedbackSelections[dim.id] === 'helpful' ? 'Marked as helpful' : 'Your feedback:') : 'Was this insight helpful?'}</p>
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
                                                    {/* Feedback Input for Negative Feedback */}
                                                    {(state === 'under_review' || (state === 'reviewed' && (feedbackSelections[dim.id] === 'not_helpful' || feedbackSelections[dim.id] === 'inaccurate' || feedbackSelections[dim.id] === 'helpful'))) && (feedbackSelections[dim.id] === 'not_helpful' || feedbackSelections[dim.id] === 'inaccurate') && (
                                                        <div className="feedback-input-container" style={{ marginTop: 'var(--size-element-gap-md)' }}>
                                                            <Input
                                                                label={feedbackSelections[dim.id] === 'not_helpful' ? "What’s missing or off about this insight?" : "What feels inaccurate from this AI insight?"}
                                                                value={feedbackText[dim.id] || ''}
                                                                onChange={(e) => setFeedbackText(prev => ({ ...prev, [dim.id]: e.target.value }))}
                                                                autoFocus={state === 'under_review'}
                                                                required
                                                                validation={(feedbackText[dim.id] || '').length > 0 && (feedbackText[dim.id] || '').length < 10 ? 'invalid' : 'none'}
                                                                validationMessage={(feedbackText[dim.id] || '').length < 10
                                                                    ? `${(feedbackText[dim.id] || '').length}/10 characters minimum`
                                                                    : `${(feedbackText[dim.id] || '').length} characters`
                                                                }
                                                            />
                                                            <div style={{ marginTop: 'var(--size-element-gap-sm)', display: 'flex', justifyContent: 'flex-end' }}>
                                                                <Button
                                                                    size="small"
                                                                    style="primary"
                                                                    disabled={
                                                                        !feedbackText[dim.id] ||
                                                                        feedbackText[dim.id].length < 10 ||
                                                                        (state === 'reviewed' && feedbackText[dim.id] === savedFeedbackText[dim.id])
                                                                    }
                                                                    onClick={(e) => { e.stopPropagation(); handleFeedbackSubmit(dim.id); }}
                                                                >
                                                                    {state === 'reviewed' ? 'Update Feedback' : 'Submit & Continue'}
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
                    )}
                </section>
            )}

            {/* Combined Accordion - Training + Goal Progress */}
            <Accordion
                activeKey={accordionActiveKeys}
                onSelect={setAccordionActiveKeys}
                alwaysOpen
                className="monthly-report-accordion reveal-section"
                style={{ animationDelay: '800ms' }}
            >
                {/* Training - Only show if we have dimensions/insights */}
                {reportData.dimensions && reportData.dimensions.length > 0 && (
                    <Accordion.Item eventKey="0" header="Recommended Training to Review">
                        <div className="training-carousel">
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
                                    />
                                ))}
                            </div>
                        </div>
                    </Accordion.Item>
                )}

                {/* Student Goal Progress - Only show if we have goal data */}
                {reportData.goalProgress && reportData.goalProgress.length > 0 && (
                    <Accordion.Item eventKey="1" header="Student Goal Progress">
                        <table className="goal-progress-table">
                            <thead>
                                <tr>
                                    <th>SCHOOL NAME</th>
                                    <th>STUDENTS</th>
                                    <th>PROGRESS GOAL</th>
                                    <th>EFFORT GOAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.goalProgress.map((row) => (
                                    <tr key={row.id}>
                                        <td>
                                            <div className="school-cell">
                                                <div className="school-abbr" style={{ borderColor: row.abbrColor, color: row.abbrColor }}>
                                                    {row.abbr}
                                                </div>
                                                <div className="school-info">
                                                    <span className="school-name">{row.school}</span>
                                                    <span className="school-teacher">{row.teacher}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="students-cell">
                                                {row.students.map((s, i) => (
                                                    <div
                                                        key={i}
                                                        className="student-avatar"
                                                        style={{ backgroundColor: `${s.color}18`, color: s.color, zIndex: row.students.length - i }}
                                                    >
                                                        {s.initials}
                                                    </div>
                                                ))}
                                                {row.extraStudents > 0 && (
                                                    <div className="student-avatar student-avatar--extra">
                                                        +{row.extraStudents}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="goal-cell">
                                                <Progress
                                                    value={row.progressGoal}
                                                    style="primary"
                                                    className="goal-progress-bar"
                                                    size="small"
                                                />
                                                <span className="goal-value">{row.progressGoal}%</span>
                                                <span className={`goal-delta goal-delta--${row.progressDeltaType}`}>
                                                    {row.progressDeltaType !== 'neutral' && <i className={`fa-solid ${row.progressDeltaType === 'success' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>}
                                                    {row.progressDeltaType === 'neutral' && '–'} {row.progressDelta}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="goal-cell">
                                                <Progress
                                                    value={row.effortGoal}
                                                    style="secondary"
                                                    className="goal-progress-bar goal-progress-bar--effort"
                                                    size="small"
                                                />
                                                <span className="goal-value">{row.effortGoal}%</span>
                                                <span className={`goal-delta goal-delta--${row.effortDeltaType}`}>
                                                    {row.effortDeltaType !== 'neutral' && <i className={`fa-solid ${row.effortDeltaType === 'success' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>}
                                                    {row.effortDeltaType === 'neutral' && '–'} {row.effortDelta}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Accordion.Item>
                )}
            </Accordion>

            {/* CTA: Sign up for more sessions */}
            <section className="cta-section reveal-section" style={{ animationDelay: '1200ms' }}>
                <div className="cta-content">
                    <div className="cta-text">
                        <h2 className="cta-title">Keep the Momentum Going</h2>
                        <p className="cta-subtitle">Sign up for additional sessions next month.</p>
                    </div>
                    <Button
                        text="Sign up"
                        style="primary"
                        fill="filled"
                        size="medium"
                        onClick={() => { }}
                        trailingVisual={<i className="fa-solid fa-arrow-right"></i>}
                    />
                </div>
            </section>
        </div>
    );
}
