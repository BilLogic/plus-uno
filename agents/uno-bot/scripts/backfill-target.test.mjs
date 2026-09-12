// The backfill's refusals and its one skip, checked by RUNNING it.
//
// Everything worth testing here happens before the first embedding call, and
// it is all refusal or skip: a pass that writes the wrong vectors into the
// right place does not fail anywhere downstream. Search still answers, the
// scores still look like scores, and the only symptom is an index that means
// nothing. So the script is spawned and its exit is read, which is also how a
// person finds out.
//
// THE SKIP IS THE ONE PATH ANYBODY CAN RUN TODAY. This deployment has no
// OpenAI key and is not getting one, so "no key" is not an edge case here — it
// is the standing state of the nightly's second pass, every night. It has to
// be a clean exit that says what it did and what turning it on would take.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "backfill-semantic-search.mjs");

/**
 * A Supabase that answers `index_meta` and nothing else.
 *
 * What a pass may write is decided against a row in the database — which model
 * this index was built with — so the only way to exercise it is to serve that
 * row. Anything asked for beyond it answers 500, because reaching those means
 * the decision under test was already made.
 */
function serveIndexMeta(row) {
  const server = createServer((req, res) => {
    if (req.url?.startsWith("/rest/v1/index_meta")) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(row ? [row] : []));
      return;
    }
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ message: `unexpected request: ${req.url}` }));
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () =>
      resolve({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() }),
    );
  });
}

function run(args) {
  const argv = Array.isArray(args) ? args : args.argv;
  const extra = Array.isArray(args) ? {} : (args.env ?? {});
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [SCRIPT, ...argv],
      // A deliberately unreachable Supabase host by default: the checks under
      // test all precede any request, so reaching the network at all is itself
      // the failure this env makes visible.
      {
        env: {
          ...process.env,
          SUPABASE_URL: (Array.isArray(args) ? undefined : args.supabaseUrl) ?? "http://127.0.0.1:1",
          SUPABASE_SERVICE_ROLE_KEY: "not-a-key",
          GEMINI_API_KEY: "not-a-key",
          GEMINI_PROJECT_ID: "",
          GEMINI_SA_EMAIL: "",
          GEMINI_SA_PRIVATE_KEY: "",
          OPENAI_API_KEY: "",
          EMBED_MODEL: "",
          ...extra,
        },
        timeout: 20000,
      },
      (err, stdout, stderr) => resolve({ code: err?.code ?? 0, out: `${stdout}${stderr}` }),
    );
  });
}

test("an openai pass with no key skips cleanly, and says what turning it on takes", async () => {
  // The unreachable host is what proves the ordering: the skip comes before
  // Supabase, so this exits 0 rather than failing on a connection.
  const { code, out } = await run(["--model=text-embedding-3-small"]);
  assert.equal(code, 0);
  assert.match(out, /\[backfill\] SKIPPED/);
  assert.match(out, /OPENAI_API_KEY/);
  // The order, stated where a person meets the skip. Listing an index before
  // it exists makes every meaning search raise.
  assert.match(out, /set OPENAI_API_KEY .*re-run this pass.*only then list the index/s);
  assert.match(out, /In that order/);
  // Nothing was embedded and nothing was written.
  assert.doesNotMatch(out, /upserted/);
  assert.doesNotMatch(out, /eligible chunks/);
  assert.doesNotMatch(out, /FAILED/);
});

test("the provider is read off the model name, so no flag has to agree with it", async () => {
  // `--provider` exists for a model this list has not heard of; it is not how
  // an OpenAI pass is normally spelled, and a pass that needed both flags to
  // agree would have a way to be half-right.
  const { code, out } = await run(["--model=text-embedding-3-large"]);
  assert.equal(code, 0);
  assert.match(out, /SKIPPED/);
});

test("a key that is set is a pass that runs, not a pass that skips", async () => {
  // MISSING is a skip; SET is somebody trying. A set key must reach the
  // database and fail there rather than being quietly swallowed — otherwise
  // the one case where a person is waiting for an index looks identical to the
  // case where nobody is.
  const { code, out } = await run({
    argv: ["--model=text-embedding-3-small"],
    env: { OPENAI_API_KEY: "sk-not-a-real-key" },
  });
  assert.notEqual(code, 0);
  assert.match(out, /\[backfill\] FAILED/);
  assert.doesNotMatch(out, /SKIPPED/);
});

test("an index with no metadata row is refused before anything is embedded", async () => {
  const supabase = await serveIndexMeta(null);
  try {
    const { code, out } = await run({ argv: [], supabaseUrl: supabase.url });
    assert.notEqual(code, 0);
    assert.match(out, /no row for source "blueprint"/);
    assert.doesNotMatch(out, /upserted/);
  } finally {
    supabase.close();
  }
});

test("a declared width other than 768 is refused", async () => {
  const supabase = await serveIndexMeta({ model: "gemini-embedding-001", dims: 1536 });
  try {
    const { code, out } = await run({ argv: [], supabaseUrl: supabase.url });
    assert.notEqual(code, 0);
    assert.match(out, /declared 1536-dim; this pass writes 768/);
  } finally {
    supabase.close();
  }
});

test("a pass that names no model embeds with the one the index holds", async () => {
  // The default is a fact in the database, not a constant in this file. When
  // the index's model changed (20260912000000), the nightly followed it with
  // no edit here.
  const supabase = await serveIndexMeta({ model: "gemini-embedding-001", dims: 768 });
  try {
    const { out } = await run({ argv: [], supabaseUrl: supabase.url });
    assert.match(out, /gemini-embedding-001 @ 768 via google/);
    assert.match(out, /corpus_chunks\.embedding \(the index's own model\)/);
  } finally {
    supabase.close();
  }
});

test("a second model is written beside the index's own, not into it", async () => {
  // The whole capability, read off the one line that says where the vectors
  // are going. A pass that announced the index's own column here would be
  // about to overwrite the set everybody searches.
  const supabase = await serveIndexMeta({ model: "gemini-embedding-001", dims: 768 });
  try {
    const { out } = await run({
      argv: ["--model=text-embedding-3-small"],
      supabaseUrl: supabase.url,
      env: { OPENAI_API_KEY: "sk-not-a-real-key" },
    });
    assert.match(out, /text-embedding-3-small @ 768 via openai/);
    assert.match(out, /chunk_embeddings \(beside gemini-embedding-001\)/);
    assert.doesNotMatch(out, /the index's own model/);
  } finally {
    supabase.close();
  }
});
