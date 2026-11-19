#!/usr/bin/env node
// The half of dependency hygiene Dependabot cannot do (#266).
//
// `.github/dependabot.yml` answers "is anything out of date?". This answers the
// two questions it structurally cannot:
//
//   1. Is anything DEAD? A declared dependency nothing imports gets upgraded
//      forever, reviewed forever, and audited forever, for nothing. Two were
//      found here with zero references in the entire repo.
//
//   2. Is anything real but UNDECLARED? A `<link>` to a CDN is invisible to
//      every dependency tool there is. FontAwesome — the icon system 254 files
//      actually use — is loaded that way, from two different CDNs, at two
//      different MAJOR versions, and nothing had ever said so.
//
// CONFLICTS ARE RATCHETED, not failed outright. The FontAwesome split is a
// major-version icon migration across six prototypes: FA7 renamed icons, so
// unifying it needs someone to look at the rendered pages. Recording it keeps
// the gate honest about what is already true while failing anything NEW — the
// same shape as the a11y baseline and `check:negation`.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cdnPins, pinConflicts, unusedDeclared } from "./deps.mjs";
import { byRoot, main } from "./lib/findings.mjs";
import { loadExceptions } from "./lib/exceptions.mjs";
import { absentMessage, openRatchet } from "./lib/ratchet.mjs";
import { trackedFiles } from "./lib/tracked-sources.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Declared, never referenced, and kept on purpose: the `allowed` list of
 * `check:deps` in `scripts/exceptions.json`, each with its reason.
 *
 * The bar: something the repo genuinely needs at build or test time but never
 * names in source. Anything else belongs out of package.json.
 */
const allowedPackages = () => new Map(loadExceptions("check:deps", "allowed").map((e) => [e.at, e.reason]));

/**
 * CDN version splits that already exist. New ones fail; these are recorded in
 * `scripts/baselines/cdn-splits.json`, one entry per `lib@version`, each with the
 * reason it stands. A baseline, not an amnesty: the reason has to say what it would
 * take to close it, so it does not quietly become permanent.
 */
export const BASELINE = "scripts/baselines/cdn-splits.json";

/** The ratchet's key for one version of one library. */
const splitKey = (lib, version) => `${lib}@${version}`;

/**
 * Judge the CDN conflicts against the recorded splits.
 *
 * A recorded split is not a blank check for that library: the record names the exact
 * versions, and a THIRD version appearing is new and has to fail. A recorded version
 * that is gone is reported, so the record stops asserting something untrue.
 *
 * @param {{lib: string, versions: string[]}[]} conflicts
 * @param {string[]} unresolved libraries whose installed version could not be read
 * @param {ReturnType<typeof openRatchet>} ratchet
 * @returns {{newConflicts: object[], staleBaseline: string[], baselined: number}}
 */
export function splitVerdict(conflicts, unresolved, ratchet) {
  const found = conflicts.flatMap((c) => c.versions.map((v) => splitKey(c.lib, v)));
  const recordedOf = (lib) => [...ratchet.entries.keys()].filter((k) => k.startsWith(`${lib}@`)).map((k) => k.slice(lib.length + 1));
  const isNew = new Set(ratchet.failures(found).filter((f) => f.kind === "new").map((f) => f.key));

  const newConflicts = [];
  for (const c of conflicts) {
    if (!recordedOf(c.lib).length) {
      newConflicts.push(c);
      continue;
    }
    const extra = c.versions.filter((v) => isNew.has(splitKey(c.lib, v)));
    if (extra.length) newConflicts.push({ ...c, extra });
  }

  // A recorded split nobody prunes is a backlog wearing a ratchet's clothes — the
  // same thing the allowed list has a staleness check for.
  const staleBaseline = [];
  const staleLibs = new Set();
  for (const { key } of ratchet.stale(found)) {
    const lib = key.slice(0, key.lastIndexOf("@"));
    // Not "no conflict found" — "no conflict found, and we were able to look".
    // A CDN-pin-versus-shipped split needs node_modules to compare, so without
    // it the comparison never runs, and calling that closed would delete a live entry.
    if (unresolved.includes(lib) || staleLibs.has(lib)) continue;
    staleLibs.add(lib);
    const live = conflicts.find((c) => c.lib === lib);
    const recorded = recordedOf(lib);
    const stillSplit = live ? recorded.filter((v) => live.versions.includes(v)) : [];
    staleBaseline.push(`${lib} (recorded ${recorded.join(", ")}; still present: ${stillSplit.join(", ") || "none"})`);
  }

  return { newConflicts, staleBaseline, baselined: conflicts.filter((c) => recordedOf(c.lib).length).length };
}

