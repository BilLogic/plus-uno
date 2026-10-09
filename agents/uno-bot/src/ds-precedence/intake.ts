// `ds_precedence_intake` — the one operation a weekly DS precedence card runs,
// past its Review's Approve, and the write a Needs changes on it makes. A
// `worker` tool: only the morning post stages it (`./jobs.ts`), and the model
// is never offered it.
//
// ONE INTAKE A WEEK, decided when the write runs, not when the card posted.
// The week's intake is a filing in ThreadState (`claimFiling`, keyed by the
// week), whose Durable Object answers one caller at a time:
//   • filed — comment this section on the issue it records;
//   • claimed — this caller files. First it looks on GitHub, every intake
//     updated since the week began, open or closed, for the week's marker
//     (`precedenceMarker`): an intake filed before the store recorded it is
//     commented on, and recorded. Only when none is found does it file one,
//     with this section as its first;
//   • busy — another caller is filing right now: wait, and ask again.
// So two Approves back to back make one intake and one comment, and an
// intake closed mid-week is still found and commented on, never filed twice.
//
// The writes themselves are `github_issue_create` and `github_issue_update`'s
// own executors — the triage labels, the footer and the thread's one line all
// stay theirs — bound in `tools/ds-precedence-intake.ts`.
//
// Pure: every dependency arrives by name.

import type { FiledIssue, FilingClaim } from "../thread-state/index";
import { intakeBody, precedenceIntakeTitle, precedenceMarker } from "./report";

/** How many times a busy filing is asked again, and how long between. */
const BUSY_TRIES = 10;
const BUSY_WAIT_MS = 1_500;

export interface IntakeDeps {
  /** The week's filing (`ThreadState.claimFiling` / `settleFiling`). */
  filing: {
    claim(key: string): Promise<FilingClaim>;
    settle(key: string, issue: FiledIssue | null): Promise<void>;
  };
  /** Every `harness-intake` issue updated since `since` (ISO), open or
   *  closed, and whether that was all of them. */
  intakesSince(since: string): Promise<{ intakes: Array<{ number: number; url: string; body: string }>; complete: boolean }>;
  /** File an intake: `github_issue_create`'s executor, its JSON result. */
  create(input: { title: string; body: string }): Promise<string>;
  /** Comment on an issue: `github_issue_update`'s executor, its JSON result. */
  comment(input: { issue_number: number; comment: string }): Promise<string>;
  sleep(ms: number): Promise<void>;
}

/** The filing key a week's intake is held under. */
export function weeklyIntakeKey(weekOf: string): string {
  return `ds-precedence:${weekOf}`;
}

const failed = (error: string) => JSON.stringify({ ok: false, error });

/**
 * Add one section to the week's intake, filing the intake when the week has
 * none.
 *
 * Never throws: a bad input, a failed read or a filing that stays busy is
 * `ok:false` with the cause, and nothing is filed.
 *
 * @param input - `week_of` and `section`, as the card staged them
 * @param deps - The filing, the intake read and the two GitHub writes
 */
export async function addToWeeklyIntake(input: Record<string, unknown>, deps: IntakeDeps): Promise<string> {
  const weekOf = typeof input.week_of === "string" ? input.week_of : "";
  const section = typeof input.section === "string" ? input.section.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekOf)) return failed("missing 'week_of'");
  if (!section) return failed("missing 'section'");
  const key = weeklyIntakeKey(weekOf);
  const comment = (issue: FiledIssue) => deps.comment({ issue_number: issue.number, comment: section });

  for (let tries = 0; tries < BUSY_TRIES; tries++) {
    const claim = await deps.filing.claim(key);
    if (claim.state === "filed") return comment(claim.issue);
    if (claim.state === "busy") {
      await deps.sleep(BUSY_WAIT_MS);
      continue;
    }
    return fileOrFind(weekOf, key, section, deps, comment);
  }
  return failed("this week's intake is still being filed, so nothing was added; try again in a minute");
}

/** Holding the claim: find the week's intake on GitHub, or file it. */
async function fileOrFind(
  weekOf: string,
  key: string,
  section: string,
  deps: IntakeDeps,
  comment: (issue: FiledIssue) => Promise<string>,
): Promise<string> {
  let release = true;
  try {
    const marker = precedenceMarker(weekOf);
    const look = await deps.intakesSince(`${weekOf}T00:00:00Z`);
    const found = look.intakes.find((i) => i.body.includes(marker));
    if (found) {
      const issue = { number: found.number, url: found.url };
      await deps.filing.settle(key, issue);
      release = false;
      return comment(issue);
    }
    // Filing past a page that ran out could make a second intake.
    if (!look.complete) return failed("couldn't read every intake updated this week, so nothing was filed");
    const result = await deps.create({ title: precedenceIntakeTitle(weekOf), body: intakeBody(weekOf, section) });
    const filed = JSON.parse(result) as { ok?: boolean; issue_number?: unknown; issue_url?: unknown };
    if (filed.ok !== false && typeof filed.issue_number === "number" && typeof filed.issue_url === "string") {
      await deps.filing.settle(key, { number: filed.issue_number, url: filed.issue_url });
      release = false;
    }
    return result;
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    return failed(`couldn't read this week's intakes, so nothing was filed: ${cause}`);
  } finally {
    if (release) await deps.filing.settle(key, null).catch(() => {});
  }
}
