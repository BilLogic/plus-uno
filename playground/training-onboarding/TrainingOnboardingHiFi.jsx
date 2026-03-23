/**
 * TrainingOnboardingHiFi.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Prototyping MODE — Training → Onboarding Page (High-Fidelity)
 *
 * ─── WC4 Hero Progress Card (replaces ProgressHeader + NextStepBanner) ────────
 *   Dark gradient hero band: greeting + animated SVG progress ring
 *   Interactive milestone bubble track: 6 step bubbles, click-to-trigger CTA
 *   Ring SVG animates in on mount (strokeDasharray transition 0.8s)
 *   Bubble hover → scale + shadow (CSS)
 *   Bubble focus → 2px primary outline (keyboard-accessible)
 *   Locked bubbles → disabled, reduced opacity
 *
 * ─── PLUS DS Components Used ─────────────────────────────────────────────────
 *   PageLayout              → page frame (top bar + sidebar)
 *   Button                  → hero CTA, toggle icons
 *   OnboardingModulesTable  → list view (spec table: thumbnail, duration, progress, actions)
 *   OnboardingModuleCard    → card view item (with thumbnail images)
 *   CtaButtons              → Get Started / Continue / Review CTA (card view + table internal)
 *
 * ─── Status Logic ────────────────────────────────────────────────────────────
 *   completed   → 'success' tonal CTA ("Review"), check icon, card muted
 *   in progress → highlighted card, 'primary' filled CTA ("Continue")
 *   not started → locked appearance, no CTA, lock icon visible
 *   (first not-started after in-progress row = unlocked next step)
 *
 * ─── Toggle Behavior ─────────────────────────────────────────────────────────
 *   • Switches between list and card views
 *   • No re-render of data on toggle
 *   • CSS transition crossfade (opacity 200ms)
 *   • Scroll position preserved via CSS (no JS scroll reset)
 *
 * ─── Responsive Grid (Card View) ─────────────────────────────────────────────
 *   XL (≥1440px): 3 columns
 *   LG (≥1024px): 2 columns
 *   MD (≥768px):  1 column
 */

import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '@/specs/Universal/Pages';
import Button from '@/components/Button';
import OnboardingModuleCard from '@/specs/Training/onboarding/Cards/OnboardingModuleCard/OnboardingModuleCard';
import CtaButtons from '@/specs/Training/onboarding/Elements/CtaButtons/CtaButtons';
import OnboardingModulesTable from '@/specs/Training/onboarding/Tables/OnboardingModulesTable/OnboardingModulesTable';
import './TrainingOnboardingHiFi.scss';

// ─── Module thumbnail images ─────────────────────────────────────────────────
import imgWelcome from './assets/module-1-welcome-to-plus.jpg';
import imgYourRole from './assets/module-2-your-role-at-plus.jpg';
import imgSessionOverview from './assets/module-3-tutoring-session-overview.jpg';
import imgSessionResponsibilities from './assets/module-4-tutoring-session-responsibilities.jpg';
import imgHelpingStudents from './assets/module-5-helping-students.jpg';
import imgTutoringTools from './assets/module-6-tutoring-tools.jpg';

// ─── Module data ──────────────────────────────────────────────────────────────

