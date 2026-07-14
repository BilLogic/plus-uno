import React, { useState } from 'react';
import { PageLayout } from '@/specs/Universal/Pages';
import { Card, Badge, Button, Alert, Textarea, Scale } from '@/components';
import './CoachingFeedbackPage.scss';

const SESSION = {
    id: 'SES-51027',
    dateLine: 'Thu Jul 9, 2026 · 4:00–4:45 PM',
    student: 'Priya Nair',
    focus: 'Geometry — similar triangles',
};

const COACHING_NOTES = [
    {
        id: 'strength',
        icon: 'circle-check',
        tone: 'strength',
        eyebrow: 'Strength',
        title: 'You surfaced the student\u2019s reasoning',
        body: 'You asked the student to explain their proof step before correcting it, which kept ownership with them.',
    },
    {
        id: 'pattern',
        icon: 'chart-line',
        tone: 'pattern',
        eyebrow: 'Pattern',
        title: 'Strong use of worked examples',
        body: 'Two of three new concepts were introduced with a fully worked example before independent practice.',
    },
    {
        id: 'growth',
        icon: 'seedling',
        tone: 'growth',
        eyebrow: 'Try next time',
        title: 'Leave more space after a question',
        body: 'Average wait time was about one second. Counting to four silently gives room for the student to extend their thinking.',
    },
];

const CLARITY_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({
    id: `clarity-${n}`,
    value: n,
    label: String(n),
}));

const BREADCRUMBS = [
    { text: 'Toolkit', href: '#' },
    { text: 'Coaching', href: '#' },
    { text: 'Session notes' },
];

const SHELL_PROPS = {
    topBarConfig: {
        breadcrumbs: BREADCRUMBS,
        user: { name: 'Sam Rivera', counter: null, counterValue: null, type: 'tutor' },
    },
    sidebarConfig: {
        user: 'tutor',
        activeTabId: 'reviews',
        onHomeClick: () => {},
        onTabClick: () => {},
    },
    id: 'test-tutor-feedback-v2-shell',
    shellEntered: true,
};

function Eyebrow({ step, children }) {
    return (
        <p className="cf-eyebrow body3-txt">
            <span className="cf-eyebrow__step">{step}</span>
            {children}
        </p>
    );
}

export default function CoachingFeedbackPage() {
    const [clarity, setClarity] = useState(null);
    const [note, setNote] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleReset = () => {
        setSubmitted(false);
        setClarity(null);
        setNote('');
    };

    if (submitted) {
        return (
            <PageLayout {...SHELL_PROPS}>
                <div className="cf cf__shell">
                    <header className="cf__header">
                        <h1 className="h2-txt cf__title">Coaching feedback</h1>
                        <p className="body2-txt cf__lede">Your review was sent to your coach.</p>
                    </header>

                    <Alert style="success" title="Feedback submitted" dismissable={false}>
                        Thanks — your calibration and note are now attached to this session for {SESSION.student}.
                    </Alert>

                    <Card title="What you sent" paddingSize="lg" gapSize="md">
                        <dl className="cf-recap">
                            <div className="cf-recap__row">
                                <dt className="body3-txt cf-recap__label">Clarity rating</dt>
                                <dd className="body1-txt cf-recap__value">
                                    <Badge text={`${clarity} / 5`} style="success" size="b2" />
                                </dd>
                            </div>
                            <div className="cf-recap__row">
                                <dt className="body3-txt cf-recap__label">Note to coach</dt>
                                <dd className="body1-txt cf-recap__value">
                                    {note.trim() ? note.trim() : 'No note added.'}
                                </dd>
                            </div>
                        </dl>
                    </Card>

                    <div className="cf__actions cf__actions--single">
                        <Button
                            text="Review another session"
                            style="primary"
                            fill="outline"
                            size="medium"
                            leadingVisual="rotate-left"
                            onClick={handleReset}
                        />
                    </div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout {...SHELL_PROPS}>
            <div className="cf cf__shell">
                <header className="cf__header">
                    <div className="cf__header-row">
                        <h1 className="h2-txt cf__title">Coaching feedback</h1>
                        <Badge text="AI coaching notes" style="info" size="b2" leadingVisual={<i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" />} />
                    </div>
                    <p className="body2-txt cf__lede">
                        {SESSION.dateLine} · {SESSION.student} · {SESSION.focus}
                    </p>
                </header>

                <section className="cf__section">
                    <Eyebrow step="1">Read the summary</Eyebrow>
                    <Card title="AI coaching summary" subtitle={`Session ${SESSION.id}`} paddingSize="lg" gapSize="md">
                        <p className="body2-txt cf-note-intro">
                            Generated from your session recording. Review it before it reaches your coach.
                        </p>
                        <ul className="cf-notes">
                            {COACHING_NOTES.map((n) => (
                                <li key={n.id} className={`cf-note cf-note--${n.tone}`}>
                                    <span className="cf-note__icon" aria-hidden="true">
                                        <i className={`fa-solid fa-${n.icon}`} />
                                    </span>
                                    <div className="cf-note__body">
                                        <p className="body3-txt cf-note__eyebrow">{n.eyebrow}</p>
                                        <h2 className="h6 cf-note__title">{n.title}</h2>
                                        <p className="body2-txt cf-note__text">{n.body}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </section>

                <section className="cf__section">
                    <Eyebrow step="2">Rate the notes</Eyebrow>
                    <Card title="How clear and actionable were these notes?" paddingSize="lg" gapSize="md">
                        <Scale
                            id="clarity-scale"
                            name="clarity-scale"
                            label=""
                            lowestLabel="Not clear"
                            highestLabel="Crystal clear"
                            options={CLARITY_OPTIONS}
                            value={clarity}
                            onChange={(v) => setClarity(v)}
                        />
                    </Card>
                </section>

                <section className="cf__section">
                    <Eyebrow step="3">Add a note (optional)</Eyebrow>
                    <Card title="Note to your coach" subtitle="Share context the recording might miss, or ask about a specific moment." paddingSize="lg" gapSize="md">
                        <Textarea
                            id="coach-note"
                            name="coach-note"
                            label="Note to coach (optional)"
                            placeholder="e.g. Priya was recovering from being out sick — we intentionally kept the pace slower."
                            rows={4}
                            variant="long"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </Card>
                </section>

                {clarity === null && (
                    <Alert style="info" dismissable={false}>
                        Pick a clarity rating above to submit your feedback.
                    </Alert>
                )}

                <div className="cf__actions">
                    <Button text="Cancel" style="default" fill="outline" size="medium" type="button" onClick={handleReset} />
                    <Button
                        text="Submit feedback"
                        style="primary"
                        fill="filled"
                        size="medium"
                        type="button"
                        leadingVisual="paper-plane"
                        disabled={clarity === null}
                        onClick={() => setSubmitted(true)}
                    />
                </div>
            </div>
        </PageLayout>
    );
}
