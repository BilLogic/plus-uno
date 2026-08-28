/**
 * The Worker's secrets: one declaration, and what holds it honest.
 *
 * The list used to be a prose comment in wrangler.toml, maintained by memory.
 * Measured 2026-08-28 against the live Worker: it named four Gmail secrets that
 * are not set, and missed two that ARE — `ANTHROPIC_API_KEY`, which
 * src/vertex/claude.ts:6 explicitly says is not involved, and
 * `SUPABASE_MCP_TOKEN`, which appears nowhere in src/. Two live credentials
 * nobody could account for, and #288 would have copied both to the new account.
 *
 * The guard here is offline and composable. The live comparison needs wrangler
 * auth, so it is a command you run, not a gate — see `npm run secrets:audit`.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  SECRETS,
  classify,
  envInterfaceNames,
  expectedBlock,
  parseSecretList,
  readExpectedBlock,
  secretNames,
  varsInWrangler,
} from "./secrets.mjs";
import { liveSecretNames, nodeTooOld, putSecret } from "./wrangler-secrets.mjs";

/* ------------------------------------------------------------- the manifest */

test("every entry carries a reason, so the list cannot grow silently", () => {
  for (const s of SECRETS) {
    assert.match(s.name, /^[A-Z][A-Z0-9_]*$/, `${s.name} is not an env var name`);
    assert.equal(typeof s.required, "boolean", `${s.name} must say whether it is required`);
    assert.ok(typeof s.why === "string" && s.why.length > 20, `${s.name} needs a real reason`);
  }
});

test("no duplicate names — a second entry would silently shadow the first", () => {
  assert.equal(new Set(secretNames()).size, SECRETS.length);
});

/* ------------------------------------------------------- live vs. declared */

test("a required secret that is not set is reported missing", () => {
  const { missing } = classify(["SLACK_BOT_TOKEN"]);
  assert.ok(missing.includes("SLACK_SIGNING_SECRET"));
  assert.ok(!missing.includes("SLACK_BOT_TOKEN"));
});

test("an optional secret that is not set is NOT missing — it degrades by design", () => {
  // GMAIL_* unset means send_email reports "not configured". That is the
  // intended state, not an incident, and reporting it as missing would train
  // whoever runs this to ignore the output.
  const { missing, optionalUnset } = classify([]);
  assert.ok(!missing.includes("GMAIL_SENDER"));
  assert.ok(optionalUnset.includes("GMAIL_SENDER"));
});

test("a live secret nobody declared is reported — the #288 case", () => {
  // Both real, both measured on the live Worker. An undeclared credential is
  // still a credential: it still needs rotating, it still gets copied to the
  // new account by anyone working from the list, and nobody can say what it is.
  const { undeclared } = classify(["ANTHROPIC_API_KEY", "SUPABASE_MCP_TOKEN", "SLACK_BOT_TOKEN"]);
  assert.deepEqual(undeclared, ["ANTHROPIC_API_KEY", "SUPABASE_MCP_TOKEN"]);
});

test("a secret marked never-set is reported when it IS set", () => {
  // GEMINI_API_KEY on the Worker is the ADR-018 violation: the AI Studio key
  // takes a lane the Vertex SA is supposed to own, and it cannot reach Claude
  // at all. Declaring it and then finding it is a finding, not a pass.
  const { forbidden } = classify(["GEMINI_API_KEY"]);
  assert.deepEqual(forbidden, ["GEMINI_API_KEY"]);
  assert.deepEqual(classify([]).forbidden, []);
});

test("classify does not mistake a forbidden secret for an undeclared one", () => {
  const { undeclared } = classify(["GEMINI_API_KEY"]);
  assert.deepEqual(undeclared, []);
});

/* --------------------------------------------------- the plaintext firewall */

test("[vars] entries are found, so a secret cannot hide among them", () => {
  const toml = [
    "name = \"uno-bot\"",
    "account_id = \"abc\"",
    "[vars]",
    "# a comment",
    'GITHUB_REPO = "BilLogic/plus-uno"',
    'SLACK_STREAMING = "on"',
    "",
    "[[kv_namespaces]]",
    'binding = "HARNESS_KV"',
  ].join("\n");
  assert.deepEqual(varsInWrangler(toml), ["GITHUB_REPO", "SLACK_STREAMING"]);
});

test("a key after the [vars] block is not attributed to it", () => {
  // The failure this prevents is the dangerous direction: reading a later
  // section's key as a var is noise, but STOPPING the scan early would let a
  // real secret sit in [vars] unnoticed, committed in plaintext, forever.
  const toml = '[vars]\nA = "1"\n\n[observability]\nenabled = true\n';
  assert.deepEqual(varsInWrangler(toml), ["A"]);
});

test("indented and spaced assignments still count as vars", () => {
  const toml = '[vars]\n  SPACED   =   "1"\nTIGHT="2"\n';
  assert.deepEqual(varsInWrangler(toml).sort(), ["SPACED", "TIGHT"]);
});

/* ------------------------------------------------------- the Env contract */

test("the Env interface is parsed, optional markers and all", () => {
  const src = [
    "export interface Thread { a: string }",
    "export interface Env {",
    "  SLACK_BOT_TOKEN: string;",
    "  /** a doc comment */",
    "  DEBUG_TOKEN?: string;",
    "  // a line comment",
    "  THREAD_STATE: DurableObjectNamespace;",
    "}",
    "export interface After { b: string }",
  ].join("\n");
  const names = envInterfaceNames(src);
  assert.ok(names.includes("SLACK_BOT_TOKEN"));
  assert.ok(names.includes("DEBUG_TOKEN"));
  assert.ok(names.includes("THREAD_STATE"));
  assert.ok(!names.includes("a"), "members of a different interface leaked in");
  assert.ok(!names.includes("b"), "the scan ran past the closing brace");
});

