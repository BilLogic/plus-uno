/**
 * Labelled test sentences for comparing the uno-prototype gate's regex
 * decisions against Jev (TypeSafe). Three suites, one per decision the hook
 * makes today without a model:
 *
 * - `intent`     — every prompt: should the PRD gate start? (intents.mjs)
 * - `prdCheck`   — the reply to "Do you have a PRD?" (validators.mjs)
 * - `reflection` — a reply during a Step 2 reflection step (states.mjs —
 *                  today any non-empty text counts as the answer)
 *
 * Labels are what the gate SHOULD do, not what it does. Cases marked
 * `real: true` are prompts that actually reached the hook in this repo,
 * translated to English.
 */

/** @typedef {'start_new' | 'iterate_existing' | 'discuss_skill' | 'review' | 'other'} IntentLabel */

/** @type {Array<{ id: string; text: string; label: IntentLabel; real?: boolean }>} */
export const INTENT_CASES = [
  // start_new — the gate should fire
  { id: 'i01', text: 'prototype this onboarding flow', label: 'start_new' },
  { id: 'i02', text: 'Can you make a hi-fi prototype of the tutor dashboard?', label: 'start_new' },
  { id: 'i03', text: '/uno-prototype', label: 'start_new' },
  { id: 'i04', text: 'use uno-prototype on the session-notes PRD', label: 'start_new' },
  { id: 'i05', text: 'sketch the flow for rescheduling a session', label: 'start_new' },
  { id: 'i06', text: 'implement this Figma design: https://www.figma.com/design/abc123/Tutor-Home?node-id=1-2', label: 'start_new' },
  { id: 'i07', text: 'build this PRD', label: 'start_new' },
  { id: 'i08', text: 'spin up a quick prototype for the attendance page', label: 'start_new' },
  { id: 'i09', text: 'map the data flow for session payouts', label: 'start_new' },
  { id: 'i10', text: 'I need a clickable mockup of the new lesson planner', label: 'start_new' },
  { id: 'i11', text: "let's wireframe the student check-in screen", label: 'start_new' },
  { id: 'i12', text: 'Could we get a rough concept of what the parent report email might look like?', label: 'start_new' },
  { id: 'i13', text: "help me make a prototype of the tutor scheduling page", label: 'start_new' },
  { id: 'i14', text: "turn this PRD into a hi-fi prototype", label: 'start_new' },
  { id: 'i15', text: "draw the user flow for student check-in", label: 'start_new' },
  { id: 'i16', text: "turn this Figma design into a working page", label: 'start_new' },

  // iterate_existing — work on something already built; no PRD gate
  { id: 'i17', text: 'continue working on the prototype we built yesterday', label: 'iterate_existing' },
  { id: 'i18', text: "the prototype's header is misaligned, fix it", label: 'iterate_existing' },
  { id: 'i19', text: "make the prototype's buttons use the primary token", label: 'iterate_existing' },
  { id: 'i20', text: 'update the tutor dashboard prototype with the new copy', label: 'iterate_existing' },
  { id: 'i21', text: 'add an empty state to the prototype', label: 'iterate_existing' },
  { id: 'i22', text: "in the prototype, change the buttons to the primary color", label: 'iterate_existing' },

  // discuss_skill — talking about the skill or its hook, not using it
  { id: 'i23', text: 'fix the uno-prototype hook so it stops firing on meta-discussion', label: 'discuss_skill' },
  { id: 'i24', text: 'why does uno-prototype ask so many questions?', label: 'discuss_skill' },
  { id: 'i25', text: 'update the intent regex in uno-prototype to support Chinese', label: 'discuss_skill' },
  { id: 'i26', text: 'can you explain how the PRD gate decides when to start?', label: 'discuss_skill' },
  { id: 'i27', text: 'how do I make the prototype skill skip the PRD question?', label: 'discuss_skill' },
  {
    id: 'i28',
    text: "create a new branch called uno-prototype-jev-decision to explore whether uno-prototype can use Jev to help with some simple decisions and save time, since I heard Jev is much faster",
    label: 'discuss_skill',
    real: true,
  },
  {
    id: 'i29',
    text: "I want you to check whether TypeSafe can judge intent and the fidelity routing after it, and whether some of the questions asked to the user in between could use TypeSafe",
    label: 'discuss_skill',
    real: true,
  },
  { id: 'i30', text: "uno-prototype has too many intake questions, can we trim them down?", label: 'discuss_skill' },

  // review — uno-review's job
  { id: 'i31', text: 'review this prototype', label: 'review' },
  { id: 'i32', text: 'critique the onboarding prototype against the DS', label: 'review' },
  { id: 'i33', text: 'run design QA on the tutor home build', label: 'review' },
  { id: 'i34', text: 'can you check if this prototype is accessible?', label: 'review' },
  { id: 'i35', text: "take a look at this prototype and give me feedback", label: 'review' },

  // other — unrelated
  { id: 'i36', text: 'help me fix this button style', label: 'other' },
  { id: 'i37', text: "what's the token for card shadow?", label: 'other' },
  { id: 'i38', text: 'write a PRD for session reminders', label: 'other' },
  { id: 'i39', text: 'the prototypes folder is getting big, can we clean up old ones?', label: 'other' },
  { id: 'i40', text: "what's the difference between a prototype and a mockup?", label: 'other' },
  { id: 'i41', text: "do you know Jev?", label: 'other', real: true },
  { id: 'i42', text: "what time does next week's design review start?", label: 'other' },
];

