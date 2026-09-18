// The tool table is the roster, and nothing is missing from it.
//
// Two directions, both of which used to be checked nowhere: a tool the model
// is offered with no row here would dispatch off the end of a switch, and a
// row for a tool the model is never offered is a dead column five readers
// would still consult. `withSchemas` refuses both, and this is the test that
// runs it over the real schema file.
//
// The schema file is read from disk rather than through `src/agent/tools.ts`,
// which imports it: `tsc` does not copy JSON into `.test-build/`, so the
// joined module is the one thing in this seam a Node test cannot load. What
// it joins — the rows and the bodies — is loaded directly instead, so the
// same two halves are checked.
//
// Row-to-BODY exhaustiveness is a type, not an assertion — `TOOL_BODIES` is a
// `Record<ToolName, ToolBody>`, so a missing body fails `tsc` before it can
// fail here. The runtime check below is the cheap second reading, because a
// type that is never exercised is a type nobody notices going soft.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  gateWordsFor,
  isToolName,
  rowFor,
  TOOL_NAMES,
  TOOL_TABLE,
  withSchemas,
  type ToolSchema,
} from "../src/agent/tool-table";
import { TOOL_BODIES } from "../src/agent/tool-bodies";
import { retrievalRanIn } from "../src/agent/confidence";
import { proposalWasAddressed } from "../src/agent/pending-notice";
import { operationKinds, proposalVerb } from "../src/slack/proposal-render";
import { warrantsReviewRequest } from "../src/slack/api";

function schemasFromDisk(): ToolSchema[] {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), "tool-definitions.json"), "utf8"),
  ) as ToolSchema[];
}

describe("the tool table", () => {
  it("has one row per tool in the schema file, and no row without one", () => {
    const rows = withSchemas(schemasFromDisk());
    assert.deepEqual([...Object.keys(rows)].sort(), [...TOOL_NAMES].sort());
    for (const name of TOOL_NAMES) {
      assert.equal(rows[name].name, name);
      assert.equal(rows[name].schema.name, name);
      assert.ok(rows[name].schema.description.length > 0, `${name} has no description`);
    }
  });

  it("says which tool is missing rather than which count is wrong", () => {
    const withoutOne = schemasFromDisk().filter((t) => t.name !== "slack_react");
    assert.throws(() => withSchemas(withoutOne), /slack_react/);

    const withAStranger = [
      ...schemasFromDisk(),
      { name: "moon_landing", description: "x", input_schema: { type: "object", properties: {} } },
    ] as ToolSchema[];
    assert.throws(() => withSchemas(withAStranger), /moon_landing/);
  });

  it("gives every row a body", () => {
    assert.deepEqual([...Object.keys(TOOL_BODIES)].sort(), [...TOOL_NAMES].sort());
    for (const name of TOOL_NAMES) {
      assert.equal(typeof TOOL_BODIES[name], "function", `${name} has no body`);
    }
  });
});

describe("the access column partitions the tools across the two dispatches", () => {
  // What #597 rests on. Both dispatches are `TOOLS_BY_NAME[name]` filtered on
  // `access` — `agent/run-agent.ts` runs `ungated` inside the turn,
  // `agent/resolve-proposal.ts` runs `gated` past the Gate, and `control` is
  // intercepted by the loop before either. Neither module is loadable here
  // (both name `Env` and reach `tools.ts`, which imports the JSON `tsc` does
  // not copy into `.test-build/`), so what is checked is the fact they read:
  // every tool falls to exactly one dispatch, and the one that falls to
  // neither is named rather than merely absent.
  it("puts every tool in exactly one of the three standings", () => {
    const seen = { ungated: 0, gated: 0, control: 0 };
    for (const name of TOOL_NAMES) {
      const access = TOOL_TABLE[name].access;
      assert.ok(access in seen, `${name} has an access no dispatch reads: ${access}`);
      seen[access]++;
    }
    // A degenerate table — nothing gated, say — would satisfy every other
    // assertion in this file while meaning the Gate is never reached.
    assert.ok(seen.ungated > 0, "no tool runs inside the turn");
    assert.ok(seen.gated > 0, "no tool runs past the Gate");
    assert.equal(seen.ungated + seen.gated + seen.control, TOOL_NAMES.length);
  });

  it("intercepts proposal_resolve and nothing else", () => {
    assert.deepEqual(
      TOOL_NAMES.filter((name) => TOOL_TABLE[name].access === "control"),
      ["proposal_resolve"],
    );
  });
});

