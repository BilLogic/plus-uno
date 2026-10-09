// What a task card says about its lookup: the query it ran (`details`), what
// came back (`output`) and the links it read (`sources`).
//
// Table-driven over result text shaped as each tool writes it — success, empty
// and error — so a tool that changes its payload breaks a row here rather than
// a card in Slack. Nothing Slack-shaped is asserted: which of these sources a
// thread may see is the Slack adapter's call (`tests/checklist-sources.test.ts`).
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { readoutFor, type TaskCardSource } from "../src/agent/task-card-readout";
import { TOOL_TABLE, taskCardFor, type ToolName } from "../src/agent/tool-table";

const ok = (body: Record<string, unknown>): string => JSON.stringify({ ok: true, ...body });
const failed = (error: string): string => JSON.stringify({ ok: false, error, note: "say so" });

interface Row {
  name: ToolName;
  args: Record<string, unknown>;
  details: string | null;
  result: string;
  output: string | null;
  sources?: TaskCardSource[];
}

const ROWS: Row[] = [
  // roadmap_query
  {
    name: "roadmap_query",
    args: { title: "tutor import" },
    details: "tutor import",
    result: ok({ count: 2, cards: [
      { title: "Tutor import v2", url: "https://www.notion.so/plus/Tutor-import-v2-abc" },
      { title: "Tutor import table", url: "https://www.notion.so/plus/Tutor-import-table-def" },
    ] }),
    output: "2 cards",
    sources: [
      { text: "Tutor import v2", url: "https://www.notion.so/plus/Tutor-import-v2-abc" },
      { text: "Tutor import table", url: "https://www.notion.so/plus/Tutor-import-table-def" },
    ],
  },
  {
    name: "roadmap_query",
    args: { design_status: "WIP" },
    details: "WIP",
    result: ok({ count: 1, board: { title: "Roadmap", url: "https://www.notion.so/roadmapdb" }, cards: [
      { title: "Tutor import v2", url: "https://www.notion.so/plus/Tutor-import-v2-abc" },
    ] }),
    output: "1 card",
    sources: [
      { text: "Roadmap", url: "https://www.notion.so/roadmapdb", queried: "collection" },
      { text: "Tutor import v2", url: "https://www.notion.so/plus/Tutor-import-v2-abc" },
    ],
  },
  { name: "roadmap_query", args: { card_number: 412 }, details: "#412", result: ok({ count: 0, cards: [] }), output: "no matching cards", sources: [] },
  { name: "roadmap_query", args: { design_status: "In review" }, details: "In review", result: failed("bad status"), output: null, sources: [] },
  // notion_search
  {
    name: "notion_search",
    args: { query: "session recap" },
    details: "session recap",
    result: ok({ scope: "any", count: 1, results: [{ title: "Session recap PRD", url: "https://www.notion.so/Session-recap-1" }] }),
    output: "1 page",
    sources: [{ text: "Session recap PRD", url: "https://www.notion.so/Session-recap-1" }],
  },
  { name: "notion_search", args: { query: "decisions", scope: "decisions" }, details: "decisions in decisions", result: ok({ count: 0, results: [] }), output: "no matches" },
  { name: "notion_search", args: { query: "x" }, details: "x", result: "not json at all", output: null, sources: [] },
  // source_read
  {
    name: "source_read",
    args: { url: "https://www.figma.com/design/KEY/File?node-id=1-2" },
    details: "https://www.figma.com/design/KEY/File?node-id=1-2",
    result: ok({ source_type: "figma", url: "https://www.figma.com/design/KEY/File?node-id=1-2", title: "Tutor card", content: "…" }),
    output: "Read Tutor card",
    sources: [{ text: "Tutor card", url: "https://www.figma.com/design/KEY/File?node-id=1-2", queried: "page" }],
  },
  { name: "source_read", args: { text: "see https://example.com/a for it" }, details: "https://example.com/a", result: failed("fetch 404"), output: null, sources: [] },
  // search_blueprint
  {
    name: "search_blueprint",
    args: { query: "reconfirm call" },
    details: "reconfirm call",
    result: ok({ count: 3, rows: [
      { name: "Reconfirm", url: "https://plus-uno.netlify.app/blueprint/cell/1", links: [] },
      { name: "Call-off", url: "https://plus-uno.netlify.app/blueprint/cell/2" },
      { label: "Chunk", text: "no url here" },
    ] }),
    output: "3 matches",
    sources: [
      { text: "Reconfirm", url: "https://plus-uno.netlify.app/blueprint/cell/1" },
      { text: "Call-off", url: "https://plus-uno.netlify.app/blueprint/cell/2" },
    ],
  },
  { name: "search_blueprint", args: { query: "zzz" }, details: "zzz", result: ok({ count: 0, rows: [] }), output: "no matches", sources: [] },
  // github_read
  {
    name: "github_read",
    args: { search: "ButtonGroup" },
    details: "ButtonGroup",
    result: ok({ repo: "BilLogic/plus-uno", search: "ButtonGroup", count: 1, hits: [{ path: "src/ButtonGroup.jsx", url: "https://github.com/BilLogic/plus-uno/blob/main/src/ButtonGroup.jsx" }] }),
    output: "1 file",
    sources: [{ text: "src/ButtonGroup.jsx", url: "https://github.com/BilLogic/plus-uno/blob/main/src/ButtonGroup.jsx" }],
  },
  { name: "github_read", args: { path: "README.md" }, details: "README.md", result: ok({ path: "README.md", kind: "file", content: "# hi" }), output: "Read README.md", sources: [] },
  { name: "github_read", args: { path: "src" }, details: "src", result: ok({ path: "src", kind: "dir", entries: ["a", "b", "c"] }), output: "3 entries" },
  { name: "github_read", args: { search: "nothing" }, details: "nothing", result: ok({ count: 0, hits: [] }), output: "no matches" },
  // github_intake_search
  {
    name: "github_intake_search",
    args: { keywords: "stale link" },
    details: "stale link",
    result: ok({ count: 1, matches: [{ number: 12, title: "Stale link in README", url: "https://github.com/BilLogic/plus-uno/issues/12" }] }),
    output: "1 open intake",
    sources: [{ text: "Stale link in README", url: "https://github.com/BilLogic/plus-uno/issues/12" }],
  },
  { name: "github_intake_search", args: { keywords: "x" }, details: "x", result: ok({ count: 0, matches: [] }), output: "no open intakes match" },
  // slack people
  { name: "slack_user_profile", args: { user_id: "U123" }, details: null, result: ok({ user: { id: "U123", name: "Coco" } }), output: "Found Coco" },
  { name: "slack_user_profile", args: { name: "Bryan" }, details: "Bryan", result: ok({ matches: [{ id: "U1" }, { id: "U2" }], complete: true }), output: "2 people" },
  { name: "slack_user_profile", args: { name: "Nobody" }, details: "Nobody", result: ok({ matches: [], complete: true }), output: "no matches" },
  { name: "slack_channel_members", args: { channel_id: "C9" }, details: null, result: ok({ channel: "C9", count: 14, member_ids: [] }), output: "14 members" },
  // slack_thread_read: the link is a Slack permalink, which can name a thread
  // the room cannot see, so the card says how much it read and nothing else.
  {
    name: "slack_thread_read",
    args: { link: "https://plus.slack.com/archives/C1/p1700000000000100" },
    details: null,
    result: ok({ channel: "C1", count: 6, messages: [] }),
    output: "6 messages",
    sources: [],
  },
  // reminder_set
  { name: "reminder_set", args: { when: "thursday", what: "send the recap" }, details: "send the recap", result: ok({ confirm: "Got it, Thu 9 am ET.", runAt: "2026-10-08T13:00:00Z" }), output: "Got it, Thu 9 am ET." },
  { name: "reminder_set", args: { when: "later", what: "x" }, details: "x", result: JSON.stringify({ ok: false, ask: "What day?" }), output: "Needs a time" },
  // slack_search: every hit's link carries the result's visibility, so the
  // Slack side can decide which the thread may see.
  {
    name: "slack_search",
    args: { query: "deadline" },
    details: "deadline",
    result: ok({
      query: "deadline",
      visibility: "public-only (no user credential — public channels are the whole search)",
      results: [{ channel: "#design", link: "https://plus.slack.com/archives/C1/p1", text: "…" }],
    }),
    output: "1 message",
    sources: [{
      text: "#design",
      url: "https://plus.slack.com/archives/C1/p1",
      visibility: "public-only (no user credential — public channels are the whole search)",
    }],
  },
  { name: "slack_search", args: { query: "zz" }, details: "zz", result: ok({ visibility: "public-only", results: [] }), output: "no matches", sources: [] },
  // read_reference
  { name: "read_reference", args: { name: "uno-maintain/method" }, details: "uno-maintain/method", result: ok({ name: "uno-maintain/method", chars: 900, text: "…" }), output: "Read uno-maintain/method" },
];

