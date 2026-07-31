import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FLOW_MAP } from './constants.mjs';
import { resolveQuestion } from './states.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRIEFING_DIR = path.join(__dirname, '..', 'briefings');

export const ACTIVE_INTAKE_FILE = path.join(BRIEFING_DIR, 'active-intake-question.json');

/**
 * @param {import('./states.mjs').ConversationState} state
 * @param {Record<string, unknown>} ctx
 */
export function buildIntakePayload(conversationId, session, state) {
  const effectiveType = state.type;
  const options = state.options;

  /** @type {Record<string, unknown>} */
  const payload = {
    mode: 'uno-prototype-intake',
    conversationId,
    stateId: state.id,
    type: effectiveType,
    question: resolveQuestion(state, session.context),
    strictFlow: true,
    oneQuestionOnly: true,
    neverSkipStep: true,
    prdResumed: Boolean(session.context?.prdResumed),
  };

  if (state.progressLabel) payload.progressLabel = state.progressLabel;

  if (effectiveType === 'choice' && options?.length) {
    payload.options = options.map((label, index) => ({
      id: String(index + 1),
      label,
    }));
  }

  if (effectiveType === 'reflection') {
    payload.multiSelect = Boolean(state.multiSelect);
    payload.openEnded = Boolean(state.openEnded);
    payload.confirm = Boolean(state.confirm);
    payload.stepIndex = state.stepIndex;
    payload.stepTotal = state.stepTotal;
    payload.guidance = state.guidance;
    // The confirm gate assembles the brief card from the stored answers.
    if (state.confirm && session.context?.reflection) {
      payload.reflection = session.context.reflection;
    }
  }

  return payload;
}

/**
 * @param {string} conversationId
 * @param {import('./storage.mjs').SessionState} session
 * @param {import('./states.mjs').ConversationState} state
 */
export function writeIntakeQuestion(conversationId, session, state) {
  fs.mkdirSync(BRIEFING_DIR, { recursive: true });
  const payload = buildIntakePayload(conversationId, session, state);
  fs.writeFileSync(ACTIVE_INTAKE_FILE, JSON.stringify(payload, null, 2));
}

/**
 * Remove the active question file — but only if it belongs to this conversation.
 *
 * The file is a single fixed path while sessions are per-conversation, so an
 * unguarded delete let conversation A's session-end wipe conversation B's live
 * question mid-intake (two Cursor tabs, or Cursor + Claude Code at once). The
 * payload already carries `conversationId`; this makes the delete respect it.
 * Pass no id to force (the FSM's own terminal transitions).
 *
 * @param {string} [conversationId]
 */
export function clearIntakeQuestion(conversationId) {
  if (!fs.existsSync(ACTIVE_INTAKE_FILE)) return;
  if (conversationId) {
    try {
      const owner = JSON.parse(fs.readFileSync(ACTIVE_INTAKE_FILE, 'utf8'))?.conversationId;
      if (owner && owner !== conversationId) return; // another conversation owns it
    } catch {
      // unreadable → fall through and clear it; a corrupt file helps nobody
    }
  }
  fs.unlinkSync(ACTIVE_INTAKE_FILE);
}

/**
 * @param {import('./states.mjs').ConversationState} state
 * @returns {string}
 */
/**
 * How to render a single-select question, stated as a CONTRACT rather than as
 * one runtime's tool signature.
 *
 * This used to say "AskQuestion with questions.length === 1" — Claude Code's
 * `AskUserQuestion` API shape, sent verbatim to every model. A runtime without
 * that exact tool (Cursor on a non-Claude model, Codex, headless) had no good
 * option: hallucinate a failing tool call, or silently drop to prose. Naming
 * the contract instead means every runtime can satisfy it, and the numbered
 * plain-text form is a first-class rendering, not a degradation.
 */
const ONE_QUESTION_CONTRACT =
  'ASK EXACTLY ONE QUESTION THIS MESSAGE. If your runtime has an interactive question/choice tool (whatever it is named), use it for a SINGLE question with the options below. If it does not, render the question in plain text with the options as a numbered list the designer can answer by number or in their own words — that plain-text form is fully valid here, not a fallback. Either way: one question, the options shown, a free-form answer always accepted.';

