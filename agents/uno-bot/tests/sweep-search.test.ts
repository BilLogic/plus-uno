// Finding a source nobody linked (`src/sweep/search.ts`): the names a thread
// gives a document, the match floor, and Notion before GitHub.
import { test } from "node:test";
import assert from "node:assert/strict";

import { SubrequestBudgetError } from "../src/net";
import {
  bestHit,
  findBySearch,
  looksAnswered,
  MATCH_FLOOR,
  matchScore,
  namedThings,
  questionQuery,
  type SearchHit,
} from "../src/sweep/search";

test("a thread names a document without linking it", () => {
  assert.deepEqual(
    namedThings([
      "Did we ever write this into the booking flow PRD?",
      "It's in the Tutor Help Center, I think. Not the doc.",
      "Same as the booking flow PRD, yes. <https://www.notion.so/x|the linked PRD>",
      "Or the booking PRD — one word names nothing a search can match.",
    ]),
    ["booking flow PRD", "Tutor Help Center"],
  );
});

test("a name at the floor matches; one shared word among several does not", () => {
  assert.equal(matchScore("booking flow PRD", "Booking Flow PRD"), 1);
  assert.equal(matchScore("tutor help center", "Tutor Help Center Content"), 1);
  assert.equal(matchScore("tutor student ratio training sessions", "Tutor Training PRD"), 1);
  assert.equal(matchScore("tutor help center", "Tutor Onboarding Checklist"), 0, "one common word carries nothing");
  assert.ok(matchScore("reflection redesign timeline", "Reflection Launch Plan") < MATCH_FLOOR);
});

test("the top hit is kept only above the floor", () => {
  const hits: SearchHit[] = [
    { url: "https://www.notion.so/a", title: "Tutor Onboarding", kind: "notion" },
    { url: "https://www.notion.so/b", title: "Booking Flow PRD", kind: "notion" },
  ];
  assert.equal(bestHit("booking flow PRD", hits)?.url, "https://www.notion.so/b");
  assert.equal(bestHit("reflection timeline", hits), null);
});

test("GitHub is searched only when Notion has nothing above the floor, and a known page is not found twice", async () => {
  const asked: string[] = [];
  const found = await findBySearch(
    {
      async notion(q) {
        asked.push(`notion ${q}`);
        return q === "booking flow PRD" ? [{ url: "https://www.notion.so/b", title: "Booking Flow PRD", kind: "notion" }] : [];
      },
      async github(q) {
        asked.push(`github ${q}`);
        return [{ url: "https://github.com/o/r/blob/main/docs/button-style-guide.md", title: "docs/button-style-guide.md", kind: "github" }];
      },
    },
    ["booking flow PRD", "button style guide", "third"],
    new Set(),
  );
  assert.deepEqual(asked, ["notion booking flow PRD", "notion button style guide", "github button style guide"], "at most two queries");
  assert.deepEqual(
    found.map((h) => h.url),
    ["https://www.notion.so/b", "https://github.com/o/r/blob/main/docs/button-style-guide.md"],
  );

  const again = await findBySearch(
    { notion: async () => [{ url: "https://www.notion.so/b", title: "Booking Flow PRD", kind: "notion" }] },
    ["booking flow PRD"],
    new Set(["https://www.notion.so/b"]),
  );
  assert.deepEqual(again, [], "a linked page is not found again by search");
});

test("one shared word is never a match, however short the title: \"the booking PRD\" finds no \"Booking\" page", () => {
  assert.equal(matchScore("booking PRD", "Booking"), 0);
  assert.equal(matchScore("booking PRD", "Booking Ops Retro"), 0);
  assert.equal(matchScore("booking flow PRD", "Booking Checklist"), 0, "one of two words shared");
  assert.equal(bestHit("booking", [{ url: "https://www.notion.so/x", title: "Booking", kind: "notion" }]), null);
  assert.equal(matchScore("booking flow PRD", "Booking Flow Redesign PRD"), 1, "a good two-word match still passes");
});

test("a failed search finds nothing — a 403, a rate limit, a dropped connection — and a budget stop still throws", async () => {
  const hit: SearchHit = { url: "https://www.notion.so/b", title: "Booking Flow PRD", kind: "notion" };
  const failing = await findBySearch(
    {
      notion: async () => {
        throw new Error("Notion 429 rate_limited");
      },
      github: async () => {
        throw new Error("GitHub 403: You have exceeded a secondary rate limit");
      },
    },
    ["booking flow PRD"],
  );
  assert.deepEqual(failing, []);

  const fallsThrough = await findBySearch(
    {
      notion: async () => {
        throw new TypeError("fetch failed");
      },
      github: async () => [{ ...hit, url: "https://github.com/o/r/blob/main/booking-flow.md", title: "docs/booking-flow.md", kind: "github" }],
    },
    ["booking flow PRD"],
  );
  assert.equal(fallsThrough.length, 1, "a failed Notion search still lets GitHub answer");

  await assert.rejects(
    findBySearch(
      {
        notion: async () => {
          throw new SubrequestBudgetError(38);
        },
      },
      ["booking flow PRD"],
    ),
    SubrequestBudgetError,
  );
});

test("a hit the surfaces refuse is as if never returned", async () => {
  const found = await findBySearch(
    { notion: async () => [{ url: "https://www.notion.so/b", title: "Booking Flow PRD", kind: "notion", parentDatabaseId: "private" }] },
    ["booking flow PRD"],
    new Set(),
    (h) => h.parentDatabaseId !== "private",
  );
  assert.deepEqual(found, []);
});

test("a question someone else answered reads as answered, and its words are the query", () => {
  const thread = [
    { ts: "1", user: "U0ASK", text: "What's the tutor to student ratio for training sessions?" },
    { ts: "2", user: "U0ANS", text: "1 tutor to 4–5 students." },
  ];
  assert.equal(looksAnswered(thread), true);
  assert.equal(questionQuery(thread), "tutor student ratio training session");
  assert.equal(looksAnswered([thread[0]!]), false, "unanswered");
  assert.equal(looksAnswered([thread[0]!, { ts: "3", user: "U0ASK", text: "anyone?" }]), false, "only the asker");
  assert.equal(looksAnswered([{ ts: "1", user: "U0A", text: "Shipped." }]), false, "no question");
});
