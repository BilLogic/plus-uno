import React, { useState } from 'react';
import { PageLayout } from '@/specs/Universal/Pages';
import Card from '@/components/layout-and-structure/Card';
import Badge from '@/components/status-and-loading/Badge';
import Button from '@/components/actions/Button';
import Alert from '@/components/messaging/Alert';
import { Textarea, Scale } from '@/components/forms-and-inputs';
import './TutorFeedbackPage.scss';

const SESSION_ID = 'SES-48291';

const SESSION_SUMMARY = {
    dateLine: 'Tue May 6, 2026 · 3:15–4:00 PM · Washington Middle School',
    student: 'Jordan Lee',
    focus: 'Algebra — linear equations',
};

const WENT_WELL = [
    {
        id: 'cfu',
        title: 'Checks for understanding',
        body: 'You paused twice after introducing slope-intercept form and used a quick self-rating before moving on.',
        quote: '“Before we graph this, how confident do you feel from 1–5?”',
    },
    {
        id: 'reinforcement',
        title: 'Positive reinforcement',
        body: 'You named specific strategies the student used, not just generic praise.',
        quote: '“I like how you substituted before isolating y—that kept the arithmetic cleaner.”',
    },
];

const OPPORTUNITY = {
    title: 'Wait time after questions',
    body: 'In three exchanges you answered within about one second of the student finishing. Try counting to four silently to give them space to extend their thinking.',
    quote: 'Student: “So I just plug in?” — Tutor: “Yes, plug 2 in for x and then solve.”',
};

const SCALE_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({
    id: `clarity-${n}`,
    value: n,
    label: String(n),
}));

const BREADCRUMBS = [
    { text: 'Toolkit', href: '#' },
    { text: 'Reports', href: '#' },
    { text: 'Session feedback' },
];

