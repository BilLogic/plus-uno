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
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cdnPins, pinConflicts, unusedDeclared } from "./deps.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Declared, never referenced, and kept on purpose. Each needs a reason.
 *
 * The bar: something the repo genuinely needs at build or test time but never
 * names in source. Anything else belongs out of package.json.
 */
const ALLOWED = new Map([
  ["typescript", "the compiler. Invoked as `tsc` by typecheck and the test build; never imported."],
  ["sass", "the SCSS compiler Vite reaches for. Named in vite.config's preprocessorOptions by behaviour, not by specifier."],
  ["@cloudflare/workers-types", "the Worker runtime's ambient types. Loaded through tsconfig's `types`, which names it there rather than importing it."],
  ["@types/node", "ambient Node types for the Worker's build scripts. Same shape: a tsconfig entry, never an import."],
  ["@vitest/coverage-v8", "vitest loads it by convention when --coverage is passed; there is no import site."],
  ["@popperjs/core", "Bootstrap's positioning engine. A peer dependency of the dropdown/tooltip JS, pulled in at runtime rather than imported here."],
  [
    "@storybook/builder-vite",
    "Storybook's Vite builder, under @storybook/react-vite. Suspected removable — the framework is react-vite and nothing names this directly — but proving it needs a full `build-storybook`, which is not this gate's job. Open question on #266.",
  ],
  [
    "@storybook/html-vite",
    "same as above, and the more suspect of the two: the framework is react-vite, not html-vite. Left declared pending one Storybook build that confirms it is unused. Open question on #266.",
  ],
]);

/**
 * CDN version splits that already exist. New ones fail; these are recorded.
 *
 * A baseline, not an amnesty: the reason has to say what it would take to
 * close it, so it does not quietly become permanent.
 */
const CDN_BASELINE = new Map([
  [
    "fontawesome",
    { versions: ["6.4.0", "7.2.0"], why: "6.4.0 on cdnjs in six prototype templates, 7.2.0 on jsdelivr in eleven files including index.html and both Storybook head files. FA7 renamed and re-categorised icons, so unifying means loading the six prototypes and looking at them — not a find-and-replace. Until then this is two icon fonts in one repo." },
  ],
  [
    "bootstrap",
    { versions: ["5.3.3"], why: "pinned 5.3.3 on the CDN across the prototype pages while package.json installs 5.3.8 for the app, so a prototype and a component can render the same markup differently. Closing it means deciding whether the prototypes should share the app's Bootstrap at all." },
  ],
]);

const SOURCE = /\.(m?js|cjs|jsx|ts|tsx|css|scss|mdx|html|json|ya?ml)$/;
// Markdown included deliberately: design-system/README.md carried a THIRD
// FontAwesome (6.5.1) while the check reported "0 new", and a README is the
// file people copy a <link> out of, so it is how a fourth would spread.
const MARKUP = /\.(html|mdx|md)$/;

const tracked = execFileSync("git", ["-C", REPO_ROOT, "ls-files", "-z"], {
  encoding: "utf8",
  maxBuffer: 1 << 28,
})
  .split("\0")
  .filter(Boolean);

const read = (rel) => {
  try {
    return readFileSync(path.join(REPO_ROOT, rel), "utf8");
  } catch {
    return "";
  }
};

// Both manifests. `check-harness.mjs` reads both for its own completeness
// assertion, and dependabot.yml watches both for upgrades; the dead-dependency
// half was the only thing here looking at one.
const MANIFESTS = ["package.json", "agents/uno-bot/package.json"];
const manifests = MANIFESTS.map((rel) => ({ rel, json: JSON.parse(read(rel)) }));
const pkg = manifests[0].json;

