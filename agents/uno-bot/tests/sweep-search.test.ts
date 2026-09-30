// Finding a source nobody linked (`src/sweep/search.ts`): the names a thread
// gives a document, the match floor, and Notion before GitHub.
import { test } from "node:test";
import assert from "node:assert/strict";

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
      "Did we ever write this into the booking PRD?",
      "It's in the Tutor Help Center, I think. Not the doc.",
      "Same as the booking PRD, yes. <https://www.notion.so/x|the linked PRD>",
    ]),
    ["booking PRD", "Tutor Help Center"],
  );
});

test("a name at the floor matches; one shared word among several does not", () => {
  assert.equal(matchScore("booking PRD", "Booking Flow PRD"), 1);
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
  assert.equal(bestHit("booking PRD", hits)?.url, "https://www.notion.so/b");
  assert.equal(bestHit("reflection timeline", hits), null);
});

test("GitHub is searched only when Notion has nothing above the floor, and a known page is not found twice", async () => {
  const asked: string[] = [];
  const found = await findBySearch(
    {
      async notion(q) {
        asked.push(`notion ${q}`);
        return q === "booking PRD" ? [{ url: "https://www.notion.so/b", title: "Booking PRD", kind: "notion" }] : [];
      },
      async github(q) {
        asked.push(`github ${q}`);
        return [{ url: "https://github.com/o/r/blob/main/docs/button-guide.md", title: "docs/button-guide.md", kind: "github" }];
      },
    },
    ["booking PRD", "button guide", "third"],
    new Set(),
  );
  assert.deepEqual(asked, ["notion booking PRD", "notion button guide", "github button guide"], "at most two queries");
  assert.deepEqual(
    found.map((h) => h.url),
    ["https://www.notion.so/b", "https://github.com/o/r/blob/main/docs/button-guide.md"],
  );

  const again = await findBySearch(
    { notion: async () => [{ url: "https://www.notion.so/b", title: "Booking PRD", kind: "notion" }] },
    ["booking PRD"],
    new Set(["https://www.notion.so/b"]),
  );
  assert.deepEqual(again, [], "a linked page is not found again by search");
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