/** @typedef {'yes' | 'no' | 'pasted_prd' | 'unclear'} PrdCheckLabel */

/** Replies to the gate's first question, "Do you have a PRD?". */
/** @type {Array<{ id: string; text: string; label: PrdCheckLabel }>} */
export const PRD_CHECK_CASES = [
  { id: 'p01', text: 'Yes', label: 'yes' },
  { id: 'p02', text: '1', label: 'yes' },
  { id: 'p03', text: "yep, it's in Notion", label: 'yes' },
  { id: 'p04', text: "I do", label: 'yes' },
  { id: 'p05', text: "yes, I'll paste it in a sec", label: 'yes' },
  { id: 'p06', text: 'No', label: 'no' },
  { id: 'p07', text: 'nope', label: 'no' },
  { id: 'p08', text: 'not yet', label: 'no' },
  { id: 'p09', text: "I don't think we have one", label: 'no' },
  { id: 'p10', text: "don't have one", label: 'no' },
  { id: 'p11', text: "haven't written it yet", label: 'no' },
  { id: 'p12', text: 'https://www.notion.so/plus/Session-Reminders-PRD-1a2b3c4d', label: 'pasted_prd' },
  {
    id: 'p13',
    text: 'Session reminders\nUser flow: tutor opens the session list, sees an upcoming session, gets a reminder 15 minutes before.\nAcceptance criteria: reminder fires once; tutor can snooze.',
    label: 'pasted_prd',
  },
  {
    id: 'p14',
    text: "Session reminder PRD\nUser flow: the tutor opens the class list and gets a reminder 15 minutes before class.\nAcceptance criteria: the reminder fires only once and can be snoozed.",
    label: 'pasted_prd',
  },
  { id: 'p15', text: "what's a PRD?", label: 'unclear' },
  { id: 'p16', text: 'which PRD do you mean?', label: 'unclear' },
];

/** @typedef {'answer' | 'clarifying_question' | 'go_back' | 'off_topic'} ReflectionLabel */

const Q_LEARN = 'What are you trying to achieve?';
const Q_ARTIFACT_OPEN = 'In your own words, what do you picture making?';
const Q_FIDELITY = 'What fidelity is actually needed? Visual mid · Interaction high · Scope 3 screens · Complexity low — confirm or adjust.';
const Q_EXCLUDE = 'What should the prototype intentionally NOT include?';
const Q_CONFIRM = 'Here is the prototype brief we built together. Ship it to the build?';

/** Replies during a Step 2 reflection step, paired with the question asked. */
/** @type {Array<{ id: string; question: string; text: string; label: ReflectionLabel }>} */
export const REFLECTION_CASES = [
  { id: 'r01', question: Q_LEARN, text: 'validate usability with tutors', label: 'answer' },
  { id: 'r02', question: Q_LEARN, text: 'explore concepts and compare alternatives', label: 'answer' },
  { id: 'r03', question: Q_LEARN, text: "mainly to get stakeholders aligned on direction", label: 'answer' },
  { id: 'r04', question: Q_LEARN, text: "what's the difference between explore and compare?", label: 'clarifying_question' },
  { id: 'r05', question: Q_LEARN, text: "how are these goals different?", label: 'clarifying_question' },
  { id: 'r06', question: Q_ARTIFACT_OPEN, text: 'a clickable flow of the three onboarding screens', label: 'answer' },
  { id: 'r07', question: Q_ARTIFACT_OPEN, text: "let's just draw a rough flow chart", label: 'answer' },
  { id: 'r08', question: Q_ARTIFACT_OPEN, text: 'not sure yet, what would you suggest?', label: 'clarifying_question' },
  { id: 'r09', question: Q_FIDELITY, text: 'Yes: mid visual, real interactions, 3 screens', label: 'answer' },
  { id: 'r10', question: Q_FIDELITY, text: 'lower the visual dial to low, keep the rest', label: 'answer' },
  { id: 'r11', question: Q_FIDELITY, text: 'what does fidelity mean here?', label: 'clarifying_question' },
  { id: 'r12', question: Q_FIDELITY, text: 'back', label: 'go_back' },
  { id: 'r13', question: Q_FIDELITY, text: 'wait, can we go back to the artifact question?', label: 'go_back' },
  { id: 'r14', question: Q_FIDELITY, text: "hold on, I want to change my answer to the previous question", label: 'go_back' },
  { id: 'r15', question: Q_EXCLUDE, text: 'skip the settings page and fake the payments', label: 'answer' },
  { id: 'r16', question: Q_EXCLUDE, text: "does won't include mean we never build it?", label: 'clarifying_question' },
  { id: 'r17', question: Q_EXCLUDE, text: 'btw what time is the design review tomorrow?', label: 'off_topic' },
  { id: 'r18', question: Q_EXCLUDE, text: "by the way, where is Storybook deployed right now?", label: 'off_topic' },
  { id: 'r19', question: Q_CONFIRM, text: 'Ship it', label: 'answer' },
  { id: 'r20', question: Q_CONFIRM, text: "ok, let's start", label: 'answer' },
];

