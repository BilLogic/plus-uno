// The View decision pop-up's head (render seam): an item's record state in,
// the blocks a person reads above the draft out. Each scenario is one from
// the decided-cards design: the alert at its level with what changed, the
// byline naming who and when (ET), the quote, the next step, then a divider.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { REPORT_TITLES, VIEW_TITLE_CHARS, decidedWhen, outcomeHead, reportOutcome } from "../src/slack/decision-head";
import type { ReportItem, ReportItemState } from "../src/thread-state/index";
import { viewRefusal } from "./helpers/slack-block-rules";

const BILL = "U03FYQJRQHX";
const ANN = "U0ANN00001";
// Oct 19 2026, 13:13 UTC is 9:13 AM ET.
const AT = Date.UTC(2026, 9, 19, 13, 13);

const ITEM: ReportItem = {
  id: "c1",
  kind: "ds-precedence",
  title: "Skeleton",
  body: "Code has a shape prop, and no variant in the library carries it.",
  open: { label: "Code", url: "https://github.com/BilLogic/plus-uno" },
  done: "added to this week's DS precedence intake.",
};

type Rich = { type: string; elements: Array<{ type: string; elements: Array<{ type: string; text?: string; user_id?: string }> }> };

/** The head as a person reads it: the alert, then each line's words, a
 *  pill as `@id`. */
function read(state: ReportItemState): { level: string; alert: string; lines: string[]; blocks: unknown[] } {
  const outcome = reportOutcome({ id: "c1", item: ITEM, state });
  assert.ok(outcome, "a decided item has an outcome");
  const blocks = outcomeHead(outcome);
  const [alert, ...rest] = blocks as Array<{ type: string; level?: string; text?: { text: string } }>;
  const lines = rest.map((b) => {
    if (b.type === "divider") return "---";
    if (b.type === "section") return `next: ${b.text!.text}`;
    const r = b as unknown as Rich;
    const inner = r.elements[0]!;
    const words = inner.elements.map((e) => (e.type === "user" ? `@${e.user_id}` : e.text)).join("");
    return inner.type === "rich_text_quote" ? `> ${words}` : words;
  });
  return { level: alert!.level!, alert: alert!.text!.text, lines, blocks };
}

