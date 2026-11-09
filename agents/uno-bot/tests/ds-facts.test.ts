// The design-system facts the Worker carries: baked at build from the root
// facts module (`scripts/generate-ds-facts.mjs`), read in-process by
// `src/integrations/ds-facts.ts`, and handed to the model by `github_read`'s
// `lookup`. No fetch anywhere: the answer to "does PLUS have a card?" is in
// the bundle.
//
// The parity tests load the root module itself, from the checkout, and hold
// the baked lookup to it name by name: the IDE and Slack answer from one set
// of facts, so they must give one answer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { dsFacts, precedenceIndex, type DsAnswer } from "../src/integrations/ds-facts";
import { readGithub, type GithubReadDeps } from "../src/tools/github-read";
import { parseRepoList, resolveRepo } from "../src/integrations/repo-list.mjs";

const ROOT = resolve(process.cwd(), "../..");

interface RootFacts {
  manifests: { components: { components: Array<{ name: string; props?: Array<{ name: string; values: string[] | null }> | null }> }; tokens: { tokens: Array<{ name: string; group: string }> } };
  barrels: Record<string, Set<string>>;
  lookup(name: string): Record<string, unknown>;
  tokens(query: string): Array<Record<string, unknown>>;
  notHere(): Array<Record<string, unknown>>;
}

async function rootFacts(): Promise<RootFacts> {
  const mod = (await import(pathToFileURL(resolve(ROOT, "scripts/lib/ds-facts.mjs")).href)) as { loadFacts(root: string): RootFacts };
  return mod.loadFacts(ROOT);
}

/**
 * Prop descriptions are not baked: they stay in the generated docs. Nor are a
 * component's aliases: they are ds_find's ranking vocabulary, and the Worker
 * has no find.
 */
function withoutDescriptions(answer: Record<string, unknown>): Record<string, unknown> {
  const props = answer.props as Array<Record<string, unknown>> | null | undefined;
  const { aliases: _aliases, ...rest } = answer;
  const out: Record<string, unknown> = { ...rest, description: null };
  if (props) out.props = props.map((p) => ({ ...p, description: null }));
  return out;
}

test("every component, pattern, export and invented name answers as the root module answers it", async () => {
  const root = await rootFacts();
  const facts = dsFacts();
  const names = new Set<string>([
    ...root.manifests.components.components.map((c) => c.name),
    ...Object.values(root.barrels).flatMap((s) => [...s]),
    ...root.notHere().filter((r) => r.kind === "component").map((r) => String(r.not)),
    "Nonesuch",
  ]);
  for (const name of names) {
    assert.deepEqual(withoutDescriptions(facts.lookup(name) as unknown as Record<string, unknown>), withoutDescriptions(root.lookup(name)), name);
  }
});

test("every prop, with and without a value, answers as the root module answers it", async () => {
  const root = await rootFacts();
  const facts = dsFacts();
  const queries = ["Button.variant", "Button.size", "Button.appearance=secondary", "Heading.size=sm", "Heading.level", "Button.nonesuch", "Nonesuch.prop"];
  for (const c of root.manifests.components.components) {
    for (const p of c.props ?? []) {
      queries.push(`${c.name}.${p.name}`);
      if (p.values?.[0]) queries.push(`${c.name}.${p.name}=${p.values[0]}`, `${c.name}.${p.name}=nonesuch`);
    }
  }
  for (const q of queries) assert.deepEqual(withoutDescriptions(facts.lookup(q) as unknown as Record<string, unknown>), withoutDescriptions(root.lookup(q)), q);
});

