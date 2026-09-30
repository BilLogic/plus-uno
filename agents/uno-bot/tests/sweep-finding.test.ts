// The two decisions every sweep finding needs before anything is posted —
// whose it is, and where it goes — and when it may go.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  changedSpan,
  classifyLink,
  linksIn,
  pickDestination,
  postableAt,
  resolveDestination,
  routeOwner,
  type DriftFinding,
  type FindingTarget,
} from "../src/sweep/index";

const notion = (pillars: string[] = []): FindingTarget => ({
  url: "https://www.notion.so/abc",
  kind: "notion",
  writable: true,
  title: "A card",
  pillars,
});

const evidence = (over: Partial<DriftFinding["evidence"]> = {}): DriftFinding["evidence"] => ({
  channel: "C0DESIGN",
  channelKind: "public",
  threadTs: "1790000000.000100",
  messageTs: ["1790000000.000200"],
  permalinks: [],
  ...over,
});

test("pickDestination: each kind of finding lands on its rung", () => {
  const table: Array<[string, Pick<DriftFinding, "evidence" | "target">, ReturnType<typeof pickDestination>]> = [
    [
      "private channel → that channel only",
      { evidence: evidence({ channel: "G0PRIVATE", channelKind: "private" }), target: notion(["Universal"]) },
      { rung: "private", channel: "G0PRIVATE", threadTs: "1790000000.000100" },
    ],
    [
      "group DM → that group DM only",
      { evidence: evidence({ channel: "G0MPIM", channelKind: "group-dm", threadTs: null }), target: notion() },
      { rung: "private", channel: "G0MPIM", threadTs: null },
    ],
    [
      "DM → that DM only",
      { evidence: evidence({ channel: "D0DM", channelKind: "dm", threadTs: null }), target: notion() },
      { rung: "private", channel: "D0DM", threadTs: null },
    ],
    [
      "public thread → that thread, even for a design-system target",
      { evidence: evidence(), target: notion(["Universal"]) },
      { rung: "thread", channel: "C0DESIGN", threadTs: "1790000000.000100" },
    ],
    [
      "no thread, Universal card → #plus-universal",
      { evidence: evidence({ threadTs: null }), target: notion(["Toolkit", "Universal"]) },
      { rung: "design-system", channel: "plus-universal" },
    ],
    [
      "no thread, the Figma library → #plus-universal",
      { evidence: evidence({ threadTs: null }), target: { ...notion(), kind: "figma-library", writable: false } },
      { rung: "design-system", channel: "plus-universal" },
    ],
    [
      "no thread, design-system code → #plus-universal",
      { evidence: evidence({ threadTs: null }), target: { ...notion(), kind: "design-system-code", writable: false } },
      { rung: "design-system", channel: "plus-universal" },
    ],
    [
      "no thread, Storybook → #plus-universal",
      { evidence: evidence({ threadTs: null }), target: { ...notion(), kind: "storybook", writable: false } },
      { rung: "design-system", channel: "plus-universal" },
    ],
    [
      "no thread, anything else → #plus-design",
      { evidence: evidence({ threadTs: null }), target: notion(["Toolkit"]) },
      { rung: "design", channel: "plus-design" },
    ],
  ];
  for (const [name, finding, expected] of table) assert.deepEqual(pickDestination(finding), expected, name);
});

test("a role's channel resolves from config, and is null when unset — never #uno-bot", () => {
  const channels = { plusUniversal: "C0UNIVERSAL", plusDesign: "C0DESIGN" };
  assert.deepEqual(resolveDestination({ rung: "design-system", channel: "plus-universal" }, channels), {
    channel: "C0UNIVERSAL",
    threadTs: null,
  });
  assert.deepEqual(resolveDestination({ rung: "design", channel: "plus-design" }, channels), {
    channel: "C0DESIGN",
    threadTs: null,
  });
  assert.equal(resolveDestination({ rung: "design", channel: "plus-design" }, {}), null);
});

test("owner routing falls through its three rungs, never to a default", () => {
  const participants = ["U0STARTER", "U0CLAIMER"];
  assert.deepEqual(
    routeOwner({ claimedBy: "U0CLAIMER", participants, contributorIds: ["U0CONTRIB"], starter: "U0STARTER" }),
    { owner: "U0CLAIMER", rung: "claimed" },
  );
  // A claim by someone who never posted in the thread is a guess.
  assert.deepEqual(
    routeOwner({ claimedBy: "U0STRANGER", participants, contributorIds: ["U0CONTRIB"], starter: "U0STARTER" }),
    { owner: "U0CONTRIB", rung: "contributor" },
  );
  assert.deepEqual(routeOwner({ claimedBy: null, participants, contributorIds: [], starter: "U0STARTER" }), {
    owner: "U0STARTER",
    rung: "starter",
  });
});

