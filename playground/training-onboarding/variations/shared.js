/**
 * shared.js — Shared mock data + utilities for all Onboarding layout variations
 *
 * All 4 variations use identical content hierarchy (same data, different structure).
 * Changing props here affects every variation simultaneously — great for A/B comparison.
 */

// ─── Shared step data ─────────────────────────────────────────────────────────
export const MOCK_STEPS = [
    {
        id: 1,
        title: 'Welcome to PLUS',
        description: 'Learn what PLUS is and how it operates.',
        duration: '9 mins',
        status: 'completed',
    },
    {
        id: 2,
        title: 'Your Role at PLUS',
        description: 'Understand your responsibilities as a tutor.',
        duration: '12 mins',
        status: 'in-progress',
    },
    {
        id: 3,
        title: 'Tutoring Session Overview',
        description: 'Walk through what a standard session looks like.',
        duration: '15 mins',
        status: 'locked',
    },
    {
        id: 4,
        title: 'Student Communication',
        description: 'Best practices for engaging and motivating students.',
        duration: '10 mins',
        status: 'locked',
    },
    {
        id: 5,
        title: 'Session Wrap-Up & Reporting',
        description: 'How to close sessions and complete post-session notes.',
        duration: '11 mins',
        status: 'locked',
    },
];

export const MOCK_SUPPLEMENTAL = [
    { id: 'r1', title: 'PLUS Style Guide', type: 'document' },
    { id: 'r2', title: 'Common Parent Questions', type: 'document' },
    { id: 'r3', title: 'Escalation Protocols', type: 'video' },
];

// ─── Shared utilities ─────────────────────────────────────────────────────────

/** Returns the first non-completed step (the "next step") */
export const getNextStep = (steps) =>
    steps.find((s) => s.status !== 'completed') || null;

/** Returns progress as 0–100 integer */
export const getProgressPct = (steps) => {
    const completed = steps.filter((s) => s.status === 'completed').length;
    return Math.round((completed / steps.length) * 100);
};

/** Consistent PageLayout configs used by all variations */
export const getPageLayoutConfigs = (userName) => ({
    topBarConfig: {
        breadcrumbs: [
            { text: 'Home', href: '#' },
            { text: 'Training' },
            { text: 'Onboarding' },
        ],
        user: { name: userName, counter: false },
    },
    sidebarConfig: {
        user: 'tutor',
        activeTab: 'onboarding',
    },
});
