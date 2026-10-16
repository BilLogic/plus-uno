import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isStale } from './constants.mjs';
import { clearIntakeQuestion } from './intake-question.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_DIR = path.join(__dirname, '..', 'state');
const PRD_CACHE_DIR = path.join(STATE_DIR, 'prd-cache');
const BRIEFING_DIR = path.join(__dirname, '..', 'briefings');

/**
 * @typedef {object} SessionState
 * @property {string} stateId
 * @property {string[]} history
 * @property {Record<string, unknown>} context
 * @property {'active' | 'awaiting_execute' | 'completed'} status
 * @property {string} [conversationId] the session that created it
 * @property {string} updatedAt
 */

function ensureDirs() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.mkdirSync(PRD_CACHE_DIR, { recursive: true });
  fs.mkdirSync(BRIEFING_DIR, { recursive: true });
}

/**
 * @param {string} conversationId
 * @returns {string}
 */
function prdCachePath(conversationId) {
  const safe = conversationId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(PRD_CACHE_DIR, `${safe}.json`);
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
 * The session for this conversation, or null. A session idle past the intake
 * TTL is released rather than resumed — otherwise a conversation left
 * mid-reflection silently consumes the next unrelated prompt as the answer
 * (ce:review 064). One whose recorded owner differs (two ids that sanitize to
 * the same file name) is not this conversation's.
 * @param {string} conversationId
 * @returns {SessionState | null}
 */
export function loadSession(conversationId) {
  ensureDirs();
  const file = statePath(conversationId);
  if (!fs.existsSync(file)) return null;
  try {
    const session = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (session?.conversationId && session.conversationId !== conversationId) return null;
    if (isStale(session?.updatedAt)) {
      clearSession(conversationId); // stale — release the gate rather than eat a prompt
      return null;
    }
    return session;
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
  session.conversationId = conversationId;
  session.updatedAt = new Date().toISOString();
  fs.writeFileSync(statePath(conversationId), JSON.stringify(session, null, 2));
}

/**
 * @param {string} conversationId
 */
export function clearSession(conversationId) {
  const file = statePath(conversationId);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  clearIntakeQuestion(conversationId); // never another session's briefing
}

/**
 * Defensive cleanup of any stale briefing left by an older workflow version.
 * @param {string} conversationId
 */
export function clearBriefing(conversationId) {
  const file = briefingPath(conversationId);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

/**
 * @typedef {object} PrdCacheEntry
 * @property {string} prd
 * @property {string} updatedAt
 */

/**
 * @param {string} conversationId
 * @param {{ prd: string }} entry
 */
export function savePrdCache(conversationId, entry) {
  ensureDirs();
  if (!entry?.prd?.trim()) return;
  /** @type {PrdCacheEntry} */
  const payload = {
    prd: entry.prd.trim(),
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(prdCachePath(conversationId), JSON.stringify(payload, null, 2));
}

/**
 * @param {string} conversationId
 * @returns {PrdCacheEntry | null}
 */
export function loadPrdCache(conversationId) {
  ensureDirs();
  const file = prdCachePath(conversationId);
  if (!fs.existsSync(file)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!parsed?.prd?.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * @param {string} conversationId
 */
export function clearPrdCache(conversationId) {
  const file = prdCachePath(conversationId);
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
