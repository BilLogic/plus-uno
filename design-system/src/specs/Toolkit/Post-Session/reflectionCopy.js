/**
 * Shared copy + option banks for post-session reflection forms.
 * Grounded in Figma Toolkit / Post-Session (node 3400:286833) + Notion Form Design.
 */

/** Privacy line used on AI answers and Form Feedback Q3. */
export const PRIVACY_WARNING = "Please do not include students' names in your response.";

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
    { id: 'ahead', label: 'Ahead of Goal', tooltip: 'Finished the weekly goal early or exceeded it.' },
    { id: 'steady', label: 'Steady / On Track', tooltip: 'Progressing as planned toward the weekly goal.' },
    { id: 'needs-support', label: 'Needs Support', tooltip: 'Struggling with the goal — needs targeted help.' },
    { id: 'other', label: 'Other', tooltip: 'Anything not covered by the options — a short text field asks for details.' },
];

export const EFFORT_OPTIONS = [
    { id: 'above', label: 'Went Above and Beyond', tooltip: 'Worked hard and pushed through challenges.' },
    { id: 'consistent', label: 'Consistent', tooltip: 'Kept a steady effort throughout the session.' },
    { id: 'gave-up', label: 'Gave Up Quickly', tooltip: 'Gave up quickly or needed frequent nudges.' },
    { id: 'other', label: 'Other', tooltip: 'Anything not covered by the options — a short text field asks for details.' },
];

export const ENGAGEMENT_OPTIONS = [
    { id: 'enthusiastic', label: 'Enthusiastic / Curious', tooltip: 'Asked questions and engaged beyond the task.' },
    { id: 'responsive', label: 'Responsive', tooltip: 'Participated when prompted.' },
    { id: 'distracted', label: 'Distracted', tooltip: 'Attention drifted; hard to keep on task.' },
    { id: 'other', label: 'Other', tooltip: 'Anything not covered by the options — a short text field asks for details.' },
];

export const WHAT_WORKED_OPTIONS = [
    { id: 'clear-structure', label: 'Clear Structure', tooltip: 'The session followed a clear plan with defined goals.' },
    { id: 'productive-setting', label: 'Productive Setting', tooltip: 'The environment stayed focused and low-distraction.' },
    { id: 'good-pacing', label: 'Good Pacing', tooltip: 'Time was well split across warm-up, practice, and wrap-up.' },
    { id: 'smooth-tech', label: 'Smooth Tech', tooltip: 'Audio, video, and screen sharing worked without friction.' },
    { id: 'effective-scaffolding', label: 'Effective Scaffolding', tooltip: 'Support was broken into steps the student could climb.' },
    { id: 'strong-teamwork', label: 'Strong Tutor Teamwork', tooltip: 'Tutors coordinated smoothly and shared the load.' },
    { id: 'strong-rapport', label: 'Strong Student Rapport', tooltip: 'Students felt comfortable, heard, and encouraged.' },
    { id: 'other', label: 'Other', tooltip: 'Anything not covered by the options — a short text field asks for details.' },
];

export const WHAT_COULD_IMPROVE_OPTIONS = [
    { id: 'pacing', label: 'Pacing', tooltip: 'The pace felt too rushed or too slow for the material.' },
    { id: 'tech-friction', label: 'Tech Friction', tooltip: 'Login, audio, video, or screen-share problems ate into time.' },
    { id: 'environmental-friction', label: 'Environmental Friction', tooltip: 'Noise, space, or scheduling disrupted the session.' },
    { id: 'unstructured-lesson', label: 'Unstructured Lesson', tooltip: 'The session lacked a clear plan or goals.' },
    { id: 'curriculum-gap', label: 'Curriculum Gap', tooltip: 'The material did not match the student’s current level.' },
    { id: 'tutor-student-rapport', label: 'Tutor / Student Rapport', tooltip: 'The connection with the student needs work.' },
    { id: 'unclear-support', label: 'Unclear Support from Lead', tooltip: 'Expectations or help from the lead tutor were unclear.' },
    { id: 'other', label: 'Other', tooltip: 'Anything not covered by the options — a short text field asks for details.' },
];

export const STUDENT_FOLLOWUP_OPTIONS = [
    { id: 'no', label: 'No', tooltip: 'Nothing to escalate about this student.' },
    { id: 'behavioral', label: 'Yes, behavioral concern', tooltip: 'A concern about the student’s behavior — routed to your supervisor.' },
    { id: 'well-being', label: 'Yes, well-being concern', tooltip: 'A concern about the student’s well-being — routed to your supervisor.' },
    { id: 'other', label: 'Other', tooltip: 'Anything not listed — describe it in the text field.' },
];

export const SUPERVISOR_FOLLOWUP_OPTIONS = [
    { id: 'no', label: 'No', tooltip: 'Nothing to escalate from this session.' },
    { id: 'school-staff', label: 'Yes, school staff behavior', tooltip: 'A concern about school staff conduct — routed to your supervisor.' },
    { id: 'tutor-lead', label: 'Yes, tutor/lead behavior', tooltip: 'A concern about a tutor or lead — routed to your supervisor.' },
    { id: 'lead-late', label: 'Yes, lead tutor joined late', tooltip: 'The lead tutor joined the session late.' },
    { id: 'other-urgent', label: 'Other urgent concern', tooltip: 'Anything urgent not listed — describe it in the text field.' },
];

