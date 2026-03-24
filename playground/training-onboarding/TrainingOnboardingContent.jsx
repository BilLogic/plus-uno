import React, { useState, useMemo, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Button';
import OnboardingModuleCard from '@/specs/Training/onboarding/Cards/OnboardingModuleCard/OnboardingModuleCard';
import CtaButtons from '@/specs/Training/onboarding/Elements/CtaButtons/CtaButtons';
import OnboardingModulesTable from '@/specs/Training/onboarding/Tables/OnboardingModulesTable/OnboardingModulesTable';
import { ShellContext } from '../home-redesign/src/context/ShellContext';
import './TrainingOnboardingHiFi.scss';

// ─── Module thumbnail images ─────────────────────────────────────────────────
import imgWelcome from './assets/module-1-welcome-to-plus.jpg';
import imgYourRole from './assets/module-2-your-role-at-plus.jpg';
import imgSessionOverview from './assets/module-3-tutoring-session-overview.jpg';
import imgSessionResponsibilities from './assets/module-4-tutoring-session-responsibilities.jpg';
import imgHelpingStudents from './assets/module-5-helping-students.jpg';
import imgTutoringTools from './assets/module-6-tutoring-tools.jpg';

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

const ViewToggle = ({ view, onChange }) => (
    <div className="oob-hifi__view-toggle" role="group" aria-label="Toggle between list and card view">
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

const HeroProgressCard = ({ userName, modules, nextModule, onCta }) => {
    const completedCount = modules.filter((m) => m.stage === 'completed').length;
    const totalCount = modules.length;
    const pct = Math.round((completedCount / totalCount) * 100);
    const isInProgress = nextModule?.stage === 'in progress';

    const [ringReady, setRingReady] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setRingReady(true), 80);
        return () => clearTimeout(t);
    }, []);

    const r = 40;
    const circumference = 2 * Math.PI * r; 
    const arc = circumference * (pct / 100);

    return (
        <div className="oob-hifi__hero-card">
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
                                text={isInProgress ? `Continue: ${nextModule.title}` : `Get Started: ${nextModule.title}`}
                                style="primary"
                                fill="filled"
                                size="medium"
                                onClick={() => onCta && onCta(nextModule)}
                            />
                        </div>
                    ) : (
                        <p className="body2-txt oob-hifi__hero-complete-msg">
                            🎉 All modules complete — your first session is ready!
                        </p>
                    )}
                </div>
                <div className="oob-hifi__hero-ring-wrap" aria-label={`${completedCount} of ${totalCount} modules complete`}>
                    <svg className="oob-hifi__hero-ring-svg" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                        <circle
                            cx="50" cy="50" r={r}
                            fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round"
                            style={{
                                strokeDasharray: ringReady ? `${arc} ${circumference}` : `0 ${circumference}`,
                                transition: 'stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.15s',
                            }}
                        />
                    </svg>
                    <div className="oob-hifi__hero-ring-text">
                        <span className="oob-hifi__hero-ring-num">{completedCount}/{totalCount}</span>
                        <span className="oob-hifi__hero-ring-label">modules</span>
                    </div>
                </div>
            </div>
            <div className="oob-hifi__bubble-track" role="list">
                {modules.map((mod) => {
                    const isCompleted = mod.stage === 'completed';
                    const isActive = mod.stage === 'in progress';
                    const isLocked = mod.locked;
                    return (
                        <button
                            key={mod.id}
                            className={[
                                'oob-hifi__bubble-step',
                                isCompleted && 'oob-hifi__bubble-step--completed',
                                isActive && 'oob-hifi__bubble-step--active',
                                isLocked && 'oob-hifi__bubble-step--locked',
                            ].filter(Boolean).join(' ')}
                            onClick={() => !isLocked && onCta && onCta(mod)}
                            disabled={isLocked}
                        >
                            <div className="oob-hifi__bubble">
                                {isCompleted ? <i className="fa-solid fa-check" /> : isActive ? <i className="fa-solid fa-play" /> : isLocked ? <i className="fa-solid fa-lock" /> : <span>{mod.id}</span>}
                            </div>
                            <span className="oob-hifi__bubble-label body3-txt">{mod.title}</span>
                            <span className="oob-hifi__bubble-dur body3-txt"><i className="fa-regular fa-clock" />&nbsp;{mod.duration}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const ModuleCardItem = ({ module, onCta }) => {
    const isLocked = module.locked;
    const isCompleted = module.stage === 'completed';
    return (
        <div className={['oob-hifi__card-item', isLocked && 'oob-hifi__card-item--locked', isCompleted && 'oob-hifi__card-item--completed', module.stage === 'in progress' && 'oob-hifi__card-item--active'].filter(Boolean).join(' ')}>
            <div className="oob-hifi__card-desc-overlay"><p className="body2-txt">{module.description}</p></div>
            <OnboardingModuleCard
                title={module.title}
                duration={module.duration}
                variant="thumbnail"
                badgeType={module.badgeType}
                stage={module.stage}
                imageUrl={module.imageUrl}
                ctaSlot={isLocked ? (<div className="oob-hifi__card-locked-label body3-txt"><i className="fa-solid fa-lock" />&nbsp;Locked</div>) : (<CtaButtons state={module.stage} onClick={() => onCta && onCta(module)} />)}
            />
        </div>
    );
};

export const TrainingOnboardingContent = ({
    userName = 'Ashley Xu',
    modules = DEFAULT_MODULES,
    defaultView = 'card',
    onModuleCta,
}) => {
    const { setBreadcrumbs, setMainClassName, setFloatingContent } = useContext(ShellContext);
    const [view, setView] = useState(defaultView);

    useEffect(() => {
        setBreadcrumbs([
            { text: 'Home', href: '/home' },
            { text: 'Training' },
            { text: 'Onboarding' }
        ]);
        setMainClassName('oob-scrollable');
        setFloatingContent(null);
    }, [setBreadcrumbs, setMainClassName, setFloatingContent]);

    const processedModules = useMemo(() => getModuleUnlockState(modules), [modules]);
    const nextModule = useMemo(() => processedModules.find((m) => m.stage === 'in progress') || processedModules.find((m) => m.stage === 'not started' && !m.locked), [processedModules]);

    const handleCta = (module) => { if (onModuleCta) onModuleCta(module); };

    return (
        <div className="oob-hifi">
            <HeroProgressCard userName={userName} modules={processedModules} nextModule={nextModule} onCta={handleCta} />
            <section className="oob-hifi__section">
                <div className="oob-hifi__section-header">
                    <h2 className="h4 oob-hifi__section-title">Your Onboarding Path</h2>
                    <ViewToggle view={view} onChange={setView} />
                </div>
                <div className="oob-hifi__content-area">
                    <div className={`oob-hifi__list-view ${view === 'list' ? 'oob-hifi__view--visible' : 'oob-hifi__view--hidden'}`}>
                        <OnboardingModulesTable
                            modules={processedModules.map((mod) => ({ ...mod, ctaState: mod.stage }))}
                            sortable={true}
                            onCtaClick={handleCta}
                            onModuleClick={handleCta}
                        />
                    </div>
                    <div className={`oob-hifi__card-view ${view === 'card' ? 'oob-hifi__view--visible' : 'oob-hifi__view--hidden'}`}>
                        <div className="oob-hifi__card-grid">
                            {processedModules.map((mod) => (<ModuleCardItem key={mod.id} module={mod} onCta={handleCta} />))}
                        </div>
                    </div>
                </div>
            </section>
            <footer className="oob-hifi__footer">
                <p className="body3-txt">v5.2.0 | Copyright © Carnegie Mellon University 2026</p>
            </footer>
        </div>
    );
};

export default TrainingOnboardingContent;
