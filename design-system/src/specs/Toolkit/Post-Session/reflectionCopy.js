/**
 * Shared copy + option banks for post-session reflection forms.
 * Grounded in Figma Toolkit / Post-Session (node 3400:286833).
 */

/** @type {Record<number, string>} */
export const SESSION_RATING_COMMENTS = {
    1: 'Rough — very little went to plan.',
    2: 'Tough, and a lot needs adjusting.',
    3: 'Okay — it could have gone better.',
    4: 'Good, with a few things to tighten.',
    5: 'Great — it all came together.',
};

/** @type {Record<number, string>} */
export const FORM_RATING_COMMENTS = {
    1: 'Confusing — I struggled to get through it.',
    2: 'Workable, but not straightforward.',
    3: 'Mostly clear, a few parts less so.',
    4: 'Easy, with a couple of unclear bits.',
    5: 'Clear and easy from start to finish.',
};

export const GOAL_PROGRESS_OPTIONS = [
    { id: 'ahead', label: 'Ahead of Goal' },
    { id: 'steady', label: 'Steady / On Track' },
    { id: 'needs-support', label: 'Needs Support' },
    { id: 'other', label: 'Other' },
];

export const EFFORT_OPTIONS = [
    { id: 'above', label: 'Went Above and Beyond' },
    { id: 'consistent', label: 'Consistent' },
    { id: 'gave-up', label: 'Gave Up Quickly' },
    { id: 'other', label: 'Other' },
];

export const ENGAGEMENT_OPTIONS = [
    { id: 'enthusiastic', label: 'Enthusiastic / Curious' },
    { id: 'responsive', label: 'Responsive' },
    { id: 'distracted', label: 'Distracted' },
    { id: 'other', label: 'Other' },
];

export const WHAT_WORKED_OPTIONS = [
    { id: 'good-pacing', label: 'Good Pacing' },
    { id: 'smooth-tech', label: 'Smooth Tech' },
    { id: 'strong-rapport', label: 'Strong Student Rapport' },
    { id: 'clear-structure', label: 'Clear Structure' },
    { id: 'productive-setting', label: 'Productive Setting' },
    { id: 'effective-scaffolding', label: 'Effective Scaffolding' },
    { id: 'strong-teamwork', label: 'Strong Tutor Teamwork' },
    { id: 'other', label: 'Other' },
];

export const WHAT_COULD_IMPROVE_OPTIONS = [
    { id: 'pacing', label: 'Pacing' },
    { id: 'tech-friction', label: 'Tech Friction' },
    { id: 'environmental-friction', label: 'Environmental Friction' },
    { id: 'unstructured-lesson', label: 'Unstructured Lesson' },
    { id: 'curriculum-gap', label: 'Curriculum Gap' },
    { id: 'tutor-student-rapport', label: 'Tutor / Student Rapport' },
    { id: 'unclear-support', label: 'Unclear Support from Lead' },
    { id: 'other', label: 'Other' },
];

export const SUPERVISOR_FOLLOWUP_OPTIONS = [
    { id: 'no', label: 'No' },
    { id: 'school-staff', label: 'Yes, school staff behavior' },
    { id: 'tutor-lead', label: 'Yes, tutor/lead behavior' },
    { id: 'lead-late', label: 'Yes, lead tutor joined late' },
    { id: 'other-urgent', label: 'Other urgent concern' },
];

/**
 * Formats a "Last updated" caption for reflection section headers.
 *
 * @param {Date|string|null} [value]
 * @returns {string}
 */
export function formatLastUpdated(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value || Date.now());
    return `Last updated: ${date.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })}`;
}
