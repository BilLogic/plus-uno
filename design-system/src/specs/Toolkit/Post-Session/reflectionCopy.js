/**
 * Shared copy + option banks for post-session reflection forms.
 * Grounded in Figma Toolkit / Post-Session (node 3400:286833).
 */

/** @type {Record<number, string>} */
export const SESSION_RATING_COMMENTS = {
    1: 'Lots of room for improvement.',
    2: 'Not so well, adjustments are needed.',
    3: "Okay, could've gone better.",
    4: 'Good, with a few things to tighten.',
    5: 'Excellent session!',
};

/** @type {Record<number, string>} */
export const STUDENT_RATING_COMMENTS = {
    1: 'Lots of room for improvement.',
    2: 'Not so well, adjustments are needed.',
    3: "Okay, could've gone better.",
    4: 'Good, with some room for improvement.',
    5: 'Wonderful interactions!',
};

/** @type {Record<number, string>} */
export const SELF_RATING_COMMENTS = {
    1: 'Lots of room for improvement.',
    2: 'Not so well, adjustments are needed.',
    3: "Okay, could've gone better.",
    4: 'Good, with some room for improvement.',
    5: 'I did great!',
};

/** @type {Record<number, string>} */
export const FORM_RATING_COMMENTS = {
    1: 'Lots of room for improvement.',
    2: 'Not so well, adjustments are needed.',
    3: "Okay, could've gone better.",
    4: 'Good, with some room for improvement.',
    5: 'Excellent form!',
};

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
