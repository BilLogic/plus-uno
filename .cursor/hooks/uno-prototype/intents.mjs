import { BYPASS_PATTERNS } from './constants.mjs';

// A code span whose whole content names the skill is an invocation written in
// code font, so it is unwrapped; any other quoted text is someone else's words
// (a review report quoting example prompts, a pasted transcript) and is dropped
// before the intent checks run.
const SKILL_REF = /^(@?skills\/uno-prototype|\/uno-prototype|\/uno:prototype)$/;

function stripQuoted(text) {
  return text
    .replace(/```[\s\S]*?(```|$)/g, ' ')
    .replace(/^[ \t]*>.*$/gm, ' ')
    .replace(/`([^`\n]*)`/g, (_, inner) => (SKILL_REF.test(inner.trim()) ? inner.trim() : ' '))
    .replace(/"[^"\n]*"|\u201c[^\u201d\n]*\u201d/g, ' ');
}

// Explicit invocation: the slash command (typed, or in the
// `<command-name>/uno-prototype</command-name>` tag Claude Code may wrap it in,
// hence `>` before the slash), the skill path AGENTS.md routes by
// (with or without `@`, but not a file inside the skill's folder), a leading
// "uno-prototype:" label, or "use/run/invoke the uno-prototype skill". Prose
// about the skill ("the uno-prototype gate") is none of these.
const EXPLICIT_INVOCATION =
  /(^|[\s>])\/uno-prototype\b|\/uno:prototype\b|(^|[\s(])@?skills\/uno-prototype(?![\w/.-])|^\s*uno-prototype\s*:|\b(use|run|invoke|start)\s+(the\s+)?uno-prototype(\s+skill)?\b(?!-)/;

// A request to build something new. The `(?<!uno-)` lookbehind matters: a
// hyphen is a non-word character, so plain `\b` would let "prototype" inside
// "uno-prototype" count as its own word.
const BUILD_INTENTS = [
  /(?<!uno-)\bprototype (this|that|it|a|an|the|my|our|these|those|some)\b/,
  /\b(make|create|build|design|draft|generate|spin up|whip up|do|start|scaffold|mock up|mockup|put together)\b[^.]{0,40}(?<!uno-)\bprototype\b/,
  /scaffold (a )?playground|implement (this )?(figma|design)|build .{0,40}playground|build this prd|sketch the flow|flow sketch|map the data flow|generate a draft to validate/,
];

// Work on the skill or hook itself, or on a prototype that already exists.
// Each target is closed with `(?![\w-])` so "the hook" does not match inside
// "the hook-up flow".
const MAINTENANCE =
  /\b(fix|debug|modify|change|update|edit|tweak|adjust|configure|iterate on|continue|keep working on|resume|improve|correct|patch|polish|refine|rework)(e?s|e?d|ing)?\b[^.!?]{0,60}?\b(uno-prototype|the hook|this hook|the gate|the prd gate|prd[- ]gate|the regex|intent detection|the prototype|this prototype|the existing prototype|that prototype)(?![\w-])/;

const hasBuildIntent = (text) => BUILD_INTENTS.some((re) => re.test(text));

/**
 * Whether the prompt explicitly invokes the skill — the start trigger where a
 * plain-words build request is not enough (see `explicit_start_only`).
 * @param {string} prompt
 * @returns {boolean}
 */
export function isExplicitInvocation(prompt) {
  return EXPLICIT_INVOCATION.test(stripQuoted(prompt.toLowerCase()));
}

/**
 * @param {string} prompt
 * @returns {boolean}
 */
export function hasPrototypeIntent(prompt) {
  const lower = stripQuoted(prompt.toLowerCase());

  // Never intercept review/critique of an existing prototype.
  if (/uno-review|review (this |the )?prototype|critique.{0,20}prototype/.test(lower)) {
    return false;
  }

  // An explicit invocation outranks every exclusion below.
  if (EXPLICIT_INVOCATION.test(lower)) return true;

  // Meta-discussion about the skill/hook, or upkeep of a prototype that is
  // already built, never opens the PRD gate — unless a build request comes
  // first and the upkeep is only mentioned after it ("prototype X and update
  // the prototype copy" is still a new build).
  const upkeep = MAINTENANCE.exec(lower);
  if (upkeep && !hasBuildIntent(lower.slice(0, upkeep.index))) return false;

  return hasBuildIntent(lower);
}

// The known envelopes a runtime injects into the prompt stream: task and
// subagent hand-backs, system and CI notices, cross-session and teammate
// messages, relayed artifact comments and hook feedback. A hand-back can open
// with a line of prose before its envelope, so each is matched at the start of
// any of the first few lines. An envelope missing from this list falls through
// as a person turn — the list grows when a new one is seen in the wild.
const INJECTED_ENVELOPES = [
  /^<task-notification>/,
  /^<system-reminder>/,
  /^<agent-message[\s>]/,
  /^<cross-session-message[\s>]/,
  /^<teammate-message[\s>]/,
  /^<ci-monitor-event>/,
  /^Another Claude session sent a message/,
  /^\[SYSTEM NOTIFICATION/,
  /^\[Artifact comment sent to Claude\]/,
  /^Stop hook feedback:/,
];
const ENVELOPE_LINES = 3;

/**
 * True when the prompt is a machine-written turn — never the person's answer,
 * even when it quotes one. Only the person's own turns start or answer the gate.
 * @param {string} prompt
 * @returns {boolean}
 */
export function isMachineTurn(prompt) {
  const lines = prompt.trimStart().split('\n', ENVELOPE_LINES).map((line) => line.trimStart());
  return lines.some((line) => INJECTED_ENVELOPES.some((envelope) => envelope.test(line)));
}

/**
 * @param {string} prompt
 * @returns {boolean}
 */
export function isBypassRequest(prompt) {
  return BYPASS_PATTERNS.some((pattern) => pattern.test(prompt));
}

/**
 * User wants to replace the PRD cached for this conversation.
 * @param {string} prompt
 * @returns {boolean}
 */
export function hasNewPrdIntent(prompt) {
  const lower = prompt.toLowerCase();
  return (
    /\b(new|different|another|replace|update)\b[^.]{0,30}\bprd\b/.test(lower) ||
    /\bupload (a )?new prd\b/.test(lower) ||
    /\buse (a )?different prd\b/.test(lower)
  );
}
