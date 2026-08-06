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
import { slackConnectUrl } from "../oauth/slack";

// The Home view is a Block Kit document built per publish (cheap — no state,
// just env-derived links) — typed loosely (Slack's block schema is large and
// we hand-author valid blocks).
// Blocks above the connect prompt. Kept short on purpose: the link is the one
// action a new user can take that changes what I can answer, so it sits high
// rather than below three screens of capability copy (it used to be last).
const HOME_INTRO = [
  { type: "header", text: { type: "plain_text", text: "UNO Bot 🐐", emoji: true } },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text:
        "*Your design-team teammate for PLUS.* I pull live, cited answers from Notion, GitHub, the service blueprint, and Slack — and I'll say plainly when something's stale or not built yet.",
    },
  },
];

const HOME_BODY = [
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
          "• *DM me* — right here in the *Messages* tab ↑. It's an ordinary chat: no threads to start, just keep talking\n" +
          "• *In a channel* — `@UNO Bot` your question; I'll answer in a thread\n" +
          "• *In a thread* — once I'm in, just reply; no need to re-tag\n" +
          "• *Slash commands* — `/uno-research`, `/uno-synthesize`, `/uno-prototype`, `/uno-review`, `/uno-publish`, `/uno-maintain`",
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
  ];

// ADR-020 onboarding. Static per env — we don't check per-user token state
// here; the view is documentation, and the DM welcome does the targeted nudge.
//
// Without a link, searches run on the workspace-filtered credential: public
// channels plus the team-allowlisted private ones. Say what linking BUYS
// rather than what it is, and say where the results go — the surface gate is
// the reason it's safe to offer.
const connectBlocks = (url: string) => [
  { type: "divider" },
  { type: "section", text: { type: "mrkdwn", text: "*First: link your Slack — 10 seconds, optional*" } },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text:
        "Until you do, I can only search *public channels* (plus a few team-approved private ones). Link, and I can also pull from *your* DMs, group chats, and private channels — the conversations only you can see.\n\nAnything I find that way stays in your DM with me; nobody else ever sees it. Unlink anytime in Slack's app settings.",
    },
  },
  {
    type: "actions",
    elements: [
      {
        type: "button",
        style: "primary",
        text: { type: "plain_text", text: "🔗 Link your Slack", emoji: true },
        url,
      },
    ],
  },
];

function buildHomeView(env: Env) {
  const url = slackConnectUrl(env);
  return {
    type: "home",
    blocks: [...HOME_INTRO, ...(url ? connectBlocks(url) : []), ...HOME_BODY],
  };
}

async function publishHomeView(env: Env, userId: string): Promise<void> {
  await slackCall(env, "views.publish", { user_id: userId, view: buildHomeView(env) });
}

export async function handleAppHomeOpened(env: Env, event: SlackAppHomeOpenedEvent): Promise<void> {
  // The Messages tab open also fires this event (tab: "messages") — only the
  // Home tab wants a published view.
  if (event.tab && event.tab !== "home") return;
  await publishHomeView(env, event.user);
}
