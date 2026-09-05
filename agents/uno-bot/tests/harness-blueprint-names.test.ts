// The harness, swept for blueprint names the schema no longer has.
//
// WHY THIS IS A TEST AND NOT A DOC RULE: on 2026-09-01 an audit found that the
// prose the bot is handed every turn described a blueprint that had not existed
// for eleven days. `blueprint-navigation.md` told it to read `path_type`, to
// check `picture` and `links`, and named `findings`, `slice_items` and
// `business_model`. The `search_blueprint` tool description — which rides in
// EVERY request — told it the future layer is marked by a `Planned:` /
// `Prototype:` path NAME, then forbade it from reporting no future state until
// it had searched for one. Zero such paths existed. The instruction could only
// produce a fruitless search followed by a rule against the correct conclusion.
//
// None of it failed. Prose does not 400. The only way a stale instruction
// surfaces is when someone reads it beside the schema, which is what this does
// on every run.
//
// WHAT IT CANNOT REACH: a dead schema word used as ordinary English. `layers`
// became `lanes`, but "a labelled future layer" is a correct sentence, so the
// sweep matches BACKTICKED identifiers and named conventions only. A bare word
// is left to review — the alternative is a check that fails on English.
//
// The subject is the ASSEMBLED PROMPT — harness-bundle.md's generated twin of
// the string baked into harness.ts, after ide-only regions are stripped — plus
// tool-definitions.json, because tool schemas ship outside the bundle. Sweeping
// the assembly rather than a list of paths means a doc added to the prompt is
// swept the day it is added, with nothing to remember.
//
// THE THIRD SUBJECT IS THE ACTIONS PROMPTS (#425). uno has three embodiments
// and the two subjects above are the Worker's. The headless GitHub Actions
// prompts under `scripts/prompts/` reach a model by their own loader, never
// the bundler, and carry no `embodiment:` on purpose — so until #425 no sweep
// could name them and none did. They are listed by where they live: the walk
// is `scripts/lib/actions-prompts.mjs`, shared with `check:negation`'s third
// scope, and imported here by file URL because this test's compiled twin runs
// from `.test-build/` where a relative import cannot reach the repo root. The
// same two sweeps run over them, sentence-scoped with the same exemption.
//
// THE FOURTH SUBJECT IS THE RUNTIME NOTES (#443). A tool RESULT carries prose
// too — the conflict note and index note `search_blueprint` attaches, the
// scope hint `blueprint:` prepends, the index legend — and none of it is in
// the bundle or the tool schemas. So the prompt was swept clean of the
// `Planned:` convention on 2026-09-01 while every result still taught it.
// Those strings are exported from pure modules (blueprint-search-notes.ts,
// scope-keywords.ts, blueprint-index.ts) and swept here by name, with the
// same two sweeps and the same exemption.
//
// THE SCHEMA IS IN THE PROMPT NOW (#412). docs/connectors/supabase/blueprint.md
// is the blueprint's own account, vendored from plus-uno-blueprint, and its
// `generated:schema` region is the live catalog rendered table by table. Two
// consequences for this sweep. First, that region is the ALLOWLIST: every
// backticked `table.column` in the swept prose has to resolve against it, which
// catches a name that was never right as well as one that was retired — the
// blocklist below cannot, and needs a hand edit per rename. Second, the region
// is itself exempt from the blocklist: it is a rendering of what exists, so a
// live column that happens to share a retired name (`authoring_changes.label`,
// `trash.label` — the retired one was `cell_dependencies.label`) is correct
// there and would be condemned by a bare-word match. What guards the region's
// own truth is the chain it arrives by: plus-uno-blueprint's
// `check:agent-account` fails when the catalog and the render disagree, and
// `sync-blueprint-contract.mjs --check` fails when the vendored bytes differ.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  RETIRED_IN_PROSE,
  RETIRED_CONVENTIONS,
  WIRE_NAMES,
} from "../src/integrations/blueprint-schema";
import { SEARCH_NOTES } from "../src/tools/blueprint-search-notes";
import { TOUCHPOINT_NOTES } from "../src/tools/blueprint-touchpoint-notes";
import { SCOPES } from "../src/agent/scope-keywords";
import { INDEX_LEGEND } from "../src/integrations/blueprint-index";

