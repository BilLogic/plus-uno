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

const REPO = resolve(process.cwd(), "..", "..");
const BOT = resolve(REPO, "agents", "uno-bot");
const PROMPT_MARKER = "## The assembled prompt";

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

/** Paragraphs naming a retired identifier, minus passages ABOUT the rename. */
function offenders(text: string, source: string): string[] {
  const found: string[] = [];
  for (const { line, body } of paragraphs(text)) {
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
