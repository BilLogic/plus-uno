// One Node version for the whole repo, and a floor that is READ rather than
// declared.
//
// WHY THIS EXISTS. The uno-bot cutover wizard died at stage 2 on
// "Wrangler requires at least Node.js v22.0.0. You are using v20.19.3", and the
// repo had no way to have said so first: no .nvmrc, no `engines`, and nine
// workflows pinning three different majors (20, 22 and 24) as literals. One of
// them, uno-bot-deploy.yml, even carried the comment `# wrangler v4.97+
// requires Node >= 22` — the fact was known, written down once, and enforced
// nowhere else.
//
// The floor comes from the installed wrangler's own `engines.node`. Bumping
// wrangler past a Node major therefore fails this check instead of failing a
// deploy, which is the only ordering that helps.
import fs from 'node:fs';
import path from 'node:path';

export const WORKFLOWS = '.github/workflows';
export const NVMRC = '.nvmrc';
export const MANIFESTS = ['package.json', 'agents/uno-bot/package.json'];

/** The Node major wrangler refuses to run below, from wrangler itself. */
export function wranglerFloor(root) {
  const pkg = path.join(root, 'agents/uno-bot/node_modules/wrangler/package.json');
  if (!fs.existsSync(pkg)) return null;
  const engines = JSON.parse(fs.readFileSync(pkg, 'utf8')).engines ?? {};
  const match = /(\d+)/.exec(engines.node ?? '');
  return match ? Number(match[1]) : null;
}

export function nvmrcMajor(root) {
  const file = path.join(root, NVMRC);
  if (!fs.existsSync(file)) return null;
  const match = /(\d+)/.exec(fs.readFileSync(file, 'utf8').trim());
  return match ? Number(match[1]) : null;
}

/**
 * Workflows that pin a Node major as a LITERAL.
 *
 * `node-version-file` is the whole point: a literal is a second copy of the
 * floor, and second copies are how 20, 22 and 24 came to coexist in one repo.
 */
export function hardcoded(root) {
  const dir = path.join(root, WORKFLOWS);
  if (!fs.existsSync(dir)) return [];
  const found = [];
  for (const name of fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).sort()) {
    const lines = fs.readFileSync(path.join(dir, name), 'utf8').split('\n');
    lines.forEach((line, i) => {
      const match = /^\s*node-version:\s*["']?(\d+)/.exec(line);
      if (match) found.push({ file: `${WORKFLOWS}/${name}`, line: i + 1, version: match[1] });
    });
  }
  return found;
}

/** The `engines.node` each manifest declares, or null where it declares none. */
export function engines(root) {
  return MANIFESTS.map((f) => {
    const full = path.join(root, f);
    if (!fs.existsSync(full)) return { file: f, node: null };
    return { file: f, node: JSON.parse(fs.readFileSync(full, 'utf8')).engines?.node ?? null };
  });
}

export function findings(root) {
  const out = [];
  const floor = wranglerFloor(root);
  const nvmrc = nvmrcMajor(root);

  if (nvmrc === null) {
    out.push(`${NVMRC} is missing. It is the one place the Node version is written down.`);
  } else if (floor !== null && nvmrc < floor) {
    out.push(
      `${NVMRC} says ${nvmrc}, but the installed wrangler declares engines.node ">=${floor}". ` +
        'Every wrangler call in the repo would refuse to start.',
    );
  }

  for (const { file, line, version } of hardcoded(root)) {
    out.push(
      `${file}:${line} pins node-version: "${version}" as a literal. ` +
        `Use \`node-version-file: ".nvmrc"\` so there is one floor, not ten.`,
    );
  }

  if (nvmrc !== null) {
    for (const { file, node } of engines(root)) {
      if (node === null) out.push(`${file} declares no engines.node, so npm cannot warn before wrangler errors.`);
      else if (node !== `>=${nvmrc}`) out.push(`${file} declares engines.node "${node}", but ${NVMRC} says ${nvmrc}.`);
    }
  }

  return out;
}
