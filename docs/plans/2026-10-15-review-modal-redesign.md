---
title: "Review pop-up redesign: audit and proposal"
type: design
status: decided (Bill, 2026-10-15); not yet built
date: 2026-10-15
repos: plus-uno (agents/uno-bot)
---

# Review pop-up redesign: audit and proposal

The Review pop-up reads well for the four tools that have a reader in
`review-draft.ts` (`notion_create`, `notion_update`, `github_issue_create`,
`dm_relay`). It falls back to the card's mrkdwn text for every other gated
tool and every Worker-staged card. That fallback is what Bill opened on a
`shareout_post` card. This doc grades every modal uno-bot opens and proposes
one block anatomy for all of them, built only from blocks Slack takes in a
modal. Each variant that needs work has its before → after as exact Block Kit
JSON, with a Block Kit Builder link.

Bill approved all five of its decisions on 2026-10-15 (§ Decisions), and the
afters below already include them. No code changes yet. Each "before" payload was rendered by the repo's own
`draftView` / `renderProposalCard` at `origin/main` (f199e5ad) from sample
inputs. It is what Slack is handed today, not a reconstruction.

## What Bill saw, and why

Bill opened Review on a share-out and called it "really ugly and hard to
read", "not using the Slack native elements as some of our other pop-up
modals". The pop-up was:

- the title "Review proposal", then a bold "The draft" line;
- one mrkdwn section holding the card's text: `:warning: About to share this for
  feedback in #uno-bot-sandbox:` and a bullet per raw tool input (`Summary`,
  `Place: channel`, `Deadline`, `Round: 1`, `Project`, `Artifact`,
  `Channel: #uno-bot-sandbox`, `Feedback wanted` with sub-bullets, `Fidelity`,
  `Not looking for`, `Link`, `Reviewers`);
- the bundle caveat as bold text at the end of that section;
- the decision, then Close / Submit.

The mechanism: `draftView` asks `readableDraft` for a reading. `READERS` has no
`shareout_post` entry, so it returns null. The view then falls back to
`textSections(proposalText)`, which is the card text `cardFieldsOf` built from
the raw input keys. `draftHeadline` is null for the same reason, so the head
says "The draft". Four defects follow:

1. **The channel shows three times**: in the verb (`share this for feedback in
   #uno-bot-sandbox`), as `Channel`, and implied again by `Place: channel`.
2. **Internal inputs leak.** `place` is the executor's routing enum. The card's
   own summary line already hides it (`SHAPE_LABELS`), but the pop-up does not.
3. **The warning is buried.** The caveat is the last line of the one section,
   below about 15 bullets. In a long draft it is cut off at the fold, which is
   what Bill saw.
4. **Nothing is native.** One mrkdwn section with `•`/`◦` characters. No
   heading, no fields, no list, no link button, no alert. `Reviewers` renders as
   raw `U0…` text, because `renderField` writes the value as is: the pop-up
   shows an id where a person's name belongs.

The first redesign (a plain-text preview of the post under a header line) did
not fix defect 4, so this proposal is built from blocks, not from text.

## What a modal takes today

Checked against Slack's block reference (docs.slack.dev) on 2026-10-15:

| Block | In a modal? | Use here |
|---|---|---|
| `header` | yes | The one headline: what Approve does |
| `section` with `fields` | yes (≤10 fields, ≤2,000 chars each) | Short facts in two columns |
| `section` with `accessory` | yes | Edit fields button, beside the facts it edits |
| `rich_text` (section, list, quote, preformatted; text styles, `user`, `channel`, `link`, `emoji`) | yes | Where it goes and who it pings, as native pills; question lists; quoted text that posts verbatim |
| `alert` (`default`, `info`, `warning`, `error`, `success`; ≤200 chars) | **modals only** | Caveats; read-only and outcome states |
| `card` (title, subtitle, body ≤200, subtext, up to 3 buttons) | yes | The thing being shared or touched, with its Open button |
| `context`, `divider`, `image`, `actions` | yes | Footnotes, the decision separator, link buttons |
| `input` with `plain_text_input` / `rich_text_input` / `radio_buttons` (options take a `description`, ≤75 chars) | yes | Editable text; the decision |
| `markdown` | **messages only** | Not usable here |
| `table`, `data_table`, `container` | messages and Home tab only | Not usable here; `container` (the collapsible one) is the nearest thing to an accordion and does not reach modals |
| `task_card`, `plan`, `carousel` | messages | Not usable here |

So the earlier memory facts hold: no `table` and no accordion in a modal, and
`alert` is the modal's own block. The useful newer block is `card`. Slack's
docs list it for modals, but no uno-bot modal uses it yet; see § Not verified.

## Inventory

Every modal uno-bot opens is in `slack/review-view.ts` or `slack/feedback.ts`.
Nothing else in `src/` builds a `type: "modal"` view. The draft varies by what
the card stages, so the inventory has one row per gated tool in
`agent/tool-table.ts` and one per state.

**Grades.** Good: native blocks, every fact once, warnings visible. Needs help:
native in parts, but with mrkdwn label lines, a buried warning or a wasted
headline. Bad: the card-text fallback, or worse.

### Draft views (Review, by what the card stages)

