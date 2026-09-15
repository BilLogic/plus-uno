// The approval card as the SOURCE OF TRUTH for what a ✅ runs.
//
// A batch's plan is rendered here and nowhere else — grouped by what each
// operation touches, labelled by kind, with a rewrite showing before and after
// — and the Gate's result message is rendered from the same grouping, because
// the person reads the result against the card they approved.
//
// What every case guards is the same property in a different place: nothing is
// summarised away. Past Slack's limits the groups collapse and the complete
// list moves to follow-up messages; it is never shortened to "and N more".
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CONFIRM_FOOTER,
  groupOperations,
  withOperationPlan,
  type PlannedOperation,
} from "../src/slack/proposal-render";
import { batchResultMessage, type OperationOutcome } from "../src/gate/index";

const CARD = [":warning: About to *update this Notion page*:", "• *Page link:* …", CONFIRM_FOOTER].join(
  "\n",
);

const HUB = "https://notion.so/calendar-sync-hub";
const PRD = "https://notion.so/calendar-sync-prd";

/** Four targets, five operations, four kinds — the shape the card has to hold. */
const BATCH: PlannedOperation[] = [
  {
    toolName: "notion_update",
    input: {
      page_url: HUB,
      title: "Calendar Sync hub",
      replace: [
        {
          block_id: "24f0c2410aa1",
          last_edited_time: "2026-09-14T10:00:00.000Z",
          before: "The sync runs nightly.",
          content: "The sync runs hourly.\nAnd the failure path pages on-call.",
        },
      ],
    },
  },
  {
    toolName: "notion_update",
    input: {
      page_url: HUB,
      title: "Calendar Sync hub",
      append: { sections: [{ heading: "Decision log", body: "…" }] },
    },
  },
  {
    toolName: "notion_update",
    input: {
      page_url: PRD,
      title: "Calendar Sync PRD",
      properties: { design_status: "Ready for QA" },
    },
  },
  { toolName: "notion_create", input: { surface: "decision", title: "Calendar Sync cut" } },
  { toolName: "shareout_post", input: { summary: "Calendar Sync v2 prototype" } },
];

