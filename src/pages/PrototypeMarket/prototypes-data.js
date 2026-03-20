/**
 * Prototype Market catalog data.
 *
 * Each entry represents one deployed (or deployable) prototype.
 * Designers add their own entry here after deploying to Netlify.
 *
 * PRODUCT_PILLARS and STAGES are the canonical filter value sets;
 * keep card data consistent with these.
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
  low:  { label: 'Low-fi',  badgeStyle: 'warning' },
  mid:  { label: 'Mid-fi',  badgeStyle: 'info' },
  high: { label: 'High-fi', badgeStyle: 'success' },
};

export const PILLAR_META = {
  admin:     { label: 'Admin',     badgeStyle: 'primary' },
  home:      { label: 'Home',      badgeStyle: 'secondary' },
  login:     { label: 'Login',     badgeStyle: 'tertiary' },
  profile:   { label: 'Profile',   badgeStyle: 'tertiary' },
  toolkit:   { label: 'Toolkit',   badgeStyle: 'secondary' },
  training:  { label: 'Training',  badgeStyle: 'primary' },
  universal: { label: 'Universal', badgeStyle: 'tertiary' },
};

export const prototypes = [
  {
    id: 'bill-home-redesign',
    title: 'Home Redesign (Dashboard)',
    description:
      'New student dashboard with tutoring performance radar, weekly tutoring load donut, student momentum charts, and personalized training carousel.',
    deploymentUrl: null,
    notionCardUrl: 'https://www.notion.so/example-card-id',
    notionCardId: 'PLUS-42',
    stage: 'high',
    lastUpdated: '2026-03-10',
    creators: ['Bill'],
    contributors: ['Bill'],
    productPillar: 'home',
    localPath: '/home',
    repoPath: 'playground/prototyping/bill/home-redesign/',
  },
  {
    id: 'bill-research-assistant',
    title: 'Research Assistant Chat',
    description:
      'AI-powered research assistant for tutors using @assistant-ui/react with strategy heatmaps, training progress, and chat interface.',
    deploymentUrl: null,
    notionCardUrl: 'https://www.notion.so/example-card-id-2',
    notionCardId: 'PLUS-58',
    stage: 'high',
    lastUpdated: '2026-03-08',
    creators: ['Bill'],
    contributors: ['Bill'],
    productPillar: 'admin',
    localPath: '/research-assistant',
    repoPath: 'playground/prototyping/bill/research-assistant-chat/',
  },
  {
    id: 'bill-sessions',
    title: 'In-Session & Reflection',
    description:
      'In-session view with student management, reflection assistant, and manage-assignment modal.',
    deploymentUrl: null,
    notionCardUrl: null,
    notionCardId: null,
    stage: 'high',
    lastUpdated: '2026-03-05',
    creators: ['Bill'],
    contributors: ['Bill'],
    productPillar: 'toolkit',
    localPath: '/sessions',
    repoPath: 'playground/prototyping/bill/sessions/',
  },
  {
    id: 'bill-monthly-report',
    title: 'Monthly Reports',
    description:
      'Tutor monthly performance reports list and detail view with metrics and progress indicators.',
    deploymentUrl: null,
    notionCardUrl: null,
    notionCardId: null,
    stage: 'mid',
    lastUpdated: '2026-02-28',
    creators: ['Bill'],
    contributors: ['Bill'],
    productPillar: 'admin',
    localPath: '/monthly-reports',
    repoPath: 'playground/prototyping/bill/monthly-report/',
  },
  {
    id: 'bill-weekly-report',
    title: 'Weekly Report Demo',
    description:
      'Weekly report page and list view for tutor performance summaries.',
    deploymentUrl: null,
    notionCardUrl: null,
    notionCardId: null,
    stage: 'mid',
    lastUpdated: '2026-02-20',
    creators: ['Bill'],
    contributors: ['Bill'],
    productPillar: 'admin',
    localPath: null,
    repoPath: 'playground/prototyping/bill/weekly-report-demo/',
  },
  {
    id: 'victor-sessions',
    title: 'Sessions Management',
    description:
      'Sessions page with session cards, attendance modal with attended/absent badges, and edit session modal with tutor/student rosters.',
    deploymentUrl: null,
    notionCardUrl: null,
    notionCardId: null,
    stage: 'mid',
    lastUpdated: '2026-02-25',
    creators: ['Victor'],
    contributors: ['Victor'],
    productPillar: 'toolkit',
    localPath: null,
    repoPath: 'playground/prototyping/victor/sessions/',
  },
  {
    id: 'victor-tutor-performance',
    title: 'Tutor Performance',
    description:
      'Tutor Admin performance page with attendance/sign-up donut charts, sortable tutor table, and click-to-open attendance modal.',
    deploymentUrl: null,
    notionCardUrl: null,
    notionCardId: null,
    stage: 'mid',
    lastUpdated: '2026-02-22',
    creators: ['Victor'],
    contributors: ['Victor'],
    productPillar: 'admin',
    localPath: null,
    repoPath: 'playground/prototyping/victor/tutor-performance/',
  },
  {
    id: 'victor-training-progress',
    title: 'Training Progress',
    description:
      'Tutor Admin training progress page with completion/accuracy metrics, tutor table with progress rings, and lesson details modal.',
    deploymentUrl: null,
    notionCardUrl: null,
    notionCardId: null,
    stage: 'mid',
    lastUpdated: '2026-02-18',
    creators: ['Victor'],
    contributors: ['Victor'],
    productPillar: 'training',
    localPath: null,
    repoPath: 'playground/prototyping/victor/training-progress/',
  },
  {
    id: 'ashley-group-modal',
    title: 'Group Modal',
    description:
      'Group Admin modal for adding/editing a group with name, school select, multi-select tutors, and group size fields.',
    deploymentUrl: null,
    notionCardUrl: null,
    notionCardId: null,
    stage: 'mid',
    lastUpdated: '2026-02-15',
    creators: ['Ashley'],
    contributors: ['Ashley'],
    productPillar: 'admin',
    localPath: null,
    repoPath: 'playground/prototyping/Ashley/group-modal/',
  },
  {
    id: 'ashley-group-performance',
    title: 'Group Performance v2',
    description:
      'Group Admin performance page with attendance pie chart, session distribution stacked bar, tutor table with color-coded badges, and pagination.',
    deploymentUrl: null,
    notionCardUrl: null,
    notionCardId: null,
    stage: 'high',
    lastUpdated: '2026-03-12',
    creators: ['Ashley'],
    contributors: ['Ashley'],
    productPillar: 'admin',
    localPath: null,
    repoPath: 'playground/prototyping/Ashley/group-performance-v2/',
  },
  {
    id: 'ashley-tutor-risk',
    title: 'Tutor Risk & Interventions',
    description:
      'Tutor Admin risk page with at-risk stats, trend line chart, interventions bar chart, filter controls, and 20-row data table.',
    deploymentUrl: null,
    notionCardUrl: null,
    notionCardId: null,
    stage: 'high',
    lastUpdated: '2026-03-14',
    creators: ['Ashley'],
    contributors: ['Ashley'],
    productPillar: 'admin',
    localPath: null,
    repoPath: 'playground/prototyping/Ashley/tutor-risk-interventions/',
  },
  {
    id: 'bryan-tutor-reflection-form',
    title: 'Tutor Reflection Form Test',
    description:
      'Redesigned post-session reflection form with one-form-per-session flow, adaptive branching, student deep dive, strategy effectiveness ratings, and escalation tracking.',
    deploymentUrl: null,
    notionCardUrl: null,
    notionCardId: null,
    stage: 'mid',
    lastUpdated: '2026-03-19',
    creators: ['Bryan'],
    contributors: ['Bryan'],
    productPillar: 'toolkit',
    localPath: null,
    repoPath: 'playground/prototyping/Bryan/tutor-reflection-form/',
  },
  {
    id: 'bryan-starter',
    title: 'Starter Prototype',
    description:
      'Blank playground project scaffolded with the PLUS design system. Use as a template for new prototypes.',
    deploymentUrl: null,
    notionCardUrl: null,
    notionCardId: null,
    stage: 'low',
    lastUpdated: '2026-01-20',
    creators: ['Bryan'],
    contributors: ['Bryan'],
    productPillar: 'universal',
    localPath: null,
    repoPath: 'playground/prototyping/Bryan/starter/',
  },
];