| # | Variant | Rendered by | Blocks today | Grade |
|---|---|---|---|---|
| 1 | `shareout_post` | card-text fallback | bold "The draft" · one mrkdwn section of bullets with the caveat inside · decision | **Bad** |
| 2 | `notion_archive` | card-text fallback | "The draft" · `⚠️ About to archive…` · `Target`, `Page link` bullets. No alert on a destructive write | **Bad** |
| 3 | `github_issue_update` | card-text fallback | "The draft" · `Issue`, `Operations: comment · close as completed · add label bug`, `Comment` bullets · public-repo caveat in the same text | **Bad** |
| 4 | `github_workflow_run` | card-text fallback | "The draft" · `Repo`, `Workflow`, `Branch` bullets | Needs help |
| 5 | `notion_create`, surface `prd` / `intake` | reader | bold headline + Edit fields · Title input · `*Product Pillar:* …` mrkdwn lines · Summary input · `*Source:*` line · a `header` per section · caveat as a `context` at the very end | Needs help |
| 6 | `notion_create`, surface `decision` | reader | as 5, with Status and Roadmap Card lines | Needs help |
| 7 | `notion_create`, `marketplace` or another surface | reader | as 5; property labels come from raw keys (`labelOf`) | Needs help (fixed by 5's pattern) |
| 8 | `notion_update` | reader | headline · `*Page:*` bare URL · Current content / Issue / New content, the new value an input · `header` per rewritten block | **Good**: the house standard for before/after |
| 9 | `github_issue_create` | reader | headline · Title input · `*Repository:*` line · Body input · public-repo caveat as a `context` at the end | Needs help |
| 10 | `dm_relay`, one recipient | reader | "Direct message" · `*To:* <@U…>` · Message input | **Good** |
| 11 | Any batch (several operations) | reader per operation | "N operations, run in order" · `*1. Direct message*` sections · per-operation blocks. A batch with one unreadable tool falls back whole to the card text (Bad) | Needs help |
| 12 | `figma_tidy_up` (own answers) | stated card's lead text | "The draft" · one mrkdwn section with the file link inline · radio labelled "Decision" with the card's two answers, no descriptions | Needs help |
| 13 | `figma_dev_links` | lead text | "The draft" · one section: file link, link bullets, an "Approving adds…" paragraph | Needs help |
| 14 | `ds_precedence_intake` | lead text | "The draft" · one section: component · side · code · Figma links, bullets, an "Approving…" paragraph | Needs help |
| 15 | `sweep_share_post` | lead text | "The draft" · one section: sweep mark, a "Nothing has left…" paragraph, the note as a `>` quote | Needs help |
| 16 | Worker items on a reader's tool (sweep fixes, follow-ups, Figma comment and drift items) | the tool's reader + `choices` | as rows 5/8/9, with the card's answers in the radio but no option descriptions | As their tool's row |

### States around the draft

| # | View | Blocks today | Grade |
|---|---|---|---|
| 17 | Loading (`loadingView`, `editLoadingView`) | one section, "Loading the draft…" | Good |
| 18 | Read-only, for someone who can't decide | the same draft, with "Read-only. Only @Bill can decide this proposal." as a `context` **at the bottom** | Needs help |
| 19 | Report item (`closesAt`) | "Open until Mon 9:00 ET · @A or @B can decide." as a `context` under the note input | Needs help (minor) |
| 20 | After a decision (`noticeView`: approved, rejected, sent back, a gate note) | one mrkdwn section | Needs help |
| 21 | Closed (`closedView`: expired, superseded, gone) and "being revised" | one mrkdwn section | Needs help |
| 22 | Decided, opened from View (`decidedView`) | the card text again plus a `context`. For a turn's card this is the same bullet dump as row 1 | **Bad** |
| 23 | Edit fields (pushed) | `section` + `static_select` accessory per select, close "Done", `alert` on a refused pick | **Good** |
| 24 | Edit fields with nothing to edit | one line | Good |
| 25 | Refused edit on the draft | `alert` (error) at the top, the draft redrawn | **Good** |

### The feedback modal

| # | View | Blocks today | Grade |
|---|---|---|---|
| 26 | "What went wrong?" (`feedbackView`) | `radio_buttons` input (four reasons) · optional multiline input with a hint · Send / Skip | **Good**: the house standard |
| 27 | Thanks (`feedbackThanksView`) | one line | Good |

### The house standard

The modals Bill means by "some of our other pop-up modals" are the feedback
modal (26), Edit fields (23) and the `notion_update` / `dm_relay` drafts (8,
10). They share four traits, and the anatomy below generalises them:

- a **native input for every value a person acts on**: a radio with plain
  labels, a prefilled `plain_text_input` with a label and a hint;
- **one idea per block**, with no mrkdwn label lines (`*Label:* value`) doing
  the work of a form;
- **alerts for what needs attention**, never a `:warning:` line in prose;
- **labels a designer reads**, never an input key.

<!--PAIR feedback - Feedback modal (house standard, unchanged)-->
<!--PAIR notion_update - notion_update draft (house standard for before/after, unchanged)-->

## The shared anatomy

Every Review draft is built from the same five zones, in this order. A tool
supplies the content of each zone. The zones decide the blocks.

1. **What this does, and where.** A `header` with the action in a person's
   words ("Share for feedback", "Comment on and close #688"). Under it, one
   `rich_text` line naming the destination and the people it reaches, as
   native elements: a `channel` element for a channel, `user` elements for
   whoever it pings or DMs, and a `link` element for a repo, page or database.
   The destination appears here and nowhere else.
2. **What needs attention.** One `alert` per caveat (`warning` for the bundle
   audit, a public repo, missing open questions or a cut-off rerun; `info` for
   a private repo, a recoverable archive or a read-only view). At most two; a
   refused edit's `error` alert stays first, as it is today. Alerts are plain
   text under 200 characters, so each caveat gets a one-sentence alert
   wording.
3. **The thing itself.** A `card` for the object being shared or touched:
   title, subtitle, a body of 200 characters or fewer, and an Open button
   (`url`). A longer summary goes in a `section` under a card with no body.
4. **The content**, by kind:
   - short facts (fidelity, round, status, pillar, branch) as `section`
     `fields`, with Edit fields as that section's accessory when its selects
     can be edited;
   - questions, criteria and link lists as `rich_text` lists under a bold
     label;
   - text that goes out verbatim (a comment, a shared note) as a
     `rich_text_quote`;
   - every text a confirmer would fix as a prefilled input with a label and,
     where the field is not self-explanatory, a hint: every value editable
     today, plus the share-out's summary, questions and "not looking for";
     required inputs follow `review-fields.ts`'s `required`, optional ones say
     what clearing them does;
   - a round always reads "Round 1", never a bare "1" or "round 1";
   - before/after as `notion_update` already draws it (Current content ·
     Issue · New content input).
   Body headings become bold `rich_text` lines. `header` is kept for zone 1,
   so a PRD's five sections no longer read as five page titles.
5. **The decision.** `divider`, then the radio and the note, as today. Each
   option gets a `description` saying what it does on this card ("Posts it now
   and pings 1 reviewer", "Nothing posts"). A card with its own answers uses
   each answer's `decided` words as that answer's description, and the input is
   labelled "Your answer".

Around the draft:

- **Title.** Per tool, at most 24 characters: "Review share-out", "Review new
  issue", "Review issue update", "Review Roadmap card", "Review decision",
  "Review archive", "Review workflow run", "Review 2 DMs", "Figma tidy-up",
  "Review DS intake", "Review shared note", "Review Dev Mode links".
- **Read-only.** An `info` alert at the top naming who can decide. The same
  zones 1–4 follow, with no zone 5 and no Submit.
- **States.** Every one-line state (approved, rejected, sent back, expired,
  superseded, being revised) becomes an `alert` with the outcome and one
  `section` saying what happens next.
- **Hidden everywhere.** `place`, `channel` (the raw input), `surface`, raw
  user ids, page and file ids, `file_key`, `check`, `introduce`, block ids,
  `cards`, and any input key as a label. A value a person needs is shown once,
  in its zone: a channel as a `channel` element, a person as a `user` element,
  a page or repo as a `link` or an Open button.

## Variants: before → after

Share-out first, then the remaining Bad variants, then Needs help. Each pair
links to Block Kit Builder (open it while signed in to Slack; the JSON
includes `"type": "modal"`, so it opens on the modal surface) and carries the
exact payload. Sample ids (`C0SANDBOX1`, `U0BRYAN001`) are not real
workspace ids, so the Builder shows them as unknown channel and user pills.

### 1. Share-out (`shareout_post`): Bad → anatomy

What changes:

- `header` "Share for feedback". The channel appears once, as a `channel` pill,
  with the reviewer as a `user` pill and the deadline in the same line.
- The bundle caveat is a `warning` alert, third block, above the fold.
- The project is a `card`: title Session Sign Up, subtitle "Hi-fi prototype ·
  Round 1 · High fidelity", and an Open prototype button. The link no longer
  shows as a bare URL.
- **The words are inputs, prefilled** (Decision 1): What this is (required,
  as `summary` is in the tool's schema), Feedback question 1 (required when
  the draft has one), Feedback questions 2 and 3 and Not looking for
  (optional; the hint says clearing one drops it). Each has a label and a
  hint, as Edit fields and the feedback modal do. Today a reworded question
  costs a Needs changes round trip and a new card.
- **Where it posts and who it pings stay locked.** They are the rich-text line
  at the top, and a `context` under the inputs says Needs changes is how to
  change them, by the rule in `review-fields.ts` that changing where is a new
  proposal. The deadline, fidelity and round stay read-only too.
- `place`, `channel`, `Round: 1` as a label, `Fidelity: high` as a label, and
  raw reviewer ids are gone.
- Approve says what it does: "Posts it now and pings 1 reviewer."
- One 855-character mrkdwn section becomes native blocks: 13 in all, 5 of them
  inputs.

**Before: Share-out** · 5 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20proposal%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*The%20draft*%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22%3Awarning%3A%20About%20to%20*share%20this%20for%20feedback%20in%20%23uno-bot-sandbox*%3A%5Cn%E2%80%A2%20*Summary%3A*%20Hi-fi%20prototype%20of%20the%20new%20session%20sign-up%20flow%2C%20with%20the%20waitlist%20state.%5Cn%E2%80%A2%20*Place%3A*%20channel%5Cn%E2%80%A2%20*Deadline%3A*%20EOD%20Friday%5Cn%E2%80%A2%20*Round%3A*%201%5Cn%E2%80%A2%20*Project%3A*%20Session%20Sign%20Up%5Cn%E2%80%A2%20*Artifact%3A*%20hi-fi%20prototype%5Cn%E2%80%A2%20*Channel%3A*%20%23uno-bot-sandbox%5Cn%E2%80%A2%20*Feedback%20wanted%3A*%5Cn%20%20%20%20%E2%97%A6%20Is%20the%20waitlist%20state%20clear%20before%20a%20tutor%20commits%3F%5Cn%20%20%20%20%E2%97%A6%20Does%20the%20confirmation%20step%20need%20the%20calendar%20add%3F%5Cn%20%20%20%20%E2%97%A6%20Anything%20in%20the%20copy%20that%20reads%20as%20a%20promise%20we%20can't%20keep%3F%5Cn%E2%80%A2%20*Fidelity%3A*%20high%5Cn%E2%80%A2%20*Not%20looking%20for%3A*%20Visual%20polish%3B%20colours%20are%20placeholders.%5Cn%E2%80%A2%20*Link%3A*%20https%3A%2F%2Fplus-uno.netlify.app%2Fprototypes%2Fsession-sign-up%5Cn%E2%80%A2%20*Reviewers%3A*%5Cn%20%20%20%20%E2%97%A6%20U0BRYAN001%5Cn%3Awarning%3A%20*Bundle%20incomplete%20%E2%80%94%20missing%3A%20Loom%20walkthrough%20%C2%B7%20Decisions%20DB%20link.*%5CnApproving%20posts%20it%20*without*%20them%20%E2%80%94%20or%20drop%20the%20links%20in%20this%20thread%20first%20and%20I'll%20fold%20them%20in.%22%7D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22confirm%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approve%22%7D%7D%2C%7B%22value%22%3A%22revise%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%22%7D%7D%2C%7B%22value%22%3A%22cancel%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Reject%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%3A%20what%20should%20change.%20I%20revise%20the%20draft%20from%20it.%20Reject%3A%20an%20optional%20reason.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review proposal"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*The draft*"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": ":warning: About to *share this for feedback in #uno-bot-sandbox*:\n• *Summary:* Hi-fi prototype of the new session sign-up flow, with the waitlist state.\n• *Place:* channel\n• *Deadline:* EOD Friday\n• *Round:* 1\n• *Project:* Session Sign Up\n• *Artifact:* hi-fi prototype\n• *Channel:* #uno-bot-sandbox\n• *Feedback wanted:*\n    ◦ Is the waitlist state clear before a tutor commits?\n    ◦ Does the confirmation step need the calendar add?\n    ◦ Anything in the copy that reads as a promise we can't keep?\n• *Fidelity:* high\n• *Not looking for:* Visual polish; colours are placeholders.\n• *Link:* https://plus-uno.netlify.app/prototypes/session-sign-up\n• *Reviewers:*\n    ◦ U0BRYAN001\n:warning: *Bundle incomplete — missing: Loom walkthrough · Decisions DB link.*\nApproving posts it *without* them — or drop the links in this thread first and I'll fold them in."
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "confirm",
            "text": {
              "type": "plain_text",
              "text": "Approve"
            }
          },
          {
            "value": "revise",
            "text": {
              "type": "plain_text",
              "text": "Needs changes"
            }
          },
          {
            "value": "cancel",
            "text": {
              "type": "plain_text",
              "text": "Reject"
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Needs changes: what should change. I revise the draft from it. Reject: an optional reason."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

**After: Share-out** · 13 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20share-out%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22header%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Share%20for%20feedback%22%7D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Posts%20in%20%22%7D%2C%7B%22type%22%3A%22channel%22%2C%22channel_id%22%3A%22C0SANDBOX1%22%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22%20and%20pings%20%22%7D%2C%7B%22type%22%3A%22user%22%2C%22user_id%22%3A%22U0BRYAN001%22%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22.%20Comments%20in%20its%20thread%20by%20%22%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22EOD%20Friday%22%2C%22style%22%3A%7B%22bold%22%3Atrue%7D%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22.%22%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22alert%22%2C%22level%22%3A%22warning%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Bundle%20incomplete%3A%20no%20Loom%20walkthrough%20or%20Decisions%20DB%20link.%20Approving%20posts%20it%20without%20them%2C%20or%20drop%20the%20links%20in%20the%20thread%20first.%22%7D%7D%2C%7B%22type%22%3A%22card%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Session%20Sign%20Up%22%7D%2C%22subtitle%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Hi-fi%20prototype%20%C2%B7%20Round%201%20%C2%B7%20High%20fidelity%22%7D%2C%22actions%22%3A%5B%7B%22type%22%3A%22button%22%2C%22action_id%22%3A%22uno_review_open%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Open%20prototype%22%7D%2C%22url%22%3A%22https%3A%2F%2Fplus-uno.netlify.app%2Fprototypes%2Fsession-sign-up%22%7D%5D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_field%3A0.summary%22%2C%22optional%22%3Afalse%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22What%20this%20is%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22One%20or%20two%20sentences.%20The%20questions%20go%20below.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22value%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%2C%22initial_value%22%3A%22Hi-fi%20prototype%20of%20the%20new%20session%20sign-up%20flow%2C%20with%20the%20waitlist%20state.%22%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_field%3A0.feedback_wanted.0%22%2C%22optional%22%3Afalse%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Feedback%20question%201%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Specific%20to%20this%20stage%2C%20so%20nobody%20has%20to%20answer%20%5C%22thoughts%3F%5C%22.%20Up%20to%20three.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22value%22%2C%22multiline%22%3Afalse%2C%22max_length%22%3A3000%2C%22initial_value%22%3A%22Is%20the%20waitlist%20state%20clear%20before%20a%20tutor%20commits%3F%22%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_field%3A0.feedback_wanted.1%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Feedback%20question%202%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Clear%20it%20to%20drop%20the%20question.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22value%22%2C%22multiline%22%3Afalse%2C%22max_length%22%3A3000%2C%22initial_value%22%3A%22Does%20the%20confirmation%20step%20need%20the%20calendar%20add%3F%22%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_field%3A0.feedback_wanted.2%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Feedback%20question%203%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Clear%20it%20to%20drop%20the%20question.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22value%22%2C%22multiline%22%3Afalse%2C%22max_length%22%3A3000%2C%22initial_value%22%3A%22Anything%20in%20the%20copy%20that%20reads%20as%20a%20promise%20we%20can't%20keep%3F%22%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_field%3A0.not_looking_for%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Not%20looking%20for%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22What%20reviewers%20should%20leave%20alone%20this%20round.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22value%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%2C%22initial_value%22%3A%22Visual%20polish%3B%20colours%20are%20placeholders.%22%7D%7D%2C%7B%22type%22%3A%22context%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22Where%20it%20posts%20and%20who%20it%20pings%20are%20fixed%20on%20this%20card.%20To%20change%20them%2C%20choose%20Needs%20changes.%22%7D%5D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22confirm%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approve%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Posts%20it%20now%20and%20pings%201%20reviewer.%22%7D%7D%2C%7B%22value%22%3A%22revise%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22I%20redraft%20it%20from%20your%20note%20and%20post%20a%20new%20card.%22%7D%7D%2C%7B%22value%22%3A%22cancel%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Reject%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Nothing%20posts.%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%3A%20what%20should%20change.%20Reject%3A%20an%20optional%20reason.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review share-out"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "Share for feedback"
      }
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Posts in "
            },
            {
              "type": "channel",
              "channel_id": "C0SANDBOX1"
            },
            {
              "type": "text",
              "text": " and pings "
            },
            {
              "type": "user",
              "user_id": "U0BRYAN001"
            },
            {
              "type": "text",
              "text": ". Comments in its thread by "
            },
            {
              "type": "text",
              "text": "EOD Friday",
              "style": {
                "bold": true
              }
            },
            {
              "type": "text",
              "text": "."
            }
          ]
        }
      ]
    },
    {
      "type": "alert",
      "level": "warning",
      "text": {
        "type": "plain_text",
        "text": "Bundle incomplete: no Loom walkthrough or Decisions DB link. Approving posts it without them, or drop the links in the thread first."
      }
    },
    {
      "type": "card",
      "title": {
        "type": "plain_text",
        "text": "Session Sign Up"
      },
      "subtitle": {
        "type": "plain_text",
        "text": "Hi-fi prototype · Round 1 · High fidelity"
      },
      "actions": [
        {
          "type": "button",
          "action_id": "uno_review_open",
          "text": {
            "type": "plain_text",
            "text": "Open prototype"
          },
          "url": "https://plus-uno.netlify.app/prototypes/session-sign-up"
        }
      ]
    },
    {
      "type": "input",
      "block_id": "uno_field:0.summary",
      "optional": false,
      "label": {
        "type": "plain_text",
        "text": "What this is"
      },
      "hint": {
        "type": "plain_text",
        "text": "One or two sentences. The questions go below."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "value",
        "multiline": true,
        "max_length": 3000,
        "initial_value": "Hi-fi prototype of the new session sign-up flow, with the waitlist state."
      }
    },
    {
      "type": "input",
      "block_id": "uno_field:0.feedback_wanted.0",
      "optional": false,
      "label": {
        "type": "plain_text",
        "text": "Feedback question 1"
      },
      "hint": {
        "type": "plain_text",
        "text": "Specific to this stage, so nobody has to answer \"thoughts?\". Up to three."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "value",
        "multiline": false,
        "max_length": 3000,
        "initial_value": "Is the waitlist state clear before a tutor commits?"
      }
    },
    {
      "type": "input",
      "block_id": "uno_field:0.feedback_wanted.1",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Feedback question 2"
      },
      "hint": {
        "type": "plain_text",
        "text": "Clear it to drop the question."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "value",
        "multiline": false,
        "max_length": 3000,
        "initial_value": "Does the confirmation step need the calendar add?"
      }
    },
    {
      "type": "input",
      "block_id": "uno_field:0.feedback_wanted.2",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Feedback question 3"
      },
      "hint": {
        "type": "plain_text",
        "text": "Clear it to drop the question."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "value",
        "multiline": false,
        "max_length": 3000,
        "initial_value": "Anything in the copy that reads as a promise we can't keep?"
      }
    },
    {
      "type": "input",
      "block_id": "uno_field:0.not_looking_for",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Not looking for"
      },
      "hint": {
        "type": "plain_text",
        "text": "What reviewers should leave alone this round."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "value",
        "multiline": true,
        "max_length": 3000,
        "initial_value": "Visual polish; colours are placeholders."
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "Where it posts and who it pings are fixed on this card. To change them, choose Needs changes."
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "confirm",
            "text": {
              "type": "plain_text",
              "text": "Approve"
            },
            "description": {
              "type": "plain_text",
              "text": "Posts it now and pings 1 reviewer."
            }
          },
          {
            "value": "revise",
            "text": {
              "type": "plain_text",
              "text": "Needs changes"
            },
            "description": {
              "type": "plain_text",
              "text": "I redraft it from your note and post a new card."
            }
          },
          {
            "value": "cancel",
            "text": {
              "type": "plain_text",
              "text": "Reject"
            },
            "description": {
              "type": "plain_text",
              "text": "Nothing posts."
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Needs changes: what should change. Reject: an optional reason."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

### 2. Share-out, read-only and decided (rows 18 and 22)

Someone who can't decide sees the same content without inputs: the summary as
the card's body, the questions as an ordered `rich_text` list and "not looking
for" as its own labelled block. Who can decide is an `info` alert at the top
instead of a `context` line at the bottom.

A decided card opened from View shows a `success` alert with who approved and
where it posted, over the same content (Decision 5). This needs the decided
batch kept on the thread's record; today `decidedView` gets only the card's
text, because the record is gone.

**Before: Read-only (not a confirmer)** · 3 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20proposal%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*The%20draft*%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22%3Awarning%3A%20About%20to%20*share%20this%20for%20feedback%20in%20%23uno-bot-sandbox*%3A%5Cn%E2%80%A2%20*Summary%3A*%20Hi-fi%20prototype%20of%20the%20new%20session%20sign-up%20flow%2C%20with%20the%20waitlist%20state.%5Cn%E2%80%A2%20*Place%3A*%20channel%5Cn%E2%80%A2%20*Deadline%3A*%20EOD%20Friday%5Cn%E2%80%A2%20*Round%3A*%201%5Cn%E2%80%A2%20*Project%3A*%20Session%20Sign%20Up%5Cn%E2%80%A2%20*Artifact%3A*%20hi-fi%20prototype%5Cn%E2%80%A2%20*Channel%3A*%20%23uno-bot-sandbox%5Cn%E2%80%A2%20*Feedback%20wanted%3A*%5Cn%20%20%20%20%E2%97%A6%20Is%20the%20waitlist%20state%20clear%20before%20a%20tutor%20commits%3F%5Cn%20%20%20%20%E2%97%A6%20Does%20the%20confirmation%20step%20need%20the%20calendar%20add%3F%5Cn%20%20%20%20%E2%97%A6%20Anything%20in%20the%20copy%20that%20reads%20as%20a%20promise%20we%20can't%20keep%3F%5Cn%E2%80%A2%20*Fidelity%3A*%20high%5Cn%E2%80%A2%20*Not%20looking%20for%3A*%20Visual%20polish%3B%20colours%20are%20placeholders.%5Cn%E2%80%A2%20*Link%3A*%20https%3A%2F%2Fplus-uno.netlify.app%2Fprototypes%2Fsession-sign-up%5Cn%E2%80%A2%20*Reviewers%3A*%5Cn%20%20%20%20%E2%97%A6%20U0BRYAN001%5Cn%3Awarning%3A%20*Bundle%20incomplete%20%E2%80%94%20missing%3A%20Loom%20walkthrough%20%C2%B7%20Decisions%20DB%20link.*%5CnApproving%20posts%20it%20*without*%20them%20%E2%80%94%20or%20drop%20the%20links%20in%20this%20thread%20first%20and%20I'll%20fold%20them%20in.%22%7D%7D%2C%7B%22type%22%3A%22context%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22Read-only.%20Only%20%3C%40U0BILL0001%3E%20can%20decide%20this%20proposal.%22%7D%5D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review proposal"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*The draft*"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": ":warning: About to *share this for feedback in #uno-bot-sandbox*:\n• *Summary:* Hi-fi prototype of the new session sign-up flow, with the waitlist state.\n• *Place:* channel\n• *Deadline:* EOD Friday\n• *Round:* 1\n• *Project:* Session Sign Up\n• *Artifact:* hi-fi prototype\n• *Channel:* #uno-bot-sandbox\n• *Feedback wanted:*\n    ◦ Is the waitlist state clear before a tutor commits?\n    ◦ Does the confirmation step need the calendar add?\n    ◦ Anything in the copy that reads as a promise we can't keep?\n• *Fidelity:* high\n• *Not looking for:* Visual polish; colours are placeholders.\n• *Link:* https://plus-uno.netlify.app/prototypes/session-sign-up\n• *Reviewers:*\n    ◦ U0BRYAN001\n:warning: *Bundle incomplete — missing: Loom walkthrough · Decisions DB link.*\nApproving posts it *without* them — or drop the links in this thread first and I'll fold them in."
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "Read-only. Only <@U0BILL0001> can decide this proposal."
        }
      ]
    }
  ]
}
```

</details>

**After: Read-only (not a confirmer)** · 7 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20share-out%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22alert%22%2C%22level%22%3A%22info%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22Read-only.%20Only%20%3C%40U0BILL0001%3E%20can%20decide%20this%20proposal.%22%7D%7D%2C%7B%22type%22%3A%22header%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Share%20for%20feedback%22%7D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Posts%20in%20%22%7D%2C%7B%22type%22%3A%22channel%22%2C%22channel_id%22%3A%22C0SANDBOX1%22%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22%20and%20pings%20%22%7D%2C%7B%22type%22%3A%22user%22%2C%22user_id%22%3A%22U0BRYAN001%22%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22.%20Comments%20in%20its%20thread%20by%20%22%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22EOD%20Friday%22%2C%22style%22%3A%7B%22bold%22%3Atrue%7D%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22.%22%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22alert%22%2C%22level%22%3A%22warning%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Bundle%20incomplete%3A%20no%20Loom%20walkthrough%20or%20Decisions%20DB%20link.%20Approving%20posts%20it%20without%20them%2C%20or%20drop%20the%20links%20in%20the%20thread%20first.%22%7D%7D%2C%7B%22type%22%3A%22card%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Session%20Sign%20Up%22%7D%2C%22subtitle%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Hi-fi%20prototype%20%C2%B7%20Round%201%20%C2%B7%20High%20fidelity%22%7D%2C%22body%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22Hi-fi%20prototype%20of%20the%20new%20session%20sign-up%20flow%2C%20with%20the%20waitlist%20state.%22%7D%2C%22actions%22%3A%5B%7B%22type%22%3A%22button%22%2C%22action_id%22%3A%22uno_review_open%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Open%20prototype%22%7D%2C%22url%22%3A%22https%3A%2F%2Fplus-uno.netlify.app%2Fprototypes%2Fsession-sign-up%22%7D%5D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Feedback%20wanted%20on%22%2C%22style%22%3A%7B%22bold%22%3Atrue%7D%7D%5D%7D%2C%7B%22type%22%3A%22rich_text_list%22%2C%22style%22%3A%22ordered%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Is%20the%20waitlist%20state%20clear%20before%20a%20tutor%20commits%3F%22%7D%5D%7D%2C%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Does%20the%20confirmation%20step%20need%20the%20calendar%20add%3F%22%7D%5D%7D%2C%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Anything%20in%20the%20copy%20that%20reads%20as%20a%20promise%20we%20can't%20keep%3F%22%7D%5D%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Not%20looking%20for%22%2C%22style%22%3A%7B%22bold%22%3Atrue%7D%7D%5D%7D%2C%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Visual%20polish%3B%20colours%20are%20placeholders.%22%7D%5D%7D%5D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review share-out"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "alert",
      "level": "info",
      "text": {
        "type": "mrkdwn",
        "text": "Read-only. Only <@U0BILL0001> can decide this proposal."
      }
    },
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "Share for feedback"
      }
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Posts in "
            },
            {
              "type": "channel",
              "channel_id": "C0SANDBOX1"
            },
            {
              "type": "text",
              "text": " and pings "
            },
            {
              "type": "user",
              "user_id": "U0BRYAN001"
            },
            {
              "type": "text",
              "text": ". Comments in its thread by "
            },
            {
              "type": "text",
              "text": "EOD Friday",
              "style": {
                "bold": true
              }
            },
            {
              "type": "text",
              "text": "."
            }
          ]
        }
      ]
    },
    {
      "type": "alert",
      "level": "warning",
      "text": {
        "type": "plain_text",
        "text": "Bundle incomplete: no Loom walkthrough or Decisions DB link. Approving posts it without them, or drop the links in the thread first."
      }
    },
    {
      "type": "card",
      "title": {
        "type": "plain_text",
        "text": "Session Sign Up"
      },
      "subtitle": {
        "type": "plain_text",
        "text": "Hi-fi prototype · Round 1 · High fidelity"
      },
      "body": {
        "type": "mrkdwn",
        "text": "Hi-fi prototype of the new session sign-up flow, with the waitlist state."
      },
      "actions": [
        {
          "type": "button",
          "action_id": "uno_review_open",
          "text": {
            "type": "plain_text",
            "text": "Open prototype"
          },
          "url": "https://plus-uno.netlify.app/prototypes/session-sign-up"
        }
      ]
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Feedback wanted on",
              "style": {
                "bold": true
              }
            }
          ]
        },
        {
          "type": "rich_text_list",
          "style": "ordered",
          "elements": [
            {
              "type": "rich_text_section",
              "elements": [
                {
                  "type": "text",
                  "text": "Is the waitlist state clear before a tutor commits?"
                }
              ]
            },
            {
              "type": "rich_text_section",
              "elements": [
                {
                  "type": "text",
                  "text": "Does the confirmation step need the calendar add?"
                }
              ]
            },
            {
              "type": "rich_text_section",
              "elements": [
                {
                  "type": "text",
                  "text": "Anything in the copy that reads as a promise we can't keep?"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Not looking for",
              "style": {
                "bold": true
              }
            }
          ]
        },
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Visual polish; colours are placeholders."
            }
          ]
        }
      ]
    }
  ]
}
```

