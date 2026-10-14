// Where every scheduled action's finding goes, and whom it names: the one
// posting ladder (src/destination/).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PILLAR_CHANNELS, resolveDestination, routeFinding, type ChannelRole } from "../src/destination/index";

const publicThread = { channel: "C0DESIGN", channelKind: "public" as const, threadTs: "1790000000.000100" };
const noThread = { ...publicThread, threadTs: null };

test("private evidence stays where it was read, whatever the card says", () => {
  const card = { pillars: ["Toolkit"], designOwner: "U0OWNER" };
  assert.deepEqual(routeFinding({ evidence: { channel: "G0PRIVATE", channelKind: "private", threadTs: "1.2" }, card }).destination, {
    rung: "private",
    channel: "G0PRIVATE",
    threadTs: "1.2",
  });
  assert.deepEqual(routeFinding({ evidence: { channel: "G0MPIM", channelKind: "group-dm", threadTs: null }, card }).destination, {
    rung: "private",
    channel: "G0MPIM",
    threadTs: null,
  });
  assert.deepEqual(routeFinding({ evidence: { channel: "D0DM", channelKind: "dm", threadTs: null }, card }).destination, {
    rung: "private",
    channel: "D0DM",
    threadTs: null,
  });
});

test("evidence in a public thread is answered in that thread", () => {
  assert.deepEqual(routeFinding({ evidence: publicThread, card: { pillars: ["Admin"] } }).destination, {
    rung: "thread",
    channel: "C0DESIGN",
    threadTs: "1790000000.000100",
  });
});

test("with no thread, the card's Product Pillar picks the team channel", () => {
  const table: Array<[string, ChannelRole]> = [
    ["Universal", "plus-universal"],
    ["Admin", "plus-admin"],
    ["Toolkit", "plus-toolkit"],
    ["Training", "plus-training"],
    ["Marketing", "plus-marketing"],
  ];
  for (const [pillar, channel] of table) {
    assert.deepEqual(routeFinding({ evidence: noThread, card: { pillars: [pillar] } }).destination, { rung: "team", team: pillar, channel }, pillar);
    assert.deepEqual(
      routeFinding({ evidence: null, card: { pillars: [pillar.toLowerCase()] } }).destination,
      { rung: "team", team: pillar, channel },
      `${pillar}, no evidence`,
    );
  }
});

test("with no card, the Figma file's team is the fallback", () => {
  assert.deepEqual(routeFinding({ evidence: null, figmaFile: { team: "Training" } }).destination, {
    rung: "team",
    team: "Training",
    channel: "plus-training",
  });
  assert.deepEqual(routeFinding({ evidence: null, card: { pillars: [] }, figmaFile: { team: "Toolkit" } }).destination, {
    rung: "team",
    team: "Toolkit",
    channel: "plus-toolkit",
  });
});

test("the card wins when it and the Figma file disagree, even when its pillar is unmapped", () => {
  assert.deepEqual(routeFinding({ evidence: null, card: { pillars: ["Admin"] }, figmaFile: { team: "Toolkit" } }).destination, {
    rung: "team",
    team: "Admin",
    channel: "plus-admin",
  });
  assert.deepEqual(routeFinding({ evidence: null, card: { pillars: ["Tutoring"] }, figmaFile: { team: "Toolkit" } }).destination, {
    rung: "design",
    channel: "plus-design",
  });
});

test("a card's first mapped pillar decides when it has several", () => {
  assert.deepEqual(routeFinding({ evidence: null, card: { pillars: ["Help Center", "Training", "Universal"] } }).destination, {
    rung: "team",
    team: "Training",
    channel: "plus-training",
  });
});

test("no team, or a team with no channel, lands in #plus-design", () => {
  const design = { rung: "design", channel: "plus-design" };
  assert.deepEqual(routeFinding({ evidence: noThread }).destination, design);
  assert.deepEqual(routeFinding({ evidence: null }).destination, design);
  assert.deepEqual(routeFinding({ evidence: null, card: { pillars: ["Tutoring"] } }).destination, design);
  assert.deepEqual(routeFinding({ evidence: null, card: { pillars: ["Help Center"] } }).destination, design);
  assert.deepEqual(routeFinding({ evidence: null, figmaFile: { team: "Others" } }).destination, design);
  assert.deepEqual(routeFinding({ evidence: null, figmaFile: { team: "MISC" } }).destination, design);
});

test("the card's design owner is tagged; with no card, the file's creator is named by handle", () => {
  assert.deepEqual(
    routeFinding({ evidence: null, card: { pillars: ["Toolkit"], designOwner: "U0OWNER" }, figmaFile: { team: "Toolkit", creatorHandle: "coco" } }).addressee,
    { slack: "U0OWNER" },
  );
  assert.deepEqual(routeFinding({ evidence: null, figmaFile: { team: "Toolkit", creatorHandle: "coco" } }).addressee, { figma: "coco" });
  assert.deepEqual(routeFinding({ evidence: null, card: { pillars: ["Toolkit"] }, figmaFile: { creatorHandle: "coco" } }).addressee, {
    figma: "coco",
  });
  assert.equal(routeFinding({ evidence: null, card: { pillars: ["Toolkit"] } }).addressee, null);
  assert.equal(routeFinding({ evidence: null }).addressee, null);
});

test("a place resolves to its configured channel id, or null when it is unset or #uno-bot", () => {
  const ids = {
    plusDesign: "C0DESIGN",
    plusUniversal: "C0UNI",
    plusAdmin: "C0ADMIN",
    plusToolkit: "C0TOOL",
    plusTraining: "C0TRAIN",
    plusMarketing: "C0MKT",
    unoBot: "C0UNOBOT",
  };
  assert.deepEqual(resolveDestination({ rung: "team", team: "Toolkit", channel: "plus-toolkit" }, ids), { channel: "C0TOOL", threadTs: null });
  assert.deepEqual(resolveDestination({ rung: "team", team: "Marketing", channel: "plus-marketing" }, ids), { channel: "C0MKT", threadTs: null });
  assert.deepEqual(resolveDestination({ rung: "design", channel: "plus-design" }, ids), { channel: "C0DESIGN", threadTs: null });
  assert.deepEqual(resolveDestination({ rung: "thread", channel: "C0X", threadTs: "1.2" }, ids), { channel: "C0X", threadTs: "1.2" });
  assert.equal(resolveDestination({ rung: "team", team: "Admin", channel: "plus-admin" }, { plusDesign: "C0DESIGN" }), null);
  assert.equal(resolveDestination({ rung: "design", channel: "plus-design" }, { plusDesign: "C0UNOBOT", unoBot: "C0UNOBOT" }), null);
});

test("the pillar map is the Slack connector's", () => {
  const doc = readFileSync(join(process.cwd(), "..", "..", "docs", "connectors", "slack.md"), "utf8");
  const line = doc.split("\n").find((l) => l.startsWith("`Universal` →"));
  assert.ok(line, "the connector states the map");
  const stated = [...line!.matchAll(/`(\w[\w ]*)` → #([\w-]+)/g)].map(([, pillar, channel]) => [pillar, channel]);
  assert.deepEqual(stated, Object.entries(PILLAR_CHANNELS));
});
