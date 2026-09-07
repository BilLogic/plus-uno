// Every database name the Worker's SOURCE sends to PostgREST, swept against
// the vendored contract.
//
// WHY THIS EXISTS. `check:contract` compares two copies of one file, so it can
// only see a name the contract already declares; `tests/blueprint-schema.test.ts`
// holds the five constants in `blueprint-schema.ts` to a hand-written retired
// list. Neither can see a read written somewhere ELSE. That is the gap
// plus-uno-blueprint#300 lived in: on 2026-08-30 the app moved `findings` to
// `audit_findings`, `check_name` to `check_key`, `cell_dependencies.label` to
// `.name`, and `filter_path_type` to `filter_path_kind`, and the only thing
// that noticed was a probe reading production — four keys false on
// `/health/blueprint` for two days, with every affected call site logging a
// warning and returning `[]`, which reaches Slack as "the blueprint has nothing
// on that". The app repo caught its own half of the same rename with a static
// sweep (`npm run check:database-names`). This is the bot's.
//
// The template hit the identical class twice in one week — an agent harness
// still reading `findings` and `note` (agentic-service-blueprinting#173), and a
// `language sql` body still naming a moved table, which took every delete RPC
// down (asb#171). A rename is not a rare event here; it is the normal weather.
//
// THE RULE. A relation named in a direct read must be one the contract's
// `publicReadTables` carries. A column named in a select must be one that
// appears in `botDirectReadColumns` for SOME table. A foreign-key hint must be
// one of `fkConstraints`. Nothing here is written down twice: refresh the
// vendored contract and the allowed vocabulary moves with it, so a rename lands
// as a red test on the branch instead of as a false probe key in production.
//
// WHY THE COLUMN RULE IS A UNION AND NOT PER-TABLE. Attributing a select to its
// anchor table needs a second registry mapping constant → table, and that
// registry is one more copy to keep correct — the exact shape of the defect
// this file exists to catch. The union answers the question that actually
// failed: a name that stopped existing ANYWHERE. It would not catch a column
// asked of the wrong table, and that has never been the failure; a 400 for a
// column the whole schema dropped has been the failure three times.
//
// The RPC's OUTPUT names are deliberately not in the vocabulary.
// `searchBlueprintColumns` says `description` and `links`, which are correct on
// the wire and wrong in a direct select — the projection is its own promise.
// Admitting them here would license exactly the read that has broken twice.
//
// WHAT IT CANNOT SEE, stated so nobody trusts it further than it goes. A table
// or column that reaches the wire through a variable — `/rest/v1/${table}`,
// `${PROSE_COLUMN}` — is opaque to any sweep of literals; those are pinned
// instead by "the bot's own schema constants" below, which asserts each
// exported name in `blueprint-schema.ts` against the same contract. A table
// passed as a plain ARGUMENT is out of subject too — `fetchRows(env, "slices",
// …)` builds its own `/rest/v1/${table}`, and recognising it would mean this
// file knowing the name of that helper. `slices` is covered where it belongs,
// in `botReadTables` and its `table_slices` probe.
//
// It also says nothing about whether an embed needs a foreign-key HINT. That is
// a property of the schema's constraints rather than of its names, and it is
// asserted for the one ambiguous pair in `blueprint-schema.test.ts`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { BLUEPRINT_CONTRACT } from "../src/generated/blueprint-contract";
import {
  PROSE_COLUMN,
  POSITION_COLUMN,
  FINDINGS_TABLE,
  EDGE_SELECT_COLUMNS,
  CELL_FALLBACK_SELECT,
} from "../src/integrations/blueprint-schema";

const BOT = resolve(process.cwd(), "..", "..", "agents", "uno-bot");
const SRC = resolve(BOT, "src");

/** `src/generated/` is written by a generator, not by a person: the contract is
 *  the subject of this sweep rather than a suspect, and `harness.ts` is one
 *  string holding the whole prompt — English, swept for schema names by
 *  `harness-blueprint-names.test.ts` under rules that suit prose. */
const GENERATED = resolve(SRC, "generated");

const RELATIONS: ReadonlySet<string> = new Set(BLUEPRINT_CONTRACT.publicReadTables);
const COLUMNS: ReadonlySet<string> = new Set(
  Object.values(BLUEPRINT_CONTRACT.botDirectReadColumns).flat(),
);
const CONSTRAINTS: ReadonlySet<string> = new Set(Object.values(BLUEPRINT_CONTRACT.fkConstraints));

/** `/rest/v1/rpc` is the function endpoint, not a relation; the RPC names are
 *  pinned by `BLUEPRINT_CONTRACT.rpcs` and checked by `check:contract`. */
const NOT_A_RELATION: ReadonlySet<string> = new Set(["rpc"]);

/* ------------------------------------------------------------- extraction */

export interface Literal {
  readonly value: string;
  readonly line: number;
  /** Offset of the opening quote, so the binding that names this literal can be
   *  read out of the code in front of it. */
  readonly at: number;
  /** Offset just past the closing quote. */
  readonly end: number;
}

