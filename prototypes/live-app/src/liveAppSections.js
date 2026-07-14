/**
 * Section routes assembled from Storybook Specs page components.
 */
export const LIVE_APP_SECTIONS = [
  {
    group: 'Home',
    items: [
      { to: '/home', label: 'Skills overview', end: true },
      { to: '/home/skills-progress', label: 'Skills progress' },
    ],
  },
  {
    group: 'Training',
    items: [
      { to: '/training/lessons', label: 'Lessons' },
      { to: '/training/lessons/detail', label: 'Lesson detail' },
      { to: '/training/onboarding', label: 'Onboarding' },
      { to: '/training/onboarding/inner', label: 'Onboarding inner' },
    ],
  },
  {
    group: 'Toolkit',
    items: [
      { to: '/toolkit/sessions', label: 'All sessions' },
      { to: '/toolkit/my-sessions', label: 'My sessions' },
      { to: '/toolkit/sign-ups', label: 'Sign-ups' },
      { to: '/toolkit/call-offs', label: 'Call-offs' },
      { to: '/toolkit/fill-ins', label: 'Fill-ins' },
      { to: '/toolkit/reflection', label: 'Reflection' },
      { to: '/toolkit/create-session', label: 'Create session' },
      { to: '/toolkit/confirm-availability', label: 'Confirm availability' },
      { to: '/toolkit/in-session', label: 'In-session dashboard' },
      { to: '/toolkit/post-session', label: 'Post-session' },
      { to: '/toolkit/session-reflection', label: 'Session reflection' },
      { to: '/toolkit/student-reflection', label: 'Student reflection' },
      { to: '/toolkit/form-feedback', label: 'Form feedback' },
      { to: '/toolkit/self-reflection', label: 'Self reflection' },
    ],
  },
  {
    group: 'Admin',
    items: [
      { to: '/admin/tutors/training', label: 'Tutor training' },
      { to: '/admin/tutors/performance', label: 'Tutor performance' },
      { to: '/admin/tutors/warnings', label: 'Status warnings' },
      { to: '/admin/tutors/tool-usage', label: 'Tool usage' },
      { to: '/admin/sessions', label: 'Sessions' },
      { to: '/admin/students', label: 'Students' },
      { to: '/admin/groups', label: 'Groups' },
      { to: '/admin/groups/training', label: 'Group training' },
    ],
  },
  {
    group: 'Account',
    items: [
      { to: '/profile', label: 'Profile' },
      { to: '/login', label: 'Sign in' },
    ],
  },
];