describe("a task card's readout", () => {
  for (const row of ROWS) {
    it(`${row.name} ${JSON.stringify(row.args)} → ${row.output ?? "no output"}`, () => {
      const readout = readoutFor(row.name);
      assert.ok(readout, `${row.name} has a readout`);
      assert.equal(readout.details(row.args), row.details);
      assert.equal(readout.output(row.result), row.output);
      if (row.sources) assert.deepEqual(readout.sources(row.result), row.sources);
    });
  }

  it("every tool that gets a card has a readout, and nothing else does", () => {
    for (const name of Object.keys(TOOL_TABLE) as ToolName[]) {
      assert.equal(readoutFor(name) !== null, taskCardFor(name) !== null, name);
    }
  });

  // The card's cap is the card's (`tests/checklist-sources.test.ts`): the
  // answer may name the twelfth row, and the Sources box cites what it names.
  it("lists every row's link, in the order read", () => {
    const results = Array.from({ length: 12 }, (_, i) => ({ title: `p${i}`, url: `https://www.notion.so/p${i}` }));
    assert.equal(readoutFor("notion_search")!.sources(ok({ count: 12, results })).length, 12);
  });

  it("never lists one link twice", () => {
    const url = "https://www.notion.so/same";
    assert.deepEqual(readoutFor("notion_search")!.sources(ok({ results: [{ title: "a", url }, { title: "b", url }] })), [{ text: "a", url }]);
  });
});
