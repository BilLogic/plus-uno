// App Home — the "Home" tab landing page. Published via views.publish whenever a
// user opens the tab (app_home_opened with tab==="home"). Republishing on every
// open is idempotent and keeps the view fresh; there's no per-user state here.
//
// Design constraints:
//   • Only LINK buttons (elements with `url`) — those need no interactivity
//     handler / Request URL. A button without `url` would post a block_actions
//     payload the Worker doesn't handle.
//   • Only links to surfaces known to exist (Storybook, blueprint, repo). A
//     constructed/guessed link on a curated home page is worse than no link
//     (AGENT.md § Grounding — never present an unverified URL as in-hand).

import type { Env } from "../types";
import type { SlackAppHomeOpenedEvent } from "./types";
import { slackCall } from "./api";
import { SUGGESTED_PROMPTS } from "./assistant";

// The Home view is a fixed Block Kit document — typed loosely (Slack's block
// schema is large and we hand-author valid blocks).
const HOME_VIEW = {
  type: "home",
  blocks: [
    { type: "header", text: { type: "plain_text", text: "UNO Bot 🐐", emoji: true } },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "*Your design-team teammate for PLUS.* I pull live, cited answers from Notion, GitHub, the service blueprint, and Slack — and I'll say plainly when something's stale or not built yet.",
      },
    },
    { type: "divider" },
    { type: "section", text: { type: "mrkdwn", text: "*What I can do*" } },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "• *Answer, grounded* — Roadmap card status / owner / pillar, how a product flow works, design-system components & tokens, and any linked Notion, Figma, or Slack doc\n" +
          "• *Create — with your :white_check_mark:* — draft a PRD, file or update a card, kick off a component build or prototype, share work for feedback\n" +
          "• *Hand off* — anything that needs real code, I write a ready-to-paste prompt for your IDE agent (Claude Code, Cursor, Codex, Antigravity)",
      },
    },
    { type: "divider" },
    { type: "section", text: { type: "mrkdwn", text: "*How to reach me*" } },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "• *DM me* — right here in the *Messages* tab ↑\n" +
          "• *In a channel* — `@UNO Bot` your question\n" +
          "• *In a thread* — once I'm in, just reply; no need to re-tag",
      },
    },
    { type: "divider" },
    { type: "section", text: { type: "mrkdwn", text: "*Try asking*" } },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        // Single source of truth: the same four starter prompts the assistant
        // panel offers as chips (assistant.ts) — imported, not hand-copied.
        text: SUGGESTED_PROMPTS.map((p) => `› _${p.message}_`).join("\n"),
      },
    },
    { type: "divider" },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "📚 Storybook", emoji: true },
          url: "https://plus-uno.netlify.app/storybook/",
        },
        {
          type: "button",
          text: { type: "plain_text", text: "🗺️ Service blueprint", emoji: true },
          url: "https://uno-blueprint.netlify.app/",
        },
        {
          type: "button",
          text: { type: "plain_text", text: "💻 Repo", emoji: true },
          url: "https://github.com/BilLogic/plus-uno",
        },
      ],
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text:
            "Reads are free and instant. Anything I'd create or change in Notion or GitHub always waits for your :white_check_mark: first — the friction is the feature.",
        },
      ],
    },
  ],
};

async function publishHomeView(env: Env, userId: string): Promise<void> {
  await slackCall(env, "views.publish", { user_id: userId, view: HOME_VIEW });
}

export async function handleAppHomeOpened(env: Env, event: SlackAppHomeOpenedEvent): Promise<void> {
  // The Messages tab open also fires this event (tab: "messages") — only the
  // Home tab wants a published view.
  if (event.tab && event.tab !== "home") return;
  await publishHomeView(env, event.user);
}
