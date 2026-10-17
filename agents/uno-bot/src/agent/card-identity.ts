// What a waiting proposal card is called, and what it is aimed at.
//
// Two readers need the same answer (#1318). The model's pending-proposal
// context lists every live card in the thread by headline and target, so it
// can tell an edit of one card from a request for a different matter. And the
// turn names cards to the person — "*Backup tutor matching* above is still
// waiting" — and holds two cards aimed at the same Notion page or the same
// GitHub issue to one matter, whatever the model said. One module, so the card
// the model was shown is the card the person is told about.
//
// Pure: reads the staged batch and the tool table, and nothing else.

import { proposalOperations, type PendingProposal, type ProposalOperation } from "../thread-state/index";
import { gateWordsFor } from "./tool-table";

/** How long a headline may run before it is cut. */
const HEADLINE_MAX = 80;

/**
 * A card's headline: what a person would call it. The first operation's
 * title, project or recipient where its input names one; else the issue it
 * changes; else what its ✅ does, in the gated row's own words.
 */
export function cardHeadline(card: Pick<PendingProposal, "operations" | "toolName" | "input">): string {
  const op = proposalOperations(card)[0]!;
  const said = named(op);
  const headline = said ?? gateWordsFor(op.toolName)?.verb ?? op.toolName;
  return headline.length > HEADLINE_MAX ? `${headline.slice(0, HEADLINE_MAX - 1).trimEnd()}…` : headline;
}

function named(op: ProposalOperation): string | null {
  const text = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim().replace(/\s+/g, " ") : null);
  switch (op.toolName) {
    case "shareout_post":
      return text(op.input.project) ?? text(op.input.artifact) ?? text(op.input.summary);
    case "dm_relay": {
      const to = text(op.input.recipient);
      return to ? `DM to ${to}` : null;
    }
    case "github_issue_update": {
      const target = issueTarget(op);
      return target ? `issue #${target.number}` : null;
    }
    default:
      return text(op.input.title);
  }
}

/**
 * Where a card's operations land, when they name a page or an issue: a Notion
 * page's link, or an issue as `repo#N`. What the model is shown beside the
 * headline; empty for a card that creates something new.
 */
export function cardTargets(card: Pick<PendingProposal, "operations" | "toolName" | "input">): string[] {
  const out: string[] = [];
  for (const op of proposalOperations(card)) {
    const page = notionPageOf(op);
    if (page) out.push(String(op.input.page_url));
    const issue = issueTarget(op);
    if (issue) out.push(`${issue.repo?.toLowerCase() ?? "(default repo)"}#${issue.number}`);
  }
  return [...new Set(out)];
}

/**
 * The repo a GitHub issue change's `repo` input names, as the executor
 * resolves it (`integrations/github.ts` `resolveRepoFor`): absent names the
 * default repo, `GITHUB_REPO`; a short name names the listed repo it is.
 * Handed in, so this module stays pure.
 */
export type IssueRepoOf = (repo: unknown) => string;

/**
 * Whether two operations are aimed at the same Notion page or the same GitHub
 * issue — the one case where two cards are one matter whatever the model
 * says (`turn/card-matter.ts`). Two cards that would both write one page or
 * one issue can never both be live: approving both would have the second
 * overwrite the first. An issue named without a repo goes to the default
 * repo, so it matches the same number in that repo and no other: each side's
 * repo is read through `repoOf` before the two are compared.
 *
 * @param repoOf - The repo an issue's `repo` input resolves to
 */
export function sameWriteTarget(a: ProposalOperation, b: ProposalOperation, repoOf: IssueRepoOf): boolean {
  const pageA = notionPageOf(a);
  if (pageA) return pageA === notionPageOf(b);
  const issueA = issueTarget(a);
  const issueB = issueTarget(b);
  if (!issueA || !issueB || issueA.number !== issueB.number) return false;
  return repoOf(issueA.repo).toLowerCase() === repoOf(issueB.repo).toLowerCase();
}

const NOTION_ID = /[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}/i;

/** The Notion page an update or archive writes, as its bare 32-hex id — or,
 *  for a link that carries none, the link itself, so two writes to one link
 *  are still one page. */
function notionPageOf(op: ProposalOperation): string | null {
  if (op.toolName !== "notion_update" && op.toolName !== "notion_archive") return null;
  const url = typeof op.input.page_url === "string" ? op.input.page_url.trim() : "";
  if (!url) return null;
  const m = url.match(NOTION_ID);
  return m ? m[0].replace(/-/g, "").toLowerCase() : url;
}

/** The issue a GitHub issue change is aimed at. */
function issueTarget(op: ProposalOperation): { repo?: string; number: string } | null {
  if (op.toolName !== "github_issue_update") return null;
  const n = op.input.issue_number;
  if (n === undefined || n === null || String(n).trim() === "") return null;
  const repo = typeof op.input.repo === "string" && op.input.repo.trim() ? op.input.repo.trim() : undefined;
  return { ...(repo ? { repo } : {}), number: String(n).trim().replace(/^#/, "").trim() };
}
