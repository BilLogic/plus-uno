import React, { useState } from 'react';
import { PageLayout } from '@/specs/Universal/Pages';
import Button from '@/components/Button';
import './WeeklyReport.css'; // We'll create this for specific styles

// Mock Data
const REPORT_DATA = {
    dateRange: 'Jan 27 – Jan 31, 2026',
    weekLabel: 'Week 18',
    stats: [
        { label: 'Sessions completed', value: 12, delta: '↑ 3 vs last week', icon: '📅', type: 'up' },
        { label: 'Hours tutored', value: 8.5, delta: '↑ 1.5 hrs', icon: '⏱️', type: 'up' },
        { label: 'Students helped', value: 34, delta: '— same', icon: '🎓', type: 'same' },
    ],
    studentImpact: [
        { label: 'Student edtech minutes', value: 147, delta: '↑ 22 min', icon: '💻', type: 'up' },
        { label: 'Skills mastered', value: 18, icon: '⭐' }
    ],
    dimensions: [
        {
            id: 1,
            title: 'Interpersonal Comfort',
            status: 'Demonstrated',
            subStatus: 'Greeting & rapport-building',
            badge: '👋',
            badgeType: 'demonstrated',
            summary: 'You consistently greeted students by name, asked about their week, and established a warm tone. Observed in 11 of 12 sessions.',
            evidence: '"Hey Marcus! Good to see you again. Before we get started, how\'d that math test go? … That\'s awesome, I\'m glad you felt good about it."',
            evidenceTime: 'Tue Jan 28, 2:32 PM',
            lessonUrl: '#'
        },
        {
            id: 2,
            title: 'Response to Help Requests',
            status: 'Developing',
            subStatus: 'Redirecting rather than giving answers',
            badge: '🤚',
            badgeType: 'developing',
            summary: 'In 4 of 8 observed help requests, you provided the answer directly. Try responding with a leading question first.',
            evidence: 'Student: "I don\'t know how to do this one." — Tutor: "OK so the answer here is 42, because you need to multiply 6 times 7."',
            evidenceTime: 'Wed Jan 29, 3:15 PM',
            lessonUrl: '#',
            needsWork: true
        },
        {
            id: 3,
            title: 'Prompting for Self-Explanation',
            status: 'Developing',
            subStatus: 'Asking students to explain their thinking',
            badge: '💬',
            badgeType: 'developing',
            summary: 'Self-explanation prompts observed in only 3 of 12 sessions. Try asking "Can you walk me through how you figured that out?"',
            evidence: 'Student answers correctly. Tutor: "Good job!" and moves to next problem, without asking how they arrived at the answer.',
            evidenceTime: 'Thu Jan 30, 2:50 PM',
            lessonUrl: '#',
            needsWork: true
        }
    ]
};

