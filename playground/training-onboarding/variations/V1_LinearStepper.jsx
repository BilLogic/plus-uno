/**
 * V1_LinearStepper.jsx — Variation 1: Linear Stepper Layout
 *
 * LAYOUT STRATEGY: Two-column split
 *   LEFT  ← Vertical numbered stepper (the path — always visible)
 *   RIGHT ← Active step detail panel + primary CTA
 *
 * UX STRENGTHS:
 *   • Progress is spatially embedded — you "see" the path and your position simultaneously
 *   • The stepper column acts as persistent navigation — context is never lost
 *   • Right panel focus isolates one step at a time (P2: One Decision)
 *   • Natural "wizard" pattern — tutors recognise it from onboarding flows elsewhere
 *
 * TRADEOFFS:
 *   • Requires wider viewport — may collapse awkwardly on tablet/mobile
 *   • Step detail panel can feel empty for short modules (low content density on right)
 *   • Harder to scan all step descriptions without clicking each stepper node
 *
 * BEST USE CASE:
 *   Multi-step workflows where the tutor needs to understand where they are in a
 *   longer journey (5+ steps). Works excellently when steps have rich detail (descriptions,
 *   objectives, estimated time). Desktop-first audience.
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

const V1_LinearStepper = ({
    userName = 'Ashley',
    steps = MOCK_STEPS,
    supplementalResources = MOCK_SUPPLEMENTAL,
    onStartModule,
    onContinueModule,
}) => {
    const nextStep = getNextStep(steps);
    const progressPct = getProgressPct(steps);
    const completedCount = steps.filter((s) => s.status === 'completed').length;

    // The focused step — defaults to the next step, tutor can click others
    const [focusedStep, setFocusedStep] = useState(nextStep || steps[0]);
    const [supplementalOpen, setSupplementalOpen] = useState(false);

    const { topBarConfig, sidebarConfig } = getPageLayoutConfigs(userName);

    const handleCta = () => {
        if (!focusedStep) return;
        const action = focusedStep.status === 'in-progress' ? onContinueModule : onStartModule;
        if (action) action(focusedStep);
        else console.log('[V1_LinearStepper] CTA:', focusedStep);
    };

    const ctaLabel = focusedStep?.status === 'completed'
        ? 'Review Again'
        : focusedStep?.status === 'in-progress'
            ? 'Continue Module'
            : 'Start Module';

    const ctaDisabled = focusedStep?.status === 'locked';

    return (
        <PageLayout topBarConfig={topBarConfig} sidebarConfig={sidebarConfig} id="v1-linear-stepper">
            <div className="v1">

                {/* ── Header: Progress bar spans full width ────────────────────── */}
                <header className="v1__header">
                    <div className="v1__welcome">
                        <h1 className="v1__welcome-title h4">
                            Welcome, {userName}. Let&apos;s get you ready to tutor.
                        </h1>
                        <p className="v1__welcome-sub body2-txt">
                            Complete these steps to unlock your first session.
                        </p>
                    </div>
                    <div className="v1__progress-wrap">
                        <span className="v1__progress-label body3-txt">
                            {completedCount} of {steps.length} complete · {progressPct}%
                        </span>
                        <div className="v1__progress-bar" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                            <div className="v1__progress-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                    </div>
                </header>

                {/* ── Body: Two-column stepper layout ─────────────────────────── */}
                <div className="v1__body">

                    {/* LEFT — Vertical stepper (the path) */}
                    <nav className="v1__stepper" aria-label="Onboarding steps">
                        <h2 className="v1__stepper-title body3-txt">YOUR PATH</h2>
                        <ol className="v1__step-list">
                            {steps.map((step, index) => {
                                const isFocused = focusedStep?.id === step.id;
                                const isClickable = step.status !== 'locked';
                                return (
                                    <li
                                        key={step.id}
                                        className={[
                                            'v1-step',
                                            `v1-step--${step.status}`,
                                            isFocused ? 'v1-step--focused' : '',
                                        ].join(' ')}
                                        onClick={() => isClickable && setFocusedStep(step)}
                                        role={isClickable ? 'button' : undefined}
                                        tabIndex={isClickable ? 0 : undefined}
                                        onKeyDown={(e) => e.key === 'Enter' && isClickable && setFocusedStep(step)}
                                        aria-current={isFocused ? 'step' : undefined}
                                        aria-label={`Step ${index + 1}: ${step.title}, ${step.status}`}
                                    >
                                        {/* Connector line */}
                                        {index < steps.length - 1 && (
                                            <div className="v1-step__connector" />
                                        )}

                                        {/* Node */}
                                        <div className="v1-step__node">
                                            {step.status === 'completed' ? '✓' : index + 1}
                                        </div>

                                        {/* Label */}
                                        <div className="v1-step__label">
                                            <span className="v1-step__title body2-txt">{step.title}</span>
                                            <span className="v1-step__duration body3-txt">{step.duration}</span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </nav>

                    {/* RIGHT — Step detail panel */}
                    {focusedStep && (
                        <main className="v1__detail" aria-label="Step detail">
                            <div className="v1__detail-inner">
                                {/* Step context label */}
                                <div className="v1__detail-context body3-txt">
                                    {focusedStep.id === nextStep?.id
                                        ? '📍 YOUR NEXT STEP'
                                        : focusedStep.status === 'completed'
                                            ? '✅ COMPLETED'
                                            : '🔒 LOCKED'}
                                </div>

                                <h2 className="v1__detail-title h4">{focusedStep.title}</h2>
                                <p className="v1__detail-desc body2-txt">{focusedStep.description}</p>
                                <span className="v1__detail-duration body3-txt">⏱ {focusedStep.duration}</span>

                                {/* Primary CTA */}
                                <div className="v1__detail-cta">
                                    <Button
                                        text={ctaLabel}
                                        style="primary"
                                        fill={ctaDisabled ? 'outline' : 'filled'}
                                        size="large"
                                        id="v1-primary-cta"
                                        onClick={handleCta}
                                        disabled={ctaDisabled}
                                    />
                                    {ctaDisabled && (
                                        <p className="v1__detail-locked body3-txt">
                                            Complete the previous step to unlock this module.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Supplemental (bottom of detail panel) */}
                            <div className="v1__supplemental">
                                <button
                                    className="v1__supplemental-toggle body3-txt"
                                    onClick={() => setSupplementalOpen((p) => !p)}
                                    aria-expanded={supplementalOpen}
                                >
                                    {supplementalOpen ? '▲ Hide' : '▼ Show'} supplemental resources
                                </button>
                                {supplementalOpen && (
                                    <ul className="v1__supplemental-list">
                                        {supplementalResources.map((r) => (
                                            <li key={r.id} className="body3-txt">
                                                <span style={{ textTransform: 'uppercase', fontWeight: 600, marginRight: 6 }}>[{r.type}]</span>
                                                {r.title}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </main>
                    )}
                </div>
            </div>
        </PageLayout>
    );
};

V1_LinearStepper.propTypes = {
    userName: PropTypes.string,
    steps: PropTypes.array,
    supplementalResources: PropTypes.array,
    onStartModule: PropTypes.func,
    onContinueModule: PropTypes.func,
};

export default V1_LinearStepper;