/** Every string literal in `code`, comments skipped. */
export function stringLiterals(code: string): Literal[] {
  const out: Literal[] = [];
  let line = 1;
  let i = 0;
  while (i < code.length) {
    const char = code[i]!;
    if (char === "\n") {
      line += 1;
      i += 1;
      continue;
    }
    if (char === "/" && code[i + 1] === "/") {
      const end = code.indexOf("\n", i);
      i = end === -1 ? code.length : end;
      continue;
    }
    if (char === "/" && code[i + 1] === "*") {
      const end = code.indexOf("*/", i + 2);
      const stop = end === -1 ? code.length : end + 2;
      line += (code.slice(i, stop).match(/\n/g) ?? []).length;
      i = stop;
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      const start = i;
      const startLine = line;
      i += 1;
      while (i < code.length && code[i] !== char) {
        if (code[i] === "\\") i += 1;
        else if (code[i] === "\n") line += 1;
        i += 1;
      }
      i += 1;
      out.push({ value: code.slice(start + 1, i - 1), line: startLine, at: start, end: i });
      continue;
    }
    i += 1;
  }
  return out;
}

/**
 * Literals joined by `+` merged into the one string they build.
 *
 * `CELL_FALLBACK_SELECT` and the edges select are each written as three or four
 * concatenated fragments, and a fragment is not a parseable select: splitting
 * `path:paths(name,` from `scenario:scenarios(name))` loses the nesting that
 * says which name belongs to which relation.
 *
 * Merging happens AFTER tokenizing rather than by rewriting the source, because
 * the fragments do not all carry the same quote: a textual weld of `` ` `` to
 * `"` leaves an unbalanced literal, and the tokenizer then runs to the end of
 * the file swallowing every comment on the way. Measured, not imagined — that
 * was the first draft, and it reported the words of a doc comment as columns.
 *
 * The merged record keeps the FIRST fragment's line and offset, so the finding
 * points at the declaration a reader would go and edit.
 */
export function mergedLiterals(code: string): Literal[] {
  const out: Literal[] = [];
  for (const literal of stringLiterals(code)) {
    const previous = out[out.length - 1];
    if (previous && /^\s*\+\s*$/.test(code.slice(previous.end, literal.at))) {
      out[out.length - 1] = { ...previous, value: previous.value + literal.value, end: literal.end };
      continue;
    }
    out.push(literal);
  }
  return out;
}

/**
 * A literal is IN SUBJECT when it is a PostgREST URL, or when it is bound to a
 * name that says "select".
 *
 * The second half is what reaches the selects this Worker actually issues: they
 * are built as constants (`CELL_FALLBACK_SELECT`, `EDGE_SELECT_COLUMNS`) or as
 * `select:` fields in the keyword-fallback table, then interpolated into a URL
 * where no literal survives. Matching on the binding rather than on the shape
 * of the string is also what keeps ordinary prose out of subject — a check that
 * fired on any comma-separated string would need an exemption per sentence, and
 * every exemption is a place for a real name to hide.
 *
 * `\bselect` does not match inside `multi_select`, which is how Notion's block
 * payloads stay out.
 */
const SELECT_BINDING = /(?:\bselect[A-Za-z0-9_$]*\s*[:=]|\b[A-Z][A-Z0-9_$]*SELECT[A-Z0-9_$]*\s*=)\s*$/;

/** `${…}` cannot be read, so it is blanked rather than guessed at. */
function blankInterpolations(s: string): string {
  return s.replace(/\$\{[^}]*\}/g, " ");
}

/** The `select=` clause of a PostgREST query string, if it has one. */
function selectClause(url: string): string | undefined {
  const at = url.indexOf("select=");
  if (at === -1) return undefined;
  const rest = url.slice(at + "select=".length);
  const end = rest.indexOf("&");
  return end === -1 ? rest : rest.slice(0, end);
}

export interface Finding {
  readonly what: "relation" | "column" | "constraint";
  readonly name: string;
}

/**
 * Relations, columns and FK hints named by a select clause.
 *
 * `alias:relation(…)`, `relation(…)` and `relation!constraint(…)` are the three
 * embed spellings PostgREST accepts. A token followed by `:` is the app's own
 * alias and names nothing in the database; a token followed by `(` or `!` is a
 * relation; a token after `!` is a constraint; everything else is a column.
 */
export function namesInSelect(clause: string): Finding[] {
  const s = blankInterpolations(clause);
  const found: Finding[] = [];
  for (const m of s.matchAll(/[A-Za-z_][A-Za-z0-9_]*/g)) {
    const at = m.index ?? 0;
    const before = s.slice(0, at).replace(/\s+$/, "");
    const after = s.slice(at + m[0].length).replace(/^\s+/, "");
    if (after.startsWith(":")) continue; // an alias
    if (before.endsWith("!")) {
      found.push({ what: "constraint", name: m[0] });
      continue;
    }
    const embedded = after.startsWith("(") || after.startsWith("!");
    found.push({ what: embedded ? "relation" : "column", name: m[0] });
  }
  return found;
}

