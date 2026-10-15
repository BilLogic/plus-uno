// The Review pop-up's readings, in the shared anatomy, of the gated writes
// that touch something already there or start something: the Notion archive,
// the GitHub issue follow-up, the workflow run, and the new issue
// (`docs/plans/2026-10-15-review-modal-redesign.md` § 3, 4, 5 and 8).
//
// WHAT THE CARD RESOLVED, READ BACK. The turn resolves where each of these
// lands before the card is posted — the archived page's title and database,
// the listed repo and whether it is public, a workflow's default branch — and
// writes it into the card's text. The pop-up reads those lines back rather
// than the model's input, so it names the place a ✅ actually writes to; the
// input stands in only where the card says nothing.
//
// PURE: blocks out, nothing posted, nothing read.
import { reviewSections } from "./render";
import { fieldInputBlocks, MAX_INPUT_CHARS } from "./review-fields";
import {
  alertsFromCaveats,
  factsSection,
  labelledText,
  TOO_LONG_TO_EDIT,
  type DraftAlert,
  type DraftAnatomy,
  type WhereElement,
} from "./review-anatomy";
import { issueUpdateFromInput, stateWords, type IssueUpdate } from "../tools/github-issue-update-render";
import type { AnatomyContext } from "./review-draft";

type Input = Record<string, unknown>;

const DEFAULT_REPO = "BilLogic/plus-uno";

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const capital = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
/** A card value back to the words it escaped. */
const unescaped = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const context = (text: string): unknown => ({ type: "context", elements: [{ type: "mrkdwn", text }] });

/** The card's `• *Label:* value` line's value, as written; "" when it has none. */
function cardField(cardText: string, label: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^• \\*${escaped}:\\* (.+)$`, "m").exec(cardText)?.[1]?.trim() ?? "";
}

/** What the card says about the repo a write lands on: its name in the list's
 *  spelling, who can read it, and whether the footer links the thread. */
interface RepoNotice {
  repo: string;
  visibility: "public" | "private" | "unknown";
  fromDm: boolean;
}

const VISIBILITY_LINE = /^(?::warning: )?\*([^*]+)\* (is public|is private|may be public) — .*$/m;

/** The card's repo-visibility line, read back; null when it has none (an
 *  update with no comment carries none: nothing is written that anyone reads). */
function repoNotice(cardText: string): RepoNotice | null {
  const m = VISIBILITY_LINE.exec(cardText);
  if (!m) return null;
  const visibility = m[2] === "is public" ? "public" : m[2] === "is private" ? "private" : "unknown";
  return { repo: m[1]!, visibility, fromDm: !m[0].includes("linking this thread") };
}

/** The card's caveats other than the repo's visibility (a cut-off rerun, say),
 *  as alerts. */
function otherAlerts(cardText: string): DraftAlert[] {
  const lines = cardText
    .split("\n")
    .filter((line) => line.startsWith(":warning:") && !/^:warning: About to /.test(line) && !VISIBILITY_LINE.test(line));
  return alertsFromCaveats(lines);
}

/**
 * A write to a repo as its alert says it: on a public repo, or one whose
 * visibility could not be read, a warning to check the words before they go
 * out; on a private one, an info line saying who can read them.
 *
 * @param what - "the issue" or "the comment"
 */
function repoAlert(notice: RepoNotice, what: "issue" | "comment"): DraftAlert {
  const [readable, check] = what === "comment" ? ["the comment once it's posted", "Check it"] : ["the issue once it's filed", "Check the body"];
  const footer = notice.fromDm ? "I add a footer naming you." : "I add a footer naming you and linking this thread.";
  const tail = `${check} for anything from a DM or private channel. ${footer}`;
  if (notice.visibility === "private") return { level: "info", text: `Only people with access to ${notice.repo} can read the ${what}. ${footer}` };
  if (notice.visibility === "unknown") return { level: "warning", text: `I couldn't check whether ${notice.repo} is public, so treat the ${what} as readable by anyone. ${tail}` };
  return { level: "warning", text: `Anyone can read ${readable}. ${tail}` };
}

/** The where line's end: ", a public repo." or ", a private repo.", or a full
 *  stop where the card did not say. */