const DEFAULT_MODULES = [
    {
        id: 1,
        title: 'Welcome to PLUS',
        duration: '9 mins',
        badgeType: 'video',
        stage: 'completed',
        description: 'In this module, you\'ll meet the PLUS team. We\'re happy to have you aboard!',
        imageUrl: imgWelcome,
    },
    {
        id: 2,
        title: 'Your Role at PLUS',
        duration: '12 mins',
        badgeType: 'document',
        stage: 'in progress',
        description: 'In this module, you\'ll learn about what your job is as a PLUS tutor.',
        imageUrl: imgYourRole,
    },
    {
        id: 3,
        title: 'Tutoring Session Overview',
        duration: '15 mins',
        badgeType: 'video',
        stage: 'not started',
        description: 'In this module, you\'ll learn about how PLUS tutoring sessions work: who will be there, what their role is, and what you\'ll do.',
        imageUrl: imgSessionOverview,
    },
    {
        id: 4,
        title: 'Tutoring Session Responsibilities',
        duration: '15 mins',
        badgeType: 'document',
        stage: 'not started',
        description: 'In this module, you\'ll learn about your responsibilities before, during, and after a tutoring session.',
        imageUrl: imgSessionResponsibilities,
    },
    {
        id: 5,
        title: 'Helping Students',
        duration: '15 mins',
        badgeType: 'other',
        stage: 'not started',
        description: 'In this module, you\'ll learn tutoring strategies and how to use insights from the PLUS dashboards to help your students.',
        imageUrl: imgHelpingStudents,
    },
    {
        id: 6,
        title: 'Tutoring Tools',
        duration: '15 mins',
        badgeType: 'document',
        stage: 'not started',
        description: 'In this module, you\'ll learn best practices for using the Zoom and Pencil video conferencing platforms.',
        imageUrl: imgTutoringTools,
    },
];

// ─── Helper: derive unlock state ──────────────────────────────────────────────

/**
 * A module is "unlocked" if:
 *   - It is completed, OR
 *   - It is in-progress, OR
 *   - It is the first "not started" module after all completed/in-progress modules
 */
function getModuleUnlockState(modules) {
    let foundFirstLocked = false;
    return modules.map((mod) => {
        if (mod.stage === 'completed' || mod.stage === 'in progress') {
            return { ...mod, locked: false };
        }
        if (!foundFirstLocked) {
            foundFirstLocked = true;
            return { ...mod, locked: false }; // next step: unlocked
        }
        return { ...mod, locked: true };
    });
}

// ─── Sub-component: ViewToggle ────────────────────────────────────────────────
// Exactly matches LessonsOverviewPage pattern:
//   icons: fa-list-ul | fa-table-cells-large
//   size: small
//   style: primary
//   active fill: tonal | inactive fill: ghost
//   container: border + overflow:hidden (from .lessons-overview-page__view-toggle)

const ViewToggle = ({ view, onChange }) => (
    <div
        className="oob-hifi__view-toggle"
        role="group"
        aria-label="Toggle between list and card view"
    >
        <Button
            id="oob-toggle-list"
            leadingVisual="list-ul"
            style="primary"
            fill={view === 'list' ? 'tonal' : 'ghost'}
            size="small"
            active={view === 'list'}
            aria-pressed={view === 'list'}
            aria-label="List view"
            title="List view"
            onClick={() => onChange('list')}
        />
        <Button
            id="oob-toggle-card"
            leadingVisual="table-cells-large"
            style="primary"
            fill={view === 'card' ? 'tonal' : 'ghost'}
            size="small"
            active={view === 'card'}
            aria-pressed={view === 'card'}
            aria-label="Card view"
            title="Card view"
            onClick={() => onChange('card')}
        />
    </div>
);

ViewToggle.propTypes = {
    view: PropTypes.oneOf(['list', 'card']).isRequired,
    onChange: PropTypes.func.isRequired,
};

// ─── Sub-component: HeroProgressCard ─────────────────────────────────────────
// WC4 — Dark gradient hero + animated progress ring + interactive milestone bubbles.
// Replaces the previous ProgressHeader + NextStepBanner.
//
// Interactive behaviours:
//   • Hero CTA fires onCta(nextModule)
//   • Each unlocked bubble fires onCta(module)
//   • SVG ring animates in on mount (strokeDasharray transition, 0.8s)
//   • Bubble hover  → scale(1.08) + shadow (CSS :hover)
//   • Bubble focus  → 2px primary outline (keyboard-accessible)
//   • Locked bubbles → disabled, lock icon, reduced opacity