test("a finding posts at the first weekday 09:00 ET (13:00 UTC in EDT) after it was found", () => {
  // Swept at Wednesday 00:00 ET (04:00 UTC) → Wednesday 09:00 ET, 13:00 UTC.
  assert.equal(postableAt(Date.UTC(2026, 8, 30, 4)), Date.UTC(2026, 8, 30, 13));
  // Friday's work, swept at Saturday 00:00 ET → Monday 09:00 ET, not the weekend.
  assert.equal(postableAt(Date.UTC(2026, 9, 3, 4)), Date.UTC(2026, 9, 5, 13));
  // A swept job deferred into the small hours still makes that morning.
  assert.equal(postableAt(Date.UTC(2026, 8, 30, 12, 59)), Date.UTC(2026, 8, 30, 13));
  // Exactly at 09:00 ET is not "after".
  assert.equal(postableAt(Date.UTC(2026, 8, 29, 13)), Date.UTC(2026, 8, 30, 13));
});

test("a finding posts at 09:00 ET on both sides of the 1 Nov 2026 change", () => {
  // Fri 30 Oct swept at Sat 31 Oct 00:00 EDT → Mon 2 Nov 09:00 EST, 14:00 UTC.
  assert.equal(postableAt(Date.UTC(2026, 9, 31, 4)), Date.UTC(2026, 10, 2, 14));
  // Found before Friday's run → that morning, 09:00 EDT.
  assert.equal(postableAt(Date.UTC(2026, 9, 30, 9)), Date.UTC(2026, 9, 30, 13));
  // Mon 2 Nov swept at Tue 3 Nov 00:00 EST, 05:00 UTC → that morning's 14:00 UTC run.
  assert.equal(postableAt(Date.UTC(2026, 10, 3, 5)), Date.UTC(2026, 10, 3, 14));
  // 13:00 UTC on Mon 2 Nov is 08:00 EST → that morning's 14:00 UTC run.
  assert.equal(postableAt(Date.UTC(2026, 10, 2, 13)), Date.UTC(2026, 10, 2, 14));
});

test("links: Slack's <url|label> and bare URLs, each once, classified or left alone", () => {
  assert.deepEqual(
    linksIn("see <https://www.notion.so/abc|the PRD> and https://github.com/o/r/blob/main/design-system/x.md. again <https://www.notion.so/abc>"),
    ["https://www.notion.so/abc", "https://github.com/o/r/blob/main/design-system/x.md"],
  );
  assert.equal(classifyLink("https://app.notion.com/p/abc"), "notion");
  assert.equal(classifyLink("https://www.figma.com/design/LIBKEY/DS?node-id=1-2", "LIBKEY"), "figma-library");
  assert.equal(classifyLink("https://www.figma.com/design/OTHER/x", "LIBKEY"), "figma");
  assert.equal(classifyLink("https://github.com/o/r/blob/main/design-system/src/a.jsx"), "design-system-code");
  assert.equal(classifyLink("https://github.com/o/r/pull/3"), "github");
  assert.equal(classifyLink("https://plus.slack.com/docs/T0/F0CANVAS"), "canvas");
  assert.equal(classifyLink("https://plus-uno.netlify.app/storybook/?path=/docs/button"), "storybook");
  assert.equal(classifyLink("https://example.com/"), null);
});

// The card shows what a fix changes — wherever in the block it is — with a
// little unchanged text either side, not the block's first lines.
test("a fix is shown as its changed span, before and after, with context", () => {
  const filler = "Tutors meet weekly and log each session in the portal. ".repeat(10);
  const original = `${filler}Launch date: October 15, pending review. Owner: design.`;
  const replacement = `${filler}Launch date: November 1, pending review. Owner: design.`;
  const { before, after } = changedSpan(original, replacement);
  assert.match(before, /^….*Launch date: October 15, pending review\. Owner: design\.$/);
  assert.match(after, /^….*Launch date: November 1, pending review\. Owner: design\.$/);
  assert.ok(before.length < 120, "context, not the whole block");
  assert.deepEqual(changedSpan("Owner: design team", "Owner: Bea"), { before: "Owner: design team", after: "Owner: Bea" });
});

test("a change in whitespace alone still shows as a change", () => {
  const { before, after } = changedSpan("Owner: Bea", "Owner:  Bea");
  assert.notEqual(before, after);
});