function repoTail(notice: RepoNotice | null): WhereElement {
  const kind = notice?.visibility === "public" ? ", a public repo." : notice?.visibility === "private" ? ", a private repo." : ".";
  return { type: "text", text: kind };
}

const repoUrl = (repo: string) => `https://github.com/${repo}`;

/** A text a confirmer may fix: its input in place, or, read-only or too long
 *  to be an input, the text itself under its label. */
function textOrInput(
  content: unknown[],
  detail: AnatomyContext,
  path: string,
  label: string,
  value: string,
  shown: (label: string, value: string) => unknown[] = (l, v) => [labelledText(l, v)],
): void {
  const inline = detail.inline?.get(`0.${path}`);
  if (inline) {
    content.push(...fieldInputBlocks([inline]));
    return;
  }
  if (!value) return;
  content.push(...shown(label, value));
  if (detail.editing && value.length > MAX_INPUT_CHARS) content.push(context(TOO_LONG_TO_EDIT));
}

// ── notion_archive ──────────────────────────────────────────────────────────

/** Said on every archive: it is a soft delete. */
export const ARCHIVE_RESTORE = "Archived pages can be restored from Notion's trash.";

/**
 * An archive in the anatomy: "Archive a Notion card", where it goes, an info
 * alert that it can be restored, and the page as a card with Open in Notion.
 * The title and database are the card's resolved target; a card that could
 * not resolve one names the page by its link alone.
 */
export function archiveAnatomy(input: Input, detail: AnatomyContext): DraftAnatomy {
  const target = unescaped(cardField(detail.cardText, "Target"));
  const at = target.lastIndexOf(" — in ");
  const title = at >= 0 ? target.slice(0, at) : target;
  const parent = at >= 0 ? target.slice(at + " — in ".length) : "";
  const url = str(input.page_url);
  return {
    header: "Archive a Notion card",
    where: [{ type: "text", text: parent ? `Moves this card from the ${parent} to Notion's trash.` : "Moves this card to Notion's trash." }],
    alerts: [...otherAlerts(detail.cardText), { level: "info", text: ARCHIVE_RESTORE }],
    object: {
      title: title || "This Notion card",
      ...(parent ? { subtitle: parent } : {}),
      ...(url ? { open: { url, text: "Open in Notion" } } : {}),
    },
    content: [],
  };
}

// ── github_issue_update ─────────────────────────────────────────────────────

/** The follow-up's heading: what it does to the issue, by number — the
 *  comment and the state change ("Comment on and close #688"); labels alone
 *  ("Relabel #688") where it does neither. The fields say the labels. */
function issueUpdateHeader(update: IssueUpdate): string {
  const verbs: string[] = [];
  if (update.comment) verbs.push("comment on");
  if (update.state) verbs.push(update.state === "open" ? "reopen" : "close");
  if (!verbs.length) verbs.push("relabel");
  return `${capital(verbs.join(" and "))} #${update.issue}`;
}

/** State and labels, as the facts a person checks. */
function issueUpdateFacts(update: IssueUpdate): Array<[string, string]> {
  const facts: Array<[string, string]> = [];
  if (update.state) facts.push(["State", capital(stateWords(update.state))]);
  const code = (labels: readonly string[]) => labels.map((l) => `\`${l}\``).join(", ");
  const labels = [
    update.addLabels.length ? `Add ${code(update.addLabels)}` : "",
    update.removeLabels.length ? `Remove ${code(update.removeLabels)}` : "",
  ].filter(Boolean);
  if (labels.length) facts.push(["Labels", labels.join(" · ")]);
  return facts;
}

/**
 * An issue follow-up in the anatomy: what it does to the issue, the issue as a
 * link on its repo and whether that repo is public, the repo's caveat as an
 * alert, state and labels as fields, then the comment — for a confirmer, the
 * prefilled input `review-fields.ts` offers, required as it says.
 */