</details>
**Before: Decided, opened from View** · 2 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20proposal%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22%3Awarning%3A%20About%20to%20*share%20this%20for%20feedback%20in%20%23uno-bot-sandbox*%3A%5Cn%E2%80%A2%20*Summary%3A*%20Hi-fi%20prototype%20of%20the%20new%20session%20sign-up%20flow%2C%20with%20the%20waitlist%20state.%5Cn%E2%80%A2%20*Place%3A*%20channel%5Cn%E2%80%A2%20*Deadline%3A*%20EOD%20Friday%5Cn%E2%80%A2%20*Round%3A*%201%5Cn%E2%80%A2%20*Project%3A*%20Session%20Sign%20Up%5Cn%E2%80%A2%20*Artifact%3A*%20hi-fi%20prototype%5Cn%E2%80%A2%20*Channel%3A*%20%23uno-bot-sandbox%5Cn%E2%80%A2%20*Feedback%20wanted%3A*%5Cn%20%20%20%20%E2%97%A6%20Is%20the%20waitlist%20state%20clear%20before%20a%20tutor%20commits%3F%5Cn%20%20%20%20%E2%97%A6%20Does%20the%20confirmation%20step%20need%20the%20calendar%20add%3F%5Cn%20%20%20%20%E2%97%A6%20Anything%20in%20the%20copy%20that%20reads%20as%20a%20promise%20we%20can't%20keep%3F%5Cn%E2%80%A2%20*Fidelity%3A*%20high%5Cn%E2%80%A2%20*Not%20looking%20for%3A*%20Visual%20polish%3B%20colours%20are%20placeholders.%5Cn%E2%80%A2%20*Link%3A*%20https%3A%2F%2Fplus-uno.netlify.app%2Fprototypes%2Fsession-sign-up%5Cn%E2%80%A2%20*Reviewers%3A*%5Cn%20%20%20%20%E2%97%A6%20U0BRYAN001%5Cn%5Cn%3Awhite_check_mark%3A%20Approved%20by%20%3C%40U0BILL0001%3E%22%7D%7D%2C%7B%22type%22%3A%22context%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22Read-only.%20This%20proposal%20has%20already%20been%20decided.%22%7D%5D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review proposal"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": ":warning: About to *share this for feedback in #uno-bot-sandbox*:\n• *Summary:* Hi-fi prototype of the new session sign-up flow, with the waitlist state.\n• *Place:* channel\n• *Deadline:* EOD Friday\n• *Round:* 1\n• *Project:* Session Sign Up\n• *Artifact:* hi-fi prototype\n• *Channel:* #uno-bot-sandbox\n• *Feedback wanted:*\n    ◦ Is the waitlist state clear before a tutor commits?\n    ◦ Does the confirmation step need the calendar add?\n    ◦ Anything in the copy that reads as a promise we can't keep?\n• *Fidelity:* high\n• *Not looking for:* Visual polish; colours are placeholders.\n• *Link:* https://plus-uno.netlify.app/prototypes/session-sign-up\n• *Reviewers:*\n    ◦ U0BRYAN001\n\n:white_check_mark: Approved by <@U0BILL0001>"
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "Read-only. This proposal has already been decided."
        }
      ]
    }
  ]
}
```

</details>

**After: Decided, opened from View** · 5 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20share-out%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22alert%22%2C%22level%22%3A%22success%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22Approved%20by%20%3C%40U0BILL0001%3E.%20Posted%20in%20%3C%23C0SANDBOX1%3E.%22%7D%7D%2C%7B%22type%22%3A%22header%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Share%20for%20feedback%22%7D%7D%2C%7B%22type%22%3A%22card%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Session%20Sign%20Up%22%7D%2C%22subtitle%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Hi-fi%20prototype%20%C2%B7%20Round%201%20%C2%B7%20High%20fidelity%22%7D%2C%22body%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22Hi-fi%20prototype%20of%20the%20new%20session%20sign-up%20flow%2C%20with%20the%20waitlist%20state.%22%7D%2C%22actions%22%3A%5B%7B%22type%22%3A%22button%22%2C%22action_id%22%3A%22uno_review_open%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Open%20prototype%22%7D%2C%22url%22%3A%22https%3A%2F%2Fplus-uno.netlify.app%2Fprototypes%2Fsession-sign-up%22%7D%5D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Feedback%20wanted%20on%22%2C%22style%22%3A%7B%22bold%22%3Atrue%7D%7D%5D%7D%2C%7B%22type%22%3A%22rich_text_list%22%2C%22style%22%3A%22ordered%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Is%20the%20waitlist%20state%20clear%20before%20a%20tutor%20commits%3F%22%7D%5D%7D%2C%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Does%20the%20confirmation%20step%20need%20the%20calendar%20add%3F%22%7D%5D%7D%2C%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Anything%20in%20the%20copy%20that%20reads%20as%20a%20promise%20we%20can't%20keep%3F%22%7D%5D%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Not%20looking%20for%22%2C%22style%22%3A%7B%22bold%22%3Atrue%7D%7D%5D%7D%2C%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Visual%20polish%3B%20colours%20are%20placeholders.%22%7D%5D%7D%5D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review share-out"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "alert",
      "level": "success",
      "text": {
        "type": "mrkdwn",
        "text": "Approved by <@U0BILL0001>. Posted in <#C0SANDBOX1>."
      }
    },
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "Share for feedback"
      }
    },
    {
      "type": "card",
      "title": {
        "type": "plain_text",
        "text": "Session Sign Up"
      },
      "subtitle": {
        "type": "plain_text",
        "text": "Hi-fi prototype · Round 1 · High fidelity"
      },
      "body": {
        "type": "mrkdwn",
        "text": "Hi-fi prototype of the new session sign-up flow, with the waitlist state."
      },
      "actions": [
        {
          "type": "button",
          "action_id": "uno_review_open",
          "text": {
            "type": "plain_text",
            "text": "Open prototype"
          },
          "url": "https://plus-uno.netlify.app/prototypes/session-sign-up"
        }
      ]
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Feedback wanted on",
              "style": {
                "bold": true
              }
            }
          ]
        },
        {
          "type": "rich_text_list",
          "style": "ordered",
          "elements": [
            {
              "type": "rich_text_section",
              "elements": [
                {
                  "type": "text",
                  "text": "Is the waitlist state clear before a tutor commits?"
                }
              ]
            },
            {
              "type": "rich_text_section",
              "elements": [
                {
                  "type": "text",
                  "text": "Does the confirmation step need the calendar add?"
                }
              ]
            },
            {
              "type": "rich_text_section",
              "elements": [
                {
                  "type": "text",
                  "text": "Anything in the copy that reads as a promise we can't keep?"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Not looking for",
              "style": {
                "bold": true
              }
            }
          ]
        },
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Visual polish; colours are placeholders."
            }
          ]
        }
      ]
    }
  ]
}
```

</details>

### 3. Issue follow-up (`github_issue_update`): Bad → anatomy

The heading says the actions in order ("Comment on and close #688"). The issue
is a `link` element, and the public-repo caveat is a `warning` alert. State and
labels are `fields`. The comment goes out verbatim, so it is a quote. The
`Operations: comment · close as completed · add label bug` line is gone: the
heading and fields say it.

