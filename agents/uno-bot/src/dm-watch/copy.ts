// What a DM reminder says, and the Home-tab switches' words.
//
// A promise the owner MADE says what a thread promise's reminder says, with
// the same four answers (`commitments/copy.ts`). A promise made TO the owner
// asks whether they want to follow up, with three answers of its own. Either
// goes only to the owner's DM with uno-bot, and mentions only the owner: the
// other person is named as plain text, never as a mention, so Slack tells them
// nothing.
//
// PURE: no `Env`, no Slack module, no Workers global.

import type { ReminderAnswer, ReminderChoice } from "../commitments/copy";
import type { DmWatchFeature } from "./store";

/** The switches as the Home tab words them. */
export const DM_WATCH_LABELS: Readonly<Record<DmWatchFeature, string>> = {
  promises_made: "Remind me about promises I make in my DMs",
  promises_to_me: "Tell me when a promise made to me in my DMs looks overdue",
  dm_capture: "Catch decisions from my DMs",
};

/** The answers under a reminder about a promise made to the owner. */
export const MADE_TO_CHOICES: readonly ReminderChoice[] = [
  { glyph: "raised_hands", label: "Got it" },
  { glyph: "hourglass_flowing_sand", label: "Wait 2 more days" },
  { glyph: "no_good", label: "Drop it" },
];
/** The same, once both ⏳ are spent: no ⏳ is offered that could bring nothing. */
export const MADE_TO_LAST_CHOICES: readonly ReminderChoice[] = [
  { glyph: "raised_hands", label: "Got it" },
  { glyph: "no_good", label: "Drop it" },
];
/** A promise the owner made, once both ⏳ are spent. */
export const MADE_LAST_CHOICES: readonly ReminderChoice[] = [
  { glyph: "raised_hands", label: "Done" },
  { glyph: "no_good", label: "Dropped" },
  { glyph: "thinking_face", label: "Wasn't a promise" },
];

/** What replaces that legend once the owner answers. 🤔 means nothing here. */
export function madeToAcknowledgment(answer: Exclude<ReminderAnswer, "not_promise">, checkBackDay?: string): string {
  switch (answer) {
    case "done":
      return "Got it. I'll leave it there.";
    case "soon":
      return `No problem. I'll check again ${checkBackDay ?? "in two working days"}.`;
    case "not_doing":
      return "Understood. I won't bring it up again.";
  }
}


