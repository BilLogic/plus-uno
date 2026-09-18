#!/usr/bin/env node
/**
 * `npm run check:icon-button-name` — a button that is only an icon still tells
 * you what it does.
 *
 * See `scripts/icon-button-name.mjs` for what is scanned and for the three
 * things the scan cannot see. The finding it was written for: 20 buttons in the
 * design system whose entire content was an icon and which had no
 * `aria-label`, no `title` and no text. A screen reader announces them as
 * "button" — that is the whole of what its user is told about a control that
 * dismisses an alert, expands a lesson row, or opens the session menu.
 *
 * axe reported 23 of these across the story suite and this reports 20; the two
 * populations overlap without one containing the other. axe counts every
 * RENDERED instance, so one component in a loop is many findings and a
 * component nobody storied is none. This counts SOURCE sites, so it sees the
 * page nobody wrote a story for — and it stops at anything it cannot read,
 * which axe, running against real DOM, does not have to.
 *
 * TWO OF THE 20 WERE NOT ABOUT NAMES AT ALL. `LessonsSpec.jsx` and
 * `OnboardingSpec.jsx` call `<Button btnStyle=… btnFill=… label="Start Lesson"
 * icon="chevron-right">`, and Button has none of those props: it takes `style`,
 * `fill`, `text` and `leadingVisual`. Those buttons were rendering EMPTY — no
 * icon, no label, nothing but a box — and the missing accessible name was the
 * symptom that surfaced it.
 *
 * NO RATCHET. Like `check:focus-ring`, this counts a defect rather than a
 * vocabulary. The bar is zero and the exception map is empty.
 *
 * Run: `npm run check:icon-button-name`.
 */
import { REPO_ROOT, failures, nameless, sites, sources } from './icon-button-name.mjs';
import { byRoot, main } from './lib/findings.mjs';
import { openRatchet } from './lib/ratchet.mjs';

const RECORD = 'docs/evals/icon-button-name.json';

/*
 * A resolver that stopped finding files reports a clean sweep. The floor is the
 * count on 2026-08-29.
 */
const MIN_FILES = 400;

export const REMEDY =
  '  -> Give the control a name: `aria-label` on a bare <button>, or `text` /\n' +
  '     `aria-label` on <Button>. Mark the icon `aria-hidden="true"` while you are\n' +
  '     there — it is decoration once the button has a name. WCAG 4.1.2.';

// The corpus walk is what both questions need, so it happens once per root
// rather than once at module scope.
const inputs = byRoot((repoRoot) => ({ files: sources(repoRoot) }));

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const { files } = inputs(repoRoot);
  const found = [];

  if (files.length < MIN_FILES) {
    found.push({
      message: `only ${files.length} JSX sources scanned (floor ${MIN_FILES}). An empty corpus names nothing.`,
    });
  }

  /*
   * The record, through `scripts/lib/ratchet.mjs` (#600). Its exception map
   * keys a call site to THE REASON ITSELF, the shape declared for it in
   * `scripts/lib/ratchet-shapes.mjs` — so a recorded site that now has a name
   * is reported stale, and a recorded site whose reason says nothing is
   * reported unreviewed. Maintained BY HAND, with no `--update`: the bar is
   * zero, and a flag that recorded a nameless control for you would be a way of
   * agreeing that "button" is enough.
   */
  const gate = openRatchet({ file: RECORD, repoRoot });
  const hits = sites(nameless(files));
  const side = Object.fromEntries([...hits.keys()].map((key) => [key, '']));
  if (gate.absent) return [...found, ...gate.failures(side).map(({ message }) => ({ message }))];

  found.push(
    ...failures(hits, {
      fresh: gate.failures(side).map((f) => f.key),
      stale: gate.stale(side).map((s) => s.key),
      unreviewed: gate.unreviewed().map((u) => u.key),
    }).map((message) => ({ message })),
  );
  return found;
}

/** The green line, which carries the size of the corpus that was scanned. */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  return `${inputs(repoRoot).files.length} JSX sources, every icon-only button has a name`;
}

main(import.meta.url, 'check:icon-button-name', { run, summary, remedy: REMEDY });
