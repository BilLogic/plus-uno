/**
 * V3_CardJourney.jsx — Variation 3: Card-Based Journey Layout
 *
 * LAYOUT STRATEGY: Horizontal pipeline of step cards + active detail below
 *   TOP      ← Welcome + progress bar
 *   MIDDLE   ← Horizontal scroll of step cards (one card per step)
 *             Active/focused card is expanded; others are compact
 *   BOTTOM   ← Contextual detail pane for the active card + primary CTA
 *   FOOTER   ← Supplemental (collapsed)
 *
 * UX STRENGTHS:
 *   • Cards give each step a distinct visual identity — feels tangible and achievable
 *   • Horizontal pipeline rhythm communicates "journey" metaphor naturally
 *   • Tapping a card to expand is familiar mobile-first interaction pattern
 *   • Easy to compare steps at a glance (all titles visible simultaneously)
 *   • Satisfying visual "completion" effect as cards shift state to completed
 *
 * TRADEOFFS:
 *   • Horizontal scroll can hide content on smaller screens
 *   • Card metaphor risks feeling like content library if not carefully constrained
 *   • Two-zone detail pane (middle cards + bottom panel) splits user attention
 *   • If step count grows (8+), cards become very small or overflow awkwardly
 *
 * BEST USE CASE:
 *   Platforms that want onboarding to feel engaging and milestone-based.
 *   Best for 4–6 steps where each card can have a distinct visual.
 *   Works well when steps have meaningful thumbnails or topic icons.
 *   Great for learners who are comfortable with card UI patterns (mobile-native apps).
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

// ── Step card status icon ────────────────────────────────────────────────────
const CardIcon = ({ status }) => {
    if (status === 'completed') return <span className="v3-card__icon v3-card__icon--done">✓</span>;
    if (status === 'in-progress') return <span className="v3-card__icon v3-card__icon--active">▶</span>;
    return <span className="v3-card__icon v3-card__icon--locked">○</span>;
};

const V3_CardJourney = ({
    userName = 'Ashley',
    steps = MOCK_STEPS,
    supplementalResources = MOCK_SUPPLEMENTAL,
    onStartModule,
    onContinueModule,
}) => {
    const nextStep = getNextStep(steps);
    const progressPct = getProgressPct(steps);
    const completedCount = steps.filter((s) => s.status === 'completed').length;

    // Active card — defaults to next step
    const [activeStep, setActiveStep] = useState(nextStep || steps[0]);
    const [supplementalOpen, setSupplementalOpen] = useState(false);

    const { topBarConfig, sidebarConfig } = getPageLayoutConfigs(userName);

    const handleCardClick = (step) => {
        // Locked steps are still selectable for preview, just CTA is disabled
        setActiveStep(step);
    };

    const handleCta = () => {
        if (!activeStep) return;
        const action = activeStep.status === 'in-progress' ? onContinueModule : onStartModule;
        if (action) action(activeStep);
        else console.log('[V3_CardJourney] CTA:', activeStep);
    };

    const ctaLabel = activeStep?.status === 'completed'
        ? 'Review Again'
        : activeStep?.status === 'in-progress'
            ? 'Continue Module'
            : 'Start Module';

    const ctaDisabled = activeStep?.status === 'locked';

    return (
        <PageLayout topBarConfig={topBarConfig} sidebarConfig={sidebarConfig} id="v3-card-journey">
            <div className="v3">

                {/* ── Header ─────────────────────────────────────────────── */}
                <header className="v3__header">
                    <div className="v3__welcome">
                        <h1 className="v3__welcome-title h4">
                            Welcome, {userName}. Let&apos;s get you ready to tutor.
                        </h1>
                        <p className="v3__welcome-sub body2-txt">
                            Complete these steps to unlock your first session.
                        </p>
                    </div>
                    <div className="v3__progress-wrap">
                        <span className="body3-txt">{completedCount} of {steps.length} steps · {progressPct}%</span>
                        <div className="v3__progress-bar" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                            <div className="v3__progress-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                    </div>
                </header>

                {/* ── Card Pipeline ───────────────────────────────────────── */}
                <section className="v3__pipeline" aria-label="Onboarding steps pipeline">
                    <h2 className="v3__pipeline-title body3-txt">YOUR JOURNEY</h2>
                    <div className="v3__card-row" role="list" aria-label="Step cards">
                        {steps.map((step, index) => {
                            const isActive = activeStep?.id === step.id;
                            return (
                                <div
                                    key={step.id}
                                    className={[
                                        'v3-card',
                                        `v3-card--${step.status}`,
                                        isActive ? 'v3-card--active' : '',
                                    ].join(' ')}
                                    role="listitem button"
                                    tabIndex={0}
                                    onClick={() => handleCardClick(step)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCardClick(step)}
                                    aria-pressed={isActive}
                                    aria-label={`Step ${index + 1}: ${step.title}, ${step.status}`}
                                >
                                    {/* Step number + connector */}
                                    <div className="v3-card__step-number body3-txt">STEP {index + 1}</div>

                                    {/* Status icon */}
                                    <CardIcon status={step.status} />

                                    {/* Title */}
                                    <p className="v3-card__title body2-txt">{step.title}</p>

                                    {/* Duration — only show on active */}
                                    {isActive && (
                                        <span className="v3-card__duration body3-txt">⏱ {step.duration}</span>
                                    )}

                                    {/* Status label */}
                                    <span className={`v3-card__status body3-txt v3-card__status--${step.status}`}>
                                        {step.status === 'completed' && 'Done'}
                                        {step.status === 'in-progress' && 'In Progress'}
                                        {step.status === 'locked' && 'Locked'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── Active Step Detail Panel ────────────────────────────── */}
                {activeStep && (
                    <section className="v3__detail" aria-label="Active step detail">
                        <div className="v3__detail-inner">
                            <div className="v3__detail-label body3-txt">
                                {activeStep.id === nextStep?.id ? '📍 YOUR NEXT STEP' : `STEP ${activeStep.id}`}
                            </div>
                            <h2 className="v3__detail-title h4">{activeStep.title}</h2>
                            <p className="v3__detail-desc body2-txt">{activeStep.description}</p>
                            <span className="v3__detail-duration body3-txt">⏱ {activeStep.duration}</span>
                        </div>

                        {/* Primary CTA */}
                        <div className="v3__detail-cta">
                            <Button
                                text={ctaLabel}
                                style="primary"
                                fill={ctaDisabled ? 'outline' : 'filled'}
                                size="large"
                                id="v3-primary-cta"
                                onClick={handleCta}
                                disabled={ctaDisabled}
                            />
                            {ctaDisabled && (
                                <p className="v3__detail-locked body3-txt">
                                    Complete the previous step to unlock this module.
                                </p>
                            )}
                        </div>
                    </section>
                )}

                {/* ── Supplemental (collapsed) ───────────────────────────── */}
                <section className="v3__supplemental" aria-label="Optional resources">
                    <button
                        className="v3__supplemental-toggle body3-txt"
                        onClick={() => setSupplementalOpen((p) => !p)}
                        aria-expanded={supplementalOpen}
                    >
                        {supplementalOpen ? '▲ Hide' : '▼ Show'} supplemental resources
                    </button>
                    {supplementalOpen && (
                        <ul className="v3__supplemental-list">
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

V3_CardJourney.propTypes = {
    userName: PropTypes.string,
    steps: PropTypes.array,
    supplementalResources: PropTypes.array,
    onStartModule: PropTypes.func,
    onContinueModule: PropTypes.func,
};

export default V3_CardJourney;
