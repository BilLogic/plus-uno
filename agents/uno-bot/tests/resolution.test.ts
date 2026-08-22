// Whether a typed message may execute an irreversible write with no model in
// the loop. The refusals below are the safety property; the acceptances are
// only the convenience.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  bareResolution,
  emojiResolution,
  fastPathAllowed,
  typedResolution,
} from "../src/agent/resolution";

describe("bare resolution — accepting", () => {
  it("takes the natural compound affirmations", () => {
    // "sure go ahead" is the message that started this: under whole-message
    // equality it matched nothing, because only "sure" and "go ahead" were
    // listed, separately.
    for (const text of [
      "sure go ahead",
      "yes please",
      "ok do it",
      "yeah go ahead",
      "sounds good",
      "go ahead",
      "yes",
      "confirmed",
      "lgtm",
      "perfect",
    ]) {
      assert.equal(bareResolution(text), "confirm", text);
    }
  });

  it("takes the cancels", () => {
    for (const text of ["cancel", "no", "nope", "stop", "never mind", "don't"]) {
      assert.equal(bareResolution(text), "cancel", text);
    }
  });

  it("ignores punctuation and case", () => {
    for (const text of ["Go ahead!", "YES.", "  ok  ", "Sure, go ahead."]) {
      assert.equal(bareResolution(text), "confirm", text);
    }
  });
});

describe("bare resolution — refusing", () => {
  it("refuses anything carrying an instruction", () => {
    // The amendment case. Resolution executes the staged input VERBATIM, so a
    // message that resolves here would silently drop the change the user just
    // asked for and file the unamended version.
    for (const text of [
      "go ahead but tag it Universal",
      "yes but make it Tier 1",
      "ok, and assign it to Max",
      "go ahead and archive the old one too",
      "sure, file it under maintenance",
    ]) {
      assert.equal(bareResolution(text), null, text);
    }
  });

  it("refuses mixed polarity", () => {
    // Never guess which half was meant.
    for (const text of ["no go ahead", "ok cancel", "yes no", "cancel yes"]) {
      assert.equal(bareResolution(text), null, text);
    }
  });

  it("refuses neutral tokens with no polarity of their own", () => {
    // "go" and "it" pad an affirmation but cannot be one. An irreversible
    // write should not fire on a bare "it".
    for (const text of ["go", "it", "do it", "that", "please", "thanks"]) {
      assert.equal(bareResolution(text), null, text);
    }
  });

  it("refuses anything longer than a short phrase", () => {
    assert.equal(bareResolution("yes yes yes yes yes"), null);
    assert.equal(
      bareResolution("ok that sounds good to me lets do it"),
      null,
    );
  });

  it("refuses a question, even an affirmative-sounding one", () => {
    assert.equal(bareResolution("go ahead?"), "confirm"); // punctuation-stripped; the model never sees it
    assert.equal(bareResolution("should I go ahead"), null); // carries content
  });

  it("refuses empty and whitespace", () => {
    for (const text of ["", "   ", "\n\n"]) {
      assert.equal(bareResolution(text), null, JSON.stringify(text));
    }
  });

  it("refuses an unrelated message that merely contains a yes-word", () => {
    assert.equal(bareResolution("the answer is yes for scenario three"), null);
  });

  it("does not read hesitation as refusal", () => {
    // "wait" and "hold" were in the cancel vocabulary until 2026-08-21.
    // Someone typing "wait" wants a moment, not a cancellation — and
    // cancelling destroys the staged proposal, so they have to ask for the
    // whole thing again. When two readings differ, the model gets it, because
    // only the model can ask which was meant.
    for (const text of ["wait", "hold", "hold on", "one sec", "hang on"]) {
      assert.equal(bareResolution(text), null, text);
    }
  });

  it("still refuses on an actual withdrawal", () => {
    for (const text of ["scrap it", "drop it", "abort"]) {
      assert.equal(bareResolution(text), "cancel", text);
    }
  });
});

describe("typed emoji", () => {
  it("treats a typed emoji as the reaction would", () => {
    // A typed 👍 and a 👍 reaction are the same intent; one was deterministic
    // and the other went to the model.
    assert.equal(emojiResolution("👍"), "confirm");
    assert.equal(emojiResolution("✅"), "confirm");
    assert.equal(emojiResolution("❌"), "cancel");
  });

  it("does not resolve an emoji embedded in a sentence", () => {
    assert.equal(emojiResolution("👍 but change the title"), null);
    assert.equal(emojiResolution("nice work 👍"), null);
  });

  it("routes both paths through typedResolution", () => {
    assert.equal(typedResolution("sure go ahead"), "confirm");
    assert.equal(typedResolution("👍"), "confirm");
    assert.equal(typedResolution("go ahead but rename it"), null);
  });
});

describe("fast path suppression", () => {
  it("stands down when the bot asked more than one question", () => {
    // "go ahead" against two open questions would execute the staged input and
    // answer neither — and a staged proposal has every parameter filled with
    // the model's guesses.
    assert.equal(
      fastPathAllowed("Shall I tag it Universal? And assign it to Max?"),
      false,
    );
  });

  it("does NOT catch a compound question punctuated once", () => {
    // Documented gap, asserted so it stays a known one rather than becoming a
    // surprise. Catching this needs interrogative-clause parsing, and a fuzzy
    // safety heuristic is worse than a sharp one with a stated edge.
    assert.equal(
      fastPathAllowed("Shall I tag it Universal, and should I assign it to Max?"),
      true,
    );
  });

  it("allows the fast path after one question", () => {
    assert.equal(fastPathAllowed("Want me to file this?"), true);
  });

  it("allows it when the bot asked nothing", () => {
    assert.equal(fastPathAllowed("Staged the card."), true);
    assert.equal(fastPathAllowed(undefined), true);
  });
});
