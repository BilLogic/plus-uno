// The share-out post's shape, and its agreement with the convention doc.
//
// `docs/connectors/slack/shapes.md` § Share-out post specified the Flow 3 template
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
import {
  decideShareoutPlace,
  executeShareForFeedback,
  shareoutPlace,
  type ShareoutChannel,
  type ShareoutReads,
} from "../src/tools/share-for-feedback";
import { preflight } from "../src/agent/preflight";
import { cardReadsFor } from "../src/turn/env-deps";
import type { Env } from "../src/types";

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
  const doc = readFileSync(join(root, "docs", "connectors", "slack", "shapes.md"), "utf8");
  const tools = JSON.parse(
    readFileSync(join(process.cwd(), "tool-definitions.json"), "utf8"),
  ) as Array<{ name: string; input_schema: { properties: Record<string, unknown> } }>;
  const shareout = tools.find((t) => t.name === "shareout_post")!;

  it("names every schema field in the convention", () => {
    const documented = doc.slice(doc.indexOf("## Share-out post"), doc.indexOf("## Answer shapes"));
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

describe("where a share-out posts", () => {
  const env = { PLUS_DESIGN_FEEDBACK_CHANNEL_ID: "C_FEEDBACK", TEST_CHANNEL_IDS: "C_SANDBOX" };
  const from = (channel: string) => ({ channel, threadTs: "1.1", userMsgTs: "1.1" });

  it("goes to #plus-design-feedback, top level, from a real conversation", () => {
    assert.deepEqual(shareoutPlace(env, from("C_DESIGN")), { channel: "C_FEEDBACK", where: "#plus-design-feedback" });
  });

  it("stays in a test channel's own thread: test traffic never posts to a team channel", () => {
    assert.deepEqual(shareoutPlace(env, from("C_SANDBOX")), { channel: "C_SANDBOX", threadTs: "1.1", where: "this thread" });
  });

  it("falls back to the asking thread when no feedback channel is set", () => {
    assert.deepEqual(shareoutPlace({}, from("C_DESIGN")), { channel: "C_DESIGN", threadTs: "1.1", where: "this thread" });
  });

  it("goes to #plus-design-feedback when asked for the feedback channel by name", () => {
    assert.deepEqual(shareoutPlace(env, from("C_DESIGN"), "feedback_channel"), { channel: "C_FEEDBACK", where: "#plus-design-feedback" });
  });

  it("stays in the asking thread when asked to post here", () => {
    assert.deepEqual(shareoutPlace(env, from("C_DESIGN"), "here"), { channel: "C_DESIGN", threadTs: "1.1", where: "this thread" });
  });

  it("stays in the DM when asked to post here from a DM", () => {
    // A threadless DM's conversation key is "dm", never a ts to post under:
    // the reply target is the asking message's own ts.
    const dm = { channel: "D_BILL", threadTs: "dm", replyTs: "2.2", userMsgTs: "2.2" };
    assert.deepEqual(shareoutPlace(env, dm, "here"), { channel: "D_BILL", threadTs: "2.2", where: "this DM" });
  });

  it("posts top level in a DM it has no reply ts for, never under the conversation key", () => {
    const dm = { channel: "D_BILL", threadTs: "dm", userMsgTs: "2.2" };
    assert.deepEqual(shareoutPlace(env, dm, "here"), { channel: "D_BILL", where: "this DM" });
  });

  it("stays in a test channel's thread whichever place was asked for", () => {
    assert.deepEqual(shareoutPlace(env, from("C_SANDBOX"), "feedback_channel"), { channel: "C_SANDBOX", threadTs: "1.1", where: "this thread" });
    assert.deepEqual(shareoutPlace(env, from("C_SANDBOX"), "here"), { channel: "C_SANDBOX", threadTs: "1.1", where: "this thread" });
  });
});

// A channel the asker names, as Slack would show it to the bot: #design-crit
// is public with the asker in it, #big-room is public without them, #secret-room
// is private with the bot in it, and #hidden is private without the bot, so
// Slack does not show it at all.
const CRIT = { id: "C0CRIT0001", name: "design-crit", kind: "channel", isPrivate: false, isArchived: false, botIsMember: false } as const;
const BIG = { id: "C0BIG00001", name: "big-room", kind: "channel", isPrivate: false, isArchived: false, botIsMember: true } as const;
const SECRET = { id: "G0SECRET01", name: "secret-room", kind: "channel", isPrivate: true, isArchived: false, botIsMember: true } as const;
const OLD = { id: "C0OLD00001", name: "old-crit", kind: "channel", isPrivate: false, isArchived: true, botIsMember: false } as const;
const KNOWN: ShareoutChannel[] = [CRIT, BIG, SECRET, OLD];
const MEMBERS: Record<string, string[]> = { C0CRIT0001: ["U_ASKER", "U2"], C0BIG00001: ["U2"], G0SECRET01: ["U_ASKER"], C0OLD00001: ["U_ASKER"] };

/** Slack as the bot sees it, recording every read. */
function fakeReads(over: Partial<ShareoutReads> = {}) {
  const calls: string[] = [];
  const reads: ShareoutReads = {
    affordable: () => true,
    async channelById(id) {
      calls.push(`info ${id}`);
      return KNOWN.find((c) => c.id === id) ?? "missing";
    },
    async channelByName(name) {
      calls.push(`list ${name}`);
      return KNOWN.find((c) => c.name === name) ?? "missing";
    },
    async members(channel) {
      calls.push(`members ${channel}`);
      return MEMBERS[channel] ?? null;
    },
    ...over,
  };
  return { reads, calls };
}

describe("a share-out in a channel the asker names", () => {
  const env = { PLUS_DESIGN_FEEDBACK_CHANNEL_ID: "C_FEEDBACK", TEST_CHANNEL_IDS: "C_SANDBOX" };
  const asked = (channel: string) => ({ channel, threadTs: "1.1", userMsgTs: "1.1", requestedBy: "U_ASKER" });
  type Asked = Parameters<typeof decideShareoutPlace>[1];
  const decide = (input: Record<string, unknown>, at: Asked = asked("C_DESIGN"), reads = fakeReads().reads) =>
    decideShareoutPlace(env, at, input, reads);
  const refusal = async (input: Record<string, unknown>, at: Asked = asked("C_DESIGN"), reads = fakeReads().reads) => {
    const decided = await decide(input, at, reads);
    assert.equal(decided.ok, false, JSON.stringify(decided));
    return decided.ok ? "" : decided.refusal;
  };

  it("posts top level in a channel named by id, and names it as a channel link", async () => {
    assert.deepEqual(await decide({ place: "channel", channel: "C0CRIT0001" }), {
      ok: true,
      place: { channel: "C0CRIT0001", where: "<#C0CRIT0001|design-crit>" },
    });
  });

  it("posts in a channel named by #name, looked up once", async () => {
    const { reads, calls } = fakeReads();
    assert.deepEqual(await decide({ place: "channel", channel: "#Design-Crit" }, asked("C_DESIGN"), reads), {
      ok: true,
      place: { channel: "C0CRIT0001", where: "<#C0CRIT0001|design-crit>" },
    });
    assert.deepEqual(calls, ["list design-crit", "members C0CRIT0001"]);
  });

  it("reads a channel mention or link as its id", async () => {
    for (const channel of ["<#C0CRIT0001|design-crit>", "<#C0CRIT0001>", "https://plus.slack.com/archives/C0CRIT0001"]) {
      const decided = await decide({ place: "channel", channel });
      assert.equal(decided.ok && decided.place.channel, "C0CRIT0001", channel);
    }
  });

  it("posts in a private channel the bot and the asker are both in", async () => {
    const decided = await decide({ place: "channel", channel: "#secret-room" });
    assert.equal(decided.ok && decided.place.where, "<#G0SECRET01|secret-room>");
  });

  it("refuses a channel the asker is not in, says so, and offers the two places", async () => {
    const said = await refusal({ place: "channel", channel: "#big-room" });
    assert.match(said, /You're not in #big-room/);
    assert.match(said, /#plus-design-feedback or here/);
  });

  it("refuses a private channel the bot is not in, and asks to be added", async () => {
    const byName = await refusal({ place: "channel", channel: "#hidden" });
    assert.match(byName, /can't find #hidden/);
    assert.match(byName, /add me to it/);
    const byId = await refusal({ place: "channel", channel: "G0HIDDEN01" });
    assert.match(byId, /can't post in <#G0HIDDEN01> — add me to it/);
    assert.match(byId, /#plus-design-feedback or here/);
  });

  it("refuses a private channel Slack lists without the bot in it", async () => {
    const { reads } = fakeReads({ channelById: async () => ({ ...SECRET, botIsMember: false }) });
    assert.match(await refusal({ place: "channel", channel: "G0SECRET01" }, asked("C_DESIGN"), reads), /can't post in #secret-room — add me to it/);
  });

  it("refuses an archived channel, a DM and a missing channel", async () => {
    assert.match(await refusal({ place: "channel", channel: "C0OLD00001" }), /#old-crit is archived/);
    const { reads, calls } = fakeReads();
    assert.match(await refusal({ place: "channel", channel: "D0BILL0001" }, asked("C_DESIGN"), reads), /not a channel/);
    assert.deepEqual(calls, []);
    assert.match(await refusal({ place: "channel" }), /Which channel/);
  });

  it("refuses rather than check a channel the turn's budget cannot cover", async () => {
    const { reads, calls } = fakeReads({ affordable: () => false });
    assert.match(await refusal({ place: "channel", channel: "#design-crit" }, asked("C_DESIGN"), reads), /used this turn's Slack lookups/);
    assert.deepEqual(calls, []);
  });

  it("refuses when it cannot check the asker is in the channel", async () => {
    const { reads } = fakeReads({ members: async () => null });
    assert.match(await refusal({ place: "channel", channel: "#design-crit" }, asked("C_DESIGN"), reads), /couldn't check you're in #design-crit/);
    const nobody = { channel: "C_DESIGN", threadTs: "1.1", userMsgTs: "1.1" };
    assert.match(await refusal({ place: "channel", channel: "#design-crit" }, nobody), /couldn't tell who's asking/);
  });

  it("refuses when Slack cannot be read", async () => {
    const { reads } = fakeReads({ channelByName: async () => "failed" });
    assert.match(await refusal({ place: "channel", channel: "#design-crit" }, asked("C_DESIGN"), reads), /couldn't look up #design-crit/);
  });

  it("tells a channel that does not exist apart from one it could not look up", async () => {
    const missing = await refusal({ place: "channel", channel: "#no-such-channel-xyz" });
    assert.match(missing, /^I can't find #no-such-channel-xyz\. If it's private, add me to it first\./);
    assert.doesNotMatch(missing, /couldn't look up/);
  });

  it("asks for the link when the channel lists ran on past what one turn reads", async () => {
    const { reads } = fakeReads({ channelByName: async () => "unfinished" });
    const said = await refusal({ place: "channel", channel: "#design-crit" }, asked("C_DESIGN"), reads);
    assert.match(said, /couldn't find #design-crit in the channels I read — paste its link/);
    assert.match(said, /#plus-design-feedback or here/);
  });

  it("keeps an ask from a test channel in its own thread, and reads nothing", async () => {
    const { reads, calls } = fakeReads();
    assert.deepEqual(await decide({ place: "channel", channel: "#design-crit" }, asked("C_SANDBOX"), reads), {
      ok: true,
      place: { channel: "C_SANDBOX", threadTs: "1.1", where: "this thread" },
    });
    assert.deepEqual(calls, []);
  });

  it("posts an ask from a DM in the channel named, since a DM is not a test channel", async () => {
    const dm = { channel: "D_BILL", threadTs: "dm", replyTs: "2.2", userMsgTs: "2.2", requestedBy: "U_ASKER" };
    const decided = await decide({ place: "channel", channel: "#design-crit" }, dm);
    assert.equal(decided.ok && decided.place.channel, "C0CRIT0001");
  });

  it("reads #plus-design-feedback named as a channel as the feedback channel", async () => {
    const { reads, calls } = fakeReads();
    const feedbackEnv = { ...env, PLUS_DESIGN_FEEDBACK_CHANNEL_ID: "C0FEEDBACK1" };
    for (const channel of ["#plus-design-feedback", "C0FEEDBACK1", "<#C0FEEDBACK1|plus-design-feedback>"]) {
      assert.deepEqual(await decideShareoutPlace(feedbackEnv, asked("C_DESIGN"), { place: "channel", channel }, reads), {
        ok: true,
        place: { channel: "C0FEEDBACK1", where: "#plus-design-feedback" },
      });
    }
    assert.deepEqual(calls, []);
  });

  it("leaves the default and here as they were, with nothing read", async () => {
    const { reads, calls } = fakeReads();
    assert.deepEqual(await decide({}, asked("C_DESIGN"), reads), { ok: true, place: { channel: "C_FEEDBACK", where: "#plus-design-feedback" } });
    assert.deepEqual(await decide({ place: "here" }, asked("C_DESIGN"), reads), {
      ok: true,
      place: { channel: "C_DESIGN", threadTs: "1.1", where: "this thread" },
    });
    assert.deepEqual(calls, []);
  });
});

describe("the refusal comes before a card is staged", () => {
  const env = { PLUS_DESIGN_FEEDBACK_CHANNEL_ID: "C_FEEDBACK", TEST_CHANNEL_IDS: "C_SANDBOX" } as unknown as Env;
  const summary = "The live app prototype, ready for a first round.";
  const ctx = (reads = fakeReads().reads) => ({
    env,
    shareout: { slack: { channel: "C_DESIGN", threadTs: "1.1", requestedBy: "U_ASKER" }, reads },
  });

  it("asks instead of staging when the asker is not in the channel", async () => {
    const ask = await preflight("shareout_post", { summary, place: "channel", channel: "#big-room" }, ctx());
    assert.match(ask?.ask ?? "", /You're not in #big-room/);
  });

  it("stages a share-out to a channel that passes every check", async () => {
    assert.equal(await preflight("shareout_post", { summary, place: "channel", channel: "#design-crit" }, ctx()), null);
  });

  it("the executor refuses at ✅ too, and posts nothing", async () => {
    const slack = { channel: "C_DESIGN", threadTs: "1.1", userMsgTs: "1.1", requestedBy: "U_ASKER" };
    const out = JSON.parse(await executeShareForFeedback(env, { summary, place: "channel", channel: "#big-room" }, slack, fakeReads().reads));
    assert.equal(out.ok, false);
    assert.equal(out.status, "refused");
    assert.match(out.error, /You're not in #big-room/);
  });
});

describe("the card names where a share-out will post", () => {
  const env = { PLUS_DESIGN_FEEDBACK_CHANNEL_ID: "C_FEEDBACK", TEST_CHANNEL_IDS: "C_SANDBOX" } as unknown as Env;
  const where = (input: Record<string, unknown>, channel: string) =>
    cardReadsFor(env, fakeReads().reads).shareoutWhere(input, { channel, requestedBy: "U_ASKER" });

  it("names #plus-design-feedback by default", async () => {
    assert.equal(await where({ summary: "x" }, "C_DESIGN"), "#plus-design-feedback");
  });

  it("names this DM when the share-out stays in a DM", async () => {
    assert.equal(await where({ summary: "x", place: "here" }, "D_BILL"), "this DM");
  });

  it("names this thread when the share-out stays in the asking thread", async () => {
    assert.equal(await where({ summary: "x", place: "here" }, "C_DESIGN"), "this thread");
  });

  it("names this thread for a test channel, whatever was asked", async () => {
    assert.equal(await where({ summary: "x" }, "C_SANDBOX"), "this thread");
    assert.equal(await where({ summary: "x", place: "channel", channel: "#design-crit" }, "C_SANDBOX"), "this thread");
  });

  it("names the channel the asker named, by id or by name", async () => {
    assert.equal(await where({ summary: "x", place: "channel", channel: "C0CRIT0001" }, "C_DESIGN"), "<#C0CRIT0001|design-crit>");
    assert.equal(await where({ summary: "x", place: "channel", channel: "#design-crit" }, "C_DESIGN"), "<#C0CRIT0001|design-crit>");
  });

  it("names the channel as asked when a check fails, so the card never names another place", async () => {
    assert.equal(await where({ summary: "x", place: "channel", channel: "#big-room" }, "C_DESIGN"), "#big-room");
  });
});
