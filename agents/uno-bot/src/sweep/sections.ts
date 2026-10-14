// What other morning jobs hand the sweep's post: their cards for a place, to
// go up on that place's one message.
//
// ONE MESSAGE A PLACE. The card follow-ups, the weekly DS precedence report,
// the Figma comment decisions, the Figma drift questions and the weekly Figma
// tidy-up each used to post on their own. Now each job that finds them runs
// before `sweep-post` and leaves its cards here, by place — a channel's top, or
// a thread — and `sweep-post` puts every section a place has on that place's
// report, beside its own fixes: one opener bullet per person (a section with
// nobody to tag has a line of its own), then one carousel. A place with no
// fixes gets its sections alone, on one message all the same.
//
// A SECTION IS ITS JOB'S. The sweep shows the cards and keeps the report's
// record; the job's `posted` stages each card it showed as its own proposal,
// with its own confirmers, window and words, and keeps whatever did not show
// for the next morning. `notPosted` gives a place's cards back to their job.
// A report claims a place's cards before it posts, so a retried morning finds
// them by its key and never shows them twice. A place stays in the hand-off,
// claimed, until its job has staged every card it showed, each card marked as
// it goes (`SectionProgress`): a budget stop part-way is retried from the
// mark, and nothing it showed is lost or staged twice.
//
// THE HAND-OFF lives in the morning run's own runner storage (`JobContext.
// runStorage`): one key a job a morning, read and written whole by that exact
// key, consistent between the run's alarms, which share the instance.
// `handedSection` turns a job's hand-off into the port `sweep-post` reads.
//
// PURE: the storage arrives as a port.

import type { RunnerStorage } from "../runner/storage";
import type { ReportItem } from "../thread-state/index";

/** Where a section goes: a thread, or a channel's top (`threadTs: null`). */
export interface SectionPlace {
  channel: string;
  threadTs: string | null;
}

/** One job's cards for one place, waiting for the morning's post. */
export interface SectionCards extends SectionPlace {
  /** The job they came from (`SweepSection.source`). */
  source: string;
  /** The morning they were handed over. */
  date: string;
  /** Each card and the person it is for, in the order asked; `null` for a
   *  card nobody owns, which the section's own line introduces. */
  cards: Array<{ person: string | null; item: ReportItem }>;
  /** Every card shows or none does: a weekly report never splits over two
   *  messages. It goes first, and past the carousel's ten it shows ten and
   *  says so. */
  whole?: boolean;
  /** How long its cards stay decidable, so the report's record outlives them. */
  ttlMs?: number;
  /** Lines with no card of their own, said under the opener (a pointer to a
   *  card in another thread). */
  lines?: string[];
  /** What its `posted` spends once the report is up, for the cards that
   *  showed (by item id): each one's staging, and any line it posts in the
   *  thread. Never the whole queue: only what goes up this morning. Absent,
   *  each card shown costs a staging's D1 queries. */
  cost?(shown: readonly string[]): { subrequests: number; d1Queries: number };
  /** What the opener says of a person's cards, or — `person: null` — of the
   *  section's cards nobody owns, by their item ids. */
  says(ids: readonly string[], person: string | null): string;
}

/** One job's hand-off, as the sweep's morning post reads it. */
export interface SweepSection {
  /** The job's name, unique among the sections: `"follow-ups"`. */
  readonly source: string;
  /** Each place's cards waiting this morning, unclaimed. */
  waiting(): Promise<SectionCards[]>;
  /** A report takes a place's cards, by its card key, before it posts —
   *  with the cards it shows, by item id, so a retry rebuilds it as it went
   *  up. */
  claim(place: SectionCards, cardKey: string, shown?: readonly string[]): Promise<void>;
  /** The cards a report claimed — those it showed, when it said — still to
   *  stage; null when none. */
  claimed(cardKey: string): Promise<SectionCards | null>;
  /** A report that never went up gives its cards back. */
  unclaim(cardKey: string): Promise<void>;
  /** Places a morning's own message claimed (`isAloneKey`) and never
   *  finished: a stop fell between its claim and its staging. */
  stranded(date: string): Promise<Array<{ cardKey: string; place: SectionCards }>>;
  /** The report is up and its record kept: the cards it showed, by item id,
   *  are staged; the rest wait for the next morning. */
  posted(place: SectionCards, shown: readonly string[], report: { ts: string; text: string }): Promise<void>;
  /** The report did not go up, or was withdrawn: every card waits for the
   *  next morning. */
  notPosted(place: SectionCards, why: string): Promise<void>;
}

