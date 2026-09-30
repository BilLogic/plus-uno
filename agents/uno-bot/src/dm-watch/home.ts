// The Home tab's DM watch section: one checkbox per switch, shown only to a
// person who has connected their own Slack token (ADR-020), each ticked as
// that person left it. A later switch is one more entry in
// `DM_WATCH_FEATURES` and appears here on its own.
//
// PURE: Block Kit in, Block Kit out.

import { DM_WATCH_LABELS } from "./copy";
import { DM_WATCH_FEATURES, isDmWatchFeature, type DmWatchFeature } from "./store";

/** The checkboxes' action id; `slack/interactive.ts` routes it. */
export const DM_WATCH_ACTION_ID = "uno_dm_watch";

/**
 * The section's blocks, with `on` ticked.
 *
 * @param on - The switches this person has on
 */
export function dmWatchHomeBlocks(on: readonly DmWatchFeature[]): unknown[] {
  const option = (f: DmWatchFeature) => ({ text: { type: "plain_text", text: DM_WATCH_LABELS[f] }, value: f });
  const ticked = DM_WATCH_FEATURES.filter((f) => on.includes(f)).map(option);
  return [
    { type: "divider" },
    { type: "section", text: { type: "mrkdwn", text: "*Reminders from your DMs*" } },
    {
      type: "actions",
      elements: [
        {
          type: "checkboxes",
          action_id: DM_WATCH_ACTION_ID,
          options: DM_WATCH_FEATURES.map(option),
          // Slack refuses an empty list here, so none ticked is no key at all.
          ...(ticked.length ? { initial_options: ticked } : {}),
        },
      ],
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text:
            "Off until you turn them on. I read your DMs with your own Slack link, each evening, and remind only you, here in our DM the next morning. I never message the other person. Turn one off and I stop, and drop what it was tracking.",
        },
      ],
    },
  ];
}

/** The switches a checkboxes action left ticked. */
export function selectedFeatures(action: { selected_options?: { value?: string }[] } | undefined): DmWatchFeature[] {
  return (action?.selected_options ?? []).map((o) => o.value).filter(isDmWatchFeature);
}
