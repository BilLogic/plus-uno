import { BYPASS_PATTERNS } from './constants.mjs';

/**
 * @param {string} prompt
 * @returns {boolean}
 */
export function hasPrototypeIntent(prompt) {
  const lower = prompt.toLowerCase();

  // Never intercept review/critique of an existing prototype.
  if (/uno-review|review (this |the )?prototype|critique.{0,20}prototype/.test(lower)) {
    return false;
  }

  // Explicit skill invocation.
  if (/uno-prototype|\/uno:prototype|\/uno-prototype|@skills\/uno-prototype/.test(lower)) {
    return true;
  }

  // Natural-language English intents, including "prototype a/the/my X",
  // "make a (hi-fi) prototype", "spin up a prototype", etc.
  if (/\bprototype (this|that|it|a|an|the|my|our|these|those|some)\b/.test(lower)) {
    return true;
  }
  if (
    /\b(make|create|build|design|draft|generate|spin up|whip up|do|start|scaffold|mock up|mockup|put together)\b[^.]{0,40}\bprototype\b/.test(
      lower,
    )
  ) {
    return true;
  }
  if (
    /scaffold (a )?playground|implement (this )?(figma|design)|build .{0,40}playground|build this prd|sketch the flow|flow sketch|map the data flow|generate a draft to validate/.test(
      lower,
    )
  ) {
    return true;
  }

  return false;
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
