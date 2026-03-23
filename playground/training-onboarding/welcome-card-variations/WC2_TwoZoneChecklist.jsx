/**
 * WC2_TwoZoneChecklist.jsx — Welcome Card Variation 2
 *
 * LAYOUT: Two-zone card separated by a divider
 *   TOP ZONE   — Greeting + animated SVG progress ring ("1/6 done")
 *   BOTTOM ZONE — Full module checklist with inline status icons + Continue CTA
 *
 * UX STRENGTHS:
 *   • Most complete information density — every module visible with status at a glance
 *   • Progress ring gives an instant emotional read ("almost there" vs "just started")
 *   • Inline "Continue" on the active row reduces navigation steps
 *   • Familiar checklist pattern — first-timers understand immediately
 *
 * TRADEOFFS:
 *   • Taller card — pushes module grid further down the page
 *   • Less spatial; users must read row-by-row rather than scan a path
 *   • "Locked" rows may demotivate if first-timer sees too many at once
 *
 * BEST FOR: Users who want full transparency about scope before they commit.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Button';
import { WELCOME_MODULES } from './welcome-shared';
import './welcome-card-variations.scss';

const WC2_TwoZoneChecklist = ({ userName = 'Ashley', modules = WELCOME_MODULES }) => {
    const completedCount = modules.filter((m) => m.status === 'completed').length;
    const totalCount = modules.length;
    const pct = Math.round((completedCount / totalCount) * 100);

    const r = 28;
    const circumference = 2 * Math.PI * r;
    const arc = circumference * (pct / 100);

    return (
        <div className="wc wc2">

            {/* Top Zone: greeting + progress ring */}
            <div className="wc2__top">
                <div className="wc2__intro">
                    <h2 className="h4 wc2__title">Ready to get started, {userName}?</h2>
                    <p className="body2-txt wc2__sub">
                        Work through these modules in order to become a certified PLUS tutor.
                    </p>
                </div>
                <div className="wc2__stat" aria-label={`${pct}% complete`}>
                    <svg className="wc2__ring" viewBox="0 0 80 80" aria-hidden="true">
                        <circle
                            cx="40" cy="40" r={r}
                            fill="none"
                            stroke="var(--color-surface-variant, #dde3ea)"
                            strokeWidth="6"
                        />
                        <circle
                            cx="40" cy="40" r={r}
                            fill="none"
                            stroke="var(--color-primary, #006492)"
                            strokeWidth="6"
                            strokeDasharray={`${arc} ${circumference}`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="wc2__stat-text">
                        <span className="wc2__stat-num">{completedCount}/{totalCount}</span>
                        <span className="wc2__stat-label">done</span>
                    </div>
                </div>
            </div>

            <div className="wc2__divider" aria-hidden="true" />

            {/* Bottom Zone: module checklist */}
            <ol className="wc2__list" aria-label="Training modules">
                {modules.map((mod, i) => {
                    const isCompleted = mod.status === 'completed';
                    const isActive = mod.status === 'in-progress';
                    const isLocked = mod.status === 'locked';
                    return (
                        <li
                            key={mod.id}
                            className={[
                                'wc2__row',
                                isActive && 'wc2__row--in-progress',
                                isLocked && 'wc2__row--locked',
                            ].filter(Boolean).join(' ')}
                            aria-label={`${mod.title}: ${mod.status}`}
                        >
                            <span className="wc2__row-icon" aria-hidden="true">
                                {isCompleted
                                    ? <i className="fa-solid fa-circle-check" />
                                    : isActive
                                    ? <i className="fa-solid fa-circle-half-stroke" />
                                    : <i className="fa-regular fa-circle" />
                                }
                            </span>
                            <span className="body3-txt wc2__row-num">{i + 1}.</span>
                            <span className="wc2__row-title">{mod.title}</span>
                            <span className="body3-txt wc2__row-dur">{mod.duration}</span>
                            {isActive && (
                                <Button text="Continue" style="primary" fill="filled" size="small" />
                            )}
                            {isCompleted && (
                                <span className="wc2__row-badge wc2__row-badge--done body3-txt">Done</span>
                            )}
                            {isLocked && (
                                <span className="wc2__row-badge wc2__row-badge--locked body3-txt" aria-label="Locked">
                                    <i className="fa-solid fa-lock" aria-hidden="true" />
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>

        </div>
    );
};

WC2_TwoZoneChecklist.propTypes = {
    userName: PropTypes.string,
    modules: PropTypes.array,
};

export default WC2_TwoZoneChecklist;