const HeroProgressCard = ({ userName, modules, nextModule, onCta }) => {
    const completedCount = modules.filter((m) => m.stage === 'completed').length;
    const totalCount = modules.length;
    const pct = Math.round((completedCount / totalCount) * 100);
    const isInProgress = nextModule?.stage === 'in progress';

    // Animate the ring SVG on mount
    const [ringReady, setRingReady] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setRingReady(true), 80);
        return () => clearTimeout(t);
    }, []);

    const r = 40;
    const circumference = 2 * Math.PI * r; // ≈ 251.3
    const arc = circumference * (pct / 100);

    return (
        <div className="oob-hifi__hero-card">

            {/* ── Hero band: greeting + progress ring ── */}
            <div className="oob-hifi__hero-band">
                <div className="oob-hifi__hero-text">
                    <h1 className="h4 oob-hifi__hero-title">
                        You&apos;re on your way, {userName}!
                    </h1>
                    <p className="body2-txt oob-hifi__hero-sub">
                        Complete all {totalCount} modules to become a certified PLUS tutor
                        and unlock your first tutoring session.
                    </p>

                    {nextModule ? (
                        <div className="oob-hifi__hero-cta-wrap">
                            <Button
                                id="oob-hero-cta"
                                text={isInProgress
                                    ? `Continue: ${nextModule.title}`
                                    : `Get Started: ${nextModule.title}`
                                }
                                style="primary"
                                fill="filled"
                                size="medium"
                                onClick={() => onCta && onCta(nextModule)}
                                aria-label={`${isInProgress ? 'Continue' : 'Get Started'}: ${nextModule.title}`}
                            />
                        </div>
                    ) : (
                        <p className="body2-txt oob-hifi__hero-complete-msg">
                            🎉 All modules complete — your first session is ready!
                        </p>
                    )}
                </div>

                {/* Animated SVG progress ring */}
                <div
                    className="oob-hifi__hero-ring-wrap"
                    aria-label={`${completedCount} of ${totalCount} modules complete`}
                >
                    <svg className="oob-hifi__hero-ring-svg" viewBox="0 0 100 100" aria-hidden="true">
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
                            strokeLinecap="round"
                            style={{
                                strokeDasharray: ringReady
                                    ? `${arc} ${circumference}`
                                    : `0 ${circumference}`,
                                transition: 'stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.15s',
                            }}
                        />
                    </svg>
                    <div className="oob-hifi__hero-ring-text" aria-hidden="true">
                        <span className="oob-hifi__hero-ring-num">{completedCount}/{totalCount}</span>
                        <span className="oob-hifi__hero-ring-label">modules</span>
                    </div>
                </div>
            </div>

            {/* ── Interactive milestone bubble track ── */}
            <div className="oob-hifi__bubble-track" role="list" aria-label="Training milestones">
                {modules.map((mod) => {
                    const isCompleted = mod.stage === 'completed';
                    const isActive = mod.stage === 'in progress';
                    const isLocked = mod.locked;

                    return (
                        <button
                            key={mod.id}
                            role="listitem"
                            className={[
                                'oob-hifi__bubble-step',
                                isCompleted && 'oob-hifi__bubble-step--completed',
                                isActive   && 'oob-hifi__bubble-step--active',
                                isLocked   && 'oob-hifi__bubble-step--locked',
                            ].filter(Boolean).join(' ')}
                            onClick={() => !isLocked && onCta && onCta(mod)}
                            disabled={isLocked}
                            aria-label={`Module ${mod.id}: ${mod.title} — ${mod.stage}${isLocked ? ' (locked)' : ''}`}
                            title={`${mod.title} · ${mod.duration}`}
                        >
                            <div className="oob-hifi__bubble" aria-hidden="true">
                                {isCompleted
                                    ? <i className="fa-solid fa-check" />
                                    : isActive
                                    ? <i className="fa-solid fa-play" />
                                    : isLocked
                                    ? <i className="fa-solid fa-lock" />
                                    : <span>{mod.id}</span>
                                }
                            </div>
                            <span className="oob-hifi__bubble-label body3-txt">{mod.title}</span>
                            <span className="oob-hifi__bubble-dur body3-txt">
                                <i className="fa-regular fa-clock" aria-hidden="true" />
                                &nbsp;{mod.duration}
                            </span>
                        </button>
                    );
                })}
            </div>

        </div>
    );
};