const REPO = resolve(process.cwd(), "..", "..");
const BOT = resolve(REPO, "agents", "uno-bot");
const ACCOUNT = resolve(REPO, "docs", "connectors", "supabase", "blueprint.md");
const PROMPT_MARKER = "## The assembled prompt";
const SCHEMA_OPEN = /<!-- generated:schema[^>]*-->/;
const SCHEMA_CLOSE = "<!-- /generated:schema -->";

/** The Actions-prompt walk, from the one module that owns it. */
type ActionsPrompts = {
  ACTIONS_PROMPTS_DIR: string;
  walkPromptDocs: (root: string) => string[];
  actionsPromptFiles: () => string[];
};
async function actionsPrompts(): Promise<ActionsPrompts> {
  const url = pathToFileURL(resolve(REPO, "scripts", "lib", "actions-prompts.mjs")).href;
  return (await import(url)) as ActionsPrompts;
}

function assembledPrompt(): string {
  const bundle = readFileSync(resolve(BOT, "harness-bundle.md"), "utf8");
  const at = bundle.indexOf(PROMPT_MARKER);
  assert.notEqual(at, -1, "harness-bundle.md has no assembled-prompt section");
  return bundle.slice(at);
}

/** The rendered catalog, cut out of a text; the text with it blanked to the
 *  same line count, so reported line numbers stay right. */
function splitSchema(text: string): { schema: string; rest: string } {
  const open = text.search(SCHEMA_OPEN);
  const close = text.indexOf(SCHEMA_CLOSE);
  if (open === -1 || close === -1) return { schema: "", rest: text };
  const schema = text.slice(open, close);
  const blank = schema.replace(/[^\n]/g, "");
  return { schema, rest: text.slice(0, open) + blank + text.slice(close) };
}

/** table → its columns, read off the account's `### \`table\`` sections and the
 *  `| \`column\` |` rows beneath each. A table listed as unreadable with the
 *  anon key has no rows and is recorded with no columns. */
export function schemaTables(text: string): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  let current: Set<string> | undefined;
  for (const line of splitSchema(text).schema.split("\n")) {
    const table = line.match(/^### `([a-z_]+)`/);
    if (table) {
      current = new Set();
      out.set(table[1]!, current);
      continue;
    }
    const unreadable = line.match(/^- `([a-z_]+)` — /);
    if (unreadable && !out.has(unreadable[1]!)) out.set(unreadable[1]!, new Set());
    const column = current && line.match(/^\| `([a-z_]+)` \|/);
    if (column) current!.add(column[1]!);
  }
  return out;
}

/** Every backticked `table.column` whose table the schema knows and whose
 *  column it does not. A table the schema lacks is left to the blocklist — the
 *  prompt is full of `file.ext` spans that look the same. */
export function unresolved(text: string, schema: Map<string, Set<string>>, source: string): string[] {
  const found: string[] = [];
  const { rest } = splitSchema(text);
  let line = 1;
  for (const raw of rest.split("\n")) {
    for (const m of raw.matchAll(/`([a-z_]+)\.([a-z_]+)`/g)) {
      const columns = schema.get(m[1]!);
      if (!columns || columns.has(m[2]!)) continue;
      found.push(`${source}:${line} names \`${m[1]}.${m[2]}\`, which the schema lacks`);
    }
    line++;
  }
  return found;
}

function toolDefinitions(): string {
  return readFileSync(resolve(BOT, "tool-definitions.json"), "utf8");
}

/** Prose is swept by PARAGRAPH, not by line.
 *
 *  The exemption below — a passage that names the old spelling in order to say
 *  it is dead — is the one place an old name belongs, and markdown wraps that
 *  sentence across lines. A line-scoped check flagged §4b's "`Happy Path` no
 *  longer exists. Neither does ... any `Planned:` / `Prototype:` name", which
 *  is the correction itself. A guard that fails on the fix teaches people to
 *  delete the explanation. */