**Before: github_issue_update** · 5 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20proposal%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*The%20draft*%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22%3Awarning%3A%20About%20to%20*update%20a%20GitHub%20issue*%3A%5Cn%E2%80%A2%20*Issue%3A*%20BilLogic%2Fplus-uno%23688%5Cn%E2%80%A2%20*Operations%3A*%20comment%20%C2%B7%20close%20as%20completed%20%C2%B7%20add%20label%20bug%5Cn%E2%80%A2%20*Comment%3A*%20Fixed%20in%20%231294.%5Cn%3Awarning%3A%20*BilLogic%2Fplus-uno*%20is%20public%20%E2%80%94%20anyone%20can%20read%20the%20comment%20once%20it's%20posted.%20Check%20it%20for%20anything%20from%20a%20DM%20or%20private%20channel%20before%20you%20approve%3B%20I%20add%20a%20footer%20naming%20you%20and%20linking%20this%20thread.%22%7D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22confirm%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approve%22%7D%7D%2C%7B%22value%22%3A%22revise%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%22%7D%7D%2C%7B%22value%22%3A%22cancel%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Reject%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%3A%20what%20should%20change.%20I%20revise%20the%20draft%20from%20it.%20Reject%3A%20an%20optional%20reason.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review proposal"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*The draft*"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": ":warning: About to *update a GitHub issue*:\n• *Issue:* BilLogic/plus-uno#688\n• *Operations:* comment · close as completed · add label bug\n• *Comment:* Fixed in #1294.\n:warning: *BilLogic/plus-uno* is public — anyone can read the comment once it's posted. Check it for anything from a DM or private channel before you approve; I add a footer naming you and linking this thread."
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "confirm",
            "text": {
              "type": "plain_text",
              "text": "Approve"
            }
          },
          {
            "value": "revise",
            "text": {
              "type": "plain_text",
              "text": "Needs changes"
            }
          },
          {
            "value": "cancel",
            "text": {
              "type": "plain_text",
              "text": "Reject"
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Needs changes: what should change. I revise the draft from it. Reject: an optional reason."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

**After: github_issue_update** · 8 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20issue%20update%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22header%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Comment%20on%20and%20close%20%23688%22%7D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22On%20%22%7D%2C%7B%22type%22%3A%22link%22%2C%22url%22%3A%22https%3A%2F%2Fgithub.com%2FBilLogic%2Fplus-uno%2Fissues%2F688%22%2C%22text%22%3A%22BilLogic%2Fplus-uno%23688%22%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22%2C%20a%20public%20repo.%22%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22alert%22%2C%22level%22%3A%22warning%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Anyone%20can%20read%20the%20comment%20once%20it's%20posted.%20Check%20it%20for%20anything%20from%20a%20DM%20or%20private%20channel.%20I%20add%20a%20footer%20naming%20you%20and%20linking%20this%20thread.%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22fields%22%3A%5B%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*State*%5CnClose%20as%20completed%22%7D%2C%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*Labels*%5CnAdd%20%60bug%60%22%7D%5D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Comment%22%2C%22style%22%3A%7B%22bold%22%3Atrue%7D%7D%5D%7D%2C%7B%22type%22%3A%22rich_text_quote%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Fixed%20in%20%231294.%22%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22confirm%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approve%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Comments%2C%20closes%20and%20labels%20%23688%20now.%22%7D%7D%2C%7B%22value%22%3A%22revise%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22I%20redraft%20it%20from%20your%20note%20and%20post%20a%20new%20card.%22%7D%7D%2C%7B%22value%22%3A%22cancel%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Reject%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Nothing%20happens.%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%3A%20what%20should%20change.%20Reject%3A%20an%20optional%20reason.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review issue update"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "Comment on and close #688"
      }
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "On "
            },
            {
              "type": "link",
              "url": "https://github.com/BilLogic/plus-uno/issues/688",
              "text": "BilLogic/plus-uno#688"
            },
            {
              "type": "text",
              "text": ", a public repo."
            }
          ]
        }
      ]
    },
    {
      "type": "alert",
      "level": "warning",
      "text": {
        "type": "plain_text",
        "text": "Anyone can read the comment once it's posted. Check it for anything from a DM or private channel. I add a footer naming you and linking this thread."
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*State*\nClose as completed"
        },
        {
          "type": "mrkdwn",
          "text": "*Labels*\nAdd `bug`"
        }
      ]
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Comment",
              "style": {
                "bold": true
              }
            }
          ]
        },
        {
          "type": "rich_text_quote",
          "elements": [
            {
              "type": "text",
              "text": "Fixed in #1294."
            }
          ]
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "confirm",
            "text": {
              "type": "plain_text",
              "text": "Approve"
            },
            "description": {
              "type": "plain_text",
              "text": "Comments, closes and labels #688 now."
            }
          },
          {
            "value": "revise",
            "text": {
              "type": "plain_text",
              "text": "Needs changes"
            },
            "description": {
              "type": "plain_text",
              "text": "I redraft it from your note and post a new card."
            }
          },
          {
            "value": "cancel",
            "text": {
              "type": "plain_text",
              "text": "Reject"
            },
            "description": {
              "type": "plain_text",
              "text": "Nothing happens."
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Needs changes: what should change. Reject: an optional reason."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

### 4. Archive (`notion_archive`): Bad → anatomy

A destructive write with no alert today. The after names the card in a `card`
with Open in Notion, says where it goes, and adds an `info` alert that it can
be restored. The `Page link` bare URL and the `Target` label are gone.

**Before: notion_archive** · 5 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20proposal%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*The%20draft*%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22%3Awarning%3A%20About%20to%20*archive%20this%20Notion%20card*%3A%5Cn%E2%80%A2%20*Target%3A*%20Old%20waitlist%20idea%20%E2%80%94%20in%20Roadmap%5Cn%E2%80%A2%20*Page%20link%3A*%20https%3A%2F%2Fwww.notion.so%2FOld-waitlist-idea-2fc01241bbbb%22%7D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22confirm%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approve%22%7D%7D%2C%7B%22value%22%3A%22revise%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%22%7D%7D%2C%7B%22value%22%3A%22cancel%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Reject%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%3A%20what%20should%20change.%20I%20revise%20the%20draft%20from%20it.%20Reject%3A%20an%20optional%20reason.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review proposal"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*The draft*"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": ":warning: About to *archive this Notion card*:\n• *Target:* Old waitlist idea — in Roadmap\n• *Page link:* https://www.notion.so/Old-waitlist-idea-2fc01241bbbb"
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "confirm",
            "text": {
              "type": "plain_text",
              "text": "Approve"
            }
          },
          {
            "value": "revise",
            "text": {
              "type": "plain_text",
              "text": "Needs changes"
            }
          },
          {
            "value": "cancel",
            "text": {
              "type": "plain_text",
              "text": "Reject"
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Needs changes: what should change. I revise the draft from it. Reject: an optional reason."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

**After: notion_archive** · 7 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20archive%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22header%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Archive%20a%20Notion%20card%22%7D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Moves%20this%20card%20from%20the%20Roadmap%20to%20Notion's%20trash.%22%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22alert%22%2C%22level%22%3A%22info%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Archived%20pages%20can%20be%20restored%20from%20Notion's%20trash.%22%7D%7D%2C%7B%22type%22%3A%22card%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Old%20waitlist%20idea%22%7D%2C%22subtitle%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Roadmap%22%7D%2C%22actions%22%3A%5B%7B%22type%22%3A%22button%22%2C%22action_id%22%3A%22uno_review_open%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Open%20in%20Notion%22%7D%2C%22url%22%3A%22https%3A%2F%2Fwww.notion.so%2FOld-waitlist-idea-2fc01241bbbb%22%7D%5D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22confirm%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approve%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Archives%20it%20now.%22%7D%7D%2C%7B%22value%22%3A%22revise%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22I%20redraft%20it%20from%20your%20note%20and%20post%20a%20new%20card.%22%7D%7D%2C%7B%22value%22%3A%22cancel%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Reject%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Nothing%20is%20archived.%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%3A%20what%20should%20change.%20Reject%3A%20an%20optional%20reason.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review archive"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "Archive a Notion card"
      }
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Moves this card from the Roadmap to Notion's trash."
            }
          ]
        }
      ]
    },
    {
      "type": "alert",
      "level": "info",
      "text": {
        "type": "plain_text",
        "text": "Archived pages can be restored from Notion's trash."
      }
    },
    {
      "type": "card",
      "title": {
        "type": "plain_text",
        "text": "Old waitlist idea"
      },
      "subtitle": {
        "type": "plain_text",
        "text": "Roadmap"
      },
      "actions": [
        {
          "type": "button",
          "action_id": "uno_review_open",
          "text": {
            "type": "plain_text",
            "text": "Open in Notion"
          },
          "url": "https://www.notion.so/Old-waitlist-idea-2fc01241bbbb"
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "confirm",
            "text": {
              "type": "plain_text",
              "text": "Approve"
            },
            "description": {
              "type": "plain_text",
              "text": "Archives it now."
            }
          },
          {
            "value": "revise",
            "text": {
              "type": "plain_text",
              "text": "Needs changes"
            },
            "description": {
              "type": "plain_text",
              "text": "I redraft it from your note and post a new card."
            }
          },
          {
            "value": "cancel",
            "text": {
              "type": "plain_text",
              "text": "Reject"
            },
            "description": {
              "type": "plain_text",
              "text": "Nothing is archived."
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Needs changes: what should change. Reject: an optional reason."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

### 5. Workflow run (`github_workflow_run`): Needs help → anatomy

Short already. The after drops "The draft" and the ⚠️ preamble, links the
repo, and puts workflow, branch and "Inputs: None" in `fields`, so the person
sees the run takes nothing they could get wrong.

**Before: github_workflow_run** · 5 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20proposal%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*The%20draft*%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22%3Awarning%3A%20About%20to%20*run%20a%20GitHub%20workflow*%3A%5Cn%E2%80%A2%20*Repo%3A*%20BilLogic%2Fplus-marketing-website%5Cn%E2%80%A2%20*Workflow%3A*%20sync-notion.yml%5Cn%E2%80%A2%20*Branch%3A*%20main%22%7D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22confirm%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approve%22%7D%7D%2C%7B%22value%22%3A%22revise%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%22%7D%7D%2C%7B%22value%22%3A%22cancel%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Reject%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%3A%20what%20should%20change.%20I%20revise%20the%20draft%20from%20it.%20Reject%3A%20an%20optional%20reason.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review proposal"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*The draft*"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": ":warning: About to *run a GitHub workflow*:\n• *Repo:* BilLogic/plus-marketing-website\n• *Workflow:* sync-notion.yml\n• *Branch:* main"
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "confirm",
            "text": {
              "type": "plain_text",
              "text": "Approve"
            }
          },
          {
            "value": "revise",
            "text": {
              "type": "plain_text",
              "text": "Needs changes"
            }
          },
          {
            "value": "cancel",
            "text": {
              "type": "plain_text",
              "text": "Reject"
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Needs changes: what should change. I revise the draft from it. Reject: an optional reason."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

**After: github_workflow_run** · 6 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20workflow%20run%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22header%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Run%20sync-notion.yml%22%7D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Starts%20a%20GitHub%20Actions%20run%20on%20%22%7D%2C%7B%22type%22%3A%22link%22%2C%22url%22%3A%22https%3A%2F%2Fgithub.com%2FBilLogic%2Fplus-marketing-website%22%2C%22text%22%3A%22BilLogic%2Fplus-marketing-website%22%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22.%22%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22section%22%2C%22fields%22%3A%5B%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*Workflow*%5Cn%60sync-notion.yml%60%22%7D%2C%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*Branch*%5Cn%60main%60%20(the%20default)%22%7D%2C%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*Inputs*%5CnNone%22%7D%5D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22confirm%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approve%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Starts%20the%20run%3B%20its%20runs%20page%20posts%20in%20the%20thread.%22%7D%7D%2C%7B%22value%22%3A%22revise%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22I%20redraft%20it%20from%20your%20note%20and%20post%20a%20new%20card.%22%7D%7D%2C%7B%22value%22%3A%22cancel%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Reject%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Nothing%20runs.%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%3A%20what%20should%20change.%20Reject%3A%20an%20optional%20reason.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review workflow run"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "Run sync-notion.yml"
      }
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Starts a GitHub Actions run on "
            },
            {
              "type": "link",
              "url": "https://github.com/BilLogic/plus-marketing-website",
              "text": "BilLogic/plus-marketing-website"
            },
            {
              "type": "text",
              "text": "."
            }
          ]
        }
      ]
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Workflow*\n`sync-notion.yml`"
        },
        {
          "type": "mrkdwn",
          "text": "*Branch*\n`main` (the default)"
        },
        {
          "type": "mrkdwn",
          "text": "*Inputs*\nNone"
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "confirm",
            "text": {
              "type": "plain_text",
              "text": "Approve"
            },
            "description": {
              "type": "plain_text",
              "text": "Starts the run; its runs page posts in the thread."
            }
          },
          {
            "value": "revise",
            "text": {
              "type": "plain_text",
              "text": "Needs changes"
            },
            "description": {
              "type": "plain_text",
              "text": "I redraft it from your note and post a new card."
            }
          },
          {
            "value": "cancel",
            "text": {
              "type": "plain_text",
              "text": "Reject"
            },
            "description": {
              "type": "plain_text",
              "text": "Nothing runs."
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Needs changes: what should change. Reject: an optional reason."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

### 6. Roadmap card (`notion_create`, `prd` / `intake`): Needs help → anatomy

The reader is right about what to show; the blocks are the problem. The
no-open-questions caveat moves from the last `context` to a `warning` alert
under the destination. Pillar, Design Status and Source become `fields` with
Edit fields as their accessory, so the button sits beside the values it edits.
The five section `header`s become bold `rich_text` lines, and the goals and
criteria become `rich_text` bullet lists. Title and Summary stay prefilled
inputs.

**Before: notion_create, PRD** · 15 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20proposal%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*New%20PRD%20card%20on%20the%20Roadmap*%22%7D%2C%22accessory%22%3A%7B%22type%22%3A%22button%22%2C%22action_id%22%3A%22uno_review_edit%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Edit%20fields%22%7D%2C%22value%22%3A%22edit%22%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_field%3A0.title%22%2C%22optional%22%3Afalse%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Title%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22value%22%2C%22multiline%22%3Afalse%2C%22max_length%22%3A3000%2C%22initial_value%22%3A%22Session%20sign-up%20waitlist%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*Product%20Pillar%3A*%20Tutor%20Experience%5Cn*Design%20Status%3A*%20Need%20PRD%20%2F%20Under%20Playground%22%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_field%3A0.summary%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Summary%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22value%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%2C%22initial_value%22%3A%22Tutors%20can%20join%20a%20waitlist%20when%20a%20session%20is%20full.%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*Source%3A*%20%3Chttps%3A%2F%2Fplus.slack.com%2Farchives%2FC0SANDBOX1%2Fp1760540000000100%3E%22%7D%7D%2C%7B%22type%22%3A%22header%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Problem%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22Full%20sessions%20turn%20tutors%20away%20with%20no%20next%20step.%22%7D%7D%2C%7B%22type%22%3A%22header%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Goals%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22%E2%80%A2%20Keep%20tutors%20who%20hit%20a%20full%20session%5Cn%E2%80%A2%20Fill%20dropped%20seats%20within%20an%20hour%22%7D%7D%2C%7B%22type%22%3A%22header%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Acceptance%20criteria%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22%E2%80%A2%20A%20full%20session%20offers%20Join%20waitlist%5Cn%E2%80%A2%20A%20freed%20seat%20notifies%20the%20first%20tutor%22%7D%7D%2C%7B%22type%22%3A%22context%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22%3Awarning%3A%20*No%20open%20questions%20were%20named%20for%20this%20brief.*%20If%20it%20leaves%20anything%20ambiguous%20(states%2C%20interactions%2C%20semantics)%2C%20cancel%20and%20ask%20%E2%80%94%20confirming%20builds%20it%20as-is.%22%7D%5D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22confirm%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approve%22%7D%7D%2C%7B%22value%22%3A%22revise%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%22%7D%7D%2C%7B%22value%22%3A%22cancel%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Reject%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%3A%20what%20should%20change.%20I%20revise%20the%20draft%20from%20it.%20Reject%3A%20an%20optional%20reason.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review proposal"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*New PRD card on the Roadmap*"
      },
      "accessory": {
        "type": "button",
        "action_id": "uno_review_edit",
        "text": {
          "type": "plain_text",
          "text": "Edit fields"
        },
        "value": "edit"
      }
    },
    {
      "type": "input",
      "block_id": "uno_field:0.title",
      "optional": false,
      "label": {
        "type": "plain_text",
        "text": "Title"
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "value",
        "multiline": false,
        "max_length": 3000,
        "initial_value": "Session sign-up waitlist"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Product Pillar:* Tutor Experience\n*Design Status:* Need PRD / Under Playground"
      }
    },
    {
      "type": "input",
      "block_id": "uno_field:0.summary",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Summary"
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "value",
        "multiline": true,
        "max_length": 3000,
        "initial_value": "Tutors can join a waitlist when a session is full."
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Source:* <https://plus.slack.com/archives/C0SANDBOX1/p1760540000000100>"
      }
    },
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "Problem"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "Full sessions turn tutors away with no next step."
      }
    },
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "Goals"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "• Keep tutors who hit a full session\n• Fill dropped seats within an hour"
      }
    },
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "Acceptance criteria"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "• A full session offers Join waitlist\n• A freed seat notifies the first tutor"
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": ":warning: *No open questions were named for this brief.* If it leaves anything ambiguous (states, interactions, semantics), cancel and ask — confirming builds it as-is."
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "confirm",
            "text": {
              "type": "plain_text",
              "text": "Approve"
            }
          },
          {
            "value": "revise",
            "text": {
              "type": "plain_text",
              "text": "Needs changes"
            }
          },
          {
            "value": "cancel",
            "text": {
              "type": "plain_text",
              "text": "Reject"
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Needs changes: what should change. I revise the draft from it. Reject: an optional reason."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

**After: notion_create, PRD** · 13 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20Roadmap%20card%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22header%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22New%20PRD%20card%22%7D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Creates%20a%20card%20on%20the%20%22%7D%2C%7B%22type%22%3A%22link%22%2C%22url%22%3A%22https%3A%2F%2Fwww.notion.so%2F2fc01241%22%2C%22text%22%3A%22Roadmap%22%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22%20board.%22%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22alert%22%2C%22level%22%3A%22warning%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22No%20open%20questions%20were%20named%20for%20this%20brief.%20If%20anything%20is%20ambiguous%20(states%2C%20interactions%2C%20semantics)%2C%20choose%20Needs%20changes.%20Approving%20builds%20it%20as-is.%22%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_field%3A0.title%22%2C%22optional%22%3Afalse%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Title%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22value%22%2C%22multiline%22%3Afalse%2C%22max_length%22%3A3000%2C%22initial_value%22%3A%22Session%20sign-up%20waitlist%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22fields%22%3A%5B%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*Product%20Pillar*%5CnTutor%20Experience%22%7D%2C%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*Design%20Status*%5CnNeed%20PRD%20%2F%20Under%20Playground%22%7D%2C%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*Source*%5Cn%3Chttps%3A%2F%2Fplus.slack.com%2Farchives%2FC0SANDBOX1%2Fp1760540000000100%7CSlack%20thread%3E%22%7D%5D%2C%22accessory%22%3A%7B%22type%22%3A%22button%22%2C%22action_id%22%3A%22uno_review_edit%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Edit%20fields%22%7D%2C%22value%22%3A%22edit%22%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_field%3A0.summary%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Summary%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22value%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%2C%22initial_value%22%3A%22Tutors%20can%20join%20a%20waitlist%20when%20a%20session%20is%20full.%22%7D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Problem%22%2C%22style%22%3A%7B%22bold%22%3Atrue%7D%7D%5D%7D%2C%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Full%20sessions%20turn%20tutors%20away%20with%20no%20next%20step.%22%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Goals%22%2C%22style%22%3A%7B%22bold%22%3Atrue%7D%7D%5D%7D%2C%7B%22type%22%3A%22rich_text_list%22%2C%22style%22%3A%22bullet%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Keep%20tutors%20who%20hit%20a%20full%20session%22%7D%5D%7D%2C%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Fill%20dropped%20seats%20within%20an%20hour%22%7D%5D%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Acceptance%20criteria%22%2C%22style%22%3A%7B%22bold%22%3Atrue%7D%7D%5D%7D%2C%7B%22type%22%3A%22rich_text_list%22%2C%22style%22%3A%22bullet%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22A%20full%20session%20offers%20Join%20waitlist%22%7D%5D%7D%2C%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22A%20freed%20seat%20notifies%20the%20first%20tutor%22%7D%5D%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22confirm%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approve%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Creates%20the%20card%20now%20and%20links%20it%20in%20the%20thread.%22%7D%7D%2C%7B%22value%22%3A%22revise%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22I%20redraft%20it%20from%20your%20note%20and%20post%20a%20new%20card.%22%7D%7D%2C%7B%22value%22%3A%22cancel%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Reject%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Nothing%20happens.%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%3A%20what%20should%20change.%20Reject%3A%20an%20optional%20reason.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review Roadmap card"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "New PRD card"
      }
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Creates a card on the "
            },
            {
              "type": "link",
              "url": "https://www.notion.so/2fc01241",
              "text": "Roadmap"
            },
            {
              "type": "text",
              "text": " board."
            }
          ]
        }
      ]
    },
    {
      "type": "alert",
      "level": "warning",
      "text": {
        "type": "plain_text",
        "text": "No open questions were named for this brief. If anything is ambiguous (states, interactions, semantics), choose Needs changes. Approving builds it as-is."
      }
    },
    {
      "type": "input",
      "block_id": "uno_field:0.title",
      "optional": false,
      "label": {
        "type": "plain_text",
        "text": "Title"
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "value",
        "multiline": false,
        "max_length": 3000,
        "initial_value": "Session sign-up waitlist"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Product Pillar*\nTutor Experience"
        },
        {
          "type": "mrkdwn",
          "text": "*Design Status*\nNeed PRD / Under Playground"
        },
        {
          "type": "mrkdwn",
          "text": "*Source*\n<https://plus.slack.com/archives/C0SANDBOX1/p1760540000000100|Slack thread>"
        }
      ],
      "accessory": {
        "type": "button",
        "action_id": "uno_review_edit",
        "text": {
          "type": "plain_text",
          "text": "Edit fields"
        },
        "value": "edit"
      }
    },
    {
      "type": "input",
      "block_id": "uno_field:0.summary",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Summary"
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "value",
        "multiline": true,
        "max_length": 3000,
        "initial_value": "Tutors can join a waitlist when a session is full."
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Problem",
              "style": {
                "bold": true
              }
            }
          ]
        },
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Full sessions turn tutors away with no next step."
            }
          ]
        }
      ]
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Goals",
              "style": {
                "bold": true
              }
            }
          ]
        },
        {
          "type": "rich_text_list",
          "style": "bullet",
          "elements": [
            {
              "type": "rich_text_section",
              "elements": [
                {
                  "type": "text",
                  "text": "Keep tutors who hit a full session"
                }
              ]
            },
            {
              "type": "rich_text_section",
              "elements": [
                {
                  "type": "text",
                  "text": "Fill dropped seats within an hour"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Acceptance criteria",
              "style": {
                "bold": true
              }
            }
          ]
        },
        {
          "type": "rich_text_list",
          "style": "bullet",
          "elements": [
            {
              "type": "rich_text_section",
              "elements": [
                {
                  "type": "text",
                  "text": "A full session offers Join waitlist"
                }
              ]
            },
            {
              "type": "rich_text_section",
              "elements": [
                {
                  "type": "text",
                  "text": "A freed seat notifies the first tutor"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "confirm",
            "text": {
              "type": "plain_text",
              "text": "Approve"
            },
            "description": {
              "type": "plain_text",
              "text": "Creates the card now and links it in the thread."
            }
          },
          {
            "value": "revise",
            "text": {
              "type": "plain_text",
              "text": "Needs changes"
            },
            "description": {
              "type": "plain_text",
              "text": "I redraft it from your note and post a new card."
            }
          },
          {
            "value": "cancel",
            "text": {
              "type": "plain_text",
              "text": "Reject"
            },
            "description": {
              "type": "plain_text",
              "text": "Nothing happens."
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Needs changes: what should change. Reject: an optional reason."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

### 7. Decision (`notion_create`, `decision`): Needs help → anatomy

The same pattern. The destination line names the Decisions database and the
Roadmap card it links to.

**Before: notion_create, decision** · 7 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20proposal%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*New%20decision%20in%20the%20Decisions%20database*%22%7D%2C%22accessory%22%3A%7B%22type%22%3A%22button%22%2C%22action_id%22%3A%22uno_review_edit%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Edit%20fields%22%7D%2C%22value%22%3A%22edit%22%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_field%3A0.title%22%2C%22optional%22%3Afalse%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Title%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22value%22%2C%22multiline%22%3Afalse%2C%22max_length%22%3A3000%2C%22initial_value%22%3A%22Waitlist%20ships%20behind%20a%20flag%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*Status%3A*%20Decided%5Cn*Roadmap%20Card%3A*%20Session%20sign-up%20waitlist%22%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_field%3A0.summary%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Summary%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22value%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%2C%22initial_value%22%3A%22The%20October%20cohort%20gets%20the%20waitlist%20behind%20a%20feature%20flag%3B%20Bryan%20owns%20the%20copy.%22%7D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22confirm%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approve%22%7D%7D%2C%7B%22value%22%3A%22revise%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%22%7D%7D%2C%7B%22value%22%3A%22cancel%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Reject%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%3A%20what%20should%20change.%20I%20revise%20the%20draft%20from%20it.%20Reject%3A%20an%20optional%20reason.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review proposal"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*New decision in the Decisions database*"
      },
      "accessory": {
        "type": "button",
        "action_id": "uno_review_edit",
        "text": {
          "type": "plain_text",
          "text": "Edit fields"
        },
        "value": "edit"
      }
    },
    {
      "type": "input",
      "block_id": "uno_field:0.title",
      "optional": false,
      "label": {
        "type": "plain_text",
        "text": "Title"
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "value",
        "multiline": false,
        "max_length": 3000,
        "initial_value": "Waitlist ships behind a flag"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Status:* Decided\n*Roadmap Card:* Session sign-up waitlist"
      }
    },
    {
      "type": "input",
      "block_id": "uno_field:0.summary",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Summary"
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "value",
        "multiline": true,
        "max_length": 3000,
        "initial_value": "The October cohort gets the waitlist behind a feature flag; Bryan owns the copy."
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "confirm",
            "text": {
              "type": "plain_text",
              "text": "Approve"
            }
          },
          {
            "value": "revise",
            "text": {
              "type": "plain_text",
              "text": "Needs changes"
            }
          },
          {
            "value": "cancel",
            "text": {
              "type": "plain_text",
              "text": "Reject"
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Needs changes: what should change. I revise the draft from it. Reject: an optional reason."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

**After: notion_create, decision** · 8 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20decision%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22header%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Log%20a%20decision%22%7D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Creates%20a%20row%20in%20the%20%22%7D%2C%7B%22type%22%3A%22link%22%2C%22url%22%3A%22https%3A%2F%2Fwww.notion.so%2Fdecisions%22%2C%22text%22%3A%22Decisions%22%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22%20database%2C%20linked%20to%20%22%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Session%20sign-up%20waitlist%22%2C%22style%22%3A%7B%22bold%22%3Atrue%7D%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22.%22%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_field%3A0.title%22%2C%22optional%22%3Afalse%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Title%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22value%22%2C%22multiline%22%3Afalse%2C%22max_length%22%3A3000%2C%22initial_value%22%3A%22Waitlist%20ships%20behind%20a%20flag%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22fields%22%3A%5B%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*Status*%5CnDecided%22%7D%2C%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*Roadmap%20Card*%5CnSession%20sign-up%20waitlist%22%7D%5D%2C%22accessory%22%3A%7B%22type%22%3A%22button%22%2C%22action_id%22%3A%22uno_review_edit%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Edit%20fields%22%7D%2C%22value%22%3A%22edit%22%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_field%3A0.summary%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Summary%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22value%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%2C%22initial_value%22%3A%22The%20October%20cohort%20gets%20the%20waitlist%20behind%20a%20feature%20flag%3B%20Bryan%20owns%20the%20copy.%22%7D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22confirm%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approve%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Logs%20the%20decision%20now%20and%20links%20it%20in%20the%20thread.%22%7D%7D%2C%7B%22value%22%3A%22revise%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22I%20redraft%20it%20from%20your%20note%20and%20post%20a%20new%20card.%22%7D%7D%2C%7B%22value%22%3A%22cancel%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Reject%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Nothing%20happens.%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%3A%20what%20should%20change.%20Reject%3A%20an%20optional%20reason.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review decision"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "Log a decision"
      }
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Creates a row in the "
            },
            {
              "type": "link",
              "url": "https://www.notion.so/decisions",
              "text": "Decisions"
            },
            {
              "type": "text",
              "text": " database, linked to "
            },
            {
              "type": "text",
              "text": "Session sign-up waitlist",
              "style": {
                "bold": true
              }
            },
            {
              "type": "text",
              "text": "."
            }
          ]
        }
      ]
    },
    {
      "type": "input",
      "block_id": "uno_field:0.title",
      "optional": false,
      "label": {
        "type": "plain_text",
        "text": "Title"
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "value",
        "multiline": false,
        "max_length": 3000,
        "initial_value": "Waitlist ships behind a flag"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Status*\nDecided"
        },
        {
          "type": "mrkdwn",
          "text": "*Roadmap Card*\nSession sign-up waitlist"
        }
      ],
      "accessory": {
        "type": "button",
        "action_id": "uno_review_edit",
        "text": {
          "type": "plain_text",
          "text": "Edit fields"
        },
        "value": "edit"
      }
    },
    {
      "type": "input",
      "block_id": "uno_field:0.summary",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Summary"
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "value",
        "multiline": true,
        "max_length": 3000,
        "initial_value": "The October cohort gets the waitlist behind a feature flag; Bryan owns the copy."
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "confirm",
            "text": {
              "type": "plain_text",
              "text": "Approve"
            },
            "description": {
              "type": "plain_text",
              "text": "Logs the decision now and links it in the thread."
            }
          },
          {
            "value": "revise",
            "text": {
              "type": "plain_text",
              "text": "Needs changes"
            },
            "description": {
              "type": "plain_text",
              "text": "I redraft it from your note and post a new card."
            }
          },
          {
            "value": "cancel",
            "text": {
              "type": "plain_text",
              "text": "Reject"
            },
            "description": {
              "type": "plain_text",
              "text": "Nothing happens."
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Needs changes: what should change. Reject: an optional reason."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

### 8. New issue (`github_issue_create`): Needs help → anatomy

The repo moves from a `*Repository:*` line into the destination line, as a
link. The public-repo caveat moves from the last `context` to a `warning`
alert above the inputs, where it is read before the body. The body input gets
a hint that it is GitHub Markdown.

**Before: github_issue_create** · 8 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20proposal%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*New%20GitHub%20issue%20on%20BilLogic%2Fplus-uno*%22%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_field%3A0.title%22%2C%22optional%22%3Afalse%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Title%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22value%22%2C%22multiline%22%3Afalse%2C%22max_length%22%3A3000%2C%22initial_value%22%3A%22Waitlist%20state%20missing%20from%20Session%20card%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*Repository%3A*%20BilLogic%2Fplus-uno%22%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_field%3A0.body%22%2C%22optional%22%3Afalse%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Body%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22value%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%2C%22initial_value%22%3A%22%23%23%20What%5CnThe%20Session%20card%20has%20no%20waitlist%20state.%5Cn%5Cn%23%23%20Why%5CnThe%20sign-up%20prototype%20needs%20it.%22%7D%7D%2C%7B%22type%22%3A%22context%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22%3Awarning%3A%20*BilLogic%2Fplus-uno*%20is%20public%20%E2%80%94%20anyone%20can%20read%20the%20issue%20once%20it's%20filed.%20Check%20the%20body%20for%20anything%20from%20a%20DM%20or%20private%20channel%20before%20you%20approve%3B%20I%20add%20a%20footer%20naming%20you%20and%20linking%20this%20thread.%22%7D%5D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22confirm%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approve%22%7D%7D%2C%7B%22value%22%3A%22revise%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%22%7D%7D%2C%7B%22value%22%3A%22cancel%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Reject%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%3A%20what%20should%20change.%20I%20revise%20the%20draft%20from%20it.%20Reject%3A%20an%20optional%20reason.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review proposal"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*New GitHub issue on BilLogic/plus-uno*"
      }
    },
    {
      "type": "input",
      "block_id": "uno_field:0.title",
      "optional": false,
      "label": {
        "type": "plain_text",
        "text": "Title"
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "value",
        "multiline": false,
        "max_length": 3000,
        "initial_value": "Waitlist state missing from Session card"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Repository:* BilLogic/plus-uno"
      }
    },
    {
      "type": "input",
      "block_id": "uno_field:0.body",
      "optional": false,
      "label": {
        "type": "plain_text",
        "text": "Body"
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "value",
        "multiline": true,
        "max_length": 3000,
        "initial_value": "## What\nThe Session card has no waitlist state.\n\n## Why\nThe sign-up prototype needs it."
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": ":warning: *BilLogic/plus-uno* is public — anyone can read the issue once it's filed. Check the body for anything from a DM or private channel before you approve; I add a footer naming you and linking this thread."
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "confirm",
            "text": {
              "type": "plain_text",
              "text": "Approve"
            }
          },
          {
            "value": "revise",
            "text": {
              "type": "plain_text",
              "text": "Needs changes"
            }
          },
          {
            "value": "cancel",
            "text": {
              "type": "plain_text",
              "text": "Reject"
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Needs changes: what should change. I revise the draft from it. Reject: an optional reason."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

**After: github_issue_create** · 8 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20new%20issue%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22header%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22File%20a%20GitHub%20issue%22%7D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Files%20on%20%22%7D%2C%7B%22type%22%3A%22link%22%2C%22url%22%3A%22https%3A%2F%2Fgithub.com%2FBilLogic%2Fplus-uno%22%2C%22text%22%3A%22BilLogic%2Fplus-uno%22%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22%2C%20a%20public%20repo.%22%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22alert%22%2C%22level%22%3A%22warning%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Anyone%20can%20read%20the%20issue%20once%20it's%20filed.%20Check%20the%20body%20for%20anything%20from%20a%20DM%20or%20private%20channel.%20I%20add%20a%20footer%20naming%20you%20and%20linking%20this%20thread.%22%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_field%3A0.title%22%2C%22optional%22%3Afalse%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Title%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22value%22%2C%22multiline%22%3Afalse%2C%22max_length%22%3A3000%2C%22initial_value%22%3A%22Waitlist%20state%20missing%20from%20Session%20card%22%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_field%3A0.body%22%2C%22optional%22%3Afalse%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Body%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22GitHub%20Markdown%2C%20as%20it%20will%20read%20on%20the%20issue.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22value%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%2C%22initial_value%22%3A%22%23%23%20What%5CnThe%20Session%20card%20has%20no%20waitlist%20state.%5Cn%5Cn%23%23%20Why%5CnThe%20sign-up%20prototype%20needs%20it.%22%7D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22confirm%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approve%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Files%20the%20issue%20now%20and%20links%20it%20in%20the%20thread.%22%7D%7D%2C%7B%22value%22%3A%22revise%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22I%20redraft%20it%20from%20your%20note%20and%20post%20a%20new%20card.%22%7D%7D%2C%7B%22value%22%3A%22cancel%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Reject%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Nothing%20happens.%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%3A%20what%20should%20change.%20Reject%3A%20an%20optional%20reason.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review new issue"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "File a GitHub issue"
      }
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Files on "
            },
            {
              "type": "link",
              "url": "https://github.com/BilLogic/plus-uno",
              "text": "BilLogic/plus-uno"
            },
            {
              "type": "text",
              "text": ", a public repo."
            }
          ]
        }
      ]
    },
    {
      "type": "alert",
      "level": "warning",
      "text": {
        "type": "plain_text",
        "text": "Anyone can read the issue once it's filed. Check the body for anything from a DM or private channel. I add a footer naming you and linking this thread."
      }
    },
    {
      "type": "input",
      "block_id": "uno_field:0.title",
      "optional": false,
      "label": {
        "type": "plain_text",
        "text": "Title"
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "value",
        "multiline": false,
        "max_length": 3000,
        "initial_value": "Waitlist state missing from Session card"
      }
    },
    {
      "type": "input",
      "block_id": "uno_field:0.body",
      "optional": false,
      "label": {
        "type": "plain_text",
        "text": "Body"
      },
      "hint": {
        "type": "plain_text",
        "text": "GitHub Markdown, as it will read on the issue."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "value",
        "multiline": true,
        "max_length": 3000,
        "initial_value": "## What\nThe Session card has no waitlist state.\n\n## Why\nThe sign-up prototype needs it."
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "confirm",
            "text": {
              "type": "plain_text",
              "text": "Approve"
            },
            "description": {
              "type": "plain_text",
              "text": "Files the issue now and links it in the thread."
            }
          },
          {
            "value": "revise",
            "text": {
              "type": "plain_text",
              "text": "Needs changes"
            },
            "description": {
              "type": "plain_text",
              "text": "I redraft it from your note and post a new card."
            }
          },
          {
            "value": "cancel",
            "text": {
              "type": "plain_text",
              "text": "Reject"
            },
            "description": {
              "type": "plain_text",
              "text": "Nothing happens."
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Needs changes: what should change. Reject: an optional reason."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

### 9. A batch (two DMs): Needs help → anatomy

"2 operations, run in order" and `*1. Direct message*` become a `header` "Send
2 DMs", one destination line with both recipients as `user` pills, and per
operation a bold `rich_text` label ("1 · To @Bryan") over its input. A batch
with a tool that has no reader falls back whole today. Once every gated tool
has a reader (§ Implementation notes), that fallback is unreachable.

**Before: Batch of two DMs** · 11 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20proposal%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*2%20operations%2C%20run%20in%20order*%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*1.%20Direct%20message*%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*To%3A*%20%3C%40U0BRYAN001%3E%22%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_field%3A0.text%22%2C%22optional%22%3Afalse%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Message%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22value%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%2C%22initial_value%22%3A%22Crit%20moved%20to%203pm%20Friday.%22%7D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*2.%20Direct%20message*%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*To%3A*%20%3C%40U0COCO0001%3E%22%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_field%3A1.text%22%2C%22optional%22%3Afalse%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Message%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22value%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%2C%22initial_value%22%3A%22Crit%20moved%20to%203pm%20Friday.%22%7D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22confirm%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approve%22%7D%7D%2C%7B%22value%22%3A%22revise%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%22%7D%7D%2C%7B%22value%22%3A%22cancel%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Reject%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%3A%20what%20should%20change.%20I%20revise%20the%20draft%20from%20it.%20Reject%3A%20an%20optional%20reason.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review proposal"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*2 operations, run in order*"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*1. Direct message*"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*To:* <@U0BRYAN001>"
      }
    },
    {
      "type": "input",
      "block_id": "uno_field:0.text",
      "optional": false,
      "label": {
        "type": "plain_text",
        "text": "Message"
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "value",
        "multiline": true,
        "max_length": 3000,
        "initial_value": "Crit moved to 3pm Friday."
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*2. Direct message*"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*To:* <@U0COCO0001>"
      }
    },
    {
      "type": "input",
      "block_id": "uno_field:1.text",
      "optional": false,
      "label": {
        "type": "plain_text",
        "text": "Message"
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "value",
        "multiline": true,
        "max_length": 3000,
        "initial_value": "Crit moved to 3pm Friday."
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "confirm",
            "text": {
              "type": "plain_text",
              "text": "Approve"
            }
          },
          {
            "value": "revise",
            "text": {
              "type": "plain_text",
              "text": "Needs changes"
            }
          },
          {
            "value": "cancel",
            "text": {
              "type": "plain_text",
              "text": "Reject"
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Needs changes: what should change. I revise the draft from it. Reject: an optional reason."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

**After: Batch of two DMs** · 9 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%202%20DMs%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22header%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Send%202%20DMs%22%7D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Sends%20as%20uno%2C%20naming%20you%2C%20to%20%22%7D%2C%7B%22type%22%3A%22user%22%2C%22user_id%22%3A%22U0BRYAN001%22%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22%20and%20%22%7D%2C%7B%22type%22%3A%22user%22%2C%22user_id%22%3A%22U0COCO0001%22%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22%2C%20in%20this%20order.%22%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%221%20%C2%B7%20To%20%22%2C%22style%22%3A%7B%22bold%22%3Atrue%7D%7D%2C%7B%22type%22%3A%22user%22%2C%22user_id%22%3A%22U0BRYAN001%22%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_field%3A0.text%22%2C%22optional%22%3Afalse%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Message%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22value%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%2C%22initial_value%22%3A%22Crit%20moved%20to%203pm%20Friday.%22%7D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%222%20%C2%B7%20To%20%22%2C%22style%22%3A%7B%22bold%22%3Atrue%7D%7D%2C%7B%22type%22%3A%22user%22%2C%22user_id%22%3A%22U0COCO0001%22%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_field%3A1.text%22%2C%22optional%22%3Afalse%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Message%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22value%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%2C%22initial_value%22%3A%22Crit%20moved%20to%203pm%20Friday.%22%7D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22confirm%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approve%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Sends%20both%20DMs%20now.%22%7D%7D%2C%7B%22value%22%3A%22revise%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22I%20redraft%20it%20from%20your%20note%20and%20post%20a%20new%20card.%22%7D%7D%2C%7B%22value%22%3A%22cancel%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Reject%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Nothing%20is%20sent.%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%3A%20what%20should%20change.%20Reject%3A%20an%20optional%20reason.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review 2 DMs"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "Send 2 DMs"
      }
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Sends as uno, naming you, to "
            },
            {
              "type": "user",
              "user_id": "U0BRYAN001"
            },
            {
              "type": "text",
              "text": " and "
            },
            {
              "type": "user",
              "user_id": "U0COCO0001"
            },
            {
              "type": "text",
              "text": ", in this order."
            }
          ]
        }
      ]
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "1 · To ",
              "style": {
                "bold": true
              }
            },
            {
              "type": "user",
              "user_id": "U0BRYAN001"
            }
          ]
        }
      ]
    },
    {
      "type": "input",
      "block_id": "uno_field:0.text",
      "optional": false,
      "label": {
        "type": "plain_text",
        "text": "Message"
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "value",
        "multiline": true,
        "max_length": 3000,
        "initial_value": "Crit moved to 3pm Friday."
      }
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "2 · To ",
              "style": {
                "bold": true
              }
            },
            {
              "type": "user",
              "user_id": "U0COCO0001"
            }
          ]
        }
      ]
    },
    {
      "type": "input",
      "block_id": "uno_field:1.text",
      "optional": false,
      "label": {
        "type": "plain_text",
        "text": "Message"
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "value",
        "multiline": true,
        "max_length": 3000,
        "initial_value": "Crit moved to 3pm Friday."
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "confirm",
            "text": {
              "type": "plain_text",
              "text": "Approve"
            },
            "description": {
              "type": "plain_text",
              "text": "Sends both DMs now."
            }
          },
          {
            "value": "revise",
            "text": {
              "type": "plain_text",
              "text": "Needs changes"
            },
            "description": {
              "type": "plain_text",
              "text": "I redraft it from your note and post a new card."
            }
          },
          {
            "value": "cancel",
            "text": {
              "type": "plain_text",
              "text": "Reject"
            },
            "description": {
              "type": "plain_text",
              "text": "Nothing is sent."
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Needs changes: what should change. Reject: an optional reason."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

### 10. Figma tidy-up (`figma_tidy_up`, own answers): Needs help → anatomy

The finding is a `card` (check as title, finding as body, Open file). The
answers keep their values, so `draftSubmitOf` reads them unchanged. Each answer
gains its `decided` words as its description, and the input is labelled "Your
answer" rather than "Decision".

**Before: figma_tidy_up** · 5 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20proposal%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*The%20draft*%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*Card%20412%20%C2%B7%20Session%20sign-up*%20%C2%B7%20%3Chttps%3A%2F%2Fwww.figma.com%2Fdesign%2FW0qzhXWxFsMwSJzkdV2yal%7Copen%20file%3E%5CnCard%20412%20isn't%20on%20the%20Roadmap.%20Likely%20Card%20421%2C%20%5C%22Session%20sign-up%20waitlist%5C%22.%5CnFiles%20are%20moved%20and%20renamed%20in%20Figma%20by%20a%20person.%20Answering%20here%20records%20what%20you%20did%2C%20and%20Leave%20as%20is%20stops%20asking%20until%20the%20file's%20cards%20change.%22%7D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22choice%3Acancel%3Amoved%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22Moved%20it%22%7D%7D%2C%7B%22value%22%3A%22choice%3Aconfirm%3Aleave%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22Leave%20as%20is%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Optional%20context%20for%20your%20answer.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review proposal"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*The draft*"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Card 412 · Session sign-up* · <https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal|open file>\nCard 412 isn't on the Roadmap. Likely Card 421, \"Session sign-up waitlist\".\nFiles are moved and renamed in Figma by a person. Answering here records what you did, and Leave as is stops asking until the file's cards change."
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "choice:cancel:moved",
            "text": {
              "type": "mrkdwn",
              "text": "Moved it"
            }
          },
          {
            "value": "choice:confirm:leave",
            "text": {
              "type": "mrkdwn",
              "text": "Leave as is"
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Optional context for your answer."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

**After: figma_tidy_up** · 6 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Figma%20tidy-up%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22header%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Card%20412%20%C2%B7%20Session%20sign-up%22%7D%7D%2C%7B%22type%22%3A%22card%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Unknown%20card%22%7D%2C%22body%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22Card%20412%20isn't%20on%20the%20Roadmap.%20Likely%20Card%20421%2C%20%5C%22Session%20sign-up%20waitlist%5C%22.%22%7D%2C%22actions%22%3A%5B%7B%22type%22%3A%22button%22%2C%22action_id%22%3A%22uno_review_open%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Open%20file%22%7D%2C%22url%22%3A%22https%3A%2F%2Fwww.figma.com%2Fdesign%2FW0qzhXWxFsMwSJzkdV2yal%22%7D%5D%7D%2C%7B%22type%22%3A%22context%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22Files%20are%20moved%20and%20renamed%20in%20Figma%20by%20a%20person.%20Your%20answer%20records%20what%20you%20did.%22%7D%5D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Your%20answer%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22choice%3Acancel%3Amoved%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Moved%20it%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Next%20week's%20tidy-up%20checks%20the%20file%20again.%22%7D%7D%2C%7B%22value%22%3A%22choice%3Aconfirm%3Aleave%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Leave%20as%20is%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Not%20raised%20again%20until%20the%20file's%20cards%20change.%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Optional%20context%20for%20your%20answer.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Figma tidy-up"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "Card 412 · Session sign-up"
      }
    },
    {
      "type": "card",
      "title": {
        "type": "plain_text",
        "text": "Unknown card"
      },
      "body": {
        "type": "mrkdwn",
        "text": "Card 412 isn't on the Roadmap. Likely Card 421, \"Session sign-up waitlist\"."
      },
      "actions": [
        {
          "type": "button",
          "action_id": "uno_review_open",
          "text": {
            "type": "plain_text",
            "text": "Open file"
          },
          "url": "https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal"
        }
      ]
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "Files are moved and renamed in Figma by a person. Your answer records what you did."
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Your answer"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "choice:cancel:moved",
            "text": {
              "type": "plain_text",
              "text": "Moved it"
            },
            "description": {
              "type": "plain_text",
              "text": "Next week's tidy-up checks the file again."
            }
          },
          {
            "value": "choice:confirm:leave",
            "text": {
              "type": "plain_text",
              "text": "Leave as is"
            },
            "description": {
              "type": "plain_text",
              "text": "Not raised again until the file's cards change."
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Optional context for your answer."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

### 11. Dev Mode links (`figma_dev_links`): Needs help → anatomy

The header names the component. The destination line says what Approve adds
and where. The links are a `rich_text` list of `link` elements instead of
bullets of mrkdwn links.

**Before: figma_dev_links** · 5 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20proposal%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*The%20draft*%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*Button*%20%C2%B7%20%3Chttps%3A%2F%2Fwww.figma.com%2Fdesign%2FW0qzhXWxFsMwSJzkdV2yal%3Fnode-id%3D1-2%7Copen%20in%20Figma%3E%5Cn%E2%80%A2%20%3Chttps%3A%2F%2Fgithub.com%2FBilLogic%2Fplus-uno%2Fblob%2Fmain%2Fdesign-system%2Fsrc%2Fcomponents%2FButton%2FButton.jsx%7CButton%3A%20Code%20(plus-uno)%3E%5Cn%E2%80%A2%20%3Chttps%3A%2F%2Fplus-uno.netlify.app%2Fstorybook%2F%3Fpath%3D%2Fdocs%2Fbutton%7CButton%3A%20Storybook%3E%5CnApproving%20adds%202%20links%20in%20Dev%20Mode%20to%201%20library%20component%20and%20leaves%20one%20comment%20on%20Button's%20first%20saying%20what%20they%20are.%20A%20link%20already%20there%20is%20not%20added%20twice.%20Reject%20adds%20nothing.%22%7D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22confirm%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approve%22%7D%7D%2C%7B%22value%22%3A%22revise%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%22%7D%7D%2C%7B%22value%22%3A%22cancel%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Reject%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%3A%20what%20should%20change.%20I%20revise%20the%20draft%20from%20it.%20Reject%3A%20an%20optional%20reason.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review proposal"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*The draft*"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Button* · <https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal?node-id=1-2|open in Figma>\n• <https://github.com/BilLogic/plus-uno/blob/main/design-system/src/components/Button/Button.jsx|Button: Code (plus-uno)>\n• <https://plus-uno.netlify.app/storybook/?path=/docs/button|Button: Storybook>\nApproving adds 2 links in Dev Mode to 1 library component and leaves one comment on Button's first saying what they are. A link already there is not added twice. Reject adds nothing."
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "confirm",
            "text": {
              "type": "plain_text",
              "text": "Approve"
            }
          },
          {
            "value": "revise",
            "text": {
              "type": "plain_text",
              "text": "Needs changes"
            }
          },
          {
            "value": "cancel",
            "text": {
              "type": "plain_text",
              "text": "Reject"
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Needs changes: what should change. I revise the draft from it. Reject: an optional reason."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

**After: figma_dev_links** · 7 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20Dev%20Mode%20links%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22header%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Add%20Dev%20Mode%20links%20to%20Button%22%7D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Adds%202%20links%20in%20Dev%20Mode%20to%201%20library%20component%20in%20%22%7D%2C%7B%22type%22%3A%22link%22%2C%22url%22%3A%22https%3A%2F%2Fwww.figma.com%2Fdesign%2FW0qzhXWxFsMwSJzkdV2yal%3Fnode-id%3D1-2%22%2C%22text%22%3A%22Figma%22%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22%2C%20and%20one%20comment%20saying%20what%20they%20are.%22%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Links%22%2C%22style%22%3A%7B%22bold%22%3Atrue%7D%7D%5D%7D%2C%7B%22type%22%3A%22rich_text_list%22%2C%22style%22%3A%22bullet%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22link%22%2C%22url%22%3A%22https%3A%2F%2Fgithub.com%2FBilLogic%2Fplus-uno%2Fblob%2Fmain%2Fdesign-system%2Fsrc%2Fcomponents%2FButton%2FButton.jsx%22%2C%22text%22%3A%22Code%20(plus-uno)%22%7D%5D%7D%2C%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22link%22%2C%22url%22%3A%22https%3A%2F%2Fplus-uno.netlify.app%2Fstorybook%2F%3Fpath%3D%2Fdocs%2Fbutton%22%2C%22text%22%3A%22Storybook%22%7D%5D%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22context%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22A%20link%20already%20there%20is%20not%20added%20twice.%22%7D%5D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22confirm%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approve%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Adds%20the%20links%20and%20the%20comment%20in%20Figma.%22%7D%7D%2C%7B%22value%22%3A%22revise%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22I%20redraft%20it%20from%20your%20note%20and%20post%20a%20new%20card.%22%7D%7D%2C%7B%22value%22%3A%22cancel%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Reject%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Adds%20nothing.%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%3A%20what%20should%20change.%20Reject%3A%20an%20optional%20reason.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review Dev Mode links"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "Add Dev Mode links to Button"
      }
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Adds 2 links in Dev Mode to 1 library component in "
            },
            {
              "type": "link",
              "url": "https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal?node-id=1-2",
              "text": "Figma"
            },
            {
              "type": "text",
              "text": ", and one comment saying what they are."
            }
          ]
        }
      ]
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Links",
              "style": {
                "bold": true
              }
            }
          ]
        },
        {
          "type": "rich_text_list",
          "style": "bullet",
          "elements": [
            {
              "type": "rich_text_section",
              "elements": [
                {
                  "type": "link",
                  "url": "https://github.com/BilLogic/plus-uno/blob/main/design-system/src/components/Button/Button.jsx",
                  "text": "Code (plus-uno)"
                }
              ]
            },
            {
              "type": "rich_text_section",
              "elements": [
                {
                  "type": "link",
                  "url": "https://plus-uno.netlify.app/storybook/?path=/docs/button",
                  "text": "Storybook"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "A link already there is not added twice."
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "confirm",
            "text": {
              "type": "plain_text",
              "text": "Approve"
            },
            "description": {
              "type": "plain_text",
              "text": "Adds the links and the comment in Figma."
            }
          },
          {
            "value": "revise",
            "text": {
              "type": "plain_text",
              "text": "Needs changes"
            },
            "description": {
              "type": "plain_text",
              "text": "I redraft it from your note and post a new card."
            }
          },
          {
            "value": "cancel",
            "text": {
              "type": "plain_text",
              "text": "Reject"
            },
            "description": {
              "type": "plain_text",
              "text": "Adds nothing."
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Needs changes: what should change. Reject: an optional reason."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

### 12. DS precedence intake (`ds_precedence_intake`): Needs help → anatomy

The header carries the finding ("Badge: the library needs the fix"). The
disagreements are a list with props in `code` style. Code and Figma are
buttons. The paragraph about what Needs changes does moves into that option's
description.

**Before: ds_precedence_intake** · 5 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20proposal%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*The%20draft*%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*Badge*%20%C2%B7%20library%20side%20needs%20the%20fix%20%C2%B7%20%3Chttps%3A%2F%2Fgithub.com%2FBilLogic%2Fplus-uno%2Fblob%2Fmain%2Fdesign-system%2Fsrc%2Fcomponents%2FBadge%2FBadge.jsx%7Ccode%3E%20%C2%B7%20%3Chttps%3A%2F%2Fwww.figma.com%2Fdesign%2FW0qz%3Fnode-id%3D3-4%7CFigma%3E%5Cn%E2%80%A2%20code%20has%20%60size%3D%5C%22xs%5C%22%60%2C%20the%20library%20doesn't%5Cn%E2%80%A2%20the%20library%20has%20a%20%60pill%60%20variant%20code%20doesn't%5CnApproving%20adds%20it%20to%20the%20DS%20precedence%20intake%20for%20the%20week%20of%20Oct%2012%2C%20filing%20the%20intake%20if%20this%20is%20the%20week's%20first.%20Needs%20changes%20puts%20your%20note%20on%20the%20intake%20instead%2C%20for%20a%20library%20that%20is%20right%20or%20a%20difference%20that%20is%20deliberate.%22%7D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22confirm%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approve%22%7D%7D%2C%7B%22value%22%3A%22revise%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%22%7D%7D%2C%7B%22value%22%3A%22cancel%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Reject%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%3A%20what%20should%20change.%20I%20revise%20the%20draft%20from%20it.%20Reject%3A%20an%20optional%20reason.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review proposal"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*The draft*"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Badge* · library side needs the fix · <https://github.com/BilLogic/plus-uno/blob/main/design-system/src/components/Badge/Badge.jsx|code> · <https://www.figma.com/design/W0qz?node-id=3-4|Figma>\n• code has `size=\"xs\"`, the library doesn't\n• the library has a `pill` variant code doesn't\nApproving adds it to the DS precedence intake for the week of Oct 12, filing the intake if this is the week's first. Needs changes puts your note on the intake instead, for a library that is right or a difference that is deliberate."
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "confirm",
            "text": {
              "type": "plain_text",
              "text": "Approve"
            }
          },
          {
            "value": "revise",
            "text": {
              "type": "plain_text",
              "text": "Needs changes"
            }
          },
          {
            "value": "cancel",
            "text": {
              "type": "plain_text",
              "text": "Reject"
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Needs changes: what should change. I revise the draft from it. Reject: an optional reason."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

**After: ds_precedence_intake** · 7 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20DS%20intake%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22header%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Badge%3A%20the%20library%20needs%20the%20fix%22%7D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Adds%20to%20the%20DS%20precedence%20intake%20for%20the%20week%20of%20%22%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Oct%2012%22%2C%22style%22%3A%7B%22bold%22%3Atrue%7D%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22%2C%20filing%20the%20intake%20if%20this%20is%20the%20week's%20first.%22%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22What%20differs%22%2C%22style%22%3A%7B%22bold%22%3Atrue%7D%7D%5D%7D%2C%7B%22type%22%3A%22rich_text_list%22%2C%22style%22%3A%22bullet%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Code%20has%20%22%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22size%3D%5C%22xs%5C%22%22%2C%22style%22%3A%7B%22code%22%3Atrue%7D%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22%2C%20the%20library%20doesn't%22%7D%5D%7D%2C%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22The%20library%20has%20a%20%22%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22pill%22%2C%22style%22%3A%7B%22code%22%3Atrue%7D%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22%20variant%20code%20doesn't%22%7D%5D%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22actions%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22button%22%2C%22action_id%22%3A%22uno_review_open_code%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Code%22%7D%2C%22url%22%3A%22https%3A%2F%2Fgithub.com%2FBilLogic%2Fplus-uno%2Fblob%2Fmain%2Fdesign-system%2Fsrc%2Fcomponents%2FBadge%2FBadge.jsx%22%7D%2C%7B%22type%22%3A%22button%22%2C%22action_id%22%3A%22uno_review_open_figma%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Figma%22%7D%2C%22url%22%3A%22https%3A%2F%2Fwww.figma.com%2Fdesign%2FW0qz%3Fnode-id%3D3-4%22%7D%5D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22confirm%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approve%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Adds%20it%20to%20this%20week's%20intake.%22%7D%7D%2C%7B%22value%22%3A%22revise%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Your%20note%20goes%20on%20the%20intake%3A%20the%20library%20is%20right%2C%20or%20it%20is%20deliberate.%22%7D%7D%2C%7B%22value%22%3A%22cancel%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Reject%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Left%20as%20deliberate.%20Nothing%20is%20filed.%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%3A%20what%20should%20change.%20Reject%3A%20an%20optional%20reason.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review DS intake"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "Badge: the library needs the fix"
      }
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Adds to the DS precedence intake for the week of "
            },
            {
              "type": "text",
              "text": "Oct 12",
              "style": {
                "bold": true
              }
            },
            {
              "type": "text",
              "text": ", filing the intake if this is the week's first."
            }
          ]
        }
      ]
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "What differs",
              "style": {
                "bold": true
              }
            }
          ]
        },
        {
          "type": "rich_text_list",
          "style": "bullet",
          "elements": [
            {
              "type": "rich_text_section",
              "elements": [
                {
                  "type": "text",
                  "text": "Code has "
                },
                {
                  "type": "text",
                  "text": "size=\"xs\"",
                  "style": {
                    "code": true
                  }
                },
                {
                  "type": "text",
                  "text": ", the library doesn't"
                }
              ]
            },
            {
              "type": "rich_text_section",
              "elements": [
                {
                  "type": "text",
                  "text": "The library has a "
                },
                {
                  "type": "text",
                  "text": "pill",
                  "style": {
                    "code": true
                  }
                },
                {
                  "type": "text",
                  "text": " variant code doesn't"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "action_id": "uno_review_open_code",
          "text": {
            "type": "plain_text",
            "text": "Code"
          },
          "url": "https://github.com/BilLogic/plus-uno/blob/main/design-system/src/components/Badge/Badge.jsx"
        },
        {
          "type": "button",
          "action_id": "uno_review_open_figma",
          "text": {
            "type": "plain_text",
            "text": "Figma"
          },
          "url": "https://www.figma.com/design/W0qz?node-id=3-4"
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "confirm",
            "text": {
              "type": "plain_text",
              "text": "Approve"
            },
            "description": {
              "type": "plain_text",
              "text": "Adds it to this week's intake."
            }
          },
          {
            "value": "revise",
            "text": {
              "type": "plain_text",
              "text": "Needs changes"
            },
            "description": {
              "type": "plain_text",
              "text": "Your note goes on the intake: the library is right, or it is deliberate."
            }
          },
          {
            "value": "cancel",
            "text": {
              "type": "plain_text",
              "text": "Reject"
            },
            "description": {
              "type": "plain_text",
              "text": "Left as deliberate. Nothing is filed."
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Needs changes: what should change. Reject: an optional reason."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

### 13. Sweep shared note (`sweep_share_post`): Needs help → anatomy

The note posts verbatim, so it is a `rich_text_quote` under a destination line
with the channel as a pill. The sweep mark and the paragraph about what has
not left the group DM fold into that line.

**Before: sweep_share_post** · 5 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20proposal%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*The%20draft*%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*End-of-day%20sweep*%20%E2%80%94%20share%20what%20this%20conversation%20settled%3F%5Cn%5CnNothing%20from%20here%20has%20left%20this%20group%20DM.%20Approving%20posts%20exactly%20this%20note%20in%20%23plus-design%2C%20and%20nothing%20else.%5Cn%5CnIn%20%23plus-design%3A%5Cn%3E%20Decided%20in%20a%20group%20DM%20today%3A%20the%20waitlist%20ships%20behind%20a%20flag%20for%20the%20October%20cohort%3B%20Bryan%20owns%20the%20copy.%5Cn%5CnThe%20people%20who%20could%20confirm%20the%20fix%20can%20confirm%20this.%20Expires%20in%2072%20h%2C%20with%20no%20reminder.%22%7D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22confirm%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approve%22%7D%7D%2C%7B%22value%22%3A%22revise%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%22%7D%7D%2C%7B%22value%22%3A%22cancel%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Reject%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%3A%20what%20should%20change.%20I%20revise%20the%20draft%20from%20it.%20Reject%3A%20an%20optional%20reason.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review proposal"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*The draft*"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*End-of-day sweep* — share what this conversation settled?\n\nNothing from here has left this group DM. Approving posts exactly this note in #plus-design, and nothing else.\n\nIn #plus-design:\n> Decided in a group DM today: the waitlist ships behind a flag for the October cohort; Bryan owns the copy.\n\nThe people who could confirm the fix can confirm this. Expires in 72 h, with no reminder."
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "confirm",
            "text": {
              "type": "plain_text",
              "text": "Approve"
            }
          },
          {
            "value": "revise",
            "text": {
              "type": "plain_text",
              "text": "Needs changes"
            }
          },
          {
            "value": "cancel",
            "text": {
              "type": "plain_text",
              "text": "Reject"
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Needs changes: what should change. I revise the draft from it. Reject: an optional reason."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

**After: sweep_share_post** · 7 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20shared%20note%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22submit%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Submit%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22header%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Share%20what%20was%20settled%22%7D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_section%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Posts%20this%20note%20in%20%22%7D%2C%7B%22type%22%3A%22channel%22%2C%22channel_id%22%3A%22C0PLUSDES1%22%7D%2C%7B%22type%22%3A%22text%22%2C%22text%22%3A%22.%20Nothing%20else%20leaves%20this%20group%20DM.%22%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22rich_text%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22rich_text_quote%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22text%22%2C%22text%22%3A%22Decided%20in%20a%20group%20DM%20today%3A%20the%20waitlist%20ships%20behind%20a%20flag%20for%20the%20October%20cohort%3B%20Bryan%20owns%20the%20copy.%22%7D%5D%7D%5D%7D%2C%7B%22type%22%3A%22context%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22The%20people%20who%20could%20confirm%20the%20fix%20can%20confirm%20this.%20Expires%20in%2072%20h%2C%20with%20no%20reminder.%22%7D%5D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_choice%22%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Decision%22%7D%2C%22element%22%3A%7B%22type%22%3A%22radio_buttons%22%2C%22action_id%22%3A%22uno_review_choice_input%22%2C%22options%22%3A%5B%7B%22value%22%3A%22confirm%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approve%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Posts%20exactly%20this%20note.%22%7D%7D%2C%7B%22value%22%3A%22revise%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22I%20redraft%20it%20from%20your%20note%20and%20post%20a%20new%20card.%22%7D%7D%2C%7B%22value%22%3A%22cancel%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Reject%22%7D%2C%22description%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Nothing%20posts.%22%7D%7D%5D%7D%7D%2C%7B%22type%22%3A%22input%22%2C%22block_id%22%3A%22uno_review_note%22%2C%22optional%22%3Atrue%2C%22label%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Note%22%7D%2C%22hint%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Needs%20changes%3A%20what%20should%20change.%20Reject%3A%20an%20optional%20reason.%22%7D%2C%22element%22%3A%7B%22type%22%3A%22plain_text_input%22%2C%22action_id%22%3A%22uno_review_note_input%22%2C%22multiline%22%3Atrue%2C%22max_length%22%3A3000%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review shared note"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "submit": {
    "type": "plain_text",
    "text": "Submit"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "Share what was settled"
      }
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "text",
              "text": "Posts this note in "
            },
            {
              "type": "channel",
              "channel_id": "C0PLUSDES1"
            },
            {
              "type": "text",
              "text": ". Nothing else leaves this group DM."
            }
          ]
        }
      ]
    },
    {
      "type": "rich_text",
      "elements": [
        {
          "type": "rich_text_quote",
          "elements": [
            {
              "type": "text",
              "text": "Decided in a group DM today: the waitlist ships behind a flag for the October cohort; Bryan owns the copy."
            }
          ]
        }
      ]
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "The people who could confirm the fix can confirm this. Expires in 72 h, with no reminder."
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "input",
      "block_id": "uno_review_choice",
      "label": {
        "type": "plain_text",
        "text": "Decision"
      },
      "element": {
        "type": "radio_buttons",
        "action_id": "uno_review_choice_input",
        "options": [
          {
            "value": "confirm",
            "text": {
              "type": "plain_text",
              "text": "Approve"
            },
            "description": {
              "type": "plain_text",
              "text": "Posts exactly this note."
            }
          },
          {
            "value": "revise",
            "text": {
              "type": "plain_text",
              "text": "Needs changes"
            },
            "description": {
              "type": "plain_text",
              "text": "I redraft it from your note and post a new card."
            }
          },
          {
            "value": "cancel",
            "text": {
              "type": "plain_text",
              "text": "Reject"
            },
            "description": {
              "type": "plain_text",
              "text": "Nothing posts."
            }
          }
        ]
      }
    },
    {
      "type": "input",
      "block_id": "uno_review_note",
      "optional": true,
      "label": {
        "type": "plain_text",
        "text": "Note"
      },
      "hint": {
        "type": "plain_text",
        "text": "Needs changes: what should change. Reject: an optional reason."
      },
      "element": {
        "type": "plain_text_input",
        "action_id": "uno_review_note_input",
        "multiline": true,
        "max_length": 3000
      }
    }
  ]
}
```

</details>

### 14. After a decision, and closed: Needs help → alert + next step

**Before: After Approve** · 1 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20proposal%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22Approved.%20I'm%20running%20it%20now%2C%20and%20the%20outcome%20posts%20in%20the%20thread.%22%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review proposal"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "Approved. I'm running it now, and the outcome posts in the thread."
      }
    }
  ]
}
```

