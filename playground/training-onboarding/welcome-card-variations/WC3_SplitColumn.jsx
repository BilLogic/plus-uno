/**
 * WC3_SplitColumn.jsx — Welcome Card Variation 3
 *
 * LAYOUT: Side-by-side two-column
 *   LEFT (36%)  — Brand-tinted summary: greeting + progress bar + "Next Up" CTA
 *   RIGHT (64%) — Full vertical stepper: all 6 milestones with status + duration chips
 *
 * UX STRENGTHS:
 *   • Equal visual weight to "where I am" and "the full path"
 *   • Left CTA is immediately actionable; right column provides context without friction
 *   • Vertical stepper on right is a familiar "onboarding wizard" pattern
 *   • Clear visual separation — purpose of each column is unambiguous
 *
 * TRADEOFFS:
 *   • Requires ≥960px width to be readable — narrow tablets may need stacking
 *   • More cognitive load than single-column layouts (two things to read)
 *   • Left panel looks sparse if there's no active "Next Up" module
 *
 * BEST FOR: First-timers who need both motivation (left CTA) and orientation (right path).
 */

import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Button';
import { WELCOME_MODULES } from './welcome-shared';
import './welcome-card-variations.scss';

const WC3_SplitColumn = ({ userName = 'Ashley', modules = WELCOME_MODULES }) => {
    const completedCount = modules.filter((m) => m.status === 'completed').length;
    const totalCount = modules.length;
    const pct = Math.round((completedCount / totalCount) * 100);
    const nextModule = modules.find((m) => m.status !== 'completed');
    const isInProgress = nextModule?.status === 'in-progress';

    return (
        <div className="wc wc3">

            {/* Left: summary + CTA */}
            <div className="wc3__left">
                <div>
                    <h2 className="h4 wc3__name">Welcome,<br />{userName}</h2>
                    <p className="body2-txt wc3__sub">
                        Complete your training to start tutoring students.
                    </p>
                </div>

                <div className="wc3__bar-wrap">
                    <div className="wc3__bar-label">
                        <span className="body3-txt">{completedCount} of {totalCount} complete</span>
                        <span className="body3-txt">{pct}%</span>
                    </div>
                    <div
                        className="wc3__bar"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${pct}% complete`}
                    >
                        <div className="wc3__bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                </div>

                {nextModule && (
                    <div className="wc3__next">
                        <div className="wc3__next-label body3-txt">Next Up</div>
                        <div className="wc3__next-title body1-txt">{nextModule.title}</div>
                        <div className="wc3__next-dur body3-txt">{nextModule.duration}</div>
                        <Button
                            text={isInProgress ? 'Continue' : 'Get Started'}
                            style="primary"
                            fill="filled"
                            size="medium"
                        />
                    </div>
                )}
            </div>

            {/* Right: full vertical stepper */}
            <div className="wc3__right">
                <p className="wc3__path-title">Your Training Path</p>
                <ol className="wc3__steps" aria-label="Training path">
                    {modules.map((mod, i) => {
                        const isCompleted = mod.status === 'completed';
                        const isActive = mod.status === 'in-progress';
                        const isLocked = mod.status === 'locked';
                        return (
                            <li
                                key={mod.id}
                                className={[
                                    'wc3__step',
                                    isCompleted && 'wc3__step--completed',
                                    isActive && 'wc3__step--active',
                                    isLocked && 'wc3__step--locked',
                                ].filter(Boolean).join(' ')}
                                aria-label={`Step ${i + 1}: ${mod.title} — ${mod.status}`}
                            >
                                <div className="wc3__step-node" aria-hidden="true">
                                    {isCompleted
                                        ? <i className="fa-solid fa-check" />
                                        : <span>{i + 1}</span>
                                    }
                                </div>
                                <div className="wc3__step-body">
                                    <p className="wc3__step-title">{mod.title}</p>
                                    <div className="wc3__step-meta">
                                        <span>{mod.duration}</span>
                                        <span className={`wc3__step-chip wc3__step-chip--${isCompleted ? 'completed' : isActive ? 'active' : 'locked'}`}>
                                            {isCompleted ? 'Done' : isActive ? 'In Progress' : 'Locked'}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>

        </div>
    );
};

WC3_SplitColumn.propTypes = {
    userName: PropTypes.string,
    modules: PropTypes.array,
};

export default WC3_SplitColumn;
