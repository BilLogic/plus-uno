import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AUDIT_PASS_RELATIVE, GATE_BRIEFING_RELATIVE } from './constants.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_DIR = path.join(__dirname, '..', 'state');
const BRIEFING_DIR = path.join(__dirname, '..', 'briefings');

/**
 * @typedef {object} WritebackSession
 * @property {'active' | 'cleared'} status
 * @property {string} startedAt
 * @property {string} [triggerPrompt]
 * @property {string} updatedAt
 */

function ensureDirs() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.mkdirSync(BRIEFING_DIR, { recursive: true });
}

/**
 * @param {string} conversationId
 */
function sessionPath(conversationId) {
  const safe = conversationId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(STATE_DIR, `writeback-${safe}.json`);
}

/**
 * @param {string} conversationId
 * @returns {WritebackSession | null}
 */
export function loadSession(conversationId) {
  ensureDirs();
  const file = sessionPath(conversationId);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * @param {string} conversationId
 * @param {WritebackSession} session
 */
export function saveSession(conversationId, session) {
  ensureDirs();
  session.updatedAt = new Date().toISOString();
  fs.writeFileSync(sessionPath(conversationId), JSON.stringify(session, null, 2));
}

/**
 * @param {string} conversationId
 */
export function clearSession(conversationId) {
  const file = sessionPath(conversationId);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  clearGateBriefing();
  clearAuditPass();
}

export function clearGateBriefing() {
  const file = path.join(BRIEFING_DIR, 'active-writeback-gate.json');
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

export function clearAuditPass() {
  const file = path.join(BRIEFING_DIR, 'writeback-audit-pass.json');
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

/**
 * @param {string} repoRoot
 * @returns {boolean}
 */
export function isWritebackGateEnabled(repoRoot) {
  const settingsFile = path.join(repoRoot, '.cursor', 'settings.json');
  if (!fs.existsSync(settingsFile)) return true;
  try {
    const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    return settings?.uno?.writebackGate !== false;
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

/**
 * @param {string} conversationId
 * @returns {boolean}
 */
export function hasAuditPass(conversationId) {
  const file = path.join(BRIEFING_DIR, 'writeback-audit-pass.json');
  if (!fs.existsSync(file)) return false;
  try {
    const pass = JSON.parse(fs.readFileSync(file, 'utf8'));
    return pass.conversationId === conversationId;
  } catch {
    return false;
  }
}

/**
 * @param {string} conversationId
 * @param {string} triggerPrompt
 */
export function writeGateBriefing(conversationId, triggerPrompt) {
  ensureDirs();
  const payload = {
    mode: 'uno-writeback-gate',
    conversationId,
    strictFlow: true,
    forbiddenAsFinalDeliverable: ['generate_figma_design', 'html-to-design capture'],
    requiredReads: [
      'design-system/figma/component-registry.json',
      'design-system/figma/token-registry.json',
      'design-system/figma/component-alignment.md',
    ],
    requiredSteps: [
      'Place Figma library component instances (never screenshot import as the final frame).',
      'Write playground/<name>/<name>-manifest.json with components[] and tokenBindings[].',
      'Run: npm run validate:figma-writeback -- <manifest.json>',
      'Run: npm run audit:figma-writeback -- --conversation-id <conversationId> <manifest.json>',
      'Say writeback:audit-passed after audit exits 0, or terminate writeback to cancel.',
    ],
    triggerPrompt,
  };
  fs.writeFileSync(path.join(BRIEFING_DIR, 'active-writeback-gate.json'), JSON.stringify(payload, null, 2));
}

export function buildAgentGateInstruction() {
  return [
    'DS write-back gate is active. Read `.cursor/hooks/briefings/active-writeback-gate.json` first.',
    'FORBIDDEN: using `generate_figma_design` / html-to-design capture as the final `[replica]` frame.',
    'REQUIRED: registry-based instances + token bindings + manifest + validate + audit scripts.',
    'Summon writers/figma for canvas placement per component-alignment.md.',
  ].join(' ');
}

export { GATE_BRIEFING_RELATIVE, AUDIT_PASS_RELATIVE };
