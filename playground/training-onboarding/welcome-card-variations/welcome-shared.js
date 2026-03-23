/**
 * welcome-shared.js — Shared mock data for Welcome Card variations (WC1–WC5)
 *
 * 6 modules matching the TrainingOnboardingHiFi data shape.
 * status: 'completed' | 'in-progress' | 'locked'
 */

export const WELCOME_MODULES = [
    { id: 1, title: 'Welcome to PLUS',              duration: '9 mins',  status: 'completed'   },
    { id: 2, title: 'Your Role at PLUS',             duration: '12 mins', status: 'in-progress' },
    { id: 3, title: 'Tutoring Session Overview',     duration: '15 mins', status: 'locked'      },
    { id: 4, title: 'Session Responsibilities',      duration: '10 mins', status: 'locked'      },
    { id: 5, title: 'Helping Students',              duration: '11 mins', status: 'locked'      },
    { id: 6, title: 'Tutoring Tools',                duration: '15 mins', status: 'locked'      },
];