test("a four-target batch renders every operation, grouped, with a kind label on each", () => {
  const plan = withOperationPlan(CARD, BATCH);

  assert.equal(plan.followUp, undefined, "it fits on the card");
  assert.match(plan.text, /5 operations across 4 targets/);
  // One heading per target, in the order the batch runs them.
  assert.match(plan.text, /\*<https:\/\/notion\.so\/calendar-sync-hub\|Calendar Sync hub>\*/);
  assert.match(plan.text, /\*<https:\/\/notion\.so\/calendar-sync-prd\|Calendar Sync PRD>\*/);
  assert.match(plan.text, /\*decision\* \(Notion data source\)/);
  assert.match(plan.text, /\*#plus-design-feedback\*/);
  // Every operation, numbered as the batch numbers it, with its kind.
  assert.match(plan.text, /1\. \*replace in place\*/);
  assert.match(plan.text, /2\. \*append\* — _Decision log_/);
  assert.match(plan.text, /3\. \*set properties\* — Design status → `Ready for QA`/);
  assert.match(plan.text, /4\. \*create row\* — Calendar Sync cut/);
  assert.match(plan.text, /5\. \*post a share-out\* — Calendar Sync v2 prototype/);
  // The two hub operations sit under the ONE hub heading, not two.
  assert.equal(plan.text.split("Calendar Sync hub>").length - 1, 1);
  // And the footer is still the last thing read.
  assert.ok(plan.text.indexOf("5. *post a share-out*") < plan.text.indexOf(CONFIRM_FOOTER));
});

test("a rewrite shows the block's text as the read reported it, then the new first line", () => {
  const plan = withOperationPlan(CARD, BATCH);
  assert.match(plan.text, /_The sync runs nightly\._ → _The sync runs hourly\._/);
  // The second line of the new content is not the gist — the first line is.
  assert.ok(!plan.text.includes("pages on-call"));
});

test("a rewrite with no read text behind it cites the block id rather than inventing a before", () => {
  const plan = withOperationPlan(CARD, [
    BATCH[3]!,
    {
      toolName: "notion_update",
      input: {
        page_url: HUB,
        title: "Calendar Sync hub",
        replace: [
          {
            block_id: "24f0c2410aa1",
            last_edited_time: "2026-09-14T10:00:00.000Z",
            content: "The sync runs hourly.",
          },
        ],
      },
    },
  ]);
  assert.match(plan.text, /block `24f0c2410aa1` → _The sync runs hourly\._/);
});

test("one operation keeps the card it always had — no plan, no ceremony", () => {
  assert.deepEqual(withOperationPlan(CARD, [BATCH[3]!]), { text: CARD });
});

test("past Slack's limits the card collapses per target, and the follow-up still names every operation", () => {
  // 30 pages × 10 rewrites, each line carrying a full before → after gist: past
  // what one Slack message can hold, which is the only thing that may change
  // how the plan renders.
  const long = (seed: string): string => `${seed} ${"context ".repeat(20)}`;
  const many: PlannedOperation[] = [];
  for (let page = 0; page < 30; page++) {
    for (let op = 0; op < 10; op++) {
      many.push({
        toolName: "notion_update",
        input: {
          page_url: `https://notion.so/page-${page}`,
          title: `Page ${page}`,
          replace: [
            {
              block_id: `block-${page}-${op}`,
              last_edited_time: "2026-09-14T10:00:00.000Z",
              before: long(`old ${page}-${op}`),
              content: long(`new ${page}-${op}`),
            },
          ],
        },
      });
    }
  }

  const plan = withOperationPlan(CARD, many);

  // The card collapsed: a heading and a tally per page, and not one numbered
  // operation line on it.
  assert.match(plan.text, /300 operations across 30 targets/);
  assert.match(plan.text, /\*<https:\/\/notion\.so\/page-0\|Page 0>\* — 10 ops: 10 replace in place/);
  assert.ok(!/\n {2}\d+\. /.test(plan.text), "no per-operation lines on a collapsed card");
  // Every page is still named — the collapse drops detail, never a target.
  for (let page = 0; page < 30; page++) {
    assert.ok(plan.text.includes(`|Page ${page}>`), `page ${page} named on the card`);
  }

  // And the whole list is in the follow-up, every operation of it.
  assert.ok(plan.followUp && plan.followUp.length > 1, "the plan needs several messages");
  const whole = plan.followUp!.join("\n");
  assert.equal(whole.split("*replace in place*").length - 1, 300);
  assert.match(whole, /1\. \*replace in place\*/);
  assert.match(whole, /300\. \*replace in place\*/);
  for (const message of plan.followUp!) {
    assert.ok(message.length <= 3500, "each follow-up posts as one message");
  }
});

test("groups keep the batch's own order and numbering", () => {
  assert.deepEqual(
    groupOperations(BATCH).map((g) => g.members),
    [[0, 1], [2], [3], [4]],
  );
});

test("the result message mirrors the card's grouping, done or failed per operation", () => {
  const outcomes: OperationOutcome[] = BATCH.map((op, i) => ({
    toolName: op.toolName,
    input: op.input,
    ok: i !== 2,
    result: "{}",
    message: i === 2 ? "the block moved since it was read" : `operation ${i + 1} landed`,
  }));

  const message = batchResultMessage(outcomes) ?? "";

  assert.match(message, /5 operations — 4 done, 1 failed/);
  assert.match(message, /\*<https:\/\/notion\.so\/calendar-sync-hub\|Calendar Sync hub>\*/);
  assert.match(message, /1\. :white_check_mark: \*replace in place\* — operation 1 landed/);
  assert.match(message, /3\. :x: \*set properties\* — the block moved since it was read/);
  assert.match(message, /5\. :white_check_mark: \*post a share-out\* — operation 5 landed/);
  // One heading per target here too, the same four the card showed.
  assert.equal(message.split("(Notion data source)").length - 1, 1);
});

test("a single-operation batch keeps the per-tool result it always had", () => {
  assert.equal(
    batchResultMessage([
      { toolName: "notion_create", input: {}, ok: true, result: "{}", message: "created" },
    ]),
    null,
  );
});