HeroProgressCard.propTypes = {
    userName: PropTypes.string.isRequired,
    modules: PropTypes.array.isRequired,
    nextModule: PropTypes.object,
    onCta: PropTypes.func,
};

// ─── Sub-component: ModuleCardItem ───────────────────────────────────────────
// Card view item — wraps OnboardingModuleCard with CTA inside the card.

const ModuleCardItem = ({ module, onCta }) => {
    const isLocked = module.locked;
    const isCompleted = module.stage === 'completed';

    return (
        <div
            className={[
                'oob-hifi__card-item',
                isLocked && 'oob-hifi__card-item--locked',
                isCompleted && 'oob-hifi__card-item--completed',
                module.stage === 'in progress' && 'oob-hifi__card-item--active',
            ].filter(Boolean).join(' ')}
            aria-label={`Module: ${module.title} — ${module.stage}`}
            tabIndex={0}
        >
            {/* Description overlay — appears on hover/focus over the image area */}
            <div className="oob-hifi__card-desc-overlay" aria-hidden="true">
                <p className="oob-hifi__card-desc-text body2-txt">
                    {module.description}
                </p>
            </div>

            <OnboardingModuleCard
                title={module.title}
                duration={module.duration}
                variant="thumbnail"
                badgeType={module.badgeType}
                stage={module.stage}
                imageUrl={module.imageUrl}
                ctaSlot={
                    isLocked ? (
                        <div className="oob-hifi__card-locked-label body3-txt">
                            <i className="fa-solid fa-lock" aria-hidden="true" />
                            &nbsp;Locked
                        </div>
                    ) : (
                        <CtaButtons
                            state={module.stage}
                            onClick={() => onCta && onCta(module)}
                        />
                    )
                }
            />
        </div>
    );
};

ModuleCardItem.propTypes = {
    module: PropTypes.object.isRequired,
    onCta: PropTypes.func,
};

// ─── Main page component ─────────────────────────────────────────────────────

