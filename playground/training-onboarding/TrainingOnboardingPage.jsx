/**
 * TrainingOnboardingPage (Prototype — Wireframe)
 *
 * CONSULTING BRIEF IMPLEMENTATION
 * Page Goal: "Guide new PLUS tutors from zero to first session — one step at a time."
 *
 * Information Hierarchy (journey-centric, not content-centric):
 *   1. Welcome Header     → Orient & personalize (name + progress bar)
 *   2. Next Step CTA      → Drive immediate action (primary CTA, above the fold)
 *   3. Onboarding Path    → Show the full sequential journey (steps w/ status)
 *   4. Supplemental       → Available but collapsed (optional resources)
 *
 * UX Principles:
 *   P1 — Progress Visibility Reduces Anxiety
 *   P2 — One Decision at a Time
 *   P3 — Structure Before Content
 *
 * NOTE: This is a low-fidelity structural wireframe.
 * No carousel. No "All Modules" table. No feature browsing at onboarding stage.
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '@/specs/Universal/Pages';
import Button from '@/components/Button';
import './TrainingOnboardingPage.scss';

// ─── Mock data shapes ────────────────────────────────────────────────────────

const DEFAULT_STEPS = [
    {
        id: 1,
        title: 'Welcome to PLUS',
        description: 'Learn what PLUS is and how it operates.',
        duration: '9 mins',
        status: 'completed', // 'completed' | 'in-progress' | 'locked'
    },
    {
        id: 2,
        title: 'Your Role at PLUS',
        description: 'Understand your responsibilities as a tutor.',
        duration: '12 mins',
        status: 'in-progress',
    },
    {
        id: 3,
        title: 'Tutoring Session Overview',
        description: 'Walk through what a standard session looks like.',
        duration: '15 mins',
        status: 'locked',
    },
    {
        id: 4,
        title: 'Student Communication',
        description: 'Best practices for engaging and motivating students.',
        duration: '10 mins',
        status: 'locked',
    },
    {
        id: 5,
        title: 'Session Wrap-Up & Reporting',
        description: 'How to close sessions and complete post-session notes.',
        duration: '11 mins',
        status: 'locked',
    },
];

const DEFAULT_SUPPLEMENTAL = [
    { id: 'r1', title: 'PLUS Style Guide', type: 'document' },
    { id: 'r2', title: 'Common Parent Questions', type: 'document' },
    { id: 'r3', title: 'Escalation Protocols', type: 'video' },
];

// ─── Step status icon (wireframe: text-based) ────────────────────────────────

const StepStatusIcon = ({ status }) => {
    if (status === 'completed') return <span className="tob-step__icon tob-step__icon--completed" aria-label="Completed">✓</span>;
    if (status === 'in-progress') return <span className="tob-step__icon tob-step__icon--in-progress" aria-label="In Progress">●</span>;
    return <span className="tob-step__icon tob-step__icon--locked" aria-label="Locked">○</span>;
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TrainingOnboardingPage = ({
    userName = 'John',
    steps = DEFAULT_STEPS,
    supplementalResources = DEFAULT_SUPPLEMENTAL,
    onStartModule,
    onContinueModule,
}) => {
    const [supplementalOpen, setSupplementalOpen] = useState(false);

    // ── Derived state ──────────────────────────────────────────────────────────
    const completedCount = steps.filter((s) => s.status === 'completed').length;
    const totalCount = steps.length;
    const progressPct = Math.round((completedCount / totalCount) * 100);

    /**
     * P2 — One Decision at a Time
     * Surface exactly one "next step" — the first non-completed step.
     */
    const nextStep = steps.find((s) => s.status !== 'completed') || null;
    const isNextStepInProgress = nextStep?.status === 'in-progress';

    const topBarConfig = {
        breadcrumbs: [
            { text: 'Home', href: '#' },
            { text: 'Training' },
            { text: 'Onboarding' },
        ],
        user: { name: userName, counter: false },
    };

    const sidebarConfig = {
        user: 'tutor',
        activeTab: 'onboarding',
    };

    // ── Handlers ───────────────────────────────────────────────────────────────
    const handlePrimaryCta = () => {
        if (!nextStep) return;
        if (isNextStepInProgress && onContinueModule) onContinueModule(nextStep);
        else if (onStartModule) onStartModule(nextStep);
        else console.log('[TrainingOnboardingPage] Primary CTA clicked:', nextStep);
    };

    const handleStepClick = (step) => {
        if (step.status === 'locked') return;
        if (step.status === 'in-progress' && onContinueModule) onContinueModule(step);
        else if (step.status === 'completed' && onStartModule) onStartModule(step);
        console.log('[TrainingOnboardingPage] Step row clicked:', step);
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="training-onboarding-page"
        >
            <div className="tob">

                {/* ── SECTION 1: Welcome Header ──────────────────────────────────────
            UX P1 — Progress Visibility Reduces Anxiety
            Shows name + progress bar + step count so tutors feel oriented. */}
                <section className="tob__section tob__section--header" aria-label="Welcome">
                    <div className="tob__welcome">
                        <div className="tob__welcome-text">
                            <h1 className="tob__welcome-title h4">
                                Welcome, {userName}. Let&apos;s get you ready to tutor.
                            </h1>
                            <p className="tob__welcome-subtitle body2-txt">
                                Complete these steps to unlock your first session.
                            </p>
                        </div>
                        <div className="tob__progress" aria-label="Onboarding progress">
                            <div className="tob__progress-label body3-txt">
                                Step {completedCount + (nextStep ? 1 : 0)} of {totalCount} &nbsp;·&nbsp; {progressPct}% complete
                            </div>
                            <div className="tob__progress-bar" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                                <div className="tob__progress-fill" style={{ width: `${progressPct}%` }} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── SECTION 2: Primary CTA — "Your Next Step" ──────────────────────
            UX P2 — One Decision at a Time
            Always visible above the fold. One action. One module. No ambiguity. */}
                {nextStep && (
                    <section className="tob__section tob__section--cta" aria-label="Your next step">
                        <div className="tob__next-step">
                            <div className="tob__next-step-label caption-txt">📍 YOUR NEXT STEP</div>
                            <div className="tob__next-step-body">
                                <div className="tob__next-step-info">
                                    <h2 className="tob__next-step-title h4">{nextStep.title}</h2>
                                    <p className="tob__next-step-desc body2-txt">{nextStep.description}</p>
                                    <span className="tob__next-step-duration body3-txt">⏱ {nextStep.duration}</span>
                                </div>
                                {/* PRIMARY CTA — single, prominent, unambiguous */}
                                <div className="tob__next-step-action">
                                    <Button
                                        text={isNextStepInProgress ? 'Continue Module' : 'Start Module'}
                                        style="primary"
                                        fill="filled"
                                        size="large"
                                        id="tob-primary-cta"
                                        onClick={handlePrimaryCta}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── SECTION 3: Onboarding Path ─────────────────────────────────────
            UX P3 — Structure Before Content
            A clear linear sequence. Status labels replace browsable content. */}
                <section className="tob__section tob__section--path" aria-label="Onboarding path">
                    <h3 className="tob__section-title h4">Your Onboarding Path</h3>
                    <ol className="tob__step-list" aria-label="Required modules in order">
                        {steps.map((step, index) => (
                            <li
                                key={step.id}
                                className={`tob-step tob-step--${step.status}`}
                                onClick={() => handleStepClick(step)}
                                role={step.status !== 'locked' ? 'button' : undefined}
                                tabIndex={step.status !== 'locked' ? 0 : undefined}
                                aria-label={`Step ${index + 1}: ${step.title} — ${step.status}`}
                                onKeyDown={(e) => e.key === 'Enter' && handleStepClick(step)}
                            >
                                <div className="tob-step__number body3-txt">{index + 1}</div>
                                <StepStatusIcon status={step.status} />
                                <div className="tob-step__content">
                                    <span className="tob-step__title body2-txt">{step.title}</span>
                                    <span className="tob-step__duration body3-txt">{step.duration}</span>
                                </div>
                                <div className="tob-step__status-badge">
                                    {step.status === 'completed' && (
                                        <span className="tob-step__badge tob-step__badge--completed body3-txt">Complete</span>
                                    )}
                                    {step.status === 'in-progress' && (
                                        <span className="tob-step__badge tob-step__badge--in-progress body3-txt">In Progress</span>
                                    )}
                                    {step.status === 'locked' && (
                                        <span className="tob-step__badge tob-step__badge--locked body3-txt">Locked</span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* ── SECTION 4: Supplemental Resources (collapsed by default) ────────
            UX P2 — One Decision at a Time
            Hidden so as not to compete with the primary journey.
            Available but not primary — accessible after onboarding is underway. */}
                <section className="tob__section tob__section--supplemental" aria-label="Optional resources">
                    <button
                        className="tob__supplemental-toggle body2-txt"
                        id="tob-supplemental-toggle"
                        onClick={() => setSupplementalOpen((prev) => !prev)}
                        aria-expanded={supplementalOpen}
                    >
                        {supplementalOpen ? '▲' : '▼'} &nbsp;
                        {supplementalOpen ? 'Hide Supplemental Resources' : 'Show Supplemental Resources'}
                    </button>

                    {supplementalOpen && (
                        <ul className="tob__supplemental-list" aria-label="Optional resources">
                            {supplementalResources.map((res) => (
                                <li key={res.id} className="tob__supplemental-item body2-txt">
                                    <span className="tob__supplemental-type body3-txt">[{res.type}]</span>
                                    &nbsp;{res.title}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

            </div>
        </PageLayout>
    );
};

TrainingOnboardingPage.propTypes = {
    /** Tutor's first name for personalized greeting */
    userName: PropTypes.string,
    /** Ordered list of required onboarding steps */
    steps: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            title: PropTypes.string.isRequired,
            description: PropTypes.string,
            duration: PropTypes.string,
            status: PropTypes.oneOf(['completed', 'in-progress', 'locked']).isRequired,
        })
    ),
    /** Optional supplemental resources shown in collapsed section */
    supplementalResources: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            title: PropTypes.string.isRequired,
            type: PropTypes.oneOf(['video', 'document', 'link']),
        })
    ),
    /** Called when tutor clicks Start on a locked/not-started module */
    onStartModule: PropTypes.func,
    /** Called when tutor clicks Continue on an in-progress module */
    onContinueModule: PropTypes.func,
};

export default TrainingOnboardingPage;
