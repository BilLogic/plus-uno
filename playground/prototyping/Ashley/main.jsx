import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'react-bootstrap';
import TrainingOnboardingClickthrough from './training-onboarding/TrainingOnboardingClickthrough';
import StorybookAIAgent from './storybook-ai-agent-llm-api/StorybookAIAgent';
import TutorTrainingProgressPage from '../../../packages/plus-ds/src/specs/Admin/Tutor Admin/Pages/TutorTrainingProgressPage/TutorTrainingProgressPage';

// ─── Global styles ────────────────────────────────────────────────────────────
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../../packages/plus-ds/src/styles/main.scss'; // PLUS tokens + design system
import '../../../src/index.css';

// ─── Landing Page ─────────────────────────────────────────────────────────────

const CARDS = [
    {
        id: 'training-onboarding',
        title: 'Training Onboarding',
        description: 'A guided, stateful onboarding flow for new PLUS tutors — from consulting sketches to a fully interactive hi-fi prototype.',
        path: '/training-onboarding',
    },
    {
        id: 'ai-agent',
        title: 'PLUS ONE Inline AI Agent',
        description: 'GPT-powered inline AI assistant embedded in a live page — smart navigation, component guidance, and screen explanation.',
        path: '/ai-agent',
    },
];

function LandingPage() {
    const navigate = useNavigate();
    return (
        <div className="plus-landing-page">
            <div className="plus-landing-page__inner">
                <h1 className="h1 plus-landing-page__title">PLUS Application Prototypes</h1>
                <p className="body1-txt plus-landing-page__subtitle">Select a prototype to view:</p>
                <div className="plus-landing-page__cards">
                    {CARDS.map((card) => (
                        <button
                            key={card.id}
                            className="plus-landing-card"
                            onClick={() => navigate(card.path)}
                        >
                            <span className="h3 plus-landing-card__title">{card.title}</span>
                            <span className="body2-txt plus-landing-card__desc">{card.description}</span>
                        </button>
                    ))}
                </div>
            </div>

            <style>{`
                .plus-landing-page {
                    min-height: 100vh;
                    background: var(--color-surface-container, #f4f8f9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 48px 24px;
                }
                .plus-landing-page__inner {
                    width: 100%;
                    max-width: 600px;
                }
                .plus-landing-page__title {
                    margin-bottom: 8px;
                    color: var(--color-on-surface, #0d1b1e);
                }
                .plus-landing-page__subtitle {
                    color: var(--color-on-surface-variant, #5c6f73);
                    margin-bottom: 32px;
                }
                .plus-landing-page__cards {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .plus-landing-card {
                    background: var(--color-surface, #ffffff);
                    border: 1px solid var(--color-outline-variant, #bec8ca);
                    border-radius: var(--size-element-radius-lg, 12px);
                    padding: 20px 24px;
                    text-align: left;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    transition: box-shadow 0.15s ease, border-color 0.15s ease;
                    width: 100%;
                }
                .plus-landing-card:hover {
                    box-shadow: var(--elevation-2, 0 2px 12px rgba(0,100,146,0.12));
                    border-color: var(--color-primary, #006492);
                }
                .plus-landing-card__title {
                    color: var(--color-on-surface, #0d1b1e);
                    display: block;
                }
                .plus-landing-card__desc {
                    color: var(--color-on-surface-variant, #5c6f73);
                    display: block;
                    line-height: 1.5;
                }
            `}</style>
        </div>
    );
}

// ─── AI Agent Page ────────────────────────────────────────────────────────────

function AIAgentPage() {
    return (
        <div style={{ position: 'relative', minHeight: '100vh' }}>
            <TutorTrainingProgressPage userName="Ashley" />
            <StorybookAIAgent pageContext="Tutor Training Progress Page" userName="Ashley" />
        </div>
    );
}

// ─── Route Body Class  ────────────────────────────────────────────────────────
// Applies a CSS class to <body> based on current route so index.css can
// override the fixed 1280×800 frame for the training onboarding page.

const ROUTE_CLASSES = {
    '/training-onboarding': 'page--training-onboarding',
};

function RouteBodyClass() {
    const { pathname } = useLocation();
    useEffect(() => {
        // Remove all managed route classes first
        Object.values(ROUTE_CLASSES).forEach((cls) => document.body.classList.remove(cls));
        // Apply the matching class (if any)
        const cls = ROUTE_CLASSES[pathname];
        if (cls) document.body.classList.add(cls);
    }, [pathname]);
    return null;
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
    return (
        <ThemeProvider>
            <RouteBodyClass />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/training-onboarding" element={<TrainingOnboardingClickthrough userName="Ashley Xu" defaultView="list" />} />
                <Route path="/ai-agent" element={<AIAgentPage />} />
            </Routes>
        </ThemeProvider>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
