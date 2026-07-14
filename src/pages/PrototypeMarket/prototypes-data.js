/**
 * Production surfaces hosted on main (not a discovery catalog — that is Notion).
 *
 * 1. Live app — SPA routes under /home, /app, …
 * 2. Full Demo Walkthrough — static build at /demo/demo.html (slug + URL frozen)
 *
 * Content modules used by both: in-session-ux, research-assistant-chat, monthly-report.
 */

export const STAGES = ['low', 'mid', 'high'];

export const PRODUCT_PILLARS = [
  'admin',
  'home',
  'login',
  'profile',
  'toolkit',
  'training',
  'universal',
];

export const STAGE_META = {
  low: { label: 'Low-fi', badgeStyle: 'warning' },
  mid: { label: 'Mid-fi', badgeStyle: 'info' },
  high: { label: 'High-fi', badgeStyle: 'success' },
};

export const PILLAR_META = {
  admin: { label: 'Admin', badgeStyle: 'primary' },
  home: { label: 'Home', badgeStyle: 'secondary' },
  login: { label: 'Login', badgeStyle: 'tertiary' },
  profile: { label: 'Profile', badgeStyle: 'tertiary' },
  toolkit: { label: 'Toolkit', badgeStyle: 'secondary' },
  training: { label: 'Training', badgeStyle: 'primary' },
  universal: { label: 'Universal', badgeStyle: 'tertiary' },
};

/**
 * Two production prototypes on main.
 * Demo id `1028` and path `/demo/demo.html` must not change (Notion + share links).
 */
export const prototypes = [
  {
    id: 'live-app',
    title: 'Live app (current)',
    description:
      'Holistic tutor flow on production: Home, Admin, Sessions, Reflection, Lessons, Research Assistant, Monthly Reports — wired as one SPA shell.',
    deploymentUrl: '/home',
    notionCardUrl: null,
    notionCardId: null,
    stage: 'high',
    lastUpdated: '2026-07-14',
    creators: ['Bill'],
    contributors: ['Bill'],
    productPillar: 'universal',
    localPath: '/home',
    repoPath: 'prototypes/home-redesign/',
  },
  {
    id: '1028',
    title: 'Full Demo Walkthrough',
    description:
      'Full-screen, edge-to-edge recording build that stitches the key screens into one click-through flow: Home → Lessons → Sessions → Reflection → Training Progress → Research terminal. Press "\\" to toggle the admin sidebar section.',
    deploymentUrl: '/demo/demo.html',
    notionCardUrl: null,
    notionCardId: null,
    stage: 'high',
    lastUpdated: '2026-06-04',
    creators: ['Bill'],
    contributors: ['Bill'],
    productPillar: 'universal',
    localPath: null,
    repoPath: 'prototypes/home-redesign/',
  },
];
