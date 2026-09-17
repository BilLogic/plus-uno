// `chat.startStream` requires `recipient_user_id` and `recipient_team_id` when
// it streams to a channel. The plan-mode call site passed both from the day it
// was written; the answer path passed neither, so for six revisions every
// channel turn opened a stream Slack refused, fell back to an ordinary post,
// and said so only in a console.warn that read as Slack being fussy. A long
// answer is several messages, so the same refused call was bought once per
// message out of the 50 subrequests a turn gets (#572).
//
// The regression is silent by construction — the fallback works — so what
// catches it is this file. It reads SOURCE rather than calling the code:
// `src/slack/delivery.ts` and `src/slack/slack-delivery.ts` both name `Env` and
// the Slack client, which this suite's compile cannot reach (tsconfig.test.json
// types only Node). Same move as the door check in `confirmation-paths.test.ts`.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(file: string): string {
  return readFileSync(resolve(process.cwd(), file), "utf8");
}

describe("the answer path's stream", () => {
  it("asks Slack for the recipient ids it requires", () => {
    const src = source("src/slack/delivery.ts");
    const call = src.slice(src.indexOf("await startStream("));
    const args = call.slice(0, call.indexOf(")"));
    assert.ok(args.includes("recipient?.userId"), "the asker reaches startStream");
    assert.ok(args.includes("recipient?.team"), "and so does their workspace");
  });

  it("spends no subrequest on a stream it cannot open", () => {
    const src = source("src/slack/delivery.ts");
    const guard = "if (!openStreamTs && !recipient?.userId) return false;";
    assert.ok(src.includes(guard), "no recipient, no call");
    assert.ok(
      src.indexOf(guard) < src.indexOf("await startStream("),
      "the guard stands BEFORE the call, or it is not a guard",
    );
  });

  it("is handed the ids by the adapter that holds them", () => {
    const src = source("src/slack/slack-delivery.ts");
    const call = src.slice(src.indexOf("await postTextVerified("));
    const args = call.slice(0, call.indexOf(");"));
    assert.ok(
      args.includes("userId: target.userId"),
      "postAnswer passes the asker through to the answer path",
    );
    assert.ok(args.includes("team: target.team"), "and their workspace with them");
  });
});