// `mts`/`cts` are here because a TypeScript ESM module was invisible to this
// sweep: agents/uno-bot/vitest.workerd.config.mts imports
// @cloudflare/vitest-pool-workers and has to be .mts (that package is ESM-only
// and the manifest is not `type: module`), so the one file that uses the
// dependency did not count as using it and the dependency read as dead (#493).
const SOURCE = /\.(m?js|cjs|jsx|ts|tsx|mts|cts|css|scss|mdx|html|json|ya?ml)$/;
// Markdown included deliberately: design-system/README.md carried a THIRD
// FontAwesome (6.5.1) while the check reported "0 new", and a README is the
// file people copy a <link> out of, so it is how a fourth would spread.
const MARKUP = /\.(html|mdx|md)$/;

/** The two manifests this repo ships, both watched for upgrades. */
const MANIFESTS = ["package.json", "agents/uno-bot/package.json"];

/**
 * Everything both halves of the check stand on, read once per repo root: one
 * file listing, one read of every source file, one CDN sweep. The findings and
 * the green line ask different questions of the same sweep, and doing that
 * sweep twice is the whole cost of this check.
 */
const inputs = byRoot((repoRoot) => {
  const tracked = trackedFiles(repoRoot);

  const read = (rel) => {
    try {
      return readFileSync(path.join(repoRoot, rel), "utf8");
    } catch {
      return "";
    }
  };

  // Both manifests. `check-harness.mjs` reads both for its own completeness
  // assertion, and dependabot.yml watches both for upgrades; the dead-dependency
  // half was the only thing here looking at one.
  const manifests = MANIFESTS.map((rel) => ({ rel, json: JSON.parse(read(rel)) }));

  // Everything except the manifests themselves — a package.json listing a
  // dependency must not count as that dependency being used.
  const sources = tracked
    .filter((f) => SOURCE.test(f) && path.basename(f) !== "package.json" && path.basename(f) !== "package-lock.json")
    .map((rel) => ({ path: rel, text: read(rel) }));

  const allowed = allowedPackages();
  const unused = [];
  const stale = [];
  let declaredCount = 0;
  for (const { rel, json } of manifests) {
    const declared = Object.keys({ ...json.dependencies, ...json.devDependencies });
    declaredCount += declared.length;
    const r = unusedDeclared({
      declared,
      sources,
      scripts: json.scripts ?? {},
      allowed,
      detailed: true,
    });
    // Named by manifest: "typescript is unused" means different things in the
    // root and in the Worker, which declares its own.
    unused.push(...r.unused.map((n) => `${n}  (${rel})`));
    stale.push(...r.stale);
  }

  /** What is actually installed, which is what a CDN pin really disagrees with. */
  const installedVersion = (name) => {
    const p = path.join(repoRoot, "node_modules", name, "package.json");
    if (!existsSync(p)) return undefined;
    try {
      return JSON.parse(readFileSync(p, "utf8")).version;
    } catch {
      return undefined;
    }
  };

  // Compared against what is INSTALLED, not against the range in package.json: a
  // range of ^5.3.3 and a CDN pin of 5.3.3 look like agreement while the app
  // actually ships 5.3.8.
  const pins = cdnPins(tracked.filter((f) => MARKUP.test(f)).map((rel) => ({ path: rel, text: read(rel) })));

  // Derived, not hand-listed: any library both pinned on a CDN and declared as a
  // dependency. A hardcoded list is right until the day someone pins a second one.
  const allDeclared = new Set(manifests.flatMap(({ json }) => Object.keys({ ...json.dependencies, ...json.devDependencies })));
  const declaredVersions = {};
  const unresolved = [];
  for (const name of new Set(pins.map((p) => p.lib))) {
    if (!allDeclared.has(name)) continue;
    const v = installedVersion(name);
    if (v) declaredVersions[name] = v;
    else unresolved.push(name);
  }
  const conflicts = pinConflicts(pins, { declaredVersions });

  return { unused, stale, pins, conflicts, unresolved, declaredCount, allowedCount: allowed.size };
});

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const { unused, stale, conflicts, unresolved } = inputs(repoRoot);

  const ratchet = openRatchet({ file: BASELINE, repoRoot });
  if (ratchet.absent) return [{ message: absentMessage(BASELINE) }];
  const { newConflicts, staleBaseline } = splitVerdict(conflicts, unresolved, ratchet);

  const failures = [];

  if (unused.length) {
    failures.push(
      `${unused.length} declared dependenc(ies) nothing in the repo refers to:\n` +
        unused.map((n) => `       ${n}`).join("\n") +
        "\n     Remove them, or add them to `allowed` in scripts/exceptions.json with the reason\n" +
        "     they are needed without being named.",
    );
  }

  // Shared across manifests, so "stale" means unused by BOTH — the Worker's
  // typescript and the root's are the same exemption.
  const trulyStale = [...new Set(stale)].filter((n) => !unused.some((u) => u.startsWith(`${n}  (`)));
  if (trulyStale.length) {
    failures.push(
      `${trulyStale.length} allowed entr(ies) for dependencies that ARE used now: ${trulyStale.join(", ")}.\n` +
        "     The exemption outlived its reason — delete it, so the list stays a set of\n" +
        "     decisions rather than a backlog.",
    );
  }

  if (staleBaseline.length) {
    failures.push(
      `${staleBaseline.length} recorded CDN split(s) describing a split that no longer exists:\n` +
        staleBaseline.map((l) => `       ${l}`).join("\n") +
        "\n     Someone closed it. Delete the entry so the file stops asserting something untrue.",
    );
  }

  if (newConflicts.length) {
    for (const c of newConflicts) {
      const lines = Object.entries(c.where)
        .map(([v, files]) => `       ${v}  ${files.length} file(s): ${files.slice(0, 3).join(", ")}${files.length > 3 ? " …" : ""}`)
        .join("\n");
      failures.push(
        `${c.lib} is pinned at ${c.extra ? `a version not in the baseline (${c.extra.join(", ")})` : "more than one version on a CDN, or disagrees with the installed one"}` +
          `${c.declared ? ` (package.json installs ${c.declared})` : ""}:\n${lines}\n` +
          "     A CDN <link> is invisible to Dependabot, so nothing else will ever notice.\n" +
          "     Unify the version, or record it in scripts/baselines/cdn-splits.json with what closing it needs.",
      );
    }
  }

  return failures.map((message) => ({ message }));
}

/**
 * The green line, which carries the four numbers this check exists to hold
 * steady — and, where a CDN-pinned library is not installed, the note that it
 * answered a smaller question here than it will in CI. Said out loud, because
 * otherwise the difference shows up as a gate that passed on a laptop and
 * failed on a runner.
 */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const { pins, conflicts, unresolved, declaredCount, allowedCount } = inputs(repoRoot);
  const { baselined } = splitVerdict(conflicts, unresolved, openRatchet({ file: BASELINE, repoRoot }));
  const line =
    `${declaredCount} declared, all referenced (${allowedCount} documented exception(s)); ` +
    `${pins.length} CDN pin(s) across ${new Set(pins.map((p) => p.path)).size} file(s), ` +
    `${baselined} recorded split(s), 0 new.`;
  if (!unresolved.length) return line;
  return (
    `${line}\nnote: ${unresolved.join(", ")} not installed here, so their CDN pins were not ` +
    "compared against the shipped version. Run after `npm ci` for the full check."
  );
}

main(import.meta.url, "check:deps", { run, summary });
