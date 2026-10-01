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

  // Never intercept meta-discussion about the uno-prototype skill/hook itself
  // (debugging it, changing when it fires, reading its code) or maintenance
  // work on something ALREADY built. The PRD gate is for starting something
  // new — a bare mention of "uno-prototype" used to match this literal
  // substring regardless of context, so a sentence fixing the gate's own
  // triggering (like this one) re-triggered the gate it was describing.
  if (
    /\b(fix|debug|modify|change|update|edit|tweak|adjust|configure|iterate on|continue|keep working on|resume|improve|correct|patch|polish|refine|rework)\b[^.!?]{0,60}\b(uno-prototype|the hook|this hook|the gate|the prd gate|prd[- ]gate|the regex|intent detection|the prototype|this prototype|the existing prototype|that prototype)\b/.test(
      lower,
    )
  ) {
    return false;
  }

  // Explicit skill invocation — a genuine command/mention, not a bare
  // substring match, so talking ABOUT the skill in prose doesn't count.
  if (/(^|\s)\/uno-prototype\b|\/uno:prototype|@skills\/uno-prototype|\b(use|run|invoke|start) uno-prototype\b/.test(lower)) {
    return true;
  }

  // Natural-language English intents, including "prototype a/the/my X",
  // "make a (hi-fi) prototype", "spin up a prototype", etc. The negative
  // lookbehind matters: a hyphen is a non-word character, so plain `\b` lets
  // "prototype" inside "uno-prototype" match as if it were its own word —
  // this excludes that so mentioning the skill by name doesn't smuggle a
  // false trigger through the generic vocabulary check below it.
  if (/(?<!uno-)\bprototype (this|that|it|a|an|the|my|our|these|those|some)\b/.test(lower)) {
    return true;
  }
  if (
    /\b(make|create|build|design|draft|generate|spin up|whip up|do|start|scaffold|mock up|mockup|put together)\b[^.]{0,40}(?<!uno-)\bprototype\b/.test(
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
