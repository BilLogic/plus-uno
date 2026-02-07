import React, { useState } from 'react';
import { PageLayout } from '@/specs/Universal/Pages';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Divider from '@/components/Divider';
import Accordion from '@/components/Accordion';
import Progress from '@/components/Progress';
import Section from '@/components/Section';

// Mock Data from weekly-report-v2.html
const REPORT_DATA = {
    dateRange: 'Jan 27 – Jan 31, 2026',
    weekLabel: 'Week 18',
    stats: [
        { label: 'Sessions completed', value: 12, delta: '↑ 3 vs last week', icon: '📅', type: 'positive' },
        { label: 'Hours tutored', value: 8.5, delta: '↑ 1.5 hrs', icon: '⏱️', type: 'positive' },
        { label: 'Students helped', value: 34, delta: '— same', icon: '🎓', type: 'neutral' },
        { label: 'Schools served', value: 3, icon: '🏫', type: 'neutral' },
    ],
    studentImpact: [
        { label: 'Student edtech minutes', value: 147, delta: '↑ 22 min', icon: '💻', type: 'positive' },
        { label: 'Skills mastered by students', value: 18, icon: '⭐' }
    ],
    timeAllocation: [
        { label: 'Active Tutoring', value: 52, color: 'var(--color-primary)', type: 'tutoring' },
        { label: 'Goal Setting', value: 14, color: 'var(--color-warning)', type: 'goal' },
        { label: 'Observing', value: 18, color: 'var(--color-primary-dark)', type: 'observing' },
        { label: 'Troubleshooting', value: 10, color: 'var(--color-danger)', type: 'troubleshoot' },
        { label: 'Other', value: 6, color: '#aaa', type: 'other' }
    ],
    dimensions: [
        {
            id: 1,
            title: 'Interpersonal Comfort',
            status: 'Demonstrated',
            subStatus: 'Greeting & rapport-building',
            badge: '👋',
            badgeType: 'success',
            summary: 'You consistently greeted students by name, asked about their week, and established a warm tone. Observed in 11 of 12 sessions.',
            evidence: '"Hey Marcus! Good to see you again. Before we get started, how\'d that math test go? … That\'s awesome, I\'m glad you felt good about it."',
            evidenceSource: 'Session recording — Tue Jan 28, 2:32 PM · 0:00–0:45',
            lessonUrl: '#'
        },
        {
            id: 2,
            title: 'Response to Help Requests',
            status: 'Developing',
            subStatus: 'Redirecting rather than giving answers',
            badge: '🤚',
            badgeType: 'warning',
            summary: 'In 4 of 8 observed help requests, you provided the answer directly. Try responding with a leading question first, like "What do you think the first step might be?"',
            evidence: 'Student: "I don\'t know how to do this one." — Tutor: "OK so the answer here is 42, because you need to multiply 6 times 7."',
            evidenceSource: 'Session recording — Wed Jan 29, 3:15 PM · 12:30–13:10',
            lessonUrl: '#',
            needsWork: true
        },
        {
            id: 3,
            title: 'Prompting for Self-Explanation',
            status: 'Developing',
            subStatus: 'Asking students to explain their thinking',
            badge: '💬',
            badgeType: 'warning',
            summary: 'Self-explanation prompts observed in only 3 of 12 sessions. Try asking "Can you walk me through how you figured that out?"',
            evidence: 'Student answers correctly. Tutor: "Good job!" and moves to next problem, without asking how they arrived at the answer.',
            evidenceSource: 'Session recording — Thu Jan 30, 2:50 PM · 8:20–8:45',
            lessonUrl: '#',
            needsWork: true
        },
        {
            id: 4,
            title: 'Reacting to Errors',
            status: 'Not Observed',
            subStatus: 'Normalizing mistakes & guiding correction',
            badge: '❌',
            badgeType: 'neutral',
            summary: 'The AI did not find clear instances of student errors during the analyzed portions of this week\'s recordings. This dimension will be evaluated again when opportunities arise.',
            evidence: null,
            lessonUrl: '#'
        },
        {
            id: 5,
            title: 'Checking for Understanding',
            status: 'Demonstrated',
            subStatus: 'Frequent comprehension checks',
            badge: '✅',
            badgeType: 'success',
            summary: 'Great job pausing after key concepts to ask "Does that make sense?" and "How would you explain this in your own words?".',
            evidence: '"So before we move on, can you tell me what the first step was?"',
            evidenceSource: 'Session recording — Fri Jan 31, 4:10 PM',
            lessonUrl: '#'
        }
    ]
};

