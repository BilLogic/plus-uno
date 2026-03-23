/**
 * WC5_CompactDrawer.jsx — Welcome Card Variation 5
 *
 * LAYOUT: Tight persistent bar + collapsible milestone drawer
 *   ALWAYS VISIBLE — greeting + slim progress bar + "Continue" CTA in one row
 *   EXPANDABLE     — "View all N steps" toggle reveals full milestone checklist
 *
 * UX STRENGTHS:
 *   • Smallest default footprint — module grid stays above the fold
 *   • The persistent bar answers "where am I?" without any interaction
 *   • Drawer reveals full context on demand without navigation
 *   • Works best for returning users who know the flow; also usable for first-timers
 *
 * TRADEOFFS:
 *   • Milestones are hidden by default — first-timers may not know to expand
 *   • Extra click to see the full journey (vs. WC1–WC4 where it's always visible)
 *   • "Continue" label alone may be insufficient call-to-action for day-one tutors
 *
 * BEST FOR: Returning tutors OR pages where the module grid is the primary content
 *   and the header needs to stay minimal.
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Button';
import { WELCOME_MODULES } from './welcome-shared';
import './welcome-card-variations.scss';

const WC5_CompactDrawer = ({ userName = 'Ashley', modules = WELCOME_MODULES }) => {
    const [drawerOpen, setDrawerOpen] = useState(false);

    const completedCount = modules.filter((m) => m.status === 'completed').length;
    const totalCount = modules.length;
    const pct = Math.round((completedCount / totalCount) * 100);
    const nextModule = modules.find((m) => m.status !== 'completed');
    const isInProgress = nextModule?.status === 'in-progress';

    return (
        <div className="wc wc5">

            {/* Always-visible compact bar */}
            <div className="wc5__bar">
                <div className="wc5__greeting">
                    <p className="wc5__name">Welcome, {userName}</p>
                    <p className="wc5__status">
                        Step {completedCount + 1} of {totalCount}&nbsp;&bull;&nbsp;
                        {isInProgress ? 'In Progress' : 'Not Started'}
                    </p>
                </div>

                <div className="wc5__progress" aria-label={`${pct}% complete`}>
                    <div
                        className="wc5__prog-bar"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <div className="wc5__prog-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="wc5__prog-label body3-txt">{pct}% complete</span>
                </div>

                {nextModule && (
                    <div className="wc5__cta">
                        <Button
                            text={isInProgress ? 'Continue' : 'Get Started'}
                            style="primary"
                            fill="filled"
                            size="small"
                        />
                    </div>
                )}
            </div>

            {/* Drawer toggle */}
            <button
                className="wc5__toggle body3-txt"
                onClick={() => setDrawerOpen((o) => !o)}
                aria-expanded={drawerOpen}
                aria-controls="wc5-drawer"
            >
                <i
                    className={`fa-solid fa-chevron-down wc5__toggle-icon ${drawerOpen ? 'wc5__toggle-icon--open' : ''}`}
                    aria-hidden="true"
                />
                {drawerOpen ? 'Hide' : 'View all'} {totalCount} training steps
            </button>

            {/* Expandable milestone drawer */}
            <div
                id="wc5-drawer"
                className={`wc5__drawer ${drawerOpen ? '' : 'wc5__drawer--hidden'}`}
                role="region"
                aria-label="All training steps"
            >
                <ol className="wc5__list">
                    {modules.map((mod, i) => {
                        const isCompleted = mod.status === 'completed';
                        const isActive = mod.status === 'in-progress';
                        const isLocked = mod.status === 'locked';
                        return (
                            <li
                                key={mod.id}
                                className={[
                                    'wc5__row',
                                    isActive && 'wc5__row--active',
                                    isLocked && 'wc5__row--locked',
                                ].filter(Boolean).join(' ')}
                                aria-label={`${mod.title}: ${mod.status}`}
                            >
                                <span className="wc5__row-icon" aria-hidden="true">
                                    {isCompleted
                                        ? <i className="fa-solid fa-circle-check" />
                                        : isActive
                                        ? <i className="fa-solid fa-circle-dot" />
                                        : <i className="fa-regular fa-circle" />
                                    }
                                </span>
                                <span className="wc5__row-num body3-txt">{i + 1}.</span>
                                <span className="wc5__row-title">{mod.title}</span>
                                <span className="wc5__row-dur body3-txt">{mod.duration}</span>
                                {isCompleted && (
                                    <span className="wc5__row-badge wc5__row-badge--done body3-txt">Done</span>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </div>

        </div>
    );
};

WC5_CompactDrawer.propTypes = {
    userName: PropTypes.string,
    modules: PropTypes.array,
};

export default WC5_CompactDrawer;
