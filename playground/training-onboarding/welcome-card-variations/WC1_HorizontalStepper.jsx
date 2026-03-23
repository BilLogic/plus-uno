/**
 * WC1_HorizontalStepper.jsx — Welcome Card Variation 1
 *
 * LAYOUT: Stacked — greeting → progress bar → horizontal milestone strip
 *
 * UX STRENGTHS:
 *   • Full journey visible at once — critical for first-timers who want to see scope
 *   • Left-to-right step flow mirrors temporal progression (familiar mental model)
 *   • Active step is visually dominant without hiding the others
 *   • Compact height — doesn't dominate the page
 *
 * TRADEOFFS:
 *   • Step labels truncate on narrow screens — desktop-first
 *   • Low info density per step (no descriptions or CTA inline)
 *   • 6 steps is near the limit; 7+ would feel crowded
 *
 * BEST FOR: First-timer who needs immediate orientation — "how far is this journey?"
 */

import React from 'react';
import PropTypes from 'prop-types';
import { WELCOME_MODULES } from './welcome-shared';
import './welcome-card-variations.scss';

const WC1_HorizontalStepper = ({ userName = 'Ashley', modules = WELCOME_MODULES }) => {
    const completedCount = modules.filter((m) => m.status === 'completed').length;
    const totalCount = modules.length;
    const pct = Math.round((completedCount / totalCount) * 100);

    return (
        <div className="wc wc1">

            {/* Header: greeting + completion badge */}
            <div className="wc1__header">
                <div className="wc1__greeting">
                    <h2 className="h4 wc1__name">Welcome, {userName} 👋</h2>
                    <p className="body2-txt wc1__sub">
                        Complete all {totalCount} modules to unlock your first tutoring session.
                    </p>
                </div>
                <div className="body3-txt wc1__badge">
                    {completedCount} of {totalCount} complete
                </div>
            </div>

            {/* Progress bar */}
            <div className="wc1__bar-wrap">
                <div
                    className="wc1__bar"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${pct}% of training complete`}
                >
                    <div className="wc1__bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="wc1__pct body3-txt">{pct}%</span>
            </div>

            {/* Horizontal milestone strip */}
            <div className="wc1__strip" aria-label="Training milestones">
                {modules.map((mod) => {
                    const isCompleted = mod.status === 'completed';
                    const isActive = mod.status === 'in-progress';
                    return (
                        <div
                            key={mod.id}
                            className={[
                                'wc1__step',
                                isCompleted && 'wc1__step--completed',
                                isActive && 'wc1__step--active',
                            ].filter(Boolean).join(' ')}
                            aria-label={`${mod.title}: ${mod.status}`}
                        >
                            <div className="wc1__bubble" aria-hidden="true">
                                {isCompleted
                                    ? <i className="fa-solid fa-check" />
                                    : isActive
                                    ? <i className="fa-solid fa-play" />
                                    : <span>{mod.id}</span>
                                }
                            </div>
                            <span className="wc1__label">{mod.title}</span>
                            <span className="wc1__dur">{mod.duration}</span>
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

WC1_HorizontalStepper.propTypes = {
    userName: PropTypes.string,
    modules: PropTypes.array,
};

export default WC1_HorizontalStepper;
