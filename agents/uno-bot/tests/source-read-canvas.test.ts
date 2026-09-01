import assert from "node:assert/strict";
import { test } from "node:test";
import { readSlackCanvasSource } from "../src/tools/slack-canvas-source";

test("source_read denies a Canvas that was not shared into the originating conversation", async () => {
  let fetches = 0;
  const request = async (): Promise<Response> => {
    fetches += 1;
    return new Response("content that must stay unread");
  };

  const result = await readSlackCanvasSource(
    "https://plus.slack.com/docs/T01234567/F012CANVAS9",
    "xoxb-test",
    [],
    request,
  );

  assert.equal(result.ok, false);
  assert.match(result.error ?? "", /shared into this conversation/i);
  assert.equal(fetches, 0);
});

test("source_read reads a Canvas shared into the originating conversation", async () => {
  const calls: Array<{ url: string; authorization: string | null }> = [];
  const request = async (url: string, init?: RequestInit): Promise<Response> => {
    calls.push({
      url,
      authorization: new Headers(init?.headers).get("authorization"),
    });
    if (url.startsWith("https://slack.com/api/files.info")) {
      return Response.json({
        ok: true,
        file: {
          title: "Launch plan",
          mimetype: "application/vnd.slack-docs",
          permalink: "https://plus.slack.com/docs/T01234567/F012CANVAS9",
          url_private_download: "https://files.slack.com/files-pri/T012-F012/download/canvas",
        },
      });
    }
    return new Response("<h1>Launch plan</h1><p>Ship on Tuesday.</p>", {
      headers: { "content-type": "text/html" },
    });
  };

  const result = await readSlackCanvasSource(
    "https://slack.com/files/F012CANVAS9",
    "xoxb-test",
    ["F012CANVAS9"],
    request,
  );

  assert.deepEqual(result, {
    ok: true,
    url: "https://plus.slack.com/docs/T01234567/F012CANVAS9",
    title: "Launch plan",
    content: "Launch plan Ship on Tuesday.",
  });
  assert.deepEqual(calls.map((call) => call.authorization), [
    "Bearer xoxb-test",
    "Bearer xoxb-test",
  ]);
});
