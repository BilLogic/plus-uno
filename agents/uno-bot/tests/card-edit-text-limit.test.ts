// A decided card always redraws, however long its draft (live 2026-10-17,
// Worker r671).
//
// A PRD card revised with a blueprint check's notes carries the whole draft
// as its text — the body and the "Compared with today's blueprint" section.
// `chat.postMessage` took that text (it truncates past 40,000), but the
// Reject that followed was refused: `chat.update` answers `msg_too_long` to a
// `text` past 4,000 characters. The card kept its Review button, and the
// outcome went up as a message of its own.
//
// Driven through the review door and the expiry edit onto Slack's own
// `chat.update` (`slack/api.ts`), on a fetch that refuses what Slack refuses
// (`helpers/report-expiry-fetch.ts`), so the assertion is what Slack was
// handed and whether it took it.
import { expiryEdits, UPDATE_TEXT_LIMIT } from "./helpers/report-expiry-fetch";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { updateMessage } from "../src/slack/api";
import { runReviewDecision, type ReviewDoorDeps } from "../src/slack/review-door";
import { showExpiredCard } from "../src/slack/card-expiry-edit";
import { renderProposalCard } from "../src/slack/proposal-render";
import { createInMemoryThreadState, type PendingProposal } from "../src/thread-state/index";
import { recordingDelivery, type ProposalCard } from "../src/turn/index";
import { recordingViews } from "./helpers/recording-slack";
import { messageBlocksRefusal } from "./helpers/slack-block-rules";
import type { Env } from "../src/types";

const env = { SLACK_BOT_TOKEN: "xoxb-test" } as unknown as Env;
const CHANNEL = "D0APTB20SK0";
const THREAD = "1792209000.000100";
const CARD_TS = "1792209726.794529";

const paragraph = (topic: string) =>
  `Tutors ${topic} differently from one session to the next, and supervisors only see the result after the fact. `.repeat(6).trim();

/** A PRD card the size of the live one: its sections, and the blueprint
 *  comparison a check's notes added to it. */
function revisedPrdText(): string {
  const card = {
    kind: "confirm",
    verb: "create a PRD",
    fields: [
      { label: "surface", value: "prd" },
      { label: "title", value: "Self-serve call-offs" },
      {
        label: "sections",
        under: [
          { field: { label: "Problem", value: paragraph("post call-offs") } },
          { field: { label: "Goals", value: paragraph("claim open sessions") } },
          { field: { label: "Requirements", value: paragraph("confirm a fill-in") } },
          { field: { label: "Open Questions", value: paragraph("hear about unclaimed call-offs") } },
          {
            field: {
              label: "Compared with today's blueprint",
              value: Array.from(
                { length: 14 },
                (_, i) => `- Step ${i + 1}, Supervisor lane: today the supervisor asks around in Slack and confirms by DM; the PRD has the first free tutor claim it on the board.`,
              ).join("\n"),
            },
          },
        ],
      },
    ],
    caveats: [],
    operations: [],
  } as unknown as ProposalCard;
  return renderProposalCard(card).text;
}

function proposal(text: string): PendingProposal {
  return {
    toolName: "notion_create",
    input: { surface: "prd", title: "Self-serve call-offs" },
    channel: CHANNEL,
    threadTs: THREAD,
    replyTs: THREAD,
    userMsgTs: THREAD,
    proposalTs: CARD_TS,
    proposalText: text,
    requesterUserId: "U1",
  };
}

type Block = { type: string; elements?: Array<{ text?: string | { text: string } }> };

/** The last context line and the buttons of one edit Slack was handed. */
function drawn(edit: Record<string, unknown>): { line: string; buttons: string[] } {
  const blocks = edit.blocks as Block[];
  const line = blocks.filter((b) => b.type === "context").at(-1)?.elements?.[0]?.text;
  const buttons = blocks
    .filter((b) => b.type === "actions")
    .flatMap((b) => (b.elements ?? []).map((e) => (typeof e.text === "object" ? e.text.text : "")));
  return { line: typeof line === "string" ? line : "", buttons };
}

describe("a long card's edits stay inside chat.update's text limit", () => {
  it("redraws a revised PRD card rejected from Review, with its outcome and View", async () => {
    const text = revisedPrdText();
    assert.ok(text.length > UPDATE_TEXT_LIMIT, `the draft is the live size (${text.length} characters)`);
    const threadState = createInMemoryThreadState();
    await threadState.putProposal(proposal(text));
    const views = recordingViews({ alreadyOpen: ["V1"] });
    const results: boolean[] = [];
    const deps: ReviewDoorDeps = {
      threadState,
      views: views.client,
      delivery: () => recordingDelivery(),
      applyVerdict: async () => {},
      // As the Worker wires it (`slack/interactive.ts`): the edit is Slack's.
      updateCard: async (channel, ts, message) => {
        const res = await updateMessage(env, { channel, ts, text: message.text, blocks: message.blocks });
        results.push(res.ok);
      },
      restage: async () => {},
      revise: async () => {},
    };
    expiryEdits.length = 0;

    await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: CARD_TS, userId: "U1", decision: "cancel" }, deps);

    assert.deepEqual(results, [true], "Slack took the one edit");
    const edit = expiryEdits[0]!;
    assert.equal(edit.ts, CARD_TS, "on the card itself");
    const sent = String(edit.text);
    assert.ok(sent.length <= UPDATE_TEXT_LIMIT, `text of ${sent.length} characters`);
    assert.equal(messageBlocksRefusal(edit.blocks as unknown[]), null);
    const { line, buttons } = drawn(edit);
    assert.match(line, /Rejected/);
    assert.deepEqual(buttons, ["View"]);
    // The copy keeps the card's opening and ends with the outcome, which is
    // what View reads once the record is gone (`review-view.ts` § outcomeOf).
    assert.ok(sent.startsWith(text.split("\n")[0]!));
    assert.equal(sent.split("\n").at(-1), line);
  });

  it("marks the same card expired at its deadline", async () => {
    const text = revisedPrdText();
    const at = { t: 1_792_209_726_000 };
    const threadState = createInMemoryThreadState({ now: () => at.t });
    await threadState.putProposal({ ...proposal(text), ttlMs: 1000 });
    at.t += 2000;
    expiryEdits.length = 0;

    await showExpiredCard(CARD_TS, {
      store: threadState,
      edit: async (channel, ts, message) => {
        const res = await updateMessage(env, { channel, ts, text: message.text, blocks: message.blocks });
        if (!res.ok) throw new Error(res.error ?? "refused");
      },
    });

    assert.equal(expiryEdits.length, 1);
    assert.ok(String(expiryEdits[0]!.text).length <= UPDATE_TEXT_LIMIT);
    assert.match(drawn(expiryEdits[0]!).line, /Expired/);
  });

  it("leaves a card that fits as it was", async () => {
    expiryEdits.length = 0;
    const short = "Ready to create a PRD: Self-serve call-offs\nRejected, so nothing runs.";
    const res = await updateMessage(env, { channel: CHANNEL, ts: CARD_TS, text: short, blocks: [] });
    assert.ok(res.ok);
    assert.equal(expiryEdits[0]!.text, short);
  });
});
