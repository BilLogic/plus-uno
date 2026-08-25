// The share-out post's shape, and its agreement with the convention doc.
//
// `docs/connectors/slack.md` § Share-out post specified the Flow 3 template
// from 2026-07-16; the tool posted four fixed lines and had no fields for most
// of it, so the documented post was literally unreachable. Nothing compared
// them, which is why it went unnoticed for months. These assertions are that
// comparison.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MAX_FEEDBACK_QUESTIONS,
  fieldsFromInput,
  renderReviewer,
  renderShareout,
} from "../src/tools/share-out-render";

const FULL = {
  project: "Session Sign Up",
  artifact: "hi-fi prototype",
  fidelity: "high",
  round: 2,
  summary: "The reworked sign-up flow with the new reconfirmation step.",
  what_changed: "Split the confirm step in two and moved the reminder 24h out.",
  feedback_wanted: [
    "Does the two-step confirm feel like one decision or two?",
    "Is the 24h reminder copy clear enough to act on?",
  ],
  not_looking_for: "Visual polish — colour and spacing are still placeholder.",
  link: "https://figma.com/file/x",
  reviewers: ["U03FYQJRQHX", "Alex"],
  deadline: "EOD Friday",
};

describe("the documented template, field for field", () => {
  const out = renderShareout(fieldsFromInput(FULL), "<@U0REQ>");

  it("opens with project · artifact · fidelity · round", () => {
    assert.equal(
      out.split("\n")[0],
      ":mega: *Session Sign Up* — hi-fi prototype · fidelity: high · round 2",
    );
  });

  it("carries every documented line", () => {
    assert.ok(out.includes("*What this is:* The reworked sign-up flow"), out);
    assert.ok(out.includes("*What changed since last round:* Split the confirm step"), out);
    assert.ok(out.includes(":dart: *Feedback wanted on:*"), out);
    assert.ok(out.includes("  1. Does the two-step confirm"), out);
    assert.ok(out.includes("  2. Is the 24h reminder copy"), out);
    assert.ok(out.includes("*Not looking for feedback on:* Visual polish"), out);
    assert.ok(out.includes(":link: https://figma.com/file/x"), out);
    assert.ok(out.includes("cc <@U03FYQJRQHX> Alex"), out);
    assert.ok(out.includes("Shared by <@U0REQ>. Comments in-thread by *EOD Friday*."), out);
  });
});

describe("the three-question cap is enforced, not requested", () => {
  it("drops anything past the cap", () => {
    const out = renderShareout(
      fieldsFromInput({ ...FULL, feedback_wanted: ["a", "b", "c", "d", "e"] }),
      "<@U0>",
    );
    assert.ok(out.includes("  3. c"), out);
    assert.ok(!out.includes("  4. d"), "a fourth question survived the cap");
    assert.equal(MAX_FEEDBACK_QUESTIONS, 3);
  });
});

describe("a thin share-out still posts", () => {
  // The bundle policy (2026-07-16) is stage-with-gaps, not block. A share-out
  // carrying only a summary must degrade to roughly what the old tool did.
  const out = renderShareout(fieldsFromInput({ summary: "The new empty state." }), "<@U0>");

  it("never opens with a bare megaphone", () => {
    assert.equal(out.split("\n")[0], ":mega: *Sharing for feedback*");
  });

  it("omits every empty line rather than printing a blank label", () => {
    for (const absent of ["fidelity:", "round", "What changed", "Feedback wanted", "Not looking for", ":link:", "cc "]) {
      assert.ok(!out.includes(absent), `"${absent}" should be omitted:\n${out}`);
    }
    assert.ok(out.includes("*What this is:* The new empty state."), out);
    assert.ok(out.includes("Shared by <@U0>."), out);
  });

  it("omits the deadline clause when there is no deadline", () => {
    assert.ok(out.trimEnd().endsWith("Comments in-thread."), out);
  });
});

describe("round 1 does not announce itself", () => {
  it("prints no round marker on the first round", () => {
    // Only the HEADER is checked — "round" also appears in "What changed since
    // last round", and asserting over the whole message caught that instead.
    const header = renderShareout(fieldsFromInput({ ...FULL, round: 1 }), "<@U0>").split("\n")[0]!;
    assert.ok(!header.includes("round"), header);
    assert.ok(header.includes("fidelity: high"), header);
  });
});

describe("reviewers", () => {
  it("@-mentions a Slack id and leaves a plain name alone", () => {
    // A display name renders as dead text and pings nobody — the tool schema
    // says IDs only, and this is what happens when the model ignores that.
    assert.equal(renderReviewer("U03FYQJRQHX"), "<@U03FYQJRQHX>");
    assert.equal(renderReviewer("W012ABCDEF"), "<@W012ABCDEF>");
    assert.equal(renderReviewer("Alex Chen"), "Alex Chen");
  });
});

describe("the doc and the tool cannot drift again", () => {
  // The actual fix. The template and the schema disagreed for months because
  // nothing read both — so this reads both.
  const root = join(process.cwd(), "..", "..");
  const doc = readFileSync(join(root, "docs", "conventions", "slack.md"), "utf8");
  const tools = JSON.parse(
    readFileSync(join(process.cwd(), "tool-definitions.json"), "utf8"),
  ) as Array<{ name: string; input_schema: { properties: Record<string, unknown> } }>;
  const shareout = tools.find((t) => t.name === "shareout_post")!;

  it("names every schema field in the convention", () => {
    const documented = doc.slice(doc.indexOf("## Share-out post"), doc.indexOf("## Two gates"));
    for (const field of Object.keys(shareout.input_schema.properties)) {
      assert.ok(
        documented.includes(`\`${field}\``),
        `${field} is a shareout_post parameter but § Share-out post never mentions it`,
      );
    }
  });

  it("still has a shareout_post tool with a summary", () => {
    // Guards the guard: if the tool is renamed, the assertion above would pass
    // vacuously on an empty property set.
    assert.ok(shareout.input_schema.properties.summary, "shareout_post lost its summary field");
    assert.ok(Object.keys(shareout.input_schema.properties).length >= 8);
  });
});

describe("input normalization", () => {
  it("accepts a comma-separated string where a list was specified", () => {
    // What the model reaches for under load.
    const f = fieldsFromInput({ summary: "x", reviewers: "U0AAAAAAA, U0BBBBBBB" });
    assert.deepEqual(f.reviewers, ["U0AAAAAAA", "U0BBBBBBB"]);
  });

  it("accepts a numeric string for round", () => {
    assert.equal(fieldsFromInput({ summary: "x", round: "3" }).round, 3);
  });

  it("treats whitespace-only fields as absent", () => {
    const f = fieldsFromInput({ summary: "x", project: "   ", deadline: "" });
    assert.equal(f.project, undefined);
    assert.equal(f.deadline, undefined);
  });
});