const FeedbackSection = ({ id }) => {
    const [feedback, setFeedback] = useState(null);
    const [correction, setCorrection] = useState('');
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(42,157,143,0.1)', color: 'var(--color-success)', fontWeight: 600, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✓ Feedback saved
            </div>
        );
    }

    return (
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed var(--color-outline-variant)' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#bbb', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                Rate this assessment
            </div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '12px' }}>
                Does this match your experience?
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {['Accurate', 'Not Sure', 'Inaccurate'].map((opt) => (
                    <button
                        key={opt}
                        onClick={() => setFeedback(opt)}
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${feedback === opt ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                            background: feedback === opt ? 'rgba(63, 43, 150, 0.05)' : '#fff',
                            color: feedback === opt ? 'var(--color-primary)' : 'var(--text-secondary)',
                            fontSize: '12px',
                            fontWeight: feedback === opt ? 600 : 500,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                    >
                        {opt === 'Accurate' ? '👍' : opt === 'Not Sure' ? '🤷' : '👎'} {opt}
                    </button>
                ))}
            </div>

            {feedback === 'Inaccurate' && (
                <div style={{ marginBottom: '12px', animation: 'fadeIn 0.3s' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-danger)', marginBottom: '8px' }}>What was off?</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                        {['I did this more often than noted', 'Context was missing', 'Example not representative'].map(opt => (
                            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <input type="radio" name={`correction-${id}`} onChange={() => setCorrection(opt)} />
                                {opt}
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {(feedback) && (
                <div>
                    <textarea
                        style={{ width: '100%', border: '1px solid var(--color-outline-variant)', borderRadius: '8px', padding: '10px', minHeight: '60px', marginBottom: '12px', fontFamily: 'inherit', fontSize: '13px' }}
                        placeholder="Optional: Tell us more..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                    <Button size="small" onClick={handleSubmit} style={{ width: '100%' }}>Submit Feedback</Button>
                </div>
            )}
        </div>
    );
};

// Strict Group Component for Hierarchy
const ReportGroup = ({ title, children }) => (
    <div style={{ marginBottom: '48px' }}>
        <div style={{
            color: 'var(--color-primary)',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            fontSize: '12px',
            marginBottom: '16px',
            borderBottom: '2px solid var(--color-primary-container)',
            paddingBottom: '8px'
        }}>
            {title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {children}
        </div>
    </div>
);

// Section Component for Headers (Level 3 typography)
const ReportSection = ({ title, children }) => (
    <div>
        {title && <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>{title}</h3>}
        {children}
    </div>
);

export default function WeeklyReportPage() {
    return (
        <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '48px', width: '100%' }}>

            <div style={{ padding: 'var(--size-element-pad-y-lg) var(--size-element-pad-x-lg)' }}>
                <div style={{ marginBottom: '8px' }}>
                    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Your Week in Review, Albus</h1>
                    <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span>{REPORT_DATA.dateRange}</span>
                        <Badge style="secondary" text={REPORT_DATA.weekLabel} />
                    </div>
                </div>
            </div>

            {/* GROUP 1: Performance Snapshot */}
            <div style={{ padding: '0 var(--size-element-pad-x-lg)' }}>
                <ReportGroup title="Performance Snapshot">

                    {/* Grid for Stats Sections */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                        {/* SECTION 1: Your Numbers (What you contributed) */}
                        <ReportSection title="What you contributed">
                            <Card>
                                <div style={{ padding: '24px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                        {REPORT_DATA.stats.map((stat, i) => (
                                            <div key={i} style={{
                                                background: i === 0 ? 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))' : 'var(--bg-secondary)',
                                                color: i === 0 ? '#fff' : 'inherit',
                                                borderRadius: '12px',
                                                padding: '20px',
                                                position: 'relative',
                                            }}>
                                                <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '20px', opacity: 0.3 }}>{stat.icon}</div>
                                                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', fontWeight: 700, marginBottom: '4px', color: i === 0 ? 'var(--color-warning)' : 'inherit' }}>
                                                    {stat.value}
                                                </div>
                                                <div style={{ fontSize: '13px', fontWeight: 500, opacity: 0.8 }}>{stat.label}</div>
                                                {stat.delta && (
                                                    <div style={{
                                                        fontSize: '11px', fontWeight: 700, marginTop: '8px',
                                                        color: i === 0 ? '#fff' : (stat.type === 'positive' ? 'var(--color-success)' : 'var(--text-muted)'),
                                                        opacity: i === 0 ? 0.9 : 1,
                                                        background: i === 0 ? 'rgba(255,255,255,0.15)' : 'transparent',
                                                        display: 'inline-block', padding: i === 0 ? '2px 8px' : 0, borderRadius: '12px'
                                                    }}>
                                                        {stat.delta}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        🏅 Your busiest day was <strong>Tuesday</strong> with 4 sessions. Top school: <strong>PS 234 — The Independence School</strong>.
                                    </div>
                                </div>
                            </Card>
                        </ReportSection>

                        {/* SECTION 2: Student Impact (What your students achieved) */}
                        <ReportSection title="What your students achieved">
                            <Card>
                                <div style={{ padding: '24px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                                        {REPORT_DATA.studentImpact.map((item, i) => (
                                            <div key={i} style={{ background: '#fff5f0', border: '1px solid #f5ddd0', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div>
                                                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 700, color: 'var(--color-danger)' }}>{item.value}</div>
                                                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{item.label}</div>
                                                    {item.delta && <div style={{ fontSize: '11px', color: 'var(--color-danger)', fontWeight: 700, marginTop: '4px' }}>{item.delta}</div>}
                                                </div>
                                                <div style={{ fontSize: '24px' }}>{item.icon}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </ReportSection>
                    </div>

                    {/* SECTION 3: Time Allocation (How you spent your time) */}
                    <ReportSection title="How you spent your time">
                        <Card>
                            <div style={{ padding: '24px' }}>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                    Based on AI analysis of your session recordings this week, here's how your time broke down across 12 sessions:
                                </p>
                                <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '10px' }}>Time allocation across all sessions</div>
                                    <div style={{ display: 'flex', height: '30px', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
                                        {REPORT_DATA.timeAllocation.map((seg, i) => (
                                            <div key={i} style={{
                                                width: `${seg.value}%`,
                                                background: seg.color,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: seg.type === 'goal' ? 'var(--text-primary)' : '#fff',
                                                fontSize: '11px', fontWeight: 600
                                            }}>
                                                {seg.value > 8 && `${seg.value}%`}
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                        {REPORT_DATA.timeAllocation.map((seg, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: seg.color }}></span>
                                                {seg.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                    💡 <strong>Insight:</strong> Your active tutoring time is right in the target range (45–60%). Your goal-setting time increased from 10% last week — nice work weaving that in.
                                </div>
                            </div>
                        </Card>
                    </ReportSection>

                </ReportGroup>

                {/* GROUP 2: Coach's Notes */}
                <ReportGroup title="Coach's Notes">

                    {/* SECTION 4: How you're developing */}
                    <ReportSection title="How you're developing">
                        <Card paddingSize="md">
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Your Skills This Week</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Our AI reviewed recordings from this week's sessions. Expand each dimension to see evidence and rate the AI's accuracy.</div>
                            </div>

                            <Accordion>
                                {REPORT_DATA.dimensions.map((dim) => (
                                    <Accordion.Item
                                        key={dim.id}
                                        eventKey={String(dim.id)}
                                        header={
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                                                <div style={{
                                                    fontSize: '20px',
                                                    background: dim.badgeType === 'neutral' ? 'var(--bg-secondary)' : (dim.badgeType === 'success' ? 'rgba(42,157,143,0.12)' : 'rgba(233,196,106,0.15)'),
                                                    width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    {dim.badge}
                                                </div>
                                                <div style={{ flex: 1, textAlign: 'left' }}>
                                                    <div style={{ fontWeight: 600, fontSize: '15px' }}>{dim.title}</div>
                                                    <div style={{ fontSize: '12px', color: dim.badgeType === 'success' ? 'var(--color-success)' : (dim.badgeType === 'neutral' ? '#aaa' : 'var(--color-warning)') }}>
                                                        {dim.subStatus}
                                                    </div>
                                                </div>
                                                <Badge style={dim.badgeType === 'neutral' ? 'neutral' : dim.badgeType} text={dim.status === 'Demonstrated' ? '✓ As Taught' : (dim.status === 'Not Observed' ? '— Not Observed' : '⚬ Developing')} />
                                            </div>
                                        }
                                    >
                                        <div style={{ paddingTop: '16px' }}>
                                            {dim.evidence ? (
                                                <>
                                                    <div style={{
                                                        background: 'var(--bg-secondary)', padding: '16px', borderRadius: '10px',
                                                        borderLeft: `3px solid ${dim.badgeType === 'success' ? 'var(--color-success)' : 'var(--color-warning)'}`, marginBottom: '16px'
                                                    }}>
                                                        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#bbb', marginBottom: '8px' }}>Evidence from session</div>
                                                        <div style={{ fontStyle: 'italic', color: '#555', marginBottom: '8px', lineHeight: '1.55' }}>{dim.evidence}</div>
                                                        <div style={{ fontSize: '12px', color: '#888' }}>{dim.evidenceSource}</div>
                                                    </div>
                                                    <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#555', marginBottom: '16px' }}>{dim.summary}</p>
                                                    <a href={dim.lessonUrl} style={{ display: 'inline-flex', alignItems: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none', marginBottom: '8px' }}>
                                                        📖 Review Lesson →
                                                    </a>
                                                </>
                                            ) : (
                                                <p style={{ fontSize: '13px', color: '#aaa', lineHeight: '1.6', marginBottom: '16px' }}>{dim.summary}</p>
                                            )}

                                            <FeedbackSection id={dim.id} />
                                        </div>
                                    </Accordion.Item>
                                ))}
                            </Accordion>
                        </Card>
                    </ReportSection>
                </ReportGroup>
            </div>
        </div>
    );
}