test("an Env-less source yields nothing rather than throwing", () => {
  assert.deepEqual(envInterfaceNames("export const x = 1;\n"), []);
});

/* -------------------------------------------- reading what wrangler tells us */

test("wrangler's JSON survives the banner it prints above it", () => {
  // Real shape: wrangler writes a version/update notice to the same stream
  // before the payload. JSON.parse on the whole thing throws.
  const out = ' ⛅️ wrangler 4.99.0\n-------------------\n[\n  {"name":"A","type":"secret_text"},\n  {"name":"B","type":"secret_text"}\n]\n';
  assert.deepEqual(parseSecretList(out), ["A", "B"]);
});

test("an empty list is an empty list, not a failure", () => {
  // A brand-new account has no secrets. That is the #288 starting state, and
  // it must read as "nothing set yet", never as "could not tell".
  assert.deepEqual(parseSecretList("[]"), []);
});

test("unparseable output throws rather than reading as no-secrets-set", () => {
  // The dangerous inversion. Silently returning [] would tell the operator
  // every secret is missing and invite them to re-enter all fifteen — or, in
  // the audit, report a clean sheet for a Worker nobody could reach.
  assert.throws(() => parseSecretList("Authentication error [code: 10000]"), /could not parse/i);
  assert.throws(() => parseSecretList(""), /could not parse/i);
});

test("a payload that is not a list of names is refused", () => {
  assert.throws(() => parseSecretList('{"error":"nope"}'), /could not parse/i);
  assert.throws(() => parseSecretList('[{"type":"secret_text"}]'), /could not parse/i);
});

/* --------------------------------------------------- the generated comment */

test("the wrangler.toml block round-trips: what is generated is what is read", () => {
  const toml = `name = "uno-bot"\n\n${expectedBlock()}\n\n[[durable_objects.bindings]]\n`;
  assert.equal(readExpectedBlock(toml), expectedBlock());
});

test("every name in the generated block is a declared secret, and vice versa", () => {
  const block = expectedBlock();
  for (const name of secretNames()) {
    assert.ok(block.includes(name), `${name} missing from the generated block`);
  }
  // ...and the block invents nothing. Checked on the header lines only: the
  // prose underneath legitimately names things that are not secrets — [vars]
  // entries like SLACK_MCP_CLIENT_ID, and words like PEM and ADR — and a
  // regex over the whole block would have to be taught each of them.
  const headers = block
    .split("\n")
    .map((l) => /^#   ([A-Z][A-Z0-9_]*)/.exec(l)?.[1])
    .filter(Boolean);
  assert.deepEqual(headers, secretNames());
});

test("a missing block reads as absent rather than as an empty match", () => {
  assert.equal(readExpectedBlock('name = "uno-bot"\n'), null);
});

/* ------------------------------------------------ talking to Cloudflare */

test("Node below wrangler's floor is refused BEFORE anything is typed", () => {
  // The ordering is the point. Wrangler exits immediately on Node < 22;
  // discovering that after eight invisible prompts is the failure.
  assert.match(nodeTooOld("v20.19.3"), /nvm use 22/);
  assert.equal(nodeTooOld("v22.17.0"), null);
  assert.equal(nodeTooOld("v24.14.0"), null);
});

test("an unreadable version string does not block the run", () => {
  // Refusing on a version we cannot parse would strand someone on a working
  // runtime. Wrangler's own check is the backstop.
  assert.equal(nodeTooOld("weird"), null);
});

test("a failed `wrangler secret list` throws instead of reading as none-set", () => {
  // The inversion that matters: an auth failure reported as an empty list tells
  // the operator every secret is missing and invites them to re-enter all
  // fifteen — into whichever account wrangler happened to be pointed at.
  const run = () => ({ status: 1, stdout: "", stderr: "Authentication error [code: 10000]" });
  assert.throws(() => liveSecretNames(run), /Authentication error/);
});

test("a successful list is read through the banner wrangler prints", () => {
  const run = () => ({
    status: 0,
    stdout: ' ⛅️ wrangler 4.99.0\n[\n  {"name":"DEBUG_TOKEN","type":"secret_text"}\n]\n',
    stderr: "",
  });
  assert.deepEqual(liveSecretNames(run), ["DEBUG_TOKEN"]);
});

test("the value goes to stdin, never into argv", () => {
  // argv is world-readable via `ps` and lands in shell history. This is the
  // whole reason putSecret takes an `input` channel rather than building a
  // command string.
  let seen;
  putSecret("DEBUG_TOKEN", "s3cret", (cmd, args, input) => {
    seen = { cmd, args, input };
    return { status: 0, stdout: "", stderr: "" };
  });
  assert.deepEqual(seen.args, ["wrangler", "secret", "put", "DEBUG_TOKEN"]);
  assert.equal(seen.input, "s3cret");
  for (const a of seen.args) assert.ok(!a.includes("s3cret"), "the value reached argv");
});

test("a failed put reports the failure without quoting the value back", () => {
  const run = () => ({ status: 1, stdout: "", stderr: "binding error" });
  try {
    putSecret("DEBUG_TOKEN", "s3cret", run);
    assert.fail("expected a throw");
  } catch (err) {
    assert.match(err.message, /DEBUG_TOKEN/);
    assert.ok(!err.message.includes("s3cret"), "the error message leaked the value");
  }
});
