import React, { useState } from 'react';
import { PageLayout } from '@/specs/Universal/Pages';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Divider from '@/components/Divider';
import Accordion from '@/components/Accordion';
import Progress from '@/components/Progress';
import Section from '@/components/Section';

// Mock Data
const REPORT_DATA = {
    dateRange: 'Jan 27 – Jan 31, 2026',
    weekLabel: 'Week 18',
    stats: [
        { label: 'Sessions completed', value: 12, delta: '↑ 3 vs last week', icon: '📅', type: 'positive' },
        { label: 'Hours tutored', value: 8.5, delta: '↑ 1.5 hrs', icon: '⏱️', type: 'positive' },
        { label: 'Students helped', value: 34, delta: '— same', icon: '🎓', type: 'neutral' },
    ],
    studentImpact: [
        { label: 'Student edtech minutes', value: 147, delta: '↑ 22 min', icon: '💻', type: 'positive' },
        { label: 'Skills mastered', value: 18, icon: '⭐' }
    ],
    dimensions: [
        {
            id: 1,
            title: 'Interpersonal Comfort',
            status: 'Demonstrated',
            subStatus: 'Greeting & rapport-building',
            badge: '👋',
            badgeType: 'success', // mapped to DS variant
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
            badgeType: 'warning',
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
            badgeType: 'warning',
            summary: 'Self-explanation prompts observed in only 3 of 12 sessions. Try asking "Can you walk me through how you figured that out?"',
            evidence: 'Student answers correctly. Tutor: "Good job!" and moves to next problem, without asking how they arrived at the answer.',
            evidenceTime: 'Thu Jan 30, 2:50 PM',
            lessonUrl: '#',
            needsWork: true
        }
    ]
};

const FeedbackSection = () => {
    const [feedback, setFeedback] = useState(null);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div style={{ padding: '16px', color: 'var(--color-success)', fontWeight: 600, textAlign: 'center' }}>
                ✓ Thanks for your feedback!
            </div>
        );
    }

    return (
        <div style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#bbb', textTransform: 'uppercase', marginBottom: '8px' }}>
                Feedback on this insight
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <Button variant={feedback === 'helpful' ? 'primary' : 'outline-secondary'} size="small" onClick={() => setFeedback('helpful')}>
                    👍 Helpful
                </Button>
                <Button variant={feedback === 'not-helpful' ? 'primary' : 'outline-secondary'} size="small" onClick={() => setFeedback('not-helpful')}>
                    👎 Not Helpful
                </Button>
                <Button variant={feedback === 'inaccurate' ? 'primary' : 'outline-secondary'} size="small" onClick={() => setFeedback('inaccurate')}>
                    🤔 Inaccurate
                </Button>
            </div>
            {feedback && (
                <div>
                    <textarea
                        style={{ width: '100%', border: '1px solid #ddd', borderRadius: '6px', padding: '8px', minHeight: '60px', marginBottom: '8px' }}
                        placeholder="Tell us more (optional)..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                    <Button size="small" onClick={handleSubmit}>Submit Feedback</Button>
                </div>
            )}
        </div>
    );
};

export default function WeeklyReportPage() {
    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>Your Week in Review</h1>
                <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>{REPORT_DATA.dateRange}</span>
                    <Badge style="secondary" text={REPORT_DATA.weekLabel} />
                </div>
            </div>

            {/* CARD 1: STATS */}
            <Card style={{ marginBottom: '24px' }}>
                <div style={{ padding: '24px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '16px' }}>
                        This Week at a Glance
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                        {REPORT_DATA.stats.map((stat, i) => (
                            <div key={i} style={{
                                background: i === 0 ? 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))' : 'var(--bg-secondary)',
                                color: i === 0 ? '#fff' : 'inherit',
                                borderRadius: '12px', padding: '20px', position: 'relative'
                            }}>
                                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 700, marginBottom: '4px', color: i === 0 ? 'var(--color-warning)' : 'inherit' }}>
                                    {stat.value}
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 500, opacity: 0.8 }}>{stat.label}</div>
                                {stat.delta && (
                                    <div style={{
                                        fontSize: '11px', fontWeight: 700, marginTop: '8px',
                                        color: i === 0 ? '#fff' : (stat.type === 'positive' ? 'var(--color-success)' : 'var(--text-muted)'),
                                        opacity: i === 0 ? 0.9 : 1
                                    }}>
                                        {stat.delta}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <Divider style={{ margin: '24px 0' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '16px' }}>📊</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-danger)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Student Impact</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        {REPORT_DATA.studentImpact.map((item, i) => (
                            <div key={i} style={{ background: '#fff5f0', border: '1px solid #f5ddd0', borderRadius: '12px', padding: '16px' }}>
                                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700, color: 'var(--color-danger)' }}>{item.value}</div>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* CARD 2: TIME */}
            <Card style={{ marginBottom: '24px' }}>
                <div style={{ padding: '24px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        AI Observation
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>How You Spent Your Time</div>

                    <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', height: '32px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
                            <div style={{ width: '52%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 600 }}>52%</div>
                            <div style={{ width: '14%', background: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-dark)', fontSize: '11px', fontWeight: 600 }}>14%</div>
                            <div style={{ width: '18%', background: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 600 }}>18%</div>
                            <div style={{ width: '16%', background: '#ccc' }}></div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--color-primary)' }}></span> Tutoring</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--color-warning)' }}></span> Goals</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--color-primary-dark)' }}></span> Observing</div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* CARD 3: FEEDBACK (Accordion) */}
            <Card paddingSize="md">
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Coaching Feedback
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700 }}>Your Skills This Week</div>
                </div>

                <Accordion>
                    {REPORT_DATA.dimensions.map((dim) => (
                        <Accordion.Item
                            key={dim.id}
                            eventKey={String(dim.id)}
                            header={
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                                    <div style={{ fontSize: '24px', background: 'var(--bg-secondary)', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{dim.badge}</div>
                                    <div style={{ flex: 1, textAlign: 'left' }}>
                                        <div style={{ fontWeight: 600, fontSize: '15px' }}>{dim.title}</div>
                                        <div style={{ fontSize: '12px', color: dim.badgeType === 'success' ? 'var(--color-success)' : 'var(--color-warning)' }}>{dim.subStatus}</div>
                                    </div>
                                    <Badge style={dim.badgeType} text={dim.status === 'Demonstrated' ? '✓ As Taught' : '⚬ Developing'} />
                                </div>
                            }
                        >
                            <div style={{ paddingTop: '16px' }}>
                                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', borderLeft: `4px solid ${dim.badgeType === 'success' ? 'var(--color-success)' : 'var(--color-warning)'}`, marginBottom: '16px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#999', marginBottom: '8px' }}>Evidence from session</div>
                                    <div style={{ fontStyle: 'italic', color: '#555', marginBottom: '8px' }}>{dim.evidence}</div>
                                    <div style={{ fontSize: '12px', color: '#888' }}>🎥 {dim.evidenceTime}</div>
                                </div>
                                <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>{dim.summary}</p>

                                <FeedbackSection />
                            </div>
                        </Accordion.Item>
                    ))}
                </Accordion>
            </Card>
        </div>
    );
}