export const SELF_EFFECTIVE_OPTIONS = [
    { id: 'scaffolding', label: 'Scaffolding', tooltip: 'Breaking concepts into steps the student could climb.' },
    { id: 'facilitation', label: 'Facilitation', tooltip: 'Guiding discussion and keeping the group on track.' },
    { id: 'pacing', label: 'Pacing', tooltip: 'Managing time across warm-up, practice, and wrap-up.' },
    { id: 'engagement', label: 'Engagement', tooltip: 'Keeping students curious and participating.' },
    { id: 'encouragement', label: 'Encouragement', tooltip: 'Motivating students through challenges.' },
    { id: 'other', label: 'Other', tooltip: 'Anything not covered by the options — a short text field asks for details.' },
];

export const SELF_IMPROVE_OPTIONS = [
    { id: 'math', label: 'Math Proficiency', tooltip: 'Content knowledge or problem-solving fluency.' },
    { id: 'rapport', label: 'Student Rapport', tooltip: 'Connection and trust with students.' },
    { id: 'time', label: 'Time Management', tooltip: 'Planning and using session time well.' },
    { id: 'communication', label: 'Communication', tooltip: 'Explaining clearly and checking understanding.' },
    { id: 'encouragement', label: 'Encouragement', tooltip: 'Supporting students through struggle.' },
    { id: 'other', label: 'Other', tooltip: 'Anything not covered by the options — a short text field asks for details.' },
];

export const CANCELLATION_REASON_OPTIONS = [
    {
        id: 'unforeseen',
        label: 'Unforeseen circumstances',
        example: 'emergencies, sudden disruptions',
    },
    {
        id: 'technical',
        label: 'Technical difficulties',
        example: 'internet issues, software malfunctions',
    },
    {
        id: 'absence',
        label: 'Participant absence',
        example: 'student no-show, tutor unavailability',
    },
    {
        id: 'schedule',
        label: 'Schedule conflict',
        example: 'overlapping commitments',
    },
    {
        id: 'communication',
        label: 'Communication error',
        example: 'missed notifications, miscommunication',
    },
    {
        id: 'other',
        label: 'Other',
        example: null,
    },
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

/**
 * Toggles a multi-select id with exclusive "No" semantics.
 * Selecting No clears every other option; selecting any other option clears No.
 *
 * @param {string[]} selectedIds
 * @param {string} id
 * @param {string} [noId='no']
 * @returns {string[]}
 */
export function toggleExclusiveNo(selectedIds, id, noId = 'no') {
    const isSelected = selectedIds.includes(id);
    if (isSelected) {
        const next = selectedIds.filter((value) => value !== id);
        return next.length ? next : [noId];
    }
    if (id === noId) return [noId];
    return [...selectedIds.filter((value) => value !== noId), id];
}

/**
 * Whether an escalation selection requires a description.
 *
 * @param {string[]} selectedIds
 * @param {string} [noId='no']
 * @returns {boolean}
 */
export function escalationNeedsDescription(selectedIds, noId = 'no') {
    return selectedIds.length > 0 && !selectedIds.includes(noId);
}

/**
 * Rating-gated requiredness for paired "positive" / "improve" chip questions.
 * 4–5 → positive required, improve optional · 1–2 → reversed · 3 → both.
 *
 * @param {number} rating
 * @returns {{ positiveRequired: boolean, improveRequired: boolean }}
 */
export function ratingGatedRequiredness(rating) {
    if (!rating || rating < 1) {
        return { positiveRequired: false, improveRequired: false };
    }
    if (rating >= 4) {
        return { positiveRequired: true, improveRequired: false };
    }
    if (rating <= 2) {
        return { positiveRequired: false, improveRequired: true };
    }
    return { positiveRequired: true, improveRequired: true };
}

/**
 * Whether a multi-select bank with optional Other text is complete.
 *
 * @param {string[]} selectedIds
 * @param {string} [otherText='']
 * @param {string} [otherId='other']
 * @returns {boolean}
 */
export function multiSelectComplete(selectedIds, otherText = '', otherId = 'other') {
    if (!selectedIds.length) return false;
    if (selectedIds.includes(otherId) && !String(otherText).trim()) return false;
    return true;
}

/**
 * Stable JSON compare for dirty-checking reflection drafts.
 *
 * @param {unknown} current
 * @param {unknown} baseline
 * @returns {boolean}
 */
/**
 * Drops AI-generated / seed-only fields so Cancel dirty checks ignore timer updates.
 *
 * @param {object|null|undefined} data
 * @returns {object|null|undefined}
 */
export function reflectionUserFields(data) {
    if (!data || typeof data !== 'object') return data;
    const {
        aiState: _aiState,
        aiPrompt: _aiPrompt,
        aiHelper: _aiHelper,
        aiAnswer: _aiAnswer,
        forceAiFail: _forceAiFail,
        forceAiEmpty: _forceAiEmpty,
        ...rest
    } = data;
    return rest;
}

/**
 * @param {object|null|undefined} current
 * @param {object|null|undefined} baseline
 * @returns {boolean}
 */
export function isReflectionDraftDirty(current, baseline) {
    try {
        return JSON.stringify(reflectionUserFields(current) ?? null)
            !== JSON.stringify(reflectionUserFields(baseline) ?? null);
    } catch {
        return true;
    }
}
