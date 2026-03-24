/**
 * V4_ChecklistCompletion.jsx — Variation 4: Checklist Completion Layout
 *
 * LAYOUT STRATEGY: Task completion focus — checklist-first, CTA inline
 *   TOP      ← Welcome + circular progress ring + completion count
 *   MIDDLE   ← Checklist-style step rows (checkbox + title + duration + status)
 *             Current step row is highlighted + contains embedded CTA button
 *   FOOTER   ← Supplemental (collapsed)
 *
 * UX STRENGTHS:
 *   • Checklist model triggers a strong completion instinct — extremely motivating
 *   • Inline CTA on the active row eliminates a navigation layer ("click to act here")
 *   • Very scannable — tutors immediately see what's done and what's left
 *   • Compact vertical layout — no horizontal space wasted, works on small screens
 *   • Familiar pattern — mirrors task managers (Todoist, Notion, Asana) tutors already use
 *   • Progress ring adds a visible "satisfaction metric" without stats dashboard overhead
 *
 * TRADEOFFS:
 *   • Checklist pattern can understate the depth of each module (just a task, not learning)
 *   • Step descriptions are compressed — less room for context and motivation
 *   • The inline CTA pattern may feel unexpected if users expect a dedicated CTA area
 *   • Checked items visually fade — may discourage reviewing completed content
 *
 * BEST USE CASE:
 *   The highest-clarity layout for action-oriented tutors who want to know
 *   "what's left and how fast can I finish?" Ideal when the primary goal is
 *   completion velocity (e.g., tutors with a deadline to be certified before first session).
 *   Best fit if session length is short (< 15 mins total) — feels very executable.
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

// ── Circular progress ring (SVG-based wireframe version) ─────────────────────
const ProgressRing = ({ pct, size = 80 }) => {
    const radius = (size - 8) / 2;         // 8 = stroke*2
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;
    return (
        <svg
            className="v4-ring"
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            aria-label={`${pct}% complete`}
            role="img"
        >
            {/* Track */}
            <circle
                className="v4-ring__track"
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={8}
            />
            {/* Fill */}
            <circle
                className="v4-ring__fill"
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={8}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.4s ease' }}
            />
            {/* Centre label */}
            <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="central"
                className="v4-ring__label"
            >
                {pct}%
            </text>
        </svg>
    );
};

const V4_ChecklistCompletion = ({
    userName = 'Ashley',
    steps = MOCK_STEPS,
    supplementalResources = MOCK_SUPPLEMENTAL,
    onStartModule,
    onContinueModule,
}) => {
    const nextStep = getNextStep(steps);
    const progressPct = getProgressPct(steps);
    const completedCount = steps.filter((s) => s.status === 'completed').length;
    const totalMins = steps.reduce((acc, s) => acc + parseInt(s.duration, 10), 0);
    const remainingMins = steps
        .filter((s) => s.status !== 'completed')
        .reduce((acc, s) => acc + parseInt(s.duration, 10), 0);

    const [supplementalOpen, setSupplementalOpen] = useState(false);
    const { topBarConfig, sidebarConfig } = getPageLayoutConfigs(userName);

    const handleCta = (step) => {
        if (!step) return;
        const action = step.status === 'in-progress' ? onContinueModule : onStartModule;
        if (action) action(step);
        else console.log('[V4_ChecklistCompletion] CTA:', step);
    };

    const isAllDone = completedCount === steps.length;

    return (
        <PageLayout topBarConfig={topBarConfig} sidebarConfig={sidebarConfig} id="v4-checklist-completion">
            <div className="v4">

                {/* ── Header: Progress ring + welcome ────────────────────── */}
                <header className="v4__header">
                    <div className="v4__header-ring-zone">
                        <ProgressRing pct={progressPct} size={80} />
                        <div className="v4__ring-meta">
                            <h1 className="v4__title h4">
                                {isAllDone
                                    ? `🎉 Done, ${userName}! You're ready to tutor.`
                                    : `Welcome, ${userName}. Let's get you ready to tutor.`}
                            </h1>
                            <p className="v4__subtitle body2-txt">
                                {isAllDone
                                    ? `All ${steps.length} steps complete.`
                                    : `${completedCount} of ${steps.length} steps done · ~${remainingMins} min left`}
                            </p>
                        </div>
                    </div>
                </header>

                {/* ── Checklist ───────────────────────────────────────────── */}
                <section className="v4__checklist" aria-label="Onboarding checklist">
                    <h2 className="v4__checklist-title body3-txt">REQUIRED STEPS</h2>

                    <ol className="v4__list">
                        {steps.map((step, index) => {
                            const isActive = step.id === nextStep?.id;
                            const isDone = step.status === 'completed';
                            const isLocked = step.status === 'locked';

                            return (
                                <li
                                    key={step.id}
                                    className={[
                                        'v4-item',
                                        `v4-item--${step.status}`,
                                        isActive ? 'v4-item--active' : '',
                                    ].join(' ')}
                                    aria-label={`Step ${index + 1}: ${step.title} — ${step.status}`}
                                >
                                    {/* Checkbox indicator */}
                                    <div
                                        className={`v4-item__check v4-item__check--${step.status}`}
                                        aria-hidden="true"
                                    >
                                        {isDone && '✓'}
                                        {step.status === 'in-progress' && '●'}
                                        {isLocked && '○'}
                                    </div>

                                    {/* Step content */}
                                    <div className="v4-item__body">
                                        <div className="v4-item__title-row">
                                            <span className={`v4-item__title body2-txt ${isDone ? 'v4-item__title--done' : ''}`}>
                                                {step.title}
                                            </span>
                                            <span className="v4-item__duration body3-txt">{step.duration}</span>
                                        </div>

                                        {/* Description + inline CTA only on the active step */}
                                        {isActive && (
                                            <div className="v4-item__active-zone">
                                                <p className="v4-item__desc body2-txt">{step.description}</p>
                                                {/* PRIMARY CTA — embedded inline in the active row */}
                                                <Button
                                                    text={step.status === 'in-progress' ? 'Continue Module' : 'Start Module'}
                                                    style="primary"
                                                    fill="filled"
                                                    size="medium"
                                                    id="v4-primary-cta"
                                                    onClick={() => handleCta(step)}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Status badge (right-aligned) */}
                                    <div className="v4-item__badge-wrap">
                                        {isDone && (
                                            <span className="v4-item__badge v4-item__badge--done body3-txt">Complete</span>
                                        )}
                                        {isActive && (
                                            <span className="v4-item__badge v4-item__badge--active body3-txt">In Progress</span>
                                        )}
                                        {isLocked && (
                                            <span className="v4-item__badge v4-item__badge--locked body3-txt">Locked</span>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </section>

                {/* ── Supplemental (collapsed) ────────────────────────────── */}
                <section className="v4__supplemental" aria-label="Optional resources">
                    <button
                        className="v4__supplemental-toggle body3-txt"
                        onClick={() => setSupplementalOpen((p) => !p)}
                        aria-expanded={supplementalOpen}
                    >
                        {supplementalOpen ? '▲ Hide' : '▼ Show'} supplemental resources
                    </button>
                    {supplementalOpen && (
                        <ul className="v4__supplemental-list">
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

V4_ChecklistCompletion.propTypes = {
    userName: PropTypes.string,
    steps: PropTypes.array,
    supplementalResources: PropTypes.array,
    onStartModule: PropTypes.func,
    onContinueModule: PropTypes.func,
};

export default V4_ChecklistCompletion;
