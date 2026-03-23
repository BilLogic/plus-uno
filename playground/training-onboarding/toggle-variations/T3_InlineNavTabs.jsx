/**
 * T3_InlineNavTabs.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * TOGGLE VARIATION 3: Inline Nav Tabs (Underline Pattern)
 *
 * PLACEMENT:       Inside the section header — the section title IS the tab bar.
 *                  The "Your Onboarding Path" heading is replaced by tab labels:
 *                  "Step by Step" (list) | "All Modules" (card)
 * TOGGLE STYLE:    PLUS NavTabs → underline pattern from the DS
 *                  The active tab renders the matching content directly below
 *                  No external heading needed — the tab label serves as the heading
 * DEFAULT VIEW:    List ("Step by Step") — first tab = default = most recommended
 *
 * COMPONENT MAP:
 *   NavTabs           → provides the underline tab rail (plus-nav-tabs class)
 *   NavTabs.Item      → individual tab with eventKey
 *   PageLayout        → page frame
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * UX STRENGTHS:
 *   • NavTabs is the most standard, universal "content mode switcher" in web UI
 *   • Underline pattern has zero learning curve — tutors encounter it everywhere
 *   • Takes up no additional vertical space — the tab bar replaces the section heading
 *   • "Step by Step" label reinforces the guided journey metaphor (P3: Structure)
 *   • First tab = first choice = default = recommended — alignment with mental models
 *   • Tab keyboard navigation is built into the PLUS NavTabs / React-Bootstrap Nav
 *
 * TRADEOFFS:
 *   • NavTabs framing may imply "these are equal modes" — flattens the hierarchy
 *     (in reality, "Step by Step" should be strongly preferred for new tutors)
 *   • Underline tabs visually compete with page content (content starts right below)
 *   • "All Modules" tab being visible invites clicks from curious tutors who
 *     might derail their own linear progression by browsing
 *   • Tab pattern is associated with content section switching, not view density toggle
 *
 * BEST WHEN:
 *   • The product genuinely supports two equal workflows (new vs returning tutors)
 *   • Space is at a premium and no extra chrome is acceptable
 *   • The design system's NavTabs is already in heavy use on adjacent pages,
 *     so consistency is a strong factor
 *   • The page is used post-onboarding as a reference (tabs = sections, not toggle)
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '@/specs/Universal/Pages';
import { CardView, ListStepperView, ProgressStrip, TOGGLE_STEPS, NavTabs } from './ViewToggleShell';
import './toggle-variations.scss';

const T3_InlineNavTabs = ({
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
        <PageLayout topBarConfig={topBarConfig} sidebarConfig={{ user: 'tutor', activeTab: 'onboarding' }} id="t3-inline-tabs">
            <div className="tv tv--t3">

                {/* Welcome hero */}
                <header className="tv__header">
                    <div>
                        <h1 className="tv__title h4">Welcome, {userName}. Let's get you ready to tutor.</h1>
                        <p className="tv__subtitle body2-txt">Complete these steps to unlock your first session.</p>
                    </div>
                    <ProgressStrip completedCount={completedCount} total={steps.length} pct={pct} />
                </header>

                {/* Section: tab bar replaces section header title */}
                <section className="tv__section tv__section--t3">

                    {/*
                     * ── T3 TOGGLE: NavTabs inline — replaces section heading ──
                     * PLUS NavTabs → underline nav pattern
                     * The tab label IS the section heading — no separate h2 needed
                     * "Step by Step" → list view | "All Modules" → card view
                     */}
                    <NavTabs
                        id="t3-view-toggle"
                        activeKey={view}
                        onSelect={(k) => setView(k)}
                        className="tv__nav-tabs"
                        aria-label="Choose view mode"
                    >
                        <NavTabs.Item
                            eventKey="list"
                            active={view === 'list'}
                            onClick={() => setView('list')}
                            id="t3-tab-list"
                        >
                            Step by Step
                        </NavTabs.Item>
                        <NavTabs.Item
                            eventKey="card"
                            active={view === 'card'}
                            onClick={() => setView('card')}
                            id="t3-tab-card"
                        >
                            All Modules
                        </NavTabs.Item>
                    </NavTabs>

                    {/* Tab panel — content keyed to active tab */}
                    <div
                        className="tv__tab-panel"
                        role="tabpanel"
                        aria-label={view === 'list' ? 'Step by Step view' : 'All Modules view'}
                    >
                        {view === 'list' ? (
                            <ListStepperView steps={steps} onContinue={s => console.log('[T3] Continue:', s.title)} />
                        ) : (
                            <CardView steps={steps} />
                        )}
                    </div>
                </section>

            </div>
        </PageLayout>
    );
};

T3_InlineNavTabs.propTypes = {
    userName: PropTypes.string,
    steps: PropTypes.array,
    defaultView: PropTypes.oneOf(['card', 'list']),
};

export default T3_InlineNavTabs;
