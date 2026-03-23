/**
 * T1_TopRightIconButtons.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * TOGGLE VARIATION 1: Top-Right Icon-Only Button Pair
 *
 * PLACEMENT:       Top-right of the content section header, aligned with title
 * TOGGLE STYLE:    Two icon-only Buttons in a ButtonGroup (PLUS ButtonGroup)
 *                  grid icon (⊞) = Card / list icon (☰) = List
 *                  Active button → fill="tonal", inactive → fill="ghost"
 * DEFAULT VIEW:    List (Stepper) — because onboarding is journey-first, not browse-first
 *
 * COMPONENT MAP:
 *   ButtonGroup   → wraps both icon buttons as a connected control pair
 *   Button        → icon-only, size="small", toggled via fill + active props
 *   PageLayout    → page frame
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * UX STRENGTHS:
 *   • Minimal footprint — does not eat into vertical space or headline prominence
 *   • Icon-only is universally understood for view switching (standard in file explorers,
 *     photo libraries, e-commerce grids)
 *   • ButtonGroup gives the pair a connected "one control" affordance — not two separate buttons
 *   • Keeps the section header semantically clean: title left, utility right
 *   • Fast switching — small target area but discoverable by experienced users
 *
 * TRADEOFFS:
 *   • Icon-only: tutors new to the product may not immediately understand the metaphor
 *   • No label means no built-in discoverability for first-time users
 *   • Small click targets — accessibility concern on touch devices
 *   • Top-right placement is visually distant from the content it controls
 *     (Fitts' Law — users must travel far to toggle)
 *   • No affordance about which view was default and why
 *
 * BEST WHEN:
 *   • Users are returning / repeat visitors who already know the two views
 *   • Horizontal space is tight and you can't afford wider controls
 *   • The page has many other controls and you want the toggle to not compete
 *   • Analytics show tutor view preferences stabilise after session 2 (preference sets in)
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '@/specs/Universal/Pages';
import { CardView, ListStepperView, ProgressStrip, TOGGLE_STEPS, Button, ButtonGroup } from './ViewToggleShell';
import './toggle-variations.scss';

const T1_TopRightIconButtons = ({
    userName = 'Ashley',
    steps = TOGGLE_STEPS,
    defaultView = 'list',
}) => {
    const [view, setView] = useState(defaultView); // 'card' | 'list'
    const completedCount = steps.filter(s => s.stage === 'completed').length;
    const pct = Math.round((completedCount / steps.length) * 100);

    const topBarConfig = {
        breadcrumbs: [{ text: 'Home', href: '#' }, { text: 'Training' }, { text: 'Onboarding' }],
        user: { name: userName, counter: false },
    };

    return (
        <PageLayout topBarConfig={topBarConfig} sidebarConfig={{ user: 'tutor', activeTab: 'onboarding' }} id="t1-top-right-icon">
            <div className="tv tv--t1">

                {/* Welcome + Progress (unchanged from approved structure) */}
                <header className="tv__header">
                    <div>
                        <h1 className="tv__title h4">Welcome, {userName}. Let's get you ready to tutor.</h1>
                        <p className="tv__subtitle body2-txt">Complete these steps to unlock your first session.</p>
                    </div>
                    <ProgressStrip completedCount={completedCount} total={steps.length} pct={pct} />
                </header>

                {/* Section: toggle anchored to section header title row */}
                <section className="tv__section">

                    {/* ── T1 TOGGLE: top-right of section header ──────────── */}
                    <div className="tv__section-header">
                        <h2 className="tv__section-title h4">Your Onboarding Path</h2>

                        {/*
                         * PLUS ButtonGroup → two icon-only Buttons
                         * Active: fill="tonal" | Inactive: fill="ghost"
                         * size="small" to stay compact in header row
                         */}
                        <ButtonGroup
                            id="t1-view-toggle"
                            ariaLabel="Switch view: card or list"
                            size="small"
                            style="default"
                            fill="ghost"
                        >
                            <Button
                                id="t1-toggle-list"
                                leadingVisual="list"
                                fill={view === 'list' ? 'tonal' : 'ghost'}
                                style="default"
                                size="small"
                                active={view === 'list'}
                                title="List view"
                                aria-pressed={view === 'list'}
                                onClick={() => setView('list')}
                            />
                            <Button
                                id="t1-toggle-card"
                                leadingVisual="grip"
                                fill={view === 'card' ? 'tonal' : 'ghost'}
                                style="default"
                                size="small"
                                active={view === 'card'}
                                title="Card view"
                                aria-pressed={view === 'card'}
                                onClick={() => setView('card')}
                            />
                        </ButtonGroup>
                    </div>

                    {/* Content — swaps based on active view */}
                    {view === 'list' ? (
                        <ListStepperView steps={steps} onContinue={s => console.log('[T1] Continue:', s.title)} />
                    ) : (
                        <CardView steps={steps} />
                    )}
                </section>

            </div>
        </PageLayout>
    );
};

T1_TopRightIconButtons.propTypes = {
    userName: PropTypes.string,
    steps: PropTypes.array,
    defaultView: PropTypes.oneOf(['card', 'list']),
};

export default T1_TopRightIconButtons;