describe("the readers answer from the row", () => {
  // The contract #598 landed: none of these modules keeps a list of tool names
  // any more, so none of them can disagree with a row — and the tests that
  // held their lists equal to these columns went with the lists.
  //
  // What is left to check is that each reader's answer IS the row's, for every
  // row, which is what makes adding a row the only edit a new tool needs. The
  // type carries the other half: a gated row without its card words does not
  // compile, so "the noun list nobody updated" is not a state this table has.
  it("counts a turn as grounded exactly when a retrieval row ran", () => {
    for (const name of TOOL_NAMES) {
      assert.equal(
        retrievalRanIn([name]),
        TOOL_TABLE[name].retrieval,
        `confidence disagrees with ${name}'s retrieval column`,
      );
    }
    // A name off the table is not a fetch — the cheap direction (one extra
    // judge call), and the only one a renamed tool can fall in.
    assert.equal(retrievalRanIn(["moon_landing"]), false);
    assert.equal(retrievalRanIn([]), false);
  });

  it("gives every gated tool its card words, and nothing else any", () => {
    for (const name of TOOL_NAMES) {
      const row = rowFor(name);
      assert.ok(row, `${name} has no row`);
      const words = gateWordsFor(name);
      if (row.access !== "gated") {
        assert.equal(words, null, `${name} is not gated but carries card words`);
        continue;
      }
      assert.ok(words, `${name} is gated with no card words`);
      assert.ok(words.verb.length > 0, `${name} has no card verb`);
      assert.ok(words.kind.length > 0, `${name} has no operation kind`);
      assert.ok(words.nouns.length > 0, `${name} has no nouns to be referred to by`);
    }
  });

  it("says on the card what the gated row says, never the tool's own name", () => {
    for (const name of TOOL_NAMES) {
      const words = gateWordsFor(name);
      if (!words) continue;
      assert.equal(proposalVerb(name), words.verb, `the card renames ${name}`);
      assert.notEqual(proposalVerb(name), name, `the card shows a designer ${name}`);
      const kinds = operationKinds({ toolName: name, input: {} });
      assert.deepEqual(
        kinds.map((k) => k.label),
        [words.kind],
        `the batch line renames ${name}`,
      );
    }
  });

  it("hears each of a gated row's nouns as addressing its proposal", () => {
    for (const name of TOOL_NAMES) {
      for (const noun of gateWordsFor(name)?.nouns ?? []) {
        assert.equal(
          proposalWasAddressed(`Not much to add about the ${noun} beyond that.`, name),
          true,
          `${name}'s "${noun}" reads as a bounce`,
        );
      }
    }
    // Gate vocabulary works whatever is staged, including a name with no row —
    // the pending notice is telemetry, and a renamed tool must not zero it.
    assert.equal(proposalWasAddressed("it is still pending", "moon_landing"), true);
  });

  it("announces exactly the rows that name a reviewable artifact", () => {
    for (const name of TOOL_NAMES) {
      const artifact = TOOL_TABLE[name].reviewRequest;
      assert.equal(
        warrantsReviewRequest(name),
        artifact !== null,
        `the review-request fan-out disagrees with ${name}`,
      );
      if (artifact === null) continue;
      assert.ok(artifact.length > 0, `${name} names an empty artifact`);
      // An artifact is something a CONFIRMED run left, so it can only be a
      // tool that went past the Gate.
      assert.equal(TOOL_TABLE[name].access, "gated", `${name} reviews an ungated run`);
    }
    assert.equal(warrantsReviewRequest("moon_landing"), false);
  });
});
