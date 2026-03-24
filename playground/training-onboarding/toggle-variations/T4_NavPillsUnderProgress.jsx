/**
 * T4_NavPillsUnderProgress.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * TOGGLE VARIATION 4: NavPills Contextual Toggle — Adjacent to Progress Bar
 *
 * PLACEMENT:       Inside the hero block, on the same row as the progress bar.
 *                  The progress bar sits left; the pill toggle sits right.
 *                  They share a flex row — both are "progress context" elements.
 * TOGGLE STYLE:    PLUS NavPills → pill buttons (rounded, filled when active)
 *                  "Path" (list) | "Cards" (card view)
 *                  Short labels — pills stay compact within the hero strip
 * DEFAULT VIEW:    List ("Path") — positionally the left/first pill = default
 *
 * COMPONENT MAP:
 *   NavPills        → provides the pill navigation (plus-nav-pills class)
 *   NavPills.Item   → individual pill tab with active state
 *   PageLayout      → page frame
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * UX STRENGTHS:
 *   • Contextual co-location: progress bar and view toggle are both about "how you see
 *     your progress" — grouping them in the hero block is semantically coherent
 *   • Pills are a lightweight, visually contained toggle — doesn't disrupt section flow
 *   • Keeps the content section header clean: no controls, just the section title h2
 *   • NavPills are visually distinct from action buttons — less risk of misclicking
 *   • Short labels ("Path" vs "Cards") save space without sacrificing meaning in context
 *   • Switching view doesn't change section heading — consistent spatial orientation
 *
 * TRADEOFFS:
 *   • Placing the toggle inside the hero means it controls content far below the fold —
 *     spatial distance creates a disconnect between control and effect
 *   • Two pills alongside a progress bar creates slight visual competition
 *   • "Path" and "Cards" are short — may feel too terse if tutors are unfamiliar with
 *     what "Path" means in this context
 *   • Users accustomed to top-right icon toggles may not look in the hero for view controls
 *   • Hero block becomes denser — risk of crowding if other elements are added later
 *
 * BEST WHEN:
 *   • The hero block is minimal and has horizontal room to add the pills without crowding
 *   • You want the toggle to feel like a "display preference" rather than a "navigation choice"
 *   • The section content area is intentionally free of chrome (no section header controls)
 *   • Research shows users set their view preference once on landing and rarely switch
 *     (making the top-of-page placement — set it and forget it — appropriate)
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '@/specs/Universal/Pages';
import { CardView, ListStepperView, ProgressStrip, TOGGLE_STEPS, NavPills } from './ViewToggleShell';
import './toggle-variations.scss';

const T4_NavPillsUnderProgress = ({
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
        <PageLayout topBarConfig={topBarConfig} sidebarConfig={{ user: 'tutor', activeTab: 'onboarding' }} id="t4-pills-hero">
            <div className="tv tv--t4">

                {/*
                 * ── T4 TOGGLE: Hero block — progress bar + pills on same row ──
                 * Both progress and view toggle live inside the hero context block.
                 * Semantic grouping: "how you track and how you see your journey"
                 */}
                <header className="tv__header tv__header--t4">
                    <div className="tv__header-top">
                        <div>
                            <h1 className="tv__title h4">Welcome, {userName}. Let's get you ready to tutor.</h1>
                            <p className="tv__subtitle body2-txt">Complete these steps to unlock your first session.</p>
                        </div>
                    </div>

                    {/* Progress + Pills on the same contextual row */}
                    <div className="tv__header-bottom tv__header-bottom--t4">
                        <ProgressStrip completedCount={completedCount} total={steps.length} pct={pct} />

                        {/*
                         * PLUS NavPills → horizontal pill toggle
                         * activeKey + onSelect manages the view state
                         * Short labels: "Path" and "Cards"
                         */}
                        <NavPills
                            id="t4-view-toggle"
                            activeKey={view}
                            onSelect={(k) => setView(k)}
                            className="tv__pills"
                            aria-label="Select view"
                        >
                            <NavPills.Item
                                eventKey="list"
                                active={view === 'list'}
                                onClick={() => setView('list')}
                                id="t4-pill-list"
                                aria-label="Path view"
                            >
                                Path
                            </NavPills.Item>
                            <NavPills.Item
                                eventKey="card"
                                active={view === 'card'}
                                onClick={() => setView('card')}
                                id="t4-pill-card"
                                aria-label="Cards view"
                            >
                                Cards
                            </NavPills.Item>
                        </NavPills>
                    </div>
                </header>

                {/* Content section — no controls here, clean header */}
                <section className="tv__section">
                    <h2 className="tv__section-title h4">Your Onboarding Path</h2>
                    {view === 'list' ? (
                        <ListStepperView steps={steps} onContinue={s => console.log('[T4] Continue:', s.title)} />
                    ) : (
                        <CardView steps={steps} />
                    )}
                </section>

            </div>
        </PageLayout>
    );
};

T4_NavPillsUnderProgress.propTypes = {
    userName: PropTypes.string,
    steps: PropTypes.array,
    defaultView: PropTypes.oneOf(['card', 'list']),
};

export default T4_NavPillsUnderProgress;
