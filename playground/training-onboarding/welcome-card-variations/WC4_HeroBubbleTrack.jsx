/**
 * WC4_HeroBubbleTrack.jsx — Welcome Card Variation 4
 *
 * LAYOUT: Two-row hero card
 *   TOP HERO   — Dark brand gradient: large greeting + animated SVG progress ring
 *   BOTTOM ROW — 6 large connected bubble steps with title + duration below each
 *
 * UX STRENGTHS:
 *   • Most emotionally engaging — dark hero feels welcoming and motivating
 *   • Progress ring gives instant "how far is this?" without reading numbers
 *   • Bubble track makes the journey feel game-like and achievable
 *   • CTA lives inside the hero where the user's eye is already focused
 *
 * TRADEOFFS:
 *   • Tallest card — consumes the most vertical space
 *   • Dark background may feel tonally heavy for an onboarding page
 *   • Bubble labels truncate on 6+ steps at standard widths
 *
 * BEST FOR: First-timers who need motivation + orientation simultaneously.
 *   Highest chance of driving the first click from a new tutor.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Button';
import { WELCOME_MODULES } from './welcome-shared';
import './welcome-card-variations.scss';

const WC4_HeroBubbleTrack = ({ userName = 'Ashley', modules = WELCOME_MODULES }) => {
    const completedCount = modules.filter((m) => m.status === 'completed').length;
    const totalCount = modules.length;
    const pct = Math.round((completedCount / totalCount) * 100);
    const nextModule = modules.find((m) => m.status !== 'completed');
    const isInProgress = nextModule?.status === 'in-progress';

    const r = 40;
    const circumference = 2 * Math.PI * r;
    const arc = circumference * (pct / 100);

    return (
        <div className="wc wc4">

            {/* Hero band */}
            <div className="wc4__hero">
                <div className="wc4__hero-text">
                    <h2 className="h4 wc4__headline">You&apos;re on your way, {userName}! 🎓</h2>
                    <p className="body2-txt wc4__hero-sub">
                        Complete all {totalCount} modules to become a certified PLUS tutor
                        and unlock your first session.
                    </p>
                    {nextModule && (
                        <Button
                            text={isInProgress
                                ? `Continue: ${nextModule.title}`
                                : `Get Started: ${nextModule.title}`
                            }
                            style="secondary"
                            fill="filled"
                            size="medium"
                        />
                    )}
                </div>

                <div className="wc4__ring-wrap" aria-label={`${completedCount} of ${totalCount} modules complete`}>
                    <svg className="wc4__ring-svg" viewBox="0 0 100 100" aria-hidden="true">
                        <circle
                            cx="50" cy="50" r={r}
                            fill="none"
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth="8"
                        />
                        <circle
                            cx="50" cy="50" r={r}
                            fill="none"
                            stroke="#fff"
                            strokeWidth="8"
                            strokeDasharray={`${arc} ${circumference}`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="wc4__ring-text" aria-hidden="true">
                        <span className="wc4__ring-num">{completedCount}/{totalCount}</span>
                        <span className="wc4__ring-label">modules</span>
                    </div>
                </div>
            </div>

            {/* Milestone bubble track */}
            <div className="wc4__track" aria-label="Training milestones">
                {modules.map((mod) => {
                    const isCompleted = mod.status === 'completed';
                    const isActive = mod.status === 'in-progress';
                    return (
                        <div
                            key={mod.id}
                            className={[
                                'wc4__step',
                                isCompleted && 'wc4__step--completed',
                                isActive && 'wc4__step--active',
                                (!isCompleted && !isActive) && 'wc4__step--locked',
                            ].filter(Boolean).join(' ')}
                            aria-label={`${mod.title}: ${mod.status}`}
                        >
                            <div className="wc4__bubble" aria-hidden="true">
                                {isCompleted
                                    ? <i className="fa-solid fa-check" />
                                    : isActive
                                    ? <i className="fa-solid fa-play" />
                                    : <span>{mod.id}</span>
                                }
                            </div>
                            <span className="wc4__step-title">{mod.title}</span>
                            <span className="wc4__step-dur">{mod.duration}</span>
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

WC4_HeroBubbleTrack.propTypes = {
    userName: PropTypes.string,
    modules: PropTypes.array,
};

export default WC4_HeroBubbleTrack;
