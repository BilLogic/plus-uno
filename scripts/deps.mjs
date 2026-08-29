// The two dependency questions Dependabot cannot answer.
//
// #266. A version bumper tells you what is out of date. It cannot tell you what
// is DEAD — declared, installed, upgraded forever, imported nowhere — and it
// cannot see a library that was never declared at all, because a `<link>` to a
// CDN is invisible to every dependency tool there is.
//
// Both were real here. `lucide-react` and `react-bootstrap-icons` had zero
// references in the whole repo. FontAwesome was loaded from two different CDNs
// at two different MAJOR versions in the same codebase, and Bootstrap was
// pinned at 5.3.3 across thirteen prototype files while the app built against
// the 5.3.8 in package.json.

/**
 * The same library, spelled differently by different CDNs.
 *
 * This table is what makes the FontAwesome drift detectable. cdnjs serves it as
 * `font-awesome`, jsdelivr as the npm package `@fortawesome/fontawesome-free`.
 * Without an alias each spelling is self-consistent — one version apiece — and
 * a six-to-seven major split reads as two unrelated libraries in agreement.
 */
const ALIASES = new Map([
  ["font-awesome", "fontawesome"],
  ["@fortawesome/fontawesome-free", "fontawesome"],
]);

const canonical = (name) => ALIASES.get(name) ?? name;

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Files where a bare quoted package name means something on its own.
 *
 * `.storybook/main.js` lists addons as plain strings, and Vite/Vitest configs
 * name plugins the same way. Everywhere else a package name in quotes is just a
 * string — and treating it as usage is not hypothetical: "typescript" and
 * "sass" appear as CODE FENCE LANGUAGE NAMES in a Notion block mapper and in
 * scripts/doc-identifiers.mjs, and "playwright" appears in a workflow YAML.
 * Counting those kept three dependencies alive that nothing imports, and the
 * check reported all clean because it had matched the wrong thing.
 */
const CONFIG_FILE = /(^|\/)(\.storybook\/|[^/]*\.config\.[cm]?[jt]s$)/;

/** Every way a module actually gets pulled in, and no more than those. */
function importsIn(text) {
  const specifiers = new Set();
  const patterns = [
    /\bfrom\s*["'`]([^"'`]+)["'`]/g,          // import x from "y" / export … from "y"
    /\bimport\s*["'`]([^"'`]+)["'`]/g,        // import "y"
    /\bimport\s*\(\s*["'`]([^"'`]+)["'`]/g,   // import("y")
    /\brequire\s*\(\s*["'`]([^"'`]+)["'`]/g,  // require("y")
    /@import\s+(?:url\()?\s*["'`]([^"'`]+)["'`]/g, // CSS @import "y"
  ];
  for (const re of patterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) specifiers.add(m[1]);
  }
  return specifiers;
}

/** "@scope/pkg/sub" -> "@scope/pkg"; "pkg/sub" -> "pkg"; relative -> null */
function packageOf(specifier) {
  if (!specifier || /^[./]/.test(specifier) || specifier.startsWith("~") || specifier.startsWith("@/")) return null;
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

/**
 * Declared dependencies that nothing in the repo refers to.
 *
 * Three ways to count as referenced, and deliberately only three:
 *   1. imported (any spelling above), by package or subpath;
 *   2. named as a bare quoted string in a CONFIG file — where Storybook addons
 *      and Vite plugins are declared that way;
 *   3. run as a bare command word in an npm script (`concurrently`, `sass`).
 *
 * @param {object} o
 * @param {string[]} o.declared
 * @param {{path: string, text: string}[]} o.sources
 * @param {Record<string,string>} [o.scripts]
 * @param {Map<string,string>} [o.allowed]  package -> why it is exempt
 * @param {boolean} [o.detailed]
 * @returns {string[] | {unused: string[], stale: string[]}}
 */
export function unusedDeclared({ declared, sources, scripts = {}, allowed = new Map(), detailed = false }) {
  const imported = new Set();
  let configText = "";
  for (const { path: p, text } of sources) {
    for (const spec of importsIn(text)) {
      const name = packageOf(spec);
      if (name) imported.add(name);
    }
    if (CONFIG_FILE.test(p)) configText += `${text}\n`;
  }

  const commands = Object.values(scripts).join("\n");
  const unused = [];
  const stale = [];

  for (const name of declared) {
    const inConfig = new RegExp(`["'\`]${escapeRe(name)}(?:/[^"'\`]*)?["'\`]`).test(configText);
    // Word-bounded so `vite` is not kept alive by `vitest` or `@vitejs/…`.
    const asCommand = new RegExp(`(?:^|[\\s"'&|;(])${escapeRe(name)}(?=$|[\\s"'&|;)])`, "m").test(commands);
    const used = imported.has(name) || inConfig || asCommand;

    if (used) {
      // An exemption that outlived its reason is how an allowlist becomes a
      // backlog. Report it rather than letting it sit.
      if (allowed.has(name)) stale.push(name);
      continue;
    }
    if (!allowed.has(name)) unused.push(name);
  }

  return detailed ? { unused, stale } : unused;
}

/** jsdelivr: /npm/name@version/ or /npm/@scope/name@version/ */
const JSDELIVR = /cdn\.jsdelivr\.net\/npm\/((?:@[^/@"'\s]+\/)?[^/@"'\s]+)@([0-9][^/"'\s]*)/g;
/** cdnjs: /ajax/libs/name/version/ */
const CDNJS = /cdnjs\.cloudflare\.com\/ajax\/libs\/([^/"'\s]+)\/([0-9][^/"'\s]*)/g;

/**
 * Every version-pinned CDN reference in the given files.
 *
 * A URL with no version (`/npm/bootstrap/dist/…`) is skipped rather than read
 * as a pin — it floats on latest, which is a different problem, and calling its
 * next path segment a "version" would be a fabricated finding.
 *
 * @param {{path: string, text: string}[]} files
 * @returns {{path: string, lib: string, spelling: string, version: string}[]}
 */
export function cdnPins(files) {
  const pins = [];
  for (const { path, text } of files) {
    for (const re of [JSDELIVR, CDNJS]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) {
        pins.push({ path, lib: canonical(m[1]), spelling: m[1], version: m[2] });
      }
    }
  }
  return pins;
}

/**
 * Libraries pinned at more than one version, or at a version that disagrees
 * with what package.json installs.
 *
 * @param {ReturnType<typeof cdnPins>} pins
 * @param {{declaredVersions?: Record<string,string>}} [o]
 * @returns {{lib: string, versions: string[], declared?: string, where: Record<string,string[]>}[]}
 */
export function pinConflicts(pins, { declaredVersions = {} } = {}) {
  const byLib = new Map();
  for (const p of pins) {
    if (!byLib.has(p.lib)) byLib.set(p.lib, new Map());
    const versions = byLib.get(p.lib);
    if (!versions.has(p.version)) versions.set(p.version, []);
    versions.get(p.version).push(p.path);
  }

  const conflicts = [];
  for (const [lib, versions] of byLib) {
    const declared = declaredVersions[lib];
    const pinned = [...versions.keys()];
    const disagreesWithPackageJson = declared !== undefined && !pinned.includes(declared);
    if (pinned.length === 1 && !disagreesWithPackageJson) continue;
    conflicts.push({
      lib,
      versions: pinned,
      ...(declared === undefined ? {} : { declared }),
      where: Object.fromEntries(versions),
    });
  }
  return conflicts;
}