// Everything except the manifests themselves — a package.json listing a
// dependency must not count as that dependency being used.
const sources = tracked
  .filter((f) => SOURCE.test(f) && path.basename(f) !== "package.json" && path.basename(f) !== "package-lock.json")
  .map((rel) => ({ path: rel, text: read(rel) }));

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
    allowed: ALLOWED,
    detailed: true,
  });
  // Named by manifest: "typescript is unused" means different things in the
  // root and in the Worker, which declares its own.
  unused.push(...r.unused.map((n) => `${n}  (${rel})`));
  stale.push(...r.stale);
}

/** What is actually installed, which is what a CDN pin really disagrees with. */
const installedVersion = (name) => {
  const p = path.join(REPO_ROOT, "node_modules", name, "package.json");
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
// A recorded split is not a blank cheque for that library. The baseline names
// the exact versions; a THIRD FontAwesome appearing is new, and has to fail.
// This is the a11y ratchet's rule: the recorded set may only shrink.
const newConflicts = [];
for (const c of conflicts) {
  const recorded = CDN_BASELINE.get(c.lib);
  if (!recorded) {
    newConflicts.push(c);
    continue;
  }
  const extra = c.versions.filter((v) => !recorded.versions.includes(v));
  if (extra.length) newConflicts.push({ ...c, extra });
}

// A baseline that never shrinks is a backlog wearing a ratchet's clothes — the
// same thing the ALLOWED list has a staleness check for.
const staleBaseline = [];
for (const [lib, recorded] of CDN_BASELINE) {
  // Not "no conflict found" — "no conflict found, and we were able to look".
  // bootstrap's split is CDN-pin-versus-shipped, so without node_modules the
  // comparison never runs, and calling that closed would delete a live entry.
  if (unresolved.includes(lib)) continue;
  const live = conflicts.find((c) => c.lib === lib);
  const stillSplit = live ? recorded.versions.filter((v) => live.versions.includes(v)) : [];
  if (stillSplit.length < recorded.versions.length) {
    staleBaseline.push(`${lib} (recorded ${recorded.versions.join(", ")}; still present: ${stillSplit.join(", ") || "none"})`);
  }
}

const failures = [];

if (unused.length) {
  failures.push(
    `${unused.length} declared dependenc(ies) nothing in the repo refers to:\n` +
      unused.map((n) => `       ${n}`).join("\n") +
      "\n     Remove them, or add them to ALLOWED in scripts/check-deps.mjs with the reason\n" +
      "     they are needed without being named.",
  );
}

// Shared across manifests, so "stale" means unused by BOTH — the Worker's
// typescript and the root's are the same exemption.
const trulyStale = [...new Set(stale)].filter((n) => !unused.some((u) => u.startsWith(`${n}  (`)));
if (trulyStale.length) {
  failures.push(
    `${trulyStale.length} ALLOWED entr(ies) for dependencies that ARE used now: ${trulyStale.join(", ")}.\n` +
      "     The exemption outlived its reason — delete it, so the list stays a set of\n" +
      "     decisions rather than a backlog.",
  );
}

if (staleBaseline.length) {
  failures.push(
    `${staleBaseline.length} CDN_BASELINE entr(ies) describing a split that no longer exists:\n` +
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
        "     Unify the version, or record it in CDN_BASELINE with what closing it needs.",
    );
  }
}

if (failures.length) {
  console.error(`[deps] ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  -> ${f}`);
  process.exit(1);
}

if (unresolved.length) {
  // Said out loud, because otherwise this check quietly answers a smaller
  // question locally than it does in CI, and the difference shows up as a gate
  // that passed on a laptop and failed on a runner.
  console.log(
    `[deps] note: ${unresolved.join(", ")} not installed here, so their CDN pins were not ` +
      "compared against the shipped version. Run after `npm ci` for the full check.",
  );
}

const baselined = conflicts.filter((c) => CDN_BASELINE.has(c.lib)).length;
console.log(
  `[deps] ${declaredCount} declared, all referenced (${ALLOWED.size} documented exception(s)); ` +
    `${pins.length} CDN pin(s) across ${new Set(pins.map((p) => p.path)).size} file(s), ` +
    `${baselined} recorded split(s), 0 new.`,
);
