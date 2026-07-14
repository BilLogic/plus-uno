/**
 * Production surfaces hosted on main (not a discovery catalog — that is Notion).
 *
 * 1. Live app — Storybook Specs pages wired as one product (`prototypes/live-app`)
 * 2. Full Demo Walkthrough — recording build under `/demo/*` (`prototypes/home-redesign`)
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
 * Demo entry `/demo/demo.html` redirects into `/demo/home` (slug prefix frozen).
 */
export const prototypes = [
  {
    id: 'live-app',
    title: 'Live app (Storybook specs)',
    description:
      'Holistic product replica assembled from design-system Specs page components (Home, Training, Toolkit, Admin, Profile, Login).',
    deploymentUrl: '/home',
    notionCardUrl: null,
    notionCardId: null,
    stage: 'high',
    lastUpdated: '2026-07-14',
    creators: ['Bill'],
    contributors: ['Bill'],
    productPillar: 'universal',
    localPath: '/home',
    repoPath: 'prototypes/live-app/',
  },
  {
    id: '1028',
    title: 'Full Demo Walkthrough',
    description:
      'Full-screen recording build under /demo/* (e.g. /demo/home). Stitches Home → Lessons → Sessions → Reflection → Training Progress → Research terminal. Press "\\" to toggle the admin sidebar. Entry /demo/demo.html is frozen.',
    deploymentUrl: '/demo/demo.html',
    notionCardUrl: null,
    notionCardId: null,
    stage: 'high',
    lastUpdated: '2026-07-14',
    creators: ['Bill'],
    contributors: ['Bill'],
    productPillar: 'universal',
    localPath: '/demo/home',
    repoPath: 'prototypes/home-redesign/',
  },
];
