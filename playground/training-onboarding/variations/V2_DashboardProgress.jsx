/**
 * V2_DashboardProgress.jsx — Variation 2: Dashboard Progress Layout
 *
 * LAYOUT STRATEGY: Metric-first, two-zone composition
 *   TOP ROW   ← 3 stat tiles: Steps Done / Time Left / Status ("Ready to start")
 *   LOWER L   ← Primary CTA hero (next step, big and prominent)
 *   LOWER R   ← Compact path summary (numbered list with status dots)
 *   FOOTER    ← Supplemental resources (collapsed)
 *
 * UX STRENGTHS:
 *   • Instant "at-a-glance" orientation — tutors see progress metrics before reading anything
 *   • Feels motivating and achievement-oriented (gamification-adjacent)
 *   • Works well for tutors who return mid-onboarding — quick re-orientation
 *   • Stat cards are easily scannable and skimmable
 *
 * TRADEOFFS:
 *   • Higher cognitive load on first load — more elements competing for attention
 *   • Stat tiles can feel redundant if onboarding is short (5 steps)
 *   • Path list (right column) is compact — titles may truncate at mobile
 *   • Dashboard metaphor may imply ongoing use, not one-time journey
 *
 * BEST USE CASE:
 *   Tutors who complete onboarding across multiple sessions (return users).
 *   Platforms that want to emphasise progress as a motivational mechanic.
 *   Works when there are 7+ steps and time-to-complete is meaningful data.
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '@/specs/Universal/Pages';
import Button from '@/components/Button';
import {
    MOCK_STEPS,
    MOCK_SUPPLEMENTAL,
    getNextStep,
    getProgressPct,
    getPageLayoutConfigs,
} from './shared';
import './variations.scss';

const V2_DashboardProgress = ({
    userName = 'Ashley',
    steps = MOCK_STEPS,
    supplementalResources = MOCK_SUPPLEMENTAL,
    onStartModule,
    onContinueModule,
}) => {
    const nextStep = getNextStep(steps);
    const progressPct = getProgressPct(steps);
    const completedCount = steps.filter((s) => s.status === 'completed').length;
    const remainingCount = steps.filter((s) => s.status !== 'completed').length;
    const totalMins = steps.reduce((acc, s) => acc + parseInt(s.duration, 10), 0);
    const remainingMins = steps
        .filter((s) => s.status !== 'completed')
        .reduce((acc, s) => acc + parseInt(s.duration, 10), 0);

    const [supplementalOpen, setSupplementalOpen] = useState(false);
    const { topBarConfig, sidebarConfig } = getPageLayoutConfigs(userName);

    const handleCta = () => {
        if (!nextStep) return;
        const action = nextStep.status === 'in-progress' ? onContinueModule : onStartModule;
        if (action) action(nextStep);
        else console.log('[V2_DashboardProgress] CTA:', nextStep);
    };

    const ctaLabel = nextStep?.status === 'in-progress' ? 'Continue Module' : 'Start Module';

    // Status badge text
    const statusText = completedCount === 0
        ? 'Not Started'
        : completedCount === steps.length
            ? '🎉 Complete!'
            : 'In Progress';

    return (
        <PageLayout topBarConfig={topBarConfig} sidebarConfig={sidebarConfig} id="v2-dashboard-progress">
            <div className="v2">

                {/* ── Page title ───────────────────────────────────────────── */}
                <header className="v2__header">
                    <div>
                        <h1 className="v2__title h4">Welcome back, {userName}.</h1>
                        <p className="v2__subtitle body2-txt">Pick up where you left off.</p>
                    </div>
                    <div className="v2__overall-bar">
                        <span className="body3-txt">{progressPct}% complete</span>
                        <div className="v2__progress-bar" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                            <div className="v2__progress-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                    </div>
                </header>

                {/* ── Stat tiles row ───────────────────────────────────────── */}
                <div className="v2__stats" aria-label="Progress overview">
                    <div className="v2-stat" id="v2-stat-completed">
                        <span className="v2-stat__value h4">{completedCount}/{steps.length}</span>
                        <span className="v2-stat__label body3-txt">Steps Complete</span>
                    </div>
                    <div className="v2-stat" id="v2-stat-time">
                        <span className="v2-stat__value h4">{remainingMins} min</span>
                        <span className="v2-stat__label body3-txt">Time Remaining</span>
                    </div>
                    <div className="v2-stat" id="v2-stat-status">
                        <span className="v2-stat__value h4">{statusText}</span>
                        <span className="v2-stat__label body3-txt">Current Status</span>
                    </div>
                </div>

                {/* ── Lower zone: CTA hero (left) + Path summary (right) ───── */}
                <div className="v2__lower">

                    {/* LEFT — Primary CTA hero block */}
                    <section className="v2__cta-hero" aria-label="Your next step">
                        {nextStep ? (
                            <>
                                <div className="v2__cta-eyebrow body3-txt">📍 NEXT UP</div>
                                <h2 className="v2__cta-title h4">{nextStep.title}</h2>
                                <p className="v2__cta-desc body2-txt">{nextStep.description}</p>
                                <div className="v2__cta-meta">
                                    <span className="body3-txt">⏱ {nextStep.duration}</span>
                                    <span className="body3-txt">·</span>
                                    <span className="body3-txt">Step {completedCount + 1} of {steps.length}</span>
                                </div>
                                <Button
                                    text={ctaLabel}
                                    style="primary"
                                    fill="filled"
                                    size="large"
                                    id="v2-primary-cta"
                                    onClick={handleCta}
                                />
                            </>
                        ) : (
                            <div className="v2__cta-complete">
                                <div className="v2__cta-eyebrow body3-txt">🎉 ALL DONE</div>
                                <h2 className="v2__cta-title h4">Onboarding Complete!</h2>
                                <p className="v2__cta-desc body2-txt">
                                    You&apos;re fully certified. Your first session is ready to go.
                                </p>
                            </div>
                        )}
                    </section>

                    {/* RIGHT — Compact path list */}
                    <aside className="v2__path-summary" aria-label="Onboarding path summary">
                        <h3 className="v2__path-title body3-txt">ALL STEPS</h3>
                        <ol className="v2__path-list">
                            {steps.map((step, i) => (
                                <li
                                    key={step.id}
                                    className={`v2-path-item v2-path-item--${step.status}`}
                                    aria-label={`Step ${i + 1}: ${step.title} — ${step.status}`}
                                >
                                    <span className="v2-path-item__node">
                                        {step.status === 'completed' ? '✓' : i + 1}
                                    </span>
                                    <span className="v2-path-item__title body2-txt">{step.title}</span>
                                    <span className="v2-path-item__duration body3-txt">{step.duration}</span>
                                </li>
                            ))}
                        </ol>
                    </aside>
                </div>

                {/* ── Supplemental (collapsed footer) ─────────────────────── */}
                <section className="v2__supplemental" aria-label="Optional resources">
                    <button
                        className="v2__supplemental-toggle body3-txt"
                        onClick={() => setSupplementalOpen((p) => !p)}
                        aria-expanded={supplementalOpen}
                    >
                        {supplementalOpen ? '▲ Hide' : '▼ Show'} supplemental resources
                    </button>
                    {supplementalOpen && (
                        <ul className="v2__supplemental-list">
                            {supplementalResources.map((r) => (
                                <li key={r.id} className="body3-txt">
                                    <span style={{ textTransform: 'uppercase', fontWeight: 600, marginRight: 6 }}>[{r.type}]</span>
                                    {r.title}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

            </div>
        </PageLayout>
    );
};

V2_DashboardProgress.propTypes = {
    userName: PropTypes.string,
    steps: PropTypes.array,
    supplementalResources: PropTypes.array,
    onStartModule: PropTypes.func,
    onContinueModule: PropTypes.func,
};

export default V2_DashboardProgress;
