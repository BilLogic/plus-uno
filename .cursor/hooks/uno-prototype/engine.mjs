import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const STEPS_FILE = path.join(__dirname, 'intake-steps.json');
export const BRIEFINGS_DIR = path.join(__dirname, '..', 'briefings');

export const INTAKE_SPEC = JSON.parse(fs.readFileSync(STEPS_FILE, 'utf8'));
export const STEPS = INTAKE_SPEC.steps;
export const STEP_IDS = STEPS.map((s) => s.id);
export const DIMENSIONS = INTAKE_SPEC.dimensions;
export const DELIVERABLES = INTAKE_SPEC.deliverables;

const COMMANDS = {
  back: /^(back|previous|go back)$/i,
  restart: /^(restart|start over|upload (a )?new prd|use (a )?different prd)$/i,
  bypass: /^(#?skip-prd-gate|skip prd( upload)?|quit|terminate (this )?(prototyping )?(process|workflow|session)|cancel (this )?(workflow|process)|abort (workflow|process)|stop (this )?(process|workflow))$/i,
};

const MACHINE_TURN =
  /^\s*<(?:task-notification|system-reminder|local-command-stdout|command-message)\b|^\s*\[Request interrupted\b/;

/**
 * Strip quoted text and non-invocation code spans so mentions of `/uno-prototype`
 * inside a report or quote do not start the intake.
 * @param {string} prompt
 */
function stripQuoted(prompt) {
  return prompt
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`\r\n]+)`/g, (_m, inner) =>
      /^\s*\/?uno[-:]prototype\s*$/i.test(inner) ? ` ${inner} ` : ' ',
    )
    .replace(/^\s*>.*$/gm, ' ')
    .replace(/"[^"\r\n]{8,}"/g, ' ')
    .replace(/\u201c[^\u201d\r\n]{8,}\u201d/g, ' ');
}

/**
 * Explicit `/uno-prototype` start only (no keyword heuristics).
 * @param {string} prompt
 */
export function isExplicitStart(prompt) {
  if (!prompt || MACHINE_TURN.test(prompt)) return false;
  if (/<command-name>\s*\/?uno[-:]prototype\s*<\/command-name>/i.test(prompt)) return true;
  const text = stripQuoted(prompt);
  if (/(?:^|[\s(])\/uno[-:]prototype\b/i.test(text)) return true;
  if (/(?:^|[\s(])@?skills\/uno-prototype\b/i.test(text)) return true;
  return /^\s*(?:please\s+)?(?:use|run|invoke|start)\s+uno[-:]prototype\b/i.test(text);
}

/**
 * @param {string} sessionId
 * @param {string} [dir]
 */
export function cardPath(sessionId, dir = BRIEFINGS_DIR) {
  const safe = String(sessionId).replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(dir, `${safe}.json`);
}

/**
 * @param {Record<string, unknown>} card
 * @param {string} stepId
 */
function isFilled(card, stepId) {
  const val = card?.[stepId];
  return typeof val === 'string' ? val.trim().length > 0 : Boolean(val);
}

/**
 * Create an empty brief card with one field per step in `intake-steps.json`.
 * @param {string} sessionId
 */
export function createEmptyCard(sessionId) {
  /** @type {Record<string, unknown>} */
  const card = { sessionId };
  for (const step of STEPS) card[step.id] = '';
  card._seen = 0;
  return card;
}

/**
 * @param {string} sessionId
 * @param {string} [dir]
 * @returns {Record<string, unknown> | null}
 */
export function readCard(sessionId, dir = BRIEFINGS_DIR) {
  const file = cardPath(sessionId, dir);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * @param {string} sessionId
 * @param {Record<string, unknown>} card
 * @param {string} [dir]
 */
export function writeCard(sessionId, card, dir = BRIEFINGS_DIR) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(cardPath(sessionId, dir), JSON.stringify(card, null, 2) + '\x0a');
}

/**
 * @param {string} sessionId
 * @param {string} [dir]
 */
export function removeCard(sessionId, dir = BRIEFINGS_DIR) {
  const file = cardPath(sessionId, dir);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

/**
 * Current step = first empty field in the brief card.
 * @param {Record<string, unknown>} card
 */
export function currentStepOf(card) {
  return STEPS.find((step) => !isFilled(card, step.id)) || null;
}

/**
 * @param {Record<string, unknown>} card
 */
export function filledStepsOf(card) {
  return STEPS.filter((step) => isFilled(card, step.id));
}

/**
 * Clear the last filled field on the brief card ("back").
 * @param {Record<string, unknown>} card
 */
export function stepBack(card) {
  const filled = filledStepsOf(card);
  if (filled.length === 0) return { moved: false, cleared: null };
  const last = filled[filled.length - 1];
  card[last.id] = '';
  card._seen = filled.length - 1;
  return { moved: true, cleared: last.id };
}

/**
 * @param {string} [repoRoot]
 */
function isPrdGateEnabled(repoRoot) {
  if (!repoRoot) return true;
  const settingsFile = path.join(repoRoot, '.cursor', 'settings.json');
  if (!fs.existsSync(settingsFile)) return true;
  try {
    const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    return settings?.uno?.prdGate !== false;
  } catch {
    return true;
  }
}

/**
 * Format the prompt injection for the active step.
 * @param {typeof STEPS[number]} step
 * @param {string} file
 * @param {{ multiFieldCount?: number; outOfOrder?: boolean; alreadyFirst?: boolean }} [flags]
 */
function formatStepMessage(step, file, flags = {}) {
  const parts = [];
  if (flags.multiFieldCount && flags.multiFieldCount > 1) {
    parts.push(
      `WARNING: More than one field was filled in a turn (${flags.multiFieldCount} fields filled at once). Intake is strictly one step per turn — clear the extra field(s) in ${file} and ask only the current step.`,
    );
  } else if (flags.outOfOrder) {
    parts.push(
      `WARNING: A later field in ${file} was filled while ${step.id} is still empty. Fill fields strictly in step order, one per turn.`,
    );
  }
  if (flags.alreadyFirst) {
    parts.push('Already at the first step. Say "restart" to start over.');
  }
  parts.push(
    `uno-prototype intake active: current step = ${step.id} (${step.stepNumber} of ${INTAKE_SPEC.totalSteps}, ${step.progressLabel}), card at ${file}.`,
  );
  if (step.id === 'prd_check') {
    parts.push(`Flow map: "${INTAKE_SPEC.flowMap}".`);
  }
  parts.push(`Question: ${step.question}`);
  if (step.options?.length) {
    parts.push(`Options / vocabulary: ${step.options.join(' · ')}.`);
  }
  parts.push(step.guidance);
  parts.push(
    `Ask ONLY this one step in this message (never batch questions). When the designer replies, write their answer into "${step.id}" in ${file} (one field per turn) before asking the next empty step.`,
  );
  return parts.join(' ');
}

/**
 * @param {Record<string, unknown>} card
 */
function formatHandoffMessage(card) {
  return [
    'uno-prototype intake complete — brief card confirmed:',
    `- Goal & audience: ${card.reflect_learn}`,
    `- Designer's words: ${card.reflect_artifact_open}`,
    `- Fidelity dials: ${card.reflect_fidelity}`,
    `- Deliverable: ${card.reflect_artifact}`,
    `- Won't include: ${card.reflect_exclude}`,
    'Load the ONE deliverable reference selected by the confirmed deliverable (see skills/uno-prototype/SKILL.md § Deliverables & routing), restate this brief at the top of the plan, and proceed to Step 3 (Plan) → Step 4 (Generate).',
  ].join('\x0a');
}

/**
 * Evaluate a user prompt against the session's brief card.
 * @param {{ prompt?: string; conversation_id?: string; session_id?: string; workspace_roots?: string[]; cwd?: string; briefingsDir?: string }} input
 * @returns {{ continue: true; agent_message?: string }}
 */
export function handleSubmit(input) {
  const prompt = String(input.prompt || '').trim();
  const sessionId = input.session_id || input.conversation_id;
  const repoRoot = input.cwd || input.workspace_roots?.[0];
  const dir = input.briefingsDir || BRIEFINGS_DIR;

  if (!prompt || !sessionId || MACHINE_TURN.test(prompt)) return { continue: true };
  if (!isPrdGateEnabled(repoRoot)) return { continue: true };

  const file = cardPath(sessionId, dir);
  let card = readCard(sessionId, dir);

  if (COMMANDS.bypass.test(prompt)) {
    removeCard(sessionId, dir);
    return { continue: true };
  }

  if (!card) {
    if (!isExplicitStart(prompt)) return { continue: true };
    card = createEmptyCard(sessionId);
    writeCard(sessionId, card, dir);
    return { continue: true, agent_message: formatStepMessage(STEPS[0], file) };
  }

  if (COMMANDS.restart.test(prompt)) {
    card = createEmptyCard(sessionId);
    writeCard(sessionId, card, dir);
    return { continue: true, agent_message: formatStepMessage(STEPS[0], file) };
  }

  if (COMMANDS.back.test(prompt)) {
    const { moved } = stepBack(card);
    writeCard(sessionId, card, dir);
    const step = currentStepOf(card) || STEPS[0];
    return {
      continue: true,
      agent_message: formatStepMessage(step, file, { alreadyFirst: !moved }),
    };
  }

  // Check if the agent recorded "No" for prd_check.
  if (typeof card.prd_check === 'string' && /^no\b/i.test(card.prd_check.trim())) {
    removeCard(sessionId, dir);
    return {
      continue: true,
      agent_message:
        'No PRD yet — stopping the uno-prototype workflow. Create a PRD first with skills/uno-synthesize (or message @uno-bot in Slack), then run /uno-prototype again.',
    };
  }

  const filled = filledStepsOf(card);
  const prevSeen = typeof card._seen === 'number' ? card._seen : 0;
  const delta = filled.length - prevSeen;
  const step = currentStepOf(card);
  const firstEmptyIdx = step ? STEPS.indexOf(step) : STEPS.length;
  const outOfOrder = STEPS.slice(firstEmptyIdx + 1).some((s) => isFilled(card, s.id));

  card._seen = filled.length;

  // All fields filled: if more than one field was filled in the final turn,
  // flag the violation; otherwise release the card and hand off to the build.
  if (!step) {
    if (delta > 1) {
      writeCard(sessionId, card, dir);
      return {
        continue: true,
        agent_message: formatStepMessage(STEPS[STEPS.length - 1], file, { multiFieldCount: delta }),
      };
    }
    if (isExplicitStart(prompt)) {
      card = createEmptyCard(sessionId);
      writeCard(sessionId, card, dir);
      return { continue: true, agent_message: formatStepMessage(STEPS[0], file) };
    }
    removeCard(sessionId, dir);
    return { continue: true, agent_message: formatHandoffMessage(card) };
  }

  writeCard(sessionId, card, dir);
  return {
    continue: true,
    agent_message: formatStepMessage(step, file, {
      multiFieldCount: delta > 1 ? delta : 0,
      outOfOrder,
    }),
  };
}
