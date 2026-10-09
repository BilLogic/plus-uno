// A pasted frame link, read end to end (#899): the turn's `source_read`
// brings the comment threads pinned to the frame, and the sweep's reads of
// the same link keep to the frame's text, so a night's sweep makes no more
// calls than before.
//
// Figma's REST answers are stubbed at `fetch`, which `net.ts` binds when it
// loads, so the stub goes in first and the modules are imported after it.
// What the payload says in each case is in tests/figma-read.test.ts.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Env } from "../src/types";

const FILE = "AbC123xyz";
const NODE = "158:21725";
const LINK = `https://www.figma.com/design/${FILE}/Sessions?node-id=158-21725`;

const FRAME = {
  id: NODE,
  name: "Session card",
  type: "FRAME",
  children: [
    { id: "158:21726", name: "Title", type: "TEXT", characters: "Today's session" },
    { id: "158:21731", name: "Join button", type: "INSTANCE", children: [] },
  ],
};
const COMMENTS = [
  {
    id: "c1",
    file_key: FILE,
    parent_id: "",
    user: { id: "u1", handle: "coco" },
    created_at: "2026-09-20T15:00:00Z",
    resolved_at: "2026-09-22T10:00:00Z",
    message: "Say 'Join', not 'Enter'.",
    client_meta: { node_id: "158:21731", node_offset: { x: 4, y: 8 } },
  },
  {
    id: "c2",
    file_key: FILE,
    parent_id: "",
    user: { id: "u2", handle: "maya" },
    created_at: "2026-09-25T12:00:00Z",
    resolved_at: null,
    message: "On the canvas, not the frame",
    client_meta: { node_id: "0:1", node_offset: { x: 900, y: 40 } },
  },
];

let requests: string[] = [];
globalThis.fetch = (async (input: unknown) => {
  const url = String(input);
  requests.push(url);
  if (url.includes(`/v1/files/${FILE}/nodes`)) {
    return Response.json({ name: "Sessions", nodes: { [NODE]: { document: FRAME } } });
  }
  if (url.includes(`/v1/files/${FILE}/comments`)) return Response.json({ comments: COMMENTS });
  throw new Error(`no stub for ${url}`);
}) as typeof fetch;

/** A Worker with a Figma token: a fresh object, so a fresh client and its own rate buckets. */
const env = (): Env => ({ FIGMA_ACCESS_TOKEN: "figd_test" }) as Env;

describe("a pasted frame link, read end to end", () => {
  it("brings the threads pinned to the frame into the turn's source_read", async () => {
    requests = [];
    const { executeReadSource } = await import("../src/tools/read-source.js");
    const payload = JSON.parse(await executeReadSource(env(), { url: LINK })) as Record<string, unknown>;
    assert.equal(payload.ok, true);
    assert.equal(payload.content, "Today's session");
    assert.deepEqual(payload.comments, [
      {
        by: "coco",
        at: "2026-09-20T15:00:00Z",
        layer: "Join button",
        resolved: true,
        resolved_at: "2026-09-22T10:00:00Z",
        text: "Say 'Join', not 'Enter'.",
        replies: [],
      },
    ]);
    assert.equal(payload.comment_threads, 1, "the canvas comment is left out");
    assert.equal(requests.filter((u) => u.includes("/comments")).length, 1);
  });

  it("keeps the sweep's read of the same link to the frame's text, with no comments call", async () => {
    requests = [];
    const { readSource } = await import("../src/sweep/env.js");
    const source = await readSource(env(), LINK, "figma");
    assert.equal(source?.title, "Session card");
    assert.equal(source?.text, "Today's session");
    assert.deepEqual(
      requests.map((u) => new URL(u).pathname),
      [`/v1/files/${FILE}/nodes`],
    );
  });

  it("tells the model, in the tool's own description, that a frame read carries its pinned comments", () => {
    const tools = JSON.parse(readFileSync(join(process.cwd(), "tool-definitions.json"), "utf8")) as Array<{
      name: string;
      description: string;
    }>;
    const sourceRead = tools.find((t) => t.name === "source_read");
    assert.match(sourceRead?.description ?? "", /Figma frame \(node name\/type, text layers and the comment threads pinned to it or a layer inside it\)/);
  });
});