describe("the View decision pop-up's head", () => {
  const as = (label: string, decided?: string) => ({ value: "x", label, ...(decided ? { decided } : {}) });
  const scenarios: Array<[string, ReportItemState, string, string, string[]]> = [
    ["approved", { kind: "approved", by: BILL, at: AT }, "success", "Approved. Added to this week's DS precedence intake.", [`Approved by @${BILL} on Oct 19 at 9:13 AM.`, "---"]],
    ["approved with a receipt", { kind: "approved", by: BILL, at: AT, done: "added to DS precedence intake #1360." }, "success", "Approved. Added to DS precedence intake #1360.", [`Approved by @${BILL} on Oct 19 at 9:13 AM.`, "---"]],
    ["rejected with a reason", { kind: "rejected", by: BILL, at: AT, reason: "dw about this yet" }, "info", "Rejected. Nothing was written.", [`Rejected by @${BILL} on Oct 19 at 9:13 AM:`, "> dw about this yet", "---"]],
    ["noted", { kind: "noted", by: BILL, at: AT, note: "is this the old badge?" }, "info", "Noted. Added to the intake as disputed.", [`Noted by @${BILL} on Oct 19 at 9:13 AM:`, "> is this the old badge?", "---"]],
    ["marked done", { kind: "approved", by: BILL, at: AT, as: as("Marked done", "Design Status moved on the Roadmap card.") }, "success", "Marked done. Design Status moved on the Roadmap card.", [`Marked done by @${BILL} on Oct 19 at 9:13 AM.`, "---"]],
    ["kept open", { kind: "rejected", by: BILL, at: AT, as: as("Kept open", "I'll check this card again on Nov 9.") }, "info", "Kept open. I'll check this card again on Nov 9.", [`Kept open by @${BILL} on Oct 19 at 9:13 AM.`, "---"]],
    ["dropped", { kind: "approved", by: BILL, at: AT, as: as("Dropped", "Design Status moved to Archived.") }, "success", "Dropped. Design Status moved to Archived.", [`Dropped by @${BILL} on Oct 19 at 9:13 AM.`, "---"]],
    ["assigned", { kind: "approved", by: BILL, at: AT, as: as(`Assigned to <@${ANN}>`, "Contributor set on the Roadmap card.") }, "success", "Assigned. Contributor set on the Roadmap card.", [`Assigned to @${ANN} by @${BILL} on Oct 19 at 9:13 AM.`, "---"]],
    ["left unassigned", { kind: "rejected", by: BILL, at: AT, as: as("Left unassigned", "I won't ask again until the card changes.") }, "info", "Left unassigned. I won't ask again until the card changes.", [`Left unassigned by @${BILL} on Oct 19 at 9:13 AM.`, "---"]],
    ["marked updated", { kind: "rejected", by: BILL, at: AT, as: as("Marked updated", "Nothing filed.") }, "info", "Marked updated. Nothing filed.", [`Marked updated by @${BILL} on Oct 19 at 9:13 AM.`, "---"]],
    ["not written", { kind: "failed", by: BILL, at: AT, reason: "the page changed after this card was made" }, "error", "Not written. The page changed after this card was made.", [`Approved by @${BILL}, not written on Oct 19 at 9:13 AM.`, "next: Ask again in the thread for a fresh card.", "---"]],
    ["changes asked", { kind: "changes-asked", by: BILL, at: AT }, "info", "Changes asked. A revised card posts in this thread.", [`Changes asked by @${BILL} on Oct 19 at 9:13 AM.`, "---"]],
    ["expired", { kind: "expired" }, "warning", "Expired. Nothing was written.", ["---"]],
  ];
  for (const [name, state, level, alert, lines] of scenarios) {
    it(`${name}: ${level} "${alert}"`, () => {
      const head = read(state);
      assert.equal(head.level, level);
      assert.equal(head.alert, alert);
      assert.deepEqual(head.lines, lines);
      const view = { type: "modal", title: { type: "plain_text", text: REPORT_TITLES["ds-precedence"] }, close: { type: "plain_text", text: "Close" }, blocks: head.blocks };
      assert.equal(viewRefusal(view), null, "Slack takes it");
    });
  }

  it("names no time on a card decided before the time was kept", () => {
    assert.deepEqual(read({ kind: "rejected", by: BILL }).lines, [`Rejected by @${BILL}.`, "---"]);
  });

  it("an alert names nobody", () => {
    assert.doesNotMatch(read({ kind: "approved", by: BILL, at: AT, as: as(`Assigned to <@${ANN}>`) }).alert, /<@|@U/);
  });

  it("has no head for an item still open or never staged", () => {
    assert.equal(reportOutcome({ id: "c1", item: ITEM, state: { kind: "open" } }), null);
    assert.equal(reportOutcome({ id: "c1", item: ITEM, state: { kind: "not-staged", note: "n" } }), null);
  });

  it("says the time in ET, whatever the server's zone", () => {
    // 2026-11-03 02:05 UTC is Nov 2 at 9:05 PM ET (EST).
    assert.equal(decidedWhen(Date.UTC(2026, 10, 3, 2, 5)), "Nov 2 at 9:05 PM");
  });

  it("titles each report's pop-up for the report, within Slack's 24 characters", () => {
    for (const title of Object.values(REPORT_TITLES)) assert.ok(title.length <= VIEW_TITLE_CHARS, title);
    assert.equal(REPORT_TITLES["ds-precedence"], "DS precedence");
    assert.equal(REPORT_TITLES["roadmap-check-in"], "Roadmap check-in");
    assert.equal(REPORT_TITLES["figma-tidy-up"], "Figma tidy-up");
    assert.equal(REPORT_TITLES["figma-drift"], "Figma drift");
    assert.equal(REPORT_TITLES["doc-fix"], "Doc fix");
  });
});