function paragraphs(text: string): Array<{ line: number; body: string }> {
  const out: Array<{ line: number; body: string }> = [];
  let line = 1;
  let start = 1;
  let buf: string[] = [];
  const flush = (): void => {
    if (buf.join("").trim()) out.push({ line: start, body: buf.join(" ") });
    buf = [];
  };
  for (const raw of text.split("\n")) {
    if (!raw.trim()) {
      flush();
      start = line + 1;
    } else {
      if (!buf.length) start = line;
      buf.push(raw);
    }
    line++;
  }
  flush();
  return out;
}

/** Language that makes a mention a CORRECTION rather than an instruction. */
const CORRECTION =
  /\brenamed\b|\bbecame\b|\bwas dropped\b|\bwas removed\b|\bremoved on\b|\bno longer\b|\bneither does\b|\buntil 2026|\bgone\b|\bis dead\b|finds nothing|\bdoes not exist\b/i;

/** Sentences, so the exemption is scoped to the clause that does the
 *  correcting rather than to everything near it.
 *
 *  Paragraph scoping was tried first and let a planted defect through: the tool
 *  description is ONE line of JSON, so its whole 2,000-word body was a single
 *  paragraph, and one clause saying the convention was removed exempted every
 *  other clause in it — including a restored "search for a `Planned:` path"
 *  instruction. An exemption has to be no wider than the sentence that earns
 *  it. */
function sentences(body: string): string[] {
  return body.split(/(?<=[.!?])\s+/).filter((x) => x.trim());
}

/** Paragraphs naming a retired identifier, minus passages ABOUT the rename,
 *  and minus the rendered catalog (see the header). */
function offenders(text: string, source: string): string[] {
  const found: string[] = [];
  for (const { line, body } of paragraphs(splitSchema(text).rest)) {
    for (const sentence of sentences(body)) {
      if (CORRECTION.test(sentence)) continue;
      for (const name of RETIRED_IN_PROSE) {
        if (!new RegExp("`[a-z_.]*\\b" + name + "\\b[a-z_.]*`").test(sentence)) continue;
        found.push(`${source}:${line} names \`${name}\``);
      }
    }
  }
  return found;
}

/** Sentences that still INSTRUCT on a convention the blueprint removed. */
function conventionOffenders(text: string, source: string): string[] {
  const found: string[] = [];
  for (const { line, body } of paragraphs(text)) {
    for (const sentence of sentences(body)) {
      if (CORRECTION.test(sentence)) continue;
      for (const { phrase, instead } of RETIRED_CONVENTIONS) {
        if (!sentence.includes(phrase)) continue;
        found.push(`${source}:${line} still instructs on "${phrase}" — use ${instead}`);
      }
    }
  }
  return found;
}

/** The runtime note strings, by where they are exported from — the fourth
 *  subject. Listed by module so a finding names the constant to fix. */
function runtimeNotes(): Array<[string, string]> {
  return [
    ...SEARCH_NOTES.map(([name, text]): [string, string] => [`blueprint-search-notes.ts#${name}`, text]),
    // The touchpoint notes (#414): the explanation of what a touchpoint is
    // lives ONLY here, so this is the only place it can be swept.
    ...TOUCHPOINT_NOTES.map(([name, text]): [string, string] => [`blueprint-touchpoint-notes.ts#${name}`, text]),
    ["scope-keywords.ts#SCOPES.blueprint", SCOPES.blueprint.instruction],
    ["blueprint-index.ts#INDEX_LEGEND", INDEX_LEGEND],
  ];
}

/** Both sweeps over a set of named strings — the runtime-note subject. */
function sweepNotes(notes: Array<[string, string]>): string[] {
  const found: string[] = [];
  for (const [source, text] of notes) found.push(...offenders(text, source), ...conventionOffenders(text, source));
  return found;
}

