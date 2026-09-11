// The backfill's refusals, checked by RUNNING it.
//
// Everything worth testing here happens before the first network call, and it
// is all refusal: a pass that writes the wrong vectors into the right column
// does not fail anywhere downstream. Search still answers, the scores still
// look like scores, and the only symptom is a measurement that means nothing.
// So the script is spawned and its exit is read, which is also how a person
// finds out.
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
 * The refusal under test compares what a column HOLDS against what the pass is
 * about to write, and the holding is a row in the database — so the only way
 * to exercise it is to serve that row. Anything the script asks for beyond it
 * answers 500, because reaching those means the refusal did not fire.
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
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [SCRIPT, ...argv],
      // A deliberately unreachable Supabase host: the checks under test all
      // precede any request, so reaching the network at all is itself the
      // failure this env makes visible.
      {
        env: {
          ...process.env,
          SUPABASE_URL: (Array.isArray(args) ? undefined : args.supabaseUrl) ?? "http://127.0.0.1:1",
          SUPABASE_SERVICE_ROLE_KEY: "not-a-key",
          GEMINI_API_KEY: "not-a-key",
          GEMINI_PROJECT_ID: "",
          GEMINI_SA_EMAIL: "",
          GEMINI_SA_PRIVATE_KEY: "",
        },
        timeout: 20000,
      },
      (err, stdout, stderr) => resolve({ code: err?.code ?? 0, out: `${stdout}${stderr}` }),
    );
  });
}

test("an unknown column is refused, and the legal ones are named", async () => {
  const { code, out } = await run(["--column=embeddings"]);
  assert.notEqual(code, 0);
  assert.match(out, /--column must be one of embedding, embedding_001/);
  // Named, so the near-miss above is correctable without reading the source.
  assert.match(out, /got "embeddings"/);
});

test("a column with no index_meta row is refused before anything is embedded", async () => {
  // The unreachable host is what proves the ordering: if this reached the
  // embedding call it would fail with something else entirely.
  const { code, out } = await run(["--column=embedding_001", "--model=gemini-embedding-001"]);
  assert.notEqual(code, 0);
  assert.match(out, /\[backfill\] FAILED/);
  assert.doesNotMatch(out, /upserted/);
});

test("a column is not written with a model it does not hold", async () => {
  const supabase = await serveIndexMeta({ model: "text-embedding-005", dims: 768 });
  try {
    const { code, out } = await run({
      argv: ["--column=embedding_001", "--model=gemini-embedding-001"],
      supabaseUrl: supabase.url,
    });
    assert.notEqual(code, 0);
    // Both models named, and the fix stated: a person reading this does not
    // have to work out which side is wrong.
    assert.match(out, /holds text-embedding-005/);
    assert.match(out, /embeds with gemini-embedding-001/);
    assert.match(out, /--model=text-embedding-005/);
    // Nothing was embedded and nothing was written.
    assert.doesNotMatch(out, /upserted/);
    assert.doesNotMatch(out, /eligible chunks/);
  } finally {
    supabase.close();
  }
});

test("a declared width other than 768 is refused", async () => {
  const supabase = await serveIndexMeta({ model: "gemini-embedding-001", dims: 1536 });
  try {
    const { code, out } = await run({
      argv: ["--column=embedding_001", "--model=gemini-embedding-001"],
      supabaseUrl: supabase.url,
    });
    assert.notEqual(code, 0);
    assert.match(out, /declared 1536-dim; this pass writes 768/);
  } finally {
    supabase.close();
  }
});

test("a matching row lets the pass get as far as the source read", async () => {
  // The positive case, bounded: the guard passes, and the script then asks for
  // something this fake does not serve. Which is the point — the refusal is
  // what is under test, and this shows it does not fire on a correct pass.
  const supabase = await serveIndexMeta({ model: "gemini-embedding-001", dims: 768 });
  try {
    const { out } = await run({
      argv: ["--column=embedding_001", "--model=gemini-embedding-001"],
      supabaseUrl: supabase.url,
    });
    assert.match(out, /column embedding_001 <- gemini-embedding-001 @ 768/);
  } finally {
    supabase.close();
  }
});
