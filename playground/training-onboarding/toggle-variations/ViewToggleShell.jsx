/**
 * ViewToggleShell.jsx — Shared shell for all 4 toggle placement variations
 *
 * Contains:
 *   - CardView: renders OnboardingModuleCard grid (gallery layout)
 *   - ListStepperView: renders the linear stepper list from V1
 *
 * Each toggle variation (T1–T4) wraps this shell with a different
 * placement/style of the Card ↔ List toggle control.
 *
 * ─── PLUS DS components used ──────────────────────────────────────────────────
 *   Button           → icon-only and labeled toggling
 *   ButtonGroup      → connected segmented control (T2, T4)
 *   NavTabs          → tab underline pattern (T3)
 *   NavPills         → pill navigation pattern (T2 alt)
 *   OnboardingModuleCard → the actual card component in gallery view
 *   PageLayout       → page frame
 */

import React from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '@/specs/Universal/Pages';
import Button from '@/components/Button';
import ButtonGroup from '@/components/ButtonGroup';
import NavTabs from '@/components/NavTabs';
import NavPills from '@/components/NavPills';
import OnboardingModuleCard from '@/specs/Training/onboarding/Cards/OnboardingModuleCard/OnboardingModuleCard';

import './toggle-variations.scss';

// ─── Shared mock data ─────────────────────────────────────────────────────────

export const TOGGLE_STEPS = [
    { id: 1, title: 'Welcome to PLUS', description: 'Learn what PLUS is and how it operates.', duration: '9 mins', stage: 'completed', badgeType: 'video' },
    { id: 2, title: 'Your Role at PLUS', description: 'Understand your responsibilities as a tutor.', duration: '12 mins', stage: 'in progress', badgeType: 'document' },
    { id: 3, title: 'Tutoring Session Overview', description: 'Walk through what a standard session looks like.', duration: '15 mins', stage: 'not started', badgeType: 'video' },
    { id: 4, title: 'Student Communication', description: 'Best practices for engaging and motivating students.', duration: '10 mins', stage: 'not started', badgeType: 'other' },
    { id: 5, title: 'Session Wrap-Up & Reporting', description: 'How to close sessions and complete post-session notes.', duration: '11 mins', stage: 'not started', badgeType: 'document' },
];

// ─── CARD / GALLERY VIEW ─────────────────────────────────────────────────────

export const CardView = ({ steps }) => (
    <div className="toggle-shell__card-grid" role="list" aria-label="Onboarding modules — card view">
        {steps.map((step) => (
            <div key={step.id} role="listitem" className="toggle-shell__card-item">
                <OnboardingModuleCard
                    title={step.title}
                    duration={step.duration}
                    variant="thumbnail"
                    badgeType={step.badgeType}
                    stage={step.stage}
                />
            </div>
        ))}
    </div>
);

CardView.propTypes = { steps: PropTypes.array };

// ─── LIST / STEPPER VIEW ─────────────────────────────────────────────────────

export const ListStepperView = ({ steps, onContinue }) => {
    const statusMap = {
        'completed': { icon: '✓', label: 'Complete' },
        'in progress': { icon: '●', label: 'In Progress' },
        'not started': { icon: '○', label: 'Locked' },
    };

    return (
        <ol className="toggle-shell__list" aria-label="Onboarding modules — list view">
            {steps.map((step, i) => {
                const { icon, label } = statusMap[step.stage] || statusMap['not started'];
                const isActive = step.stage === 'in progress';
                return (
                    <li
                        key={step.id}
                        className={`toggle-shell__list-item toggle-shell__list-item--${step.stage.replace(' ', '-')} ${isActive ? 'toggle-shell__list-item--active' : ''}`}
                    >
                        <div className="toggle-shell__list-number body3-txt">{i + 1}</div>
                        <span className={`toggle-shell__list-icon toggle-shell__list-icon--${step.stage.replace(' ', '-')}`}>{icon}</span>
                        <div className="toggle-shell__list-content">
                            <span className="toggle-shell__list-title body2-txt">{step.title}</span>
                            <span className="toggle-shell__list-duration body3-txt">{step.duration}</span>
                        </div>
                        <span className={`toggle-shell__list-badge body3-txt toggle-shell__list-badge--${step.stage.replace(' ', '-')}`}>
                            {label}
                        </span>
                        {isActive && (
                            <Button
                                text="Continue"
                                style="primary"
                                fill="filled"
                                size="small"
                                onClick={() => onContinue && onContinue(step)}
                            />
                        )}
                    </li>
                );
            })}
        </ol>
    );
};

ListStepperView.propTypes = { steps: PropTypes.array, onContinue: PropTypes.func };

// ─── Shared progress bar strip ────────────────────────────────────────────────

export const ProgressStrip = ({ completedCount, total, pct }) => (
    <div className="toggle-shell__progress">
        <span className="body3-txt toggle-shell__progress-label">
            {completedCount} of {total} complete · {pct}%
        </span>
        <div className="toggle-shell__progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="toggle-shell__progress-fill" style={{ width: `${pct}%` }} />
        </div>
    </div>
);

ProgressStrip.propTypes = { completedCount: PropTypes.number, total: PropTypes.number, pct: PropTypes.number };

// ─── Re-export PLUS DS components for direct use in toggle variations ─────────

export { Button, ButtonGroup, NavTabs, NavPills };