export function issueUpdateAnatomy(input: Input, detail: AnatomyContext): DraftAnatomy {
  const read = issueUpdateFromInput(input);
  const notice = repoNotice(detail.cardText);
  // The card's `Issue` line is the resolver's `repo#number`.
  const ref = /^(\S+?)#(\d+)$/.exec(cardField(detail.cardText, "Issue"));
  const repo = ref?.[1] ?? notice?.repo ?? (str(input.repo).includes("/") ? str(input.repo) : DEFAULT_REPO);
  if (!read.ok) {
    return { header: "Update a GitHub issue", where: [{ type: "text", text: "On " }, { type: "link", url: repoUrl(repo), text: repo }, repoTail(notice)], content: [] };
  }
  const { update } = read;
  const content: unknown[] = [];
  const facts = issueUpdateFacts(update);
  if (facts.length) content.push(factsSection(facts));
  textOrInput(content, detail, "comment", "Comment", update.comment ?? "");
  return {
    header: issueUpdateHeader(update),
    where: [
      { type: "text", text: "On " },
      { type: "link", url: `${repoUrl(repo)}/issues/${update.issue}`, text: `${repo}#${update.issue}` },
      repoTail(notice),
    ],
    alerts: [...otherAlerts(detail.cardText), ...(notice ? [repoAlert(notice, "comment")] : [])],
    content,
  };
}

// ── github_workflow_run ─────────────────────────────────────────────────────

/** Said for a run's inputs: the tool takes none, so the person sees there is
 *  nothing they could get wrong. */
const NO_INPUTS = "None";

/**
 * A workflow run in the anatomy: "Run <workflow>", the repo as a link, then
 * workflow, branch and inputs as fields. The repo and branch are the card's:
 * the listed repo and its default branch, or the card's words where that
 * branch could not be read.
 */
export function workflowRunAnatomy(input: Input, detail: AnatomyContext): DraftAnatomy {
  const workflow = str(input.workflow) || cardField(detail.cardText, "Workflow");
  const repo = cardField(detail.cardText, "Repo") || str(input.repo);
  const branch = cardField(detail.cardText, "Branch");
  const branchWords = !branch ? "The default" : /\s/.test(branch) ? capital(branch) : `\`${branch}\` (the default)`;
  const where: WhereElement[] = repo.includes("/")
    ? [{ type: "text", text: "Starts a GitHub Actions run on " }, { type: "link", url: repoUrl(repo), text: repo }, { type: "text", text: "." }]
    : [{ type: "text", text: repo ? `Starts a GitHub Actions run on ${repo}.` : "Starts a GitHub Actions run." }];
  return {
    header: workflow ? `Run ${workflow}` : "Run a GitHub workflow",
    where,
    alerts: otherAlerts(detail.cardText),
    content: [
      factsSection([
        ["Workflow", workflow ? `\`${workflow}\`` : "Not named"],
        ["Branch", branchWords],
        ["Inputs", NO_INPUTS],
      ]),
    ],
  };
}

// ── github_issue_create ─────────────────────────────────────────────────────

/** Where the card says the issue is filed: its heading's repo. */
const ISSUE_HEADING = /^:warning: About to \*file a GitHub issue on (\S+)\*:$/m;

/**
 * A new issue in the anatomy: "File a GitHub issue", the repo as a link in the
 * where line and whether it is public, that caveat as an alert above the
 * inputs, then the title and the body — for a confirmer, prefilled inputs; for
 * anyone else, the title and the body as GitHub will render it.
 */
export function issueCreateAnatomy(input: Input, detail: AnatomyContext): DraftAnatomy {
  const notice = repoNotice(detail.cardText);
  const repo = ISSUE_HEADING.exec(detail.cardText)?.[1] ?? notice?.repo ?? (str(input.repo).includes("/") ? str(input.repo) : DEFAULT_REPO);
  const content: unknown[] = [];
  textOrInput(content, detail, "title", "Title", str(input.title));
  // Markdown GitHub renders itself, so the pop-up tidies it the same way.
  textOrInput(content, detail, "body", "Body", str(input.body), (label, body) => [
    { type: "section", text: { type: "mrkdwn", text: `*${label}*` } },
    ...reviewSections(body),
  ]);
  return {
    header: "File a GitHub issue",
    where: [{ type: "text", text: "Files on " }, { type: "link", url: repoUrl(repo), text: repo }, repoTail(notice)],
    alerts: [...otherAlerts(detail.cardText), ...(notice ? [repoAlert(notice, "issue")] : [])],
    content,
  };
}