/** Both sweeps over every prompt doc under `root` — the Actions subject. */
function sweepPromptDocs(root: string, rels: string[]): string[] {
  const found: string[] = [];
  for (const rel of rels) {
    const text = readFileSync(join(root, rel), "utf8");
    found.push(...offenders(text, rel), ...conventionOffenders(text, rel));
  }
  return found;
}

test("the assembled prompt names no retired blueprint identifier", () => {
  assert.deepEqual(offenders(assembledPrompt(), "harness-bundle.md"), []);
});

test("the tool schemas name no retired blueprint identifier", () => {
  assert.deepEqual(offenders(toolDefinitions(), "tool-definitions.json"), []);
});

test("no removed convention survives as an instruction", () => {
  const surfaces: Array<[string, string]> = [
    ["harness-bundle.md", assembledPrompt()],
    ["tool-definitions.json", toolDefinitions()],
  ];
  const found: string[] = [];
  for (const [source, text] of surfaces) found.push(...conventionOffenders(text, source));
  assert.deepEqual(found, []);
});

test("the Actions prompts name no retired identifier and keep no removed convention", async () => {
  const { ACTIONS_PROMPTS_DIR, actionsPromptFiles } = await actionsPrompts();
  const files = actionsPromptFiles();
  assert.ok(files.length > 0, "an empty Actions corpus is a broken walk, not a clean repo");
  // Repo-relative paths in, so a finding reads `scripts/prompts/x/SKILL.md:12`
  // and the walk is the same one check:negation's third scope ratchets.
  assert.deepEqual(sweepPromptDocs(REPO, files), []);
  assert.equal(ACTIONS_PROMPTS_DIR, "scripts/prompts");
});

test("MUTATION: an Actions prompt fixture carrying a retired identifier fails the sweep", async () => {
  // Through the real walk over a scratch root, not a string handed to the
  // regex: the point is that a prompt on disk is REACHED, which is the half
  // the two subjects above never had to prove.
  const { walkPromptDocs } = await actionsPrompts();
  const root = mkdtempSync(join(tmpdir(), "actions-names-"));
  mkdirSync(join(root, "uno-planted", "references"), { recursive: true });
  writeFileSync(
    join(root, "uno-planted", "SKILL.md"),
    "---\nname: uno-planted\n---\n\n# Planted\n\nRead `path_type` before you answer.\n",
  );
  writeFileSync(
    join(root, "uno-planted", "references", "deep.md"),
    "NEVER assert there is no future state until you have searched for a `Planned:` path.\n",
  );
  writeFileSync(join(root, "clean.md"), "Rows may carry `links` and `description`.\n");

  const rels = walkPromptDocs(root);
  assert.deepEqual(rels, ["clean.md", "uno-planted/SKILL.md", "uno-planted/references/deep.md"]);
  assert.deepEqual(sweepPromptDocs(root, rels), [
    "uno-planted/SKILL.md:7 names `path_type`",
    'uno-planted/references/deep.md:1 still instructs on "`Planned:`" — use status = \'planned\'',
  ]);
});

test("a correction in an Actions prompt is not an offender", async () => {
  // Same exemption as the other two subjects — a passage saying the old
  // spelling is dead is the one place it belongs.
  const { walkPromptDocs } = await actionsPrompts();
  const root = mkdtempSync(join(tmpdir(), "actions-names-"));
  writeFileSync(join(root, "SKILL.md"), "`path_type` was removed on 2026-08-20; read `status`.\n");
  assert.deepEqual(sweepPromptDocs(root, walkPromptDocs(root)), []);
});

test("the runtime notes name no retired identifier and keep no removed convention", () => {
  const notes = runtimeNotes();
  assert.ok(notes.length >= 5, "the note roster is the subject; an empty one sweeps nothing");
  for (const [, text] of notes) assert.ok(text.trim(), "an empty note is a broken export, not a clean one");
  assert.deepEqual(sweepNotes(notes), []);
});

