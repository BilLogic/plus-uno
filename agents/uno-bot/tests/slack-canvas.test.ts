import assert from "node:assert/strict";
import test from "node:test";
import { parseSlackCanvasId, readSlackCanvas } from "../src/integrations/slack-canvas";

test("a Slack Canvas permalink yields its file id", () => {
  assert.equal(
    parseSlackCanvasId("https://plus.slack.com/docs/T01234567/F012CANVAS9"),
    "F012CANVAS9",
  );
  assert.equal(parseSlackCanvasId("https://example.com/docs/T01234567/F012CANVAS9"), null);
});

test("Canvas content is read with the bot token", async () => {
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
          id: "F012CANVAS9",
          title: "Launch plan",
          mimetype: "application/vnd.slack-docs",
          url_private_download: "https://files.slack.com/files-pri/T012-F012/download/canvas",
        },
      });
    }
    return new Response("<h1>Launch plan</h1><p>Ship on Tuesday.</p>", {
      headers: { "content-type": "text/html" },
    });
  };

  const result = await readSlackCanvas(
    "https://plus.slack.com/docs/T01234567/F012CANVAS9",
    "xoxb-test-token",
    request,
  );

  assert.deepEqual(result, {
    ok: true,
    canvasId: "F012CANVAS9",
    title: "Launch plan",
    content: "Launch plan Ship on Tuesday.",
  });
  assert.deepEqual(calls.map((call) => call.authorization), [
    "Bearer xoxb-test-token",
    "Bearer xoxb-test-token",
  ]);
});