/** Every database name a source file sends to PostgREST. */
export function namesInSource(code: string): Array<Finding & { line: number }> {
  const found: Array<Finding & { line: number }> = [];
  for (const { value, line, at } of mergedLiterals(code)) {
    const preceding = code.slice(Math.max(0, at - 80), at);
    const isUrl = value.includes("/rest/v1/");
    if (!isUrl && !SELECT_BINDING.test(preceding)) continue;

    if (isUrl) {
      for (const m of blankInterpolations(value).matchAll(/\/rest\/v1\/([A-Za-z_][A-Za-z0-9_]*)/g)) {
        if (!NOT_A_RELATION.has(m[1]!)) found.push({ what: "relation", name: m[1]!, line });
      }
    }
    const clause = isUrl ? selectClause(value) : value;
    if (clause === undefined) continue;
    for (const name of namesInSelect(clause)) found.push({ ...name, line });
  }
  return found;
}

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (path === GENERATED) continue;
    if (statSync(path).isDirectory()) out.push(...sourceFiles(path));
    else if (/\.tsx?$/.test(entry) && !/\.d\.ts$/.test(entry)) out.push(path);
  }
  return out;
}

function carriesIt({ what, name }: Finding): boolean {
  if (what === "relation") return RELATIONS.has(name);
  if (what === "constraint") return CONSTRAINTS.has(name);
  return COLUMNS.has(name);
}

/* ------------------------------------------------------------------ tests */

test("no direct read names a relation or column the contract does not carry", () => {
  const offenders: string[] = [];
  for (const file of sourceFiles(SRC)) {
    const where = relative(BOT, file);
    for (const finding of namesInSource(readFileSync(file, "utf8"))) {
      if (carriesIt(finding)) continue;
      offenders.push(`${where}:${finding.line} names ${finding.what} \`${finding.name}\``);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `${offenders.length} direct read(s) name something the vendored contract does not carry.\n` +
      offenders.map((o) => `  ${o}`).join("\n") +
      "\n\n  -> If the app renamed it, refresh the vendored contract" +
      "\n     (BLUEPRINT_REPO=… node scripts/sync-blueprint-contract.mjs) and move the read." +
      "\n     If the contract never declared it, the column belongs in the app's" +
      "\n     blueprintContract.ts — a read nothing declares is a read nothing can watch.",
  );
});

test("the bot's own schema constants are names the contract carries", () => {
  // The half a literal sweep cannot reach: these reach the wire through
  // `${…}`, so the file that names them is the only place they can be checked.
  assert.ok(
    (BLUEPRINT_CONTRACT.botReadTables as readonly string[]).includes(FINDINGS_TABLE),
    `${FINDINGS_TABLE} is not a table the contract says the bot reads`,
  );
  for (const [what, column] of [
    ["prose", PROSE_COLUMN],
    ["position", POSITION_COLUMN],
  ] as const) {
    assert.ok(COLUMNS.has(column), `the ${what} column \`${column}\` is not in the contract`);
  }
  for (const finding of [...namesInSelect(CELL_FALLBACK_SELECT), ...namesInSelect(EDGE_SELECT_COLUMNS)]) {
    assert.ok(carriesIt(finding), `${finding.what} \`${finding.name}\` is not in the contract`);
  }
});

test("an alias, a hint and an interpolation are not mistaken for columns", () => {
  assert.deepEqual(namesInSelect("lane:lanes!cells_lane_id_fkey(name)"), [
    { what: "relation", name: "lanes" },
    { what: "constraint", name: "cells_lane_id_fkey" },
    { what: "column", name: "name" },
  ]);
  assert.deepEqual(namesInSelect("id,${PROSE_COLUMN},content"), [
    { what: "column", name: "id" },
    { what: "column", name: "content" },
  ]);
  assert.deepEqual(namesInSelect("*"), []);
});

test("the sweep bites — each of #300's four moves is caught", () => {
  // Planted in the shape each one had on 2026-08-30, so this test fails if the
  // sweep is ever narrowed past them. `findings` and `check_name` are the
  // audit rename; `label` and `note` are the edge one.
  const planted = [
    'const url = `${base}/rest/v1/findings?select=id,check_name,note&limit=1`',
    'const EDGE_SELECT = "source_cell_id,target_cell_id,kind,label"',
    'const select = "id,name,lane:lanes(name),description"',
  ].join("\n");
  assert.deepEqual(
    namesInSource(planted).filter((f) => !carriesIt(f)).map((f) => `${f.what} ${f.name}`),
    [
      "relation findings",
      "column check_name",
      "column note",
      "column label",
      "column description",
    ],
  );
});

test("the include VALUE `findings` is not swept as a relation", () => {
  // It names a category of result on the wire, not the table — the RPC's own
  // guard clause is where that vocabulary is defined, and it did NOT move when
  // the table became `audit_findings`. A sweep that condemned it would be
  // pressure to break a working call.
  assert.equal(BLUEPRINT_CONTRACT.searchBlueprintInclude.findings, "finding");
  assert.deepEqual(namesInSource('const include = ["findings"]'), []);
});
