// Who is active, for a test (#1361): built from Team Members rows the way the
// daily sync builds it (`matchRoster`), or everyone, for a test about
// something else.
import { activePeopleOf, matchRoster, type ActivePeople, type DirectoryPerson } from "../../src/usage/roles";

/** One Team Members row, with the Slack member it matches. */
export interface TestRow {
  name: string;
  slack?: string;
  affiliation?: string;
}

/**
 * The active people the sync would store for these rows. Each row with a
 * `slack` is a Slack member of its name; `others` are Slack members with no
 * row — someone who left before the database existed.
 *
 * @param rows - The Team Members rows
 * @param others - Slack members with no row
 */
export function activeFrom(rows: readonly TestRow[], others: readonly DirectoryPerson[] = []): ActivePeople {
  const directory: DirectoryPerson[] = [...rows.flatMap((r) => (r.slack ? [{ id: r.slack, real_name: r.name }] : [])), ...others];
  return activePeopleOf(
    matchRoster(
      rows.map((r) => ({ name: r.name, ...(r.affiliation ? { affiliation: r.affiliation } : {}), ...(r.slack ? { slackUserId: r.slack } : {}) })),
      directory,
    ),
  );
}

/** Everyone active, every name an active row's: a test about something else. */
export const EVERYONE_ACTIVE: ActivePeople = {
  slack: { has: () => true } as unknown as ReadonlySet<string>,
  names: { has: () => true } as unknown as ReadonlySet<string>,
};