test("MUTATION: a runtime note carrying a retired convention fails the sweep", () => {
  // Through the same sweep the real roster goes through, with the real
  // conflict note beside the plant: the point is that the sweep reaches a
  // note-shaped string — one line, no paragraphs — not only a markdown doc.
  const planted: Array<[string, string]> = [
    ...runtimeNotes(),
    [
      "planted#CONFLICT_NOTE",
      "These rows are the CURRENT journey unless the `path` name starts `Planned:` — report those as future. Read `path_type` to tell.",
    ],
  ];
  assert.deepEqual(sweepNotes(planted), [
    "planted#CONFLICT_NOTE:1 names `path_type`",
    'planted#CONFLICT_NOTE:1 still instructs on "`Planned:`" — use status = \'planned\'',
  ]);
});

test("a wire name is not condemned as a retired column", () => {
  // `search_blueprint` really does return `description` and `links`. Sweeping
  // them out of the prose would make the tool description wrong in order to
  // make this check pass.
  for (const wire of WIRE_NAMES) {
    assert.ok(!RETIRED_IN_PROSE.includes(wire), `${wire} is a wire name, not a prose offender`);
  }
  assert.deepEqual(offenders("rows may carry `links` and `description`.", "x"), []);
});

test("the sweep bites — a retired name in prose is caught", () => {
  const planted = "read `path_type` AND `name` before answering.";
  assert.deepEqual(offenders(planted, "planted"), ["planted:1 names `path_type`"]);
});

// ── The allowlist (#412) ─────────────────────────────────────────────────────

test("the vendored account is in the prompt, and its catalog parses", () => {
  const prompt = assembledPrompt();
  assert.ok(prompt.includes("<!-- docs/connectors/supabase/blueprint.md -->"), "the account must be bundled");
  const schema = schemaTables(prompt);
  assert.ok(schema.size >= 10, `expected the rendered catalog, got ${schema.size} table(s)`);
  for (const [table, columns] of [
    ["cells", ["content", "summary", "frame", "status", "lane_id", "step_id", "path_id"]],
    ["paths", ["kind", "status", "scenario_id"]],
    ["resources", ["cell_id", "url", "kind"]],
  ] as const) {
    for (const column of columns) assert.ok(schema.get(table)?.has(column), `${table}.${column}`);
  }
  assert.ok(schema.has("business_models"), "an unreadable table is still a table the schema has");
});

test("every qualified identifier in the assembled prompt resolves against the account", () => {
  const schema = schemaTables(assembledPrompt());
  assert.deepEqual(unresolved(assembledPrompt(), schema, "harness-bundle.md"), []);
});

test("every qualified identifier in the tool schemas resolves against the account", () => {
  const schema = schemaTables(assembledPrompt());
  assert.deepEqual(unresolved(toolDefinitions(), schema, "tool-definitions.json"), []);
});

test("the allowlist bites — a column the schema lacks is caught, on a table it has", () => {
  const schema = schemaTables(readFileSync(ACCOUNT, "utf8"));
  assert.deepEqual(unresolved("read `cells.picture` first, then `cells.colour`.", schema, "planted"), [
    "planted:1 names `cells.picture`, which the schema lacks",
    "planted:1 names `cells.colour`, which the schema lacks",
  ]);
  // A live column passes; a `file.ext` span is not an identifier claim.
  assert.deepEqual(unresolved("read `cells.frame`; see `AGENT.md` and `bot.md`.", schema, "planted"), []);
});

test("the blocklist bites in the account's hand-written part, and is silent inside its catalog", () => {
  const account = readFileSync(ACCOUNT, "utf8");
  // The catalog names live columns that share a retired spelling. Correct
  // there — and this is what exempting the region buys.
  assert.deepEqual(offenders(account, "account"), []);
  // A retired name planted in the hand-written part: caught.
  const planted = account.replace("## What it is", "## What it is\n\nRead `path_type` first.");
  assert.equal(offenders(planted, "account").length, 1);
  assert.match(offenders(planted, "account")[0]!, /names `path_type`/);
  // Planted inside the catalog: not this sweep's finding — the catalog's truth
  // is the blueprint's check:agent-account and the sync's drift gate.
  const inCatalog = account.replace("### `cells`", "### `cells`\nRead `path_type` first.");
  assert.deepEqual(offenders(inCatalog, "account"), []);
});