const DimensionCard = ({ dimension }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [feedback, setFeedback] = useState(null); // 'helpful', 'not-helpful', 'inaccurate'
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleFeedback = (type) => {
        setFeedback(type);
    };

    const handleSubmit = () => {
        setSubmitted(true);
        // In a real app, send data to backend here
    };

    return (
        <div className={`wr-dimension ${isOpen ? 'open' : ''}`}>
            <div className="wr-dim-header" onClick={() => setIsOpen(!isOpen)}>
                <div className={`wr-dim-badge ${dimension.badgeType}`}>{dimension.badge}</div>
                <div className="wr-dim-info">
                    <div className="wr-dim-name">{dimension.title}</div>
                    <div className={`wr-dim-sub ${dimension.badgeType}`}>{dimension.subStatus}</div>
                </div>
                <div className={`wr-chip ${dimension.badgeType}`}>
                    {dimension.status === 'Demonstrated' ? '✓ As Taught' : '⚬ Developing'}
                </div>
                <span className="wr-dim-chevron">▾</span>
            </div>

            {isOpen && (
                <div className="wr-dim-body">
                    <div className="wr-dim-body-inner">
                        <div className={`wr-evidence ${dimension.needsWork ? 'needs-work' : ''}`}>
                            <div className="wr-evidence-label">Evidence from session</div>
                            <div className="wr-evidence-quote">{dimension.evidence}</div>
                            <div className="wr-evidence-source">🎥 {dimension.evidenceTime}</div>
                        </div>

                        <p className="wr-dim-summary">{dimension.summary}</p>

                        {dimension.lessonUrl && (
                            <a href={dimension.lessonUrl} className="wr-lesson-btn">
                                📖 Review Strategy →
                            </a>
                        )}

                        <div className="wr-dim-feedback">
                            {submitted ? (
                                <div className="wr-feedback-submitted">
                                    ✓ Thanks for your feedback!
                                </div>
                            ) : (
                                <>
                                    <div className="wr-dim-fb-label">Feedback on this insight</div>
                                    <div className="wr-fb-actions">
                                        <button
                                            className={`wr-fb-btn ${feedback === 'helpful' ? 'selected' : ''}`}
                                            onClick={() => handleFeedback('helpful')}
                                        >
                                            👍 Helpful
                                        </button>
                                        <button
                                            className={`wr-fb-btn ${feedback === 'not-helpful' ? 'selected' : ''}`}
                                            onClick={() => handleFeedback('not-helpful')}
                                        >
                                            👎 Not Helpful
                                        </button>
                                        <button
                                            className={`wr-fb-btn ${feedback === 'inaccurate' ? 'selected' : ''}`}
                                            onClick={() => handleFeedback('inaccurate')}
                                        >
                                            🤔 Inaccurate
                                        </button>
                                    </div>

                                    {feedback && (
                                        <div className="wr-fb-expand">
                                            <textarea
                                                className="wr-fb-comment"
                                                placeholder="Tell us more (optional)..."
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                            />
                                            <Button
                                                size="small"
                                                onClick={handleSubmit}
                                                style={{ marginTop: '8px' }}
                                            >
                                                Submit Feedback
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function WeeklyReportPage() {
    return (
        <div className="wr-container">
            <div className="wr-header">
                <h1 className="wr-title">Your Week in Review</h1>
                <div className="wr-meta">
                    <span>{REPORT_DATA.dateRange}</span>
                    <span className="wr-week-badge">{REPORT_DATA.weekLabel}</span>
                </div>
            </div>

            {/* CARD 1: STATS */}
            <div className="wr-card fade-up">
                <div className="wr-card-header">
                    <div>
                        <div className="wr-card-label">Your Numbers</div>
                        <div className="wr-card-title">This Week at a Glance</div>
                    </div>
                </div>
                <div className="wr-card-body">
                    <div className="wr-stats-row">
                        {REPORT_DATA.stats.map((stat, i) => (
                            <div key={i} className={`wr-stat-tile ${i === 0 ? 'hero' : ''}`}>
                                <div className="wr-stat-num">{stat.value}</div>
                                <div className="wr-stat-lbl">{stat.label}</div>
                                {stat.delta && (
                                    <span className={`wr-stat-delta ${stat.type}`}>{stat.delta}</span>
                                )}
                                <div className="wr-stat-icon">{stat.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="wr-impact-label-row">
                        <span>📊</span>
                        <span className="wr-impact-label-text">Student Impact</span>
                    </div>

                    <div className="wr-impact-row">
                        {REPORT_DATA.studentImpact.map((item, i) => (
                            <div key={i} className="wr-impact-tile">
                                <div className="wr-stat-num coral">{item.value}</div>
                                <div className="wr-stat-lbl">{item.label}</div>
                                {item.delta && <span className="wr-stat-delta up">{item.delta}</span>}
                                <div className="wr-stat-icon">{item.icon}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CARD 2: TIME */}
            <div className="wr-card fade-up delay-1">
                <div className="wr-card-header">
                    <div>
                        <div className="wr-card-label">AI Observation</div>
                        <div className="wr-card-title">How You Spent Your Time</div>
                    </div>
                </div>
                <div className="wr-card-body">
                    <p className="wr-card-desc">Based on AI analysis of 12 sessions:</p>
                    <div className="wr-time-bar-wrap">
                        <div className="wr-time-bar-track">
                            <div className="wr-time-seg tutoring" style={{ width: '52%' }}>52%</div>
                            <div className="wr-time-seg goal" style={{ width: '14%' }}>14%</div>
                            <div className="wr-time-seg observing" style={{ width: '18%' }}>18%</div>
                            <div className="wr-time-seg troubleshoot" style={{ width: '10%' }}>10%</div>
                            <div className="wr-time-seg other" style={{ width: '6%' }}></div>
                        </div>
                        <div className="wr-time-legend">
                            <div className="wr-legend-item"><div className="wr-legend-dot tutoring"></div> Active Tutoring</div>
                            <div className="wr-legend-item"><div className="wr-legend-dot goal"></div> Goal Setting</div>
                            <div className="wr-legend-item"><div className="wr-legend-dot observing"></div> Observing</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CARD 3: FEEDBACK */}
            <div className="wr-card fade-up delay-2">
                <div className="wr-card-header">
                    <div>
                        <div className="wr-card-label">Coaching Feedback</div>
                        <div className="wr-card-title">Your Skills This Week</div>
                    </div>
                </div>
                <div className="wr-card-body">
                    <p className="wr-card-desc">Click to expand details and provide feedback.</p>
                    <div className="wr-dimensions-list">
                        {REPORT_DATA.dimensions.map(dim => (
                            <DimensionCard key={dim.id} dimension={dim} />
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
}
