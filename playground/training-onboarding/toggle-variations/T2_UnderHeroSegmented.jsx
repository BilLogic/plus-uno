/**
 * T2_UnderHeroSegmented.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * TOGGLE VARIATION 2: Segmented Control Under Hero — Labeled + Icon
 *
 * PLACEMENT:       Full-width strip directly below the Welcome/Progress hero block,
 *                  above the content body. Acts as a structural "gateway" between
 *                  the orientation zone (hero) and the action zone (content).
 * TOGGLE STYLE:    ButtonGroup with labeled buttons + leading icon
 *                  "☰ Guided Path" | "⊞ Browse All"
 *                  Active → fill="tonal", style="primary"
 *                  Inactive → fill="outline", style="default"
 * DEFAULT VIEW:    List (Guided Path) — label makes the rationale explicit:
 *                  "Guided Path" signals linearity; "Browse All" signals optionality
 *
 * COMPONENT MAP:
 *   ButtonGroup   → connected labeled button pair (segmented control pattern)
 *   Button        → labeled with leadingVisual icon, size="medium"
 *   PageLayout    → page frame
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * UX STRENGTHS:
 *   • Labels remove all ambiguity — "Guided Path" vs "Browse All" are self-explanatory
 *   • Placement BETWEEN hero and content acts as a natural decision point for the user
 *   • Full-width visual weight matches the importance of the toggle decision
 *   • Icons + labels satisfy both fast-recognition (icon) and literacy (label) users
 *   • Reinforces the hierarchy: hero orients → toggle confirms mode → content executes
 *
 * TRADEOFFS:
 *   • Occupies significant vertical space — pushes content further down the page
 *   • Two large buttons centred may feel heavy for a secondary control
 *   • "Browse All" label implies a browsing library — slightly at odds with
 *     the onboarding-first philosophy (may encourage skipping the path)
 *   • At mobile widths, full-width segmented buttons stack or truncate
 *
 * BEST WHEN:
 *   • This is the user's first encounter with the page (needs maximum clarity)
 *   • The two modes have genuinely different purposes (guide vs explore)
 *   • You want the toggle to serve as an onboarding moment itself:
 *     "Here are your two modes — which do you prefer?"
 *   • Product supports both certified tutors (browse) and new tutors (path) on the same page
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '@/specs/Universal/Pages';
import { CardView, ListStepperView, ProgressStrip, TOGGLE_STEPS, Button, ButtonGroup } from './ViewToggleShell';
import './toggle-variations.scss';

const T2_UnderHeroSegmented = ({
    userName = 'Ashley',
    steps = TOGGLE_STEPS,
    defaultView = 'list',
}) => {
    const [view, setView] = useState(defaultView);
    const completedCount = steps.filter(s => s.stage === 'completed').length;
    const pct = Math.round((completedCount / steps.length) * 100);

    const topBarConfig = {
        breadcrumbs: [{ text: 'Home', href: '#' }, { text: 'Training' }, { text: 'Onboarding' }],
        user: { name: userName, counter: false },
    };

    return (
        <PageLayout topBarConfig={topBarConfig} sidebarConfig={{ user: 'tutor', activeTab: 'onboarding' }} id="t2-under-hero">
            <div className="tv tv--t2">

                {/* Welcome hero */}
                <header className="tv__header">
                    <div>
                        <h1 className="tv__title h4">Welcome, {userName}. Let's get you ready to tutor.</h1>
                        <p className="tv__subtitle body2-txt">Complete these steps to unlock your first session.</p>
                    </div>
                    <ProgressStrip completedCount={completedCount} total={steps.length} pct={pct} />
                </header>

                {/*
                 * ── T2 TOGGLE: Full-width segmented strip below hero ──────────
                 * Sits between hero and content as a structural decision zone.
                 * Uses PLUS ButtonGroup → labeled buttons with icons.
                 * "Guided Path" (list default) vs "Browse All" (card)
                 */}
                <div className="tv__toggle-strip tv__toggle-strip--t2" role="group" aria-label="Select view mode">
                    <ButtonGroup
                        id="t2-view-toggle"
                        ariaLabel="Toggle between guided path and card gallery"
                        size="medium"
                        className="tv__segmented-group"
                    >
                        <Button
                            id="t2-toggle-list"
                            text="Guided Path"
                            leadingVisual="list-ol"
                            fill={view === 'list' ? 'tonal' : 'outline'}
                            style={view === 'list' ? 'primary' : 'default'}
                            size="medium"
                            active={view === 'list'}
                            aria-pressed={view === 'list'}
                            onClick={() => setView('list')}
                        />
                        <Button
                            id="t2-toggle-card"
                            text="Browse All"
                            leadingVisual="grip"
                            fill={view === 'card' ? 'tonal' : 'outline'}
                            style={view === 'card' ? 'primary' : 'default'}
                            size="medium"
                            active={view === 'card'}
                            aria-pressed={view === 'card'}
                            onClick={() => setView('card')}
                        />
                    </ButtonGroup>
                    <span className="tv__toggle-hint body3-txt">
                        {view === 'list'
                            ? 'Following the guided path is recommended for new tutors.'
                            : 'You can browse all modules freely in this view.'}
                    </span>
                </div>

                {/* Content body */}
                <section className="tv__section">
                    <h2 className="tv__section-title h4">
                        {view === 'list' ? 'Your Onboarding Path' : 'All Modules'}
                    </h2>
                    {view === 'list' ? (
                        <ListStepperView steps={steps} onContinue={s => console.log('[T2] Continue:', s.title)} />
                    ) : (
                        <CardView steps={steps} />
                    )}
                </section>

            </div>
        </PageLayout>
    );
};

T2_UnderHeroSegmented.propTypes = {
    userName: PropTypes.string,
    steps: PropTypes.array,
    defaultView: PropTypes.oneOf(['card', 'list']),
};

export default T2_UnderHeroSegmented;