/** @typedef {'flow_map' | 'wireframe' | 'concept_image' | 'storyboard' | 'interactive' | 'coded_build'} DeliverableLabel */

/**
 * The confirmed brief → which deliverable doc to load (SKILL.md § Deliverables
 * & routing). `artifact` is the designer's Q2 answer as the hook stores it;
 * `fidelity` is the Q3 answer.
 */
/** @type {Array<{ id: string; artifact: string; fidelity: string; label: DeliverableLabel }>} */
export const DELIVERABLE_CASES = [
  { id: 'd01', artifact: 'User flow — the reschedule path end to end', fidelity: 'Visual low, Interaction low', label: 'flow_map' },
  { id: 'd02', artifact: 'a map of how session data moves between Supabase, the app and Slack', fidelity: 'Visual low', label: 'flow_map' },
  { id: 'd03', artifact: "a journey map of a tutor's first week", fidelity: "Visual low, Interaction low", label: 'flow_map' },
  { id: 'd04', artifact: 'a quick ASCII sketch of the check-in screen, right here', fidelity: 'Visual low, Scope 1 screen', label: 'wireframe' },
  { id: 'd05', artifact: 'Static mockup of the new dashboard header', fidelity: 'Visual high, Interaction none, Scope 1 screen', label: 'wireframe' },
  { id: 'd06', artifact: "draw wireframes for three pages", fidelity: "Visual mid, Interaction low", label: 'wireframe' },
  { id: 'd07', artifact: 'an image that captures the vibe of the new parent portal', fidelity: 'Visual high, Interaction none', label: 'concept_image' },
  { id: 'd08', artifact: "one concept image that conveys a feeling of \"reassurance\"", fidelity: "Visual high", label: 'concept_image' },
  { id: 'd09', artifact: "a sequence of frames showing a tutor's morning before the first session", fidelity: 'Visual mid, 6 frames', label: 'storyboard' },
  { id: 'd10', artifact: "use storyboard panels to show a student going from getting the reminder to entering class", fidelity: "Visual mid", label: 'storyboard' },
  { id: 'd11', artifact: 'Interactive prototype — a clickable flow of the 3 onboarding screens', fidelity: 'Visual mid, Interaction high, Scope 3 screens', label: 'interactive' },
  { id: 'd12', artifact: 'something tutors can tap through in a usability test, generated in v0', fidelity: 'Visual mid, Interaction high', label: 'interactive' },
  { id: 'd13', artifact: "a prototype you can click, generated with Figma Make", fidelity: "Visual mid, Interaction high", label: 'interactive' },
  { id: 'd14', artifact: 'Hi-fi build on the design system in prototypes/ — the PRD is approved', fidelity: 'Visual high, Interaction high, Scope 4 screens', label: 'coded_build' },
  { id: 'd15', artifact: 'build it for real with our PLUS components so devs can read the code', fidelity: 'Visual high, Interaction high', label: 'coded_build' },
  { id: 'd16', artifact: "build it straight in code with design-system components; the direction is settled", fidelity: "Visual high, Interaction high", label: 'coded_build' },
  { id: 'd17', artifact: 'just sketch the flow so we can talk about it', fidelity: 'Visual low', label: 'flow_map' },
  { id: 'd18', artifact: 'a polished screen I can drop into the deck — it does not need to click', fidelity: 'Visual high, Interaction none', label: 'wireframe' },
];

/** @typedef {'ascii' | 'figma' | 'spec'} WireframeRouteLabel */

/**
 * Once the deliverable is a wireframe: wireframe.md's three routes. "The
 * fidelity dials usually decide (ASCII when Visual is low and speed matters;
 * Figma when the team needs to comment on canvas; spec when an external
 * generator adds value)."
 */
/** @type {Array<{ id: string; text: string; label: WireframeRouteLabel }>} */
export const WIREFRAME_ROUTE_CASES = [
  { id: 'w01', text: 'Visual low, speed matters — I just want to converge on the layout here in chat', label: 'ascii' },
  { id: 'w02', text: "low-fi; let's quickly align on the layout in this conversation first", label: 'ascii' },
  { id: 'w03', text: 'PM and devs need to leave comments on the canvas; Visual mid', label: 'figma' },
  { id: 'w04', text: "put it in Figma so Bill can leave comments on the canvas", label: 'figma' },
  { id: 'w05', text: 'quick and rough is fine, but the team reviews everything as Figma comments', label: 'figma' },
  { id: 'w06', text: 'Visual mid-high; I want Stitch to generate a few layout variations', label: 'spec' },
  { id: 'w07', text: "I want an external tool to generate several static drafts in different styles in one go", label: 'spec' },
  { id: 'w08', text: "generate a few versions with Figma Make and let's see", label: 'spec' },
];
