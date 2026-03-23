/**
 * WC4_Styled.jsx — WC4 Hero + Bubble Track: Visual Style Variants
 *
 * Identical layout and content to WC4_HeroBubbleTrack.
 * Accepts a `variant` prop that switches the hero's visual treatment
 * while keeping structure, data, and milestone track untouched.
 *
 * Variants:
 *   default        — Dark brand gradient (original WC4 baseline)
 *   soft-gradient  — Light primary-container → surface gradient
 *   flat-container — Solid primary-container fill, no depth
 *   dark-inverse   — Inverse surface (near-black), white text
 *   accent-border  — Light surface-container-low + left primary accent border
 *   elevated-light — White surface + top accent strip + elevation shadow
 *
 * Ring SVG strokes are CSS-class-driven (wc4__ring-track / wc4__ring-progress)
 * so variant modifier classes in SCSS can override them without inline styles.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Button';
import { WELCOME_MODULES } from './welcome-shared';
import './welcome-card-variations.scss';

// Variants with a dark hero use white-on-dark button treatment
const DARK_HERO_VARIANTS = new Set(['default', 'dark-inverse']);

const WC4_Styled = ({ userName = 'Ashley', modules = WELCOME_MODULES, variant = 'default' }) => {
    const completedCount = modules.filter((m) => m.status === 'completed').length;
    const totalCount = modules.length;
    const pct = Math.round((completedCount / totalCount) * 100);
    const nextModule = modules.find((m) => m.status !== 'completed');
    const isInProgress = nextModule?.status === 'in-progress';
    const isDark = DARK_HERO_VARIANTS.has(variant);

    const r = 40;
    const circumference = 2 * Math.PI * r;
    const arc = circumference * (pct / 100);

    const rootClass = [
        'wc',
        'wc4',
        variant !== 'default' && `wc4--${variant}`,
    ].filter(Boolean).join(' ');

    return (
        <div className={rootClass}>

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
                            style={isDark ? 'secondary' : 'primary'}
                            fill="filled"
                            size="medium"
                        />
                    )}
                </div>

                <div className="wc4__ring-wrap" aria-label={`${completedCount} of ${totalCount} modules complete`}>
                    <svg className="wc4__ring-svg" viewBox="0 0 100 100" aria-hidden="true">
                        {/* Stroke colour controlled via CSS class — overridable per variant */}
                        <circle
                            className="wc4__ring-track"
                            cx="50" cy="50" r={r}
                            fill="none"
                            strokeWidth="8"
                        />
                        <circle
                            className="wc4__ring-progress"
                            cx="50" cy="50" r={r}
                            fill="none"
                            strokeWidth="8"
                            strokeDasharray={`${arc} ${circumference}`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="wc4__ring-text" aria-hidden="true">
                        <span className="wc4__ring-num">{completedCount}/{totalCount}</span>
                        <span className="wc4__ring-label">MODULES</span>
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

WC4_Styled.propTypes = {
    userName: PropTypes.string,
    modules: PropTypes.array,
    variant: PropTypes.oneOf([
        'default',
        'soft-gradient',
        'flat-container',
        'dark-inverse',
        'accent-border',
        'elevated-light',
    ]),
};

export default WC4_Styled;