export function buildAgentIntakeInstruction(state) {
  const effectiveType = state.type;

  const reviseNote =
    'Mention once, briefly, that the designer can say "back" to revise an earlier answer — we are shaping this together, nothing is locked until the brief is confirmed.';

  if (effectiveType === 'reflection') {
    if (state.confirm) {
      return [
        'uno-prototype Step 2 (Prototype Reflection) gate is active — final beat: confirm the brief. Read `.cursor/hooks/briefings/active-intake-question.json` before doing anything else.',
        `Assemble the stored answers (the \`reflection\` field in that JSON) into ONE compact brief card per the \`guidance\` field, then ask for confirmation. ${ONE_QUESTION_CONTRACT}`,
        'This card is the contract the build will be validated against — restate content in the confirm option label; never offer a content-free "looks good".',
        reviseNote,
        'Do NOT load method.md or start building until the brief is confirmed.',
      ].join(' ');
    }

    if (state.openEnded) {
      return [
        'uno-prototype Step 2 (Prototype Reflection) gate is active. Read `.cursor/hooks/briefings/active-intake-question.json` before doing anything else.',
        `This is reflection step ${state.stepIndex} of ${state.stepTotal}, OPEN-ENDED beat: ask the one question from the JSON as a plain open question — no options list, no recommendation this turn; the designer speaks first, in their own words. Any non-empty answer advances.`,
        'Never batch reflection questions; never skip ahead to planning or building.',
        reviseNote,
        'Follow the `guidance` field in that JSON. Do NOT load method.md.',
      ].join(' ');
    }

    return [
      'uno-prototype Step 2 (Prototype Reflection) gate is active. Read `.cursor/hooks/briefings/active-intake-question.json` before doing anything else.',
      `This is reflection step ${state.stepIndex} of ${state.stepTotal}. ${ONE_QUESTION_CONTRACT} Never batch the four reflection questions; never skip ahead to planning or building.`,
      state.stepIndex === 1
        ? 'PRD received — before asking, if you have not already, do Step 1 (Understand): summarize the PRD and recommend nothing yet, then ask this question.'
        : '',
      'Compose PRD-specific options: lead with the recommended choice labeled "(Recommended)", then 1–2 alternatives, and always leave room for an answer of their own (an explicit "something else" option, or the runtime\'s built-in equivalent). One line of reasoning per option, each anchored in the PRD — this is reflecting WITH the designer, not deciding for them.',
      state.multiSelect
        ? 'Several goals may co-apply — let the designer pick more than one (multi-select where the runtime supports it; otherwise say they may name several numbers).'
        : 'Single choice — this confirms your recommendation.',
      `Show the \`progressLabel\` from the JSON with the question so the designer knows where they are. ${reviseNote}`,
      'Follow the `guidance` field in that JSON for what to present before/with the question. Do NOT load method.md or start building.',
    ]
      .filter(Boolean)
      .join(' ');
  }

  const lines = [
    'uno-prototype PRD-gate intake is active. Read `.cursor/hooks/briefings/active-intake-question.json` before doing anything else.',
    `ONE QUESTION PER TURN: render exactly one PRD-gate step this message — never batch steps into one question or one reply. ${ONE_QUESTION_CONTRACT}`,
    'NEVER SKIP A STEP: even when the user message already contains a PRD, still ask the current step as verification — do not auto-advance.',
  ];

  if (state.id === 'prd_check') {
    lines.push(
      `Before asking, show the designer the shape of the whole intake in one line — "${FLOW_MAP}" — and say a PRD (Notion link, local .md, or pasted text with flows + acceptance criteria) is the one required input. Then ask the question.`,
    );
  }

  if (effectiveType === 'choice') {
    lines.push(
      'One prompt, one set of options — take both from the JSON file.',
      'Show the `progressLabel` from the JSON with the question.',
      'Forbidden: asking more than one question this message, combining steps, or previewing later steps beyond the one-line flow map.',
      'Do NOT load method.md, do NOT start building.',
    );
  } else {
    lines.push(
      'Ask exactly one plain-text question using the `question` field in that file, and show the `progressLabel` from the JSON with it.',
      'Do NOT preview or list later workflow steps.',
    );
  }

  return lines.join(' ');
}