test("tokens by name and by role, and the not-here list, answer as the root module answers them", async () => {
  const root = await rootFacts();
  const facts = dsFacts();
  const groups = new Set(root.manifests.tokens.tokens.map((t) => t.group));
  const queries = ["stack", "inline", "space", "radius", "--stack-md", "--stack-xl", "--radius-4", "--space-100", "--nonesuch", "--ds-on-surface", ...groups];
  for (const t of root.manifests.tokens.tokens.slice(0, 200)) queries.push(t.name);
  for (const r of root.notHere().filter((r) => r.kind === "token")) queries.push(String(r.not).split(/[\s,(]/)[0]!);
  for (const q of queries) assert.deepEqual(facts.tokens(q), root.tokens(q), q);
  assert.deepEqual(facts.notHere(), root.notHere());
});

test("'does PLUS have a card?' resolves to PatternCard and its import, from the bundled facts", () => {
  const found = dsFacts().find("card");
  assert.equal(found.answer.name, "Card");
  assert.equal(found.answer.status, "not-here");
  assert.deepEqual(found.answer.replacement, ["PatternCard"]);
  const [use] = found.use;
  assert.equal(use?.name, "PatternCard");
  assert.equal(use?.status, "exists");
  assert.equal(use?.kind, "pattern");
  assert.equal(use?.import, "import { PatternCard } from '@/patterns';");
});

test("a name matched in another case is found, and a miss offers the names that contain it", () => {
  const facts = dsFacts();
  assert.equal(facts.find("button").answer.name, "Button");
  assert.equal(facts.find("BUTTON").answer.status, "exists");
  const miss = facts.find("Tab");
  assert.equal(miss.answer.status, "unknown");
  assert.equal(miss.near[0], "Tabs", JSON.stringify(miss.near));
  assert.deepEqual(facts.find("zzzz").near, []);
});

test("the precedence index is the components with a generated doc, by name, with the doc's path", () => {
  const index = precedenceIndex();
  const button = index.find((e) => e.name === "Button");
  assert.ok(button, "Button is indexed");
  assert.match(button.docPath, /^design-system\/src\/components\/[^/]+\/Button\/index\.md$/);
  // Patterns have no generated doc page, and Logo is implemented outside src/components.
  assert.equal(index.some((e) => e.name === "PatternCard" || e.name === "Logo"), false);
  assert.ok(index.length > 50, `${index.length} entries`);
});

const UNO = "BilLogic/plus-uno";
function noNetwork(): GithubReadDeps & { calls: number } {
  const deps = {
    calls: 0,
    resolveRepo: (requested: unknown) => resolveRepo(parseRepoList(JSON.stringify([{ repo: UNO, purpose: "harness", workflows: [] }]), UNO), requested),
    async readPath(): Promise<never> {
      deps.calls += 1;
      throw new Error("no read expected");
    },
    async searchCode(): Promise<never> {
      deps.calls += 1;
      throw new Error("no search expected");
    },
  };
  return deps;
}

test("github_read's lookup answers 'does PLUS have a card?' from the bundle, with no fetch", async () => {
  const deps = noNetwork();
  const out = JSON.parse(await readGithub({ lookup: "card" }, deps)) as { ok: boolean; lookup: string; answer: DsAnswer; use: DsAnswer[]; note: string };
  assert.equal(deps.calls, 0);
  assert.equal(out.ok, true);
  assert.equal(out.answer.status, "not-here");
  assert.equal(out.use[0]?.name, "PatternCard");
  assert.equal(out.use[0]?.import, "import { PatternCard } from '@/patterns';");
});

test("github_read's lookup answers a prop and a token role from the bundle", async () => {
  const deps = noNetwork();
  const prop = JSON.parse(await readGithub({ lookup: "Button.appearance" }, deps)) as { ok: boolean; answer: { status: string; values: string[] | null } };
  assert.equal(prop.answer.status, "exists");
  assert.ok(prop.answer.values?.includes("primary"));
  const tokens = JSON.parse(await readGithub({ lookup: "stack" }, deps)) as { ok: boolean; tokens: Array<{ name: string; intent: string | null }> };
  assert.ok(tokens.tokens.some((t) => t.name === "--stack-md" && t.intent));
  assert.equal(deps.calls, 0);
});