/** The card follow-ups' section (`../follow-through/`). */
export const FOLLOW_UPS_SECTION = "follow-ups";

/** A place as one key: `<channel>:<thread ts>`, empty for a channel's top. */
export function placeKeyOf(place: SectionPlace): string {
  return `${place.channel}:${place.threadTs ?? ""}`;
}

/** The key of a place's message when it holds sections alone, with no fixes
 *  of the sweep's own: the morning's date, then the place. */
export function aloneKeyOf(date: string, place: SectionPlace): string {
  return `${date}:sections:${placeKeyOf(place)}`;
}

/** Whether a card key is a sections-alone message's (`aloneKeyOf`). */
export function isAloneKey(cardKey: string): boolean {
  return cardKey.slice(10, 20) === ":sections:";
}

/** One place's handed-off value, the report that claimed it, and each card
 *  its job has already handled once that report went up — `true` staged,
 *  `false` failed — by item id. */
export interface StoredPlace<P> extends SectionPlace {
  value: P;
  claimedBy?: string;
  /** The cards the claiming report shows, by item id. */
  shown?: string[];
  done?: Record<string, boolean>;
}

/** What a section's `posted` has already done for a report, from an earlier
 *  try a stop cut short, and how it records each card as it goes. */
export interface SectionProgress {
  /** Each card handled, by item id: `true` staged, `false` failed. */
  readonly done: ReadonlyMap<string, boolean>;
  /** Record a card handled, before the next one starts. */
  mark(id: string, staged: boolean): Promise<void>;
}

/** A job's hand-off in the run's storage. */
export interface SectionHandOff<P> {
  /** Keep a place's value for a morning, in place of any kept before. */
  put(date: string, place: SectionPlace, value: P): Promise<void>;
  /** Every place kept for a morning. */
  places(date: string): Promise<Array<StoredPlace<P>>>;
  claim(date: string, place: SectionPlace, cardKey: string, shown?: readonly string[]): Promise<void>;
  unclaim(date: string, cardKey: string): Promise<void>;
  /** Record one card of a place handled once its report is up. */
  mark(date: string, place: SectionPlace, id: string, staged: boolean): Promise<void>;
  /** A place is posted, or given up: it is not kept. */
  clear(date: string, place: SectionPlace): Promise<void>;
}

/**
 * A job's hand-off in the morning run's runner storage, under
 * `section:<source>:<date>`.
 *
 * @param storage - The run's storage (`JobContext.runStorage`)
 * @param source - The job's section name
 */
export function sectionHandOffIn<P>(storage: Pick<RunnerStorage, "get" | "put" | "delete">, source: string): SectionHandOff<P> {
  const keyOf = (date: string) => `section:${source}:${date}`;
  const read = async (date: string) => new Map(Object.entries((await storage.get<Record<string, StoredPlace<P>>>(keyOf(date))) ?? {}));
  const change = async (date: string, edit: (places: Map<string, StoredPlace<P>>) => void) => {
    const places = await read(date);
    edit(places);
    if (places.size) await storage.put(keyOf(date), Object.fromEntries(places));
    else await storage.delete(keyOf(date));
  };
  return {
    put: (date, place, value) =>
      change(date, (places) => {
        places.set(placeKeyOf(place), { channel: place.channel, threadTs: place.threadTs, value });
      }),
    places: async (date) => [...(await read(date)).values()],
    claim: (date, place, cardKey, shown) =>
      change(date, (places) => {
        const kept = places.get(placeKeyOf(place));
        if (kept) places.set(placeKeyOf(place), { ...kept, claimedBy: cardKey, ...(shown ? { shown: [...shown] } : {}) });
      }),
    unclaim: (date, cardKey) =>
      change(date, (places) => {
        for (const [key, kept] of places) {
          if (kept.claimedBy !== cardKey) continue;
          const { claimedBy: _claimed, shown: _shown, done: _done, ...rest } = kept;
          places.set(key, rest);
        }
      }),
    mark: (date, place, id, staged) =>
      change(date, (places) => {
        const kept = places.get(placeKeyOf(place));
        if (kept) places.set(placeKeyOf(place), { ...kept, done: { ...kept.done, [id]: staged } });
      }),
    clear: (date, place) =>
      change(date, (places) => {
        places.delete(placeKeyOf(place));
      }),
  };
}

