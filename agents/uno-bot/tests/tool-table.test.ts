// The tool table is the roster, and nothing is missing from it.
//
// Two directions, both of which used to be checked nowhere: a tool the model
// is offered with no row here would dispatch off the end of a switch, and a
// row for a tool the model is never offered is a dead column three readers
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
  isToolName,
  TOOL_NAMES,
  TOOL_TABLE,
  withSchemas,
  type ToolSchema,
} from "../src/agent/tool-table";
import { TOOL_BODIES } from "../src/agent/tool-bodies";
import { SIDE_EFFECT_TOOLS } from "../src/agent/types";
import { RETRIEVAL_TOOLS } from "../src/agent/confidence";
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

describe("the table's roster columns say what the three readers say", () => {
  // The expand half: the columns land beside the sets that are still read, and
  // this is what holds the two accounts equal until the readers move over.
  // Both directions where the set allows it — a set of plain strings can name
  // a tool that does not exist, and that is as silent as a missing column.
  it("gates exactly the side-effect tools", () => {
    for (const name of TOOL_NAMES) {
      assert.equal(
        TOOL_TABLE[name].access === "gated",
        SIDE_EFFECT_TOOLS.has(name),
        `${name} disagrees with SIDE_EFFECT_TOOLS`,
      );
    }
  });

  it("marks exactly the tools that reach a source", () => {
    for (const name of TOOL_NAMES) {
      assert.equal(
        TOOL_TABLE[name].retrieval,
        RETRIEVAL_TOOLS.has(name),
        `${name} disagrees with RETRIEVAL_TOOLS`,
      );
    }
    // RETRIEVAL_TOOLS is a set of plain strings, so this half is not a type.
    assert.deepEqual(
      [...RETRIEVAL_TOOLS].filter((name) => !isToolName(name)),
      [],
      "RETRIEVAL_TOOLS names something that is not a tool",
    );
  });

  it("marks exactly the tools whose result warrants a review request", () => {
    for (const name of TOOL_NAMES) {
      assert.equal(
        TOOL_TABLE[name].reviewRequest,
        warrantsReviewRequest(name),
        `${name} disagrees with the review-request roster`,
      );
    }
    // The review-request set is private behind `warrantsReviewRequest`, so a
    // member that is not a tool is unreachable from here — it stays unguarded
    // until the reader moves onto this column.
  });
});
