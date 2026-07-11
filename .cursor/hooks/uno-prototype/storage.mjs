import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clearIntakeQuestion } from './intake-question.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_DIR = path.join(__dirname, '..', 'state');
const BRIEFING_DIR = path.join(__dirname, '..', 'briefings');

/**
 * @typedef {object} SessionState
 * @property {string} stateId
 * @property {string[]} history
 * @property {Record<string, unknown>} context
 * @property {'active' | 'awaiting_execute' | 'completed'} status
 * @property {string} updatedAt
 */

function ensureDirs() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.mkdirSync(BRIEFING_DIR, { recursive: true });
}

/**
 * @param {string} conversationId
 * @returns {string}
 */
function statePath(conversationId) {
  const safe = conversationId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(STATE_DIR, `${safe}.json`);
}

/**
 * @param {string} conversationId
 * @returns {string}
 */
function briefingPath(conversationId) {
  const safe = conversationId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(BRIEFING_DIR, `${safe}.md`);
}

/**
 * @param {string} conversationId
 * @returns {SessionState | null}
 */
export function loadSession(conversationId) {
  ensureDirs();
  const file = statePath(conversationId);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * @param {string} conversationId
 * @param {SessionState} session
 */
export function saveSession(conversationId, session) {
  ensureDirs();
  session.updatedAt = new Date().toISOString();
  fs.writeFileSync(statePath(conversationId), JSON.stringify(session, null, 2));
}

/**
 * @param {string} conversationId
 */
export function clearSession(conversationId) {
  const file = statePath(conversationId);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  clearIntakeQuestion();
}

/**
 * @param {string} conversationId
 * @param {string} markdown
 */
export function writeBriefing(conversationId, markdown) {
  ensureDirs();
  fs.writeFileSync(briefingPath(conversationId), markdown);
  fs.writeFileSync(path.join(BRIEFING_DIR, 'active-prototype-briefing.md'), markdown);
}

/**
 * @param {string} conversationId
 * @returns {string | null}
 */
export function readBriefing(conversationId) {
  const file = briefingPath(conversationId);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8');
}

/**
 * @param {string} conversationId
 */
export function clearBriefing(conversationId) {
  const file = briefingPath(conversationId);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

/**
 * @param {string} repoRoot
 * @returns {boolean}
 */
export function isPrdGateEnabled(repoRoot) {
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
 * @param {string[]} workspaceRoots
 * @returns {string}
 */
export function resolveRepoRoot(workspaceRoots = []) {
  if (workspaceRoots.length > 0) return workspaceRoots[0];
  return path.join(__dirname, '..', '..', '..');
}