/** What a job's section reads of a place's value, and does once it is up. */
export interface HandedSectionSpec<P> {
  source: string;
  /** The morning it is read on. */
  date: string;
  handOff: SectionHandOff<P>;
  /** The place's cards and what the opener says of them. */
  cardsOf(value: P): Pick<SectionCards, "cards" | "says"> & Partial<Pick<SectionCards, "whole" | "ttlMs" | "lines" | "cost">>;
  /** The cards it showed, by item id, staged, and the rest kept. Each card
   *  `progress` holds was handled by an earlier try: it is not staged again,
   *  and counts as it came out. Each card handled now is marked at once. */
  posted(value: P, place: SectionPlace, shown: readonly string[], report: { ts: string; text: string }, progress: SectionProgress): Promise<void>;
  /** Every card kept for the next morning. */
  notPosted(value: P, place: SectionPlace, why: string): Promise<void>;
}

/**
 * A job's hand-off as the port `sweep-post` reads (`SweepSection`). A place
 * posted stays in the hand-off, claimed, while its job stages, with each card
 * marked as it is handled, and is cleared once its job is done: a stop part-way
 * leaves it for the retry, which carries on from the marks.
 *
 * @param spec - The hand-off and what the job does with a place
 */
export function handedSection<P>(spec: HandedSectionSpec<P>): SweepSection {
  const dateOf = (cardKey: string) => cardKey.slice(0, 10);
  const cardsOf = (date: string, kept: StoredPlace<P>): SectionCards => ({
    source: spec.source,
    date,
    channel: kept.channel,
    threadTs: kept.threadTs,
    ...spec.cardsOf(kept.value),
  });
  /** A claimed place as its report showed it: the cards it went up with. */
  const asClaimed = (date: string, kept: StoredPlace<P>): SectionCards => {
    const place = cardsOf(date, kept);
    return kept.shown ? { ...place, cards: place.cards.filter((c) => kept.shown!.includes(c.item.id)) } : place;
  };
  const keptAt = async (place: SectionCards): Promise<StoredPlace<P> | undefined> =>
    (await spec.handOff.places(place.date)).find((p) => placeKeyOf(p) === placeKeyOf(place));
  /** The place's value, out of the hand-off; null when already taken. */
  const take = async (place: SectionCards): Promise<P | null> => {
    const kept = await keptAt(place);
    if (!kept) return null;
    await spec.handOff.clear(place.date, place);
    return kept.value;
  };
  return {
    source: spec.source,
    async waiting() {
      return (await spec.handOff.places(spec.date)).filter((p) => !p.claimedBy).map((p) => cardsOf(spec.date, p));
    },
    claim: (place, cardKey, shown) => spec.handOff.claim(place.date, place, cardKey, shown),
    async claimed(cardKey) {
      const date = dateOf(cardKey);
      const kept = (await spec.handOff.places(date)).find((p) => p.claimedBy === cardKey);
      return kept ? asClaimed(date, kept) : null;
    },
    unclaim: (cardKey) => spec.handOff.unclaim(dateOf(cardKey), cardKey),
    async stranded(date) {
      return (await spec.handOff.places(date)).flatMap((p) => (p.claimedBy && isAloneKey(p.claimedBy) ? [{ cardKey: p.claimedBy, place: asClaimed(date, p) }] : []));
    },
    async posted(place, shown, report) {
      const kept = await keptAt(place);
      if (!kept) return;
      const done = new Map(Object.entries(kept.done ?? {}));
      const progress: SectionProgress = {
        done,
        async mark(id, staged) {
          done.set(id, staged);
          await spec.handOff.mark(place.date, place, id, staged);
        },
      };
      await spec.posted(kept.value, place, shown, report, progress);
      await spec.handOff.clear(place.date, place);
    },
    async notPosted(place, why) {
      const value = await take(place);
      if (value !== null) await spec.notPosted(value, place, why);
    },
  };
}