</details>

**After: After Approve** · 2 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20share-out%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22alert%22%2C%22level%22%3A%22success%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Approved.%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22I'm%20running%20it%20now.%20The%20outcome%20posts%20in%20the%20thread.%22%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review share-out"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "alert",
      "level": "success",
      "text": {
        "type": "plain_text",
        "text": "Approved."
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "I'm running it now. The outcome posts in the thread."
      }
    }
  ]
}
```

</details>
**Before: Expired** · 1 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20proposal%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22This%20proposal%20expired%2C%20so%20it%20can't%20be%20approved%20now.%20Ask%20me%20again%20and%20I'll%20set%20it%20up%20fresh.%22%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review proposal"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "This proposal expired, so it can't be approved now. Ask me again and I'll set it up fresh."
      }
    }
  ]
}
```

</details>

**After: Expired** · 2 blocks · [Open in Block Kit Builder](https://app.slack.com/block-kit-builder#%7B%22type%22%3A%22modal%22%2C%22callback_id%22%3A%22uno_review_draft%22%2C%22title%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Review%20share-out%22%7D%2C%22close%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Close%22%7D%2C%22private_metadata%22%3A%22%7B%5C%22channel%5C%22%3A%5C%22C0SANDBOX1%5C%22%2C%5C%22ts%5C%22%3A%5C%221760540000.000100%5C%22%7D%22%2C%22blocks%22%3A%5B%7B%22type%22%3A%22alert%22%2C%22level%22%3A%22warning%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22This%20proposal%20expired%2C%20so%20it%20can't%20be%20approved%20now.%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22Ask%20me%20again%20and%20I'll%20set%20it%20up%20fresh.%22%7D%7D%5D%7D)

<details><summary>Block Kit JSON</summary>

```json
{
  "type": "modal",
  "callback_id": "uno_review_draft",
  "title": {
    "type": "plain_text",
    "text": "Review share-out"
  },
  "close": {
    "type": "plain_text",
    "text": "Close"
  },
  "private_metadata": "{\"channel\":\"C0SANDBOX1\",\"ts\":\"1760540000.000100\"}",
  "blocks": [
    {
      "type": "alert",
      "level": "warning",
      "text": {
        "type": "plain_text",
        "text": "This proposal expired, so it can't be approved now."
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "Ask me again and I'll set it up fresh."
      }
    }
  ]
}
```

</details>

The other one-liners (rejected, sent back, superseded, gone, being revised)
follow the same two blocks: `alert` (`default` for rejected, `info` for sent
back and being revised, `warning` for superseded and expired) and a `section`
with what happens next. Their wording does not change.

### Unchanged

Loading, Edit fields (and its empty and refused states), the refused-edit
alert, `dm_relay` with one recipient, `notion_update`, and both feedback views
stay as they are, apart from the title and the decision's option descriptions,
which every draft gets.

## Decisions (Bill, 2026-10-15)

Bill reviewed the draft on 2026-10-15 and said yes to all five. Each is folded
into the afters above, so the doc proposes one view per variant.

1. **The share-out's words are editable in place.** Yes. In Bill's words,
   "we'd need the text input box". The summary, the three questions and "not
   looking for" are prefilled inputs (§ 1). Where it posts, who it pings, the
   deadline, fidelity and round stay locked, since changing who is pinged is a
   new proposal by the rule in `review-fields.ts`. The issue follow-up's
   comment was in the same recommendation but is still a quote in § 3; making
   it an input is the same change and is left for the ticket to confirm.
2. **Per-tool modal titles.** Yes: "Review share-out", "Review new issue" and
   the rest (§ The shared anatomy). "Review proposal" goes.
3. **Slack's `card` block for the shared or touched object.** Yes, live-checked
   first. A card carries a body only when the text is 200 characters or fewer;
   otherwise the card has no body and the text sits under it. Because uno-bot
   has never put a `card` in a modal, the first ticket opens one in the le goat
   DM before any reader is built on it (§ Not verified).
4. **Alerts near the top.** Yes: one `alert` per caveat, at most two, right
   under the what-and-where line. A refused edit's `error` alert stays first.
5. **View on a decided card keeps the record.** Yes. The decided batch stays on
   the thread's record (`ThreadState`) for the card's lifetime, so View draws
   the same content read-only under a `success` alert (§ 2).

## Not verified

- **No payload here was rendered in Slack.** The Block Kit Builder needs a
  signed-in workspace session, and none was available to this audit. The
  afters were checked in code against the documented limits (title ≤24, ≤100
  blocks, text ≤3,000, alert ≤200, card body ≤200, option description ≤75, a
  modal-only block set). Bill or a live check opens the links before any of it
  is built. `docs/plans/2026-10-15-review-modal-redesign.html` lists every
  variant's Before and After links in the order to check them.
- **`card` in a modal**, and the `icon` on it, are documented but untried
  here. The afters use no icon, because the docs show two different icon
  shapes (`slack_icon`/`icon_name` in the card example, `icon`/`name` on the
  icon object's page).
- **mrkdwn mentions inside an `alert`** (the read-only and decided alerts use
  `<@U…>`). Alerts take mrkdwn text, but a mention there is untried. The
  fallback is the plain-text alert plus a `rich_text` line with the `user`
  element.

## Implementation notes (for the tickets)

- **One reader per gated tool.** `review-draft.ts`'s `READERS` gains
  `shareout_post`, `notion_archive`, `github_issue_update`,
  `github_workflow_run`, `sweep_share_post`, `figma_tidy_up`,
  `figma_dev_links` and `ds_precedence_intake`. Each reading returns the five
  zones (`header`, a where-line of rich text elements, caveats, a card, facts,
  body parts) instead of `headline` + `properties` + `body`. With a reader for
  every row, the card-text fallback is unreachable for anything the Gate
  stages.
- **Share-out fields.** `review-fields.ts`'s `FIELDS` gains a
  `shareout_post` row: `summary` (required), one input per staged
  `feedback_wanted` item (the first required, the rest optional, so clearing
  one drops it), and `not_looking_for` (optional). `writePath` already
  addresses `feedback_wanted.0`; Approve has to drop emptied questions before
  the write, and `checkEdits` holds each to the placeholder guard as it does
  every text field.
- **"Round 1" on the posted card too.** The thread card's summary line
  (`shortCardOf` in `proposal-render.ts`) joins key fields by bare value, so a
  share-out's line reads "EOD Friday · 1 · Live App". The round is shown as
  "Round 1" there as well, by labelling a numeric key field with its label.
- **Caveats as data, not scraped text.** `caveatsOf` reads `:warning:` lines
  back out of the card text with a regex. The `CardCaveat` values the turn
  decided should ride the staged proposal (`PendingProposal`) instead, so the
  pop-up writes each as an alert with its own short wording.
- **Stated cards.** The four Worker cards (rows 12–15) put their facts in a
  mrkdwn `lead`. They need their facts as data on the proposal, the same way
  `choices` already is.
- **Unchanged contracts.** `uno_review_choice` / `uno_review_note` block ids,
  the option values (`confirm`, `revise`, `cancel`, `choice:<verdict>:<value>`),
  the `uno_field:` input ids and `private_metadata` stay as they are, so
  `draftSubmitOf`, `reviewSubmitOf` and `fieldsFromBlocks` read the new views
  unchanged. The Open buttons are `url` buttons; Slack still sends a
  `block_actions` for them. `interactive.ts` already acks every one and lets an
  id it does not route fall through, so they need no handler.
- **Validation.** `Storybook-validation` does not apply (no DS component). The
  check is `tests/proposal-review.test.ts` extended per reader, plus a live
  open of each variant in the le goat DM, never in #plus-design.