const TrainingOnboardingHiFi = ({
    userName = 'Ashley Xu',
    modules = DEFAULT_MODULES,
    defaultView = 'card',
    onModuleCta,
    welcomeCardVariant = 'default', // 'default' | 'soft-gradient' (prototyping)
}) => {
    const [view, setView] = useState(defaultView);

    // Derive unlock state (stable — does not change on view toggle)
    const processedModules = useMemo(() => getModuleUnlockState(modules), [modules]);

    const completedCount = useMemo(
        () => processedModules.filter((m) => m.stage === 'completed').length,
        [processedModules]
    );

    const nextModule = useMemo(
        () => processedModules.find((m) => m.stage === 'in progress') ||
            processedModules.find((m) => m.stage === 'not started' && !m.locked),
        [processedModules]
    );

    const handleCta = (module) => {
        if (onModuleCta) onModuleCta(module);
    };

    const topBarConfig = {
        breadcrumbs: [
            { text: 'Home', href: '#' },
            { text: 'Training' },
            { text: 'Onboarding' },
        ],
        user: { name: userName, counter: true, counterValue: 2 },
    };

    const sidebarConfig = {
        user: 'tutor',
        activeTabId: 'onboarding',
    };

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="training-onboarding-hifi"
        >
            <div
                className={[
                    'oob-hifi',
                    welcomeCardVariant === 'soft-gradient' && 'oob-hifi--welcome-soft-gradient',
                ].filter(Boolean).join(' ')}
            >

                {/* ── 1. Hero Progress Card (WC4) ─────────────────────────── */}
                <HeroProgressCard
                    userName={userName}
                    modules={processedModules}
                    nextModule={nextModule}
                    onCta={handleCta}
                />

                {/* ── 3. Section + Toggle ─────────────────────────────────── */}
                <section className="oob-hifi__section" aria-labelledby="oob-section-title">
                    <div className="oob-hifi__section-header">
                        <h2 id="oob-section-title" className="h4 oob-hifi__section-title">
                            Your Onboarding Path
                        </h2>

                        {/*
                         * VIEW TOGGLE — matches LessonsOverviewPage exactly:
                         *   icon: fa-list-ul  (list)
                         *   icon: fa-table-cells-large  (card/grid)
                         *   style="primary", fill="tonal" active | fill="ghost" inactive
                         *   size="small"
                         *   container: border + overflow:hidden (same SCSS pattern as Lessons)
                         */}
                        <ViewToggle view={view} onChange={setView} />
                    </div>

                    {/* ── 4. Content Area — crossfade on view switch ────────── */}
                    <div className="oob-hifi__content-area">

                        {/* LIST VIEW — OnboardingModulesTable from spec */}
                        <div
                            className={`oob-hifi__list-view ${view === 'list' ? 'oob-hifi__view--visible' : 'oob-hifi__view--hidden'}`}
                            aria-hidden={view !== 'list'}
                            role="region"
                            aria-label="Module list"
                        >
                            <OnboardingModulesTable
                                modules={processedModules.map((mod) => ({
                                    ...mod,
                                    ctaState: mod.stage,
                                }))}
                                sortable={true}
                                onCtaClick={(mod) => !mod.locked && handleCta(mod)}
                                onModuleClick={(mod) => !mod.locked && handleCta(mod)}
                            />
                        </div>

                        {/* CARD VIEW */}
                        <div
                            className={`oob-hifi__card-view ${view === 'card' ? 'oob-hifi__view--visible' : 'oob-hifi__view--hidden'}`}
                            aria-hidden={view !== 'card'}
                            role="region"
                            aria-label="Module cards"
                        >
                            {/* Responsive grid: 3col@XL / 2col@LG / 1col@MD */}
                            <div className="oob-hifi__card-grid">
                                {processedModules.map((mod) => (
                                    <ModuleCardItem
                                        key={mod.id}
                                        module={mod}
                                        onCta={handleCta}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 5. Footer ───────────────────────────────────────────── */}
                <footer className="oob-hifi__footer">
                    <p className="body3-txt">
                        v5.2.0 | Copyright © Carnegie Mellon University 2026 | Terms of Use
                    </p>
                </footer>

            </div>
        </PageLayout>
    );
};

TrainingOnboardingHiFi.propTypes = {
    /** Tutor's display name */
    userName: PropTypes.string,
    /**
     * Array of onboarding modules.
     * Stage drives all status logic.
     */
    modules: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        title: PropTypes.string.isRequired,
        duration: PropTypes.string.isRequired,
        badgeType: PropTypes.oneOf(['image', 'video', 'audio', 'document', 'book', 'website', 'other']),
        stage: PropTypes.oneOf(['not started', 'in progress', 'completed']).isRequired,
        description: PropTypes.string,
        imageUrl: PropTypes.string,
    })),
    /** Default view on first render — 'card' shows the gallery layout */
    defaultView: PropTypes.oneOf(['list', 'card']),
    /** Called when user clicks a module CTA */
    onModuleCta: PropTypes.func,
    /** 'default' = dark hero; 'soft-gradient' = prototyping VS1 light hero */
    welcomeCardVariant: PropTypes.oneOf(['default', 'soft-gradient']),
};

export default TrainingOnboardingHiFi;
export { DEFAULT_MODULES };
// WC4 hero card is active — HeroProgressCard replaces old ProgressHeader + NextStepBanner