export default function TutorFeedbackPage() {
    const [coachNote, setCoachNote] = useState('');
    const [clarity, setClarity] = useState(3);
    const [submitted, setSubmitted] = useState(false);

    const shellProps = {
        topBarConfig: {
            breadcrumbs: BREADCRUMBS,
            user: { name: 'Alex Morgan', counter: null, counterValue: null, type: 'tutor' },
        },
        sidebarConfig: {
            user: 'tutor',
            activeTabId: 'reviews',
            onHomeClick: () => {},
            onTabClick: () => {},
        },
        id: 'test-tutor-feedback-shell',
        shellEntered: true,
    };

    const handleReset = () => {
        setSubmitted(false);
        setCoachNote('');
        setClarity(3);
    };

    if (submitted) {
        return (
            <PageLayout {...shellProps}>
                <div
                    className="test-tutor-feedback test-tutor-feedback__max"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-section-gap-md)',
                    }}
                >
                    <div>
                        <h1 className="h2-txt" style={{ margin: 0, color: 'var(--color-on-surface)' }}>
                            Session feedback
                        </h1>
                        <p className="body2-txt" style={{ margin: 0, color: 'var(--color-on-surface-variant)' }}>
                            Your review was saved.
                        </p>
                    </div>
                    <Alert style="success" title="Marked as reviewed" dismissable={false}>
                        Thanks — coaches will see your calibration and note alongside this session report.
                        <div style={{ marginBlockStart: 'var(--size-element-gap-md)' }}>
                            <Button
                                text="Back to session feedback"
                                style="primary"
                                fill="outline"
                                size="medium"
                                onClick={handleReset}
                            />
                        </div>
                    </Alert>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout {...shellProps}>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-section-gap-md)',
                    width: '100%',
                    minHeight: 0,
                }}
            >
                <div className="test-tutor-feedback test-tutor-feedback__max">
                    <header className="test-tutor-feedback__hero">
                        <div className="test-tutor-feedback__hero-row">
                            <h1 className="test-tutor-feedback__page-title h1-txt">Session feedback</h1>
                            <div className="test-tutor-feedback__hero-meta" aria-label="Session status">
                                <Badge text="Awaiting your review" style="warning" size="b2" />
                                <span className="body3-txt test-tutor-feedback__session-id">{SESSION_ID}</span>
                            </div>
                        </div>
                        <p className="body2-txt test-tutor-feedback__lede">
                            AI-assisted highlights from your latest recording, ready for your review before they are shared with
                            your coach.
                        </p>
                    </header>

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--size-element-gap-md)',
                        }}
                    >
                        <Card title="Session summary" subtitle={SESSION_SUMMARY.dateLine} paddingSize="lg" gapSize="md">
                            <div className="test-tutor-feedback__summary-grid">
                                <div>
                                    <p className="body3-txt test-tutor-feedback__field-label">Student</p>
                                    <p className="body1-txt" style={{ margin: 0, color: 'var(--color-on-surface)' }}>
                                        {SESSION_SUMMARY.student}
                                    </p>
                                </div>
                                <div>
                                    <p className="body3-txt test-tutor-feedback__field-label">Focus</p>
                                    <p className="body1-txt" style={{ margin: 0, color: 'var(--color-on-surface)' }}>
                                        {SESSION_SUMMARY.focus}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <div className="test-tutor-feedback__two-col">
                            <Card title="What went well" paddingSize="lg" gapSize="md" className="test-tutor-feedback__card-fill">
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 'var(--size-section-gap-sm)',
                                    }}
                                >
                                    {WENT_WELL.map((block) => (
                                        <section key={block.id} className="test-tutor-feedback__insight-block">
                                            <h2 className="h5 test-tutor-feedback__insight-title">{block.title}</h2>
                                            <p className="body2-txt test-tutor-feedback__insight-body">{block.body}</p>
                                            <blockquote className="body2-txt test-tutor-feedback__quote">
                                                {block.quote}
                                            </blockquote>
                                        </section>
                                    ))}
                                </div>
                            </Card>

                            <Card title="Opportunity to grow" paddingSize="lg" gapSize="md" className="test-tutor-feedback__card-fill">
                                <div className="test-tutor-feedback__growth-panel">
                                    <h2 className="h4-txt test-tutor-feedback__growth-title">{OPPORTUNITY.title}</h2>
                                    <p className="body2-txt test-tutor-feedback__growth-body">{OPPORTUNITY.body}</p>
                                    <blockquote className="body2-txt test-tutor-feedback__quote">{OPPORTUNITY.quote}</blockquote>
                                </div>
                            </Card>
                        </div>

                        <Card title="Your response" subtitle="Help us calibrate this report and optionally leave a note for your coach." paddingSize="lg" gapSize="md">
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--size-section-gap-sm)',
                                }}
                            >
                                <Textarea
                                    id="coach-note"
                                    name="coach-note"
                                    label="Note to coach (optional)"
                                    placeholder="Share context the recording might miss, or ask a question about a specific moment."
                                    rows={4}
                                    variant="long"
                                    value={coachNote}
                                    onChange={(e) => setCoachNote(e.target.value)}
                                />

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)' }}>
                                    <p className="body1-txt" style={{ margin: 0, color: 'var(--color-on-surface)' }}>
                                        How clear and actionable was this feedback?
                                    </p>
                                    <Scale
                                        id="feedback-clarity-scale"
                                        name="feedback-clarity-scale"
                                        label=""
                                        lowestLabel="Not clear"
                                        highestLabel="Very clear"
                                        options={SCALE_OPTIONS}
                                        value={clarity}
                                        onChange={(v) => setClarity(v)}
                                    />
                                </div>

                                <div className="test-tutor-feedback__actions">
                                    <Button text="Save draft" style="default" fill="outline" size="medium" type="button" onClick={() => {}} />
                                    <Button
                                        text="Mark as reviewed"
                                        style="primary"
                                        fill="filled"
                                        size="medium"
                                        type="button"
                                        onClick={() => setSubmitted(true)}
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
