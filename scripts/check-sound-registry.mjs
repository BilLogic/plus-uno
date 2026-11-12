#!/usr/bin/env node
/**
 * `npm run check:sound-registry` keeps sound where the spec allows it
 * (spec #2230, ADR-043).
 *
 * WHAT IT HOLDS.
 *   - Every `sound` cell in `scripts/lib/tokens/motion-registry.mjs` names a
 *     token of the sound plan (`SOUND_SEMANTICS`), with `at` of `land` or
 *     `start` when given.
 *   - No `sound` cell sits on a row or event the always-silent list
 *     (`scripts/lib/tokens/sound-silence.mjs`) covers; each entry carries a
 *     `why` and names a real registry row (and event, when it gives one).
 *   - `AudioContext` and `new Audio(` appear only in the sound runtime
 *     (`design-system/src/sound/`) and in tests, so every sound goes through
 *     the one switch.
 *
 * `check:motion-registry` ignores `sound`; this check owns it.
 */

import { REPO_ROOT } from './lib/corpus.mjs';
import { main } from './lib/findings.mjs';
import { MOTION_REGISTRY } from './lib/tokens/motion-registry.mjs';
import { SOUND_SEMANTICS } from './lib/tokens/sound-plan.mjs';
import { SOUND_SILENT } from './lib/tokens/sound-silence.mjs';
import { trackedSources } from './lib/tracked-sources.mjs';

export const SOURCE_ROOTS = ['design-system'];
const SCANNED = /\.(jsx?|mjs|tsx?|mdx)$/;
/** Where the audio APIs may appear: the runtime itself, tests, and fixtures. */
const RUNTIME = /^design-system\/src\/sound\/|\.test\.[jt]sx?$|\.test\.mjs$/;
const AUDIO_API = [
  { re: /\bAudioContext\b/, name: 'AudioContext' },
  { re: /\bnew\s+Audio\s*\(/, name: 'new Audio(' },
];
const AT = ['land', 'start'];

export const soundTokens = () => new Set(SOUND_SEMANTICS.map((s) => s.name));

export const REMEDY =
  '  -> name a token from scripts/lib/tokens/sound-plan.mjs; play through playSound in design-system/src/sound/.\n' +
  '     Where sound never plays: scripts/lib/tokens/sound-silence.mjs.';

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({
  repoRoot = REPO_ROOT,
  registry = MOTION_REGISTRY,
  silent = SOUND_SILENT,
  tokens = soundTokens(),
  sources,
} = {}) {
  const findings = [];
  for (const entry of silent) {
    if (!entry.row || !entry.why) {
      findings.push({ message: `always-silent entry ${JSON.stringify(entry)} needs a row and a why` });
      continue;
    }
    const rows = registry.filter((r) => r.name === entry.row);
    if (rows.length === 0) {
      findings.push({ message: `always-silent entry names "${entry.row}", which has no registry row; name a real row or drop it` });
    } else if (entry.event !== undefined && !rows.some((r) => entry.event in (r.events ?? {}))) {
      findings.push({ message: `always-silent entry names "${entry.row}" event "${entry.event}", which that row does not have` });
    }
  }
  const silenced = (row, event) =>
    silent.find((s) => s.row === row && (s.event === undefined || s.event === event));

  for (const row of registry) {
    for (const [event, spec] of Object.entries(row.events ?? {})) {
      const sound = spec?.sound;
      if (sound === undefined) continue;
      const where = `motion registry row "${row.name}" event "${event}"`;
      if (!tokens.has(sound.token)) {
        findings.push({ message: `${where} sound names "${sound.token}", which is not a sound token (${[...tokens].join(', ')})` });
      }
      if (sound.at !== undefined && !AT.includes(sound.at)) {
        findings.push({ message: `${where} sound has at "${sound.at}"; use ${AT.join(' or ')}` });
      }
      const hit = silenced(row.name, event);
      if (hit) findings.push({ message: `${where} has a sound cell but is on the always-silent list: ${hit.why}` });
    }
  }

  for (const file of sources ?? trackedSources(repoRoot, SOURCE_ROOTS, SCANNED)) {
    if (RUNTIME.test(file.path)) continue;
    file.text.split('\n').forEach((line, i) => {
      for (const api of AUDIO_API) {
        if (api.re.test(line)) {
          findings.push({ file: file.path, line: i + 1, message: `${api.name} outside the sound runtime; play through playSound in design-system/src/sound/` });
        }
      }
    });
  }
  return findings;
}

export function summary({ registry = MOTION_REGISTRY } = {}) {
  const cells = registry.flatMap((r) => Object.values(r.events ?? {})).filter((e) => e?.sound).length;
  return `${cells} sound cell(s) checked against ${SOUND_SEMANTICS.length} tokens and ${SOUND_SILENT.length} always-silent entries`;
}

main(import.meta.url, 'check:sound-registry', { run, summary, remedy: REMEDY });
