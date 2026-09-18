/**
 * The shape table — what every baseline record in this repo actually looks like.
 *
 * WHY IT EXISTS, AND WHY IT IS A SURVEY RATHER THAN A CONVENTION. Twelve rows
 * in `scripts/checks.registry.mjs` declare a `baseline`, and the twelve records
 * are NOT one shape. They were written a year apart by checks that each decided
 * privately where the keyed set lived, whether an entry was a number or an
 * object, whether it carried a count at all, and where the human's reason went.
 * A ratchet module that assumed one shape and read `record.findings` would find
 * an empty set in most of them — and an empty baseline is a GREEN ratchet, so
 * the mis-read is invisible. `scripts/lib/ratchet.mjs` therefore reads a record
 * through its declared row here, and refuses a record it has no row for.
 *
 * The survey, entire, as of 2026-09-18 (#599):
 *
 *   FORM        records                                    what a key is
 *   keys        button-contrast, colour-fallback,          a string in an array;
 *               size-fallback                              presence only, no count
 *   lists       a11y `stories`                             key → array of member
 *                                                          ids; each MEMBER is a
 *                                                          finding, joined `key|member`
 *   counts      a11y `rules`, atlassian `ours`,            key → number
 *               negation `scopes.*.counts`
 *   entries     intent-role `files`, text-contrast         key → object with one
 *               `findings`, undefined-token `tokens`       or more NAMED numbers
 *   reasons     focus-ring/icon-button-name `exceptions`   key → the reason itself
 *   scalar      glossary `proseLines`, negation's per-     no keyed set at all:
 *               scope `docs`/`total`, undefined-token      named numbers on the
 *               `totals`                                   record
 *
 * WHERE A REASON LIVES is the part the first attempt at #599 got wrong, and it
 * is the part that costs a record: three of the twelve keep the reason OUTSIDE
 * the entry. `button-contrast` keeps `notes` as a SIBLING of the two sets it
 * annotates; `focus-ring` and `icon-button-name` make the exception map's VALUE
 * the reason. A write that rebuilt the record from an envelope and a set would
 * delete all three. So the table declares the reason's home, `update` only ever
 * replaces the container at the declared path, and everything else on the
 * record survives by construction.
 *
 * ROW SHAPE.
 *   file      repo-relative path. THE KEY, because it is also what the check
 *             itself names and what `checks.registry.mjs` declares, so there is
 *             one spelling of the path and three readers of it.
 *   check     the npm script name, for a message that has to say who.
 *   command   what a person runs to re-record it, or `null` where the record is
 *             maintained by hand and has no `--update`.
 *   prose     dotted path to the record's own explanatory key, for the reader.
 *   sets      one or more ratcheted containers. A record with two sets (a11y,
 *             button-contrast, colour-fallback) has two rows here and each is
 *             the other's unowned sibling.
 *
 * SET SHAPE.
 *   name      how a check asks for it.
 *   at        dotted path to the container within the record. `''` means the
 *             record itself, which is what `scalar` wants.
 *   form      one of the six above.
 *   fields    `entries`: the named numbers that ratchet — `[]` where the entry
 *             carries no number and presence is the whole finding.
 *             `scalar`: the named numbers on the container, which are its keys.
 *   join      `lists` only: the separator between a key and one of its members.
 *   reason    `{ in: field }`  the reason is a field of the entry.
 *             `{ beside: dotted }` the reason is a SIBLING map keyed the same way.
 *             `{ is: 'value' }`  the entry IS the reason.
 *             absent: this set records no reason, and `unreviewed()` is empty.
 *   ignore    keys inside the container that are not entries — `atlassian`'s
 *             `ours` keeps its `note` and `recordedAt` in with its four numbers,
 *             and they are preserved across a write rather than counted.
 *   direction 'shrink-only' (default — a recorded count may fall, never rise),
 *             'grow-only' (a FLOOR: it may rise, never fall), or 'both'.
 *
 * MIGRATING A CHECK DOES NOT EDIT THIS FILE. The rows describe what is on disk
 * today; #600 and #601 move checks onto the module, and a row changes here only
 * when a RECORD changes shape.
 */

/** @typedef {'keys'|'lists'|'counts'|'entries'|'reasons'|'scalar'} RatchetForm */

/**
 * @typedef {object} RatchetSet
 * @property {string} name
 * @property {string} at
 * @property {RatchetForm} form
 * @property {string[]} [fields]
 * @property {string} [join]
 * @property {{in?: string, beside?: string, is?: 'value'}} [reason]
 * @property {string[]} [ignore]
 * @property {'shrink-only'|'grow-only'|'both'} [direction]
 *
 * @typedef {object} RatchetShape
 * @property {string} file
 * @property {string} check
 * @property {string|null} command
 * @property {string} [prose]
 * @property {RatchetSet[]} sets
 */

/** @type {RatchetShape[]} */
export const SHAPES = [
  {
    file: 'docs/evals/a11y-baseline.json',
    check: 'check:storybook',
    command: 'npm run check:storybook -- --update',
    prose: 'measured',
    sets: [
      { name: 'rules', at: 'rules', form: 'counts' },
      // A story's finding is a RULE it violates, not the number of them: swapping
      // one rule for another keeps the length and is a regression. So the member
      // is the key, which is exactly what `check-storybook.mjs` compares.
      { name: 'stories', at: 'stories', form: 'lists', join: '|' },
    ],
  },
  {
    file: 'docs/evals/atlassian-benchmark.json',
    check: 'check:atlassian-benchmark',
    command: 'npm run benchmark:atlassian -- --update',
    prose: 'note',
    sets: [
      {
        name: 'ours',
        at: 'ours',
        form: 'counts',
        // OUR side is a FLOOR, not a ceiling: the four argued rows may rise and
        // must never fall, and `--update` refuses a backwards move. The other
        // side of the record is Atlassian's measurement and is not ours to move.
        direction: 'grow-only',
        ignore: ['note', 'recordedAt'],
      },
    ],
  },
  {
    file: 'docs/evals/button-contrast-baseline.json',
    check: 'check:button-contrast',
    command: null,
    prose: 'why',
    sets: [
      { name: 'contrast', at: 'contrast', form: 'keys', reason: { beside: 'notes' } },
      { name: 'duplicates', at: 'duplicates', form: 'keys', reason: { beside: 'notes' } },
    ],
  },
  {
    file: 'docs/evals/colour-fallback-baseline.json',
    check: 'check:colour-fallbacks',
    command: 'npm run check:colour-fallbacks -- --update',
    prose: 'why',
    sets: [
      { name: 'disagreements', at: 'disagreements', form: 'keys' },
      { name: 'undefinedTokens', at: 'undefinedTokens', form: 'keys' },
    ],
  },
  {
    file: 'docs/evals/focus-ring.json',
    check: 'check:focus-ring',
    command: null,
    prose: 'note',
    // Empty on purpose — all 29 findings of the 2026-08-29 sweep were fixed
    // rather than recorded. The value of an entry would BE the argument for it.
    sets: [{ name: 'exceptions', at: 'exceptions', form: 'reasons', reason: { is: 'value' } }],
  },
  {
    file: 'docs/evals/glossary-baseline.json',
    check: 'check:glossary',
    command: 'node scripts/check-glossary.mjs --update',
    prose: 'note',
    // The one record with no keyed set at all: a single number on the record.
    sets: [{ name: 'proseLines', at: '', form: 'scalar', fields: ['proseLines'] }],
  },
  {
    file: 'docs/evals/icon-button-name.json',
    check: 'check:icon-button-name',
    command: null,
    prose: 'note',
    sets: [{ name: 'exceptions', at: 'exceptions', form: 'reasons', reason: { is: 'value' } }],
  },
  {
    file: 'docs/evals/intent-role-adoption.json',
    check: 'check:intent-roles',
    command: null,
    prose: 'note',
    sets: [
      {
        name: 'files',
        at: 'files',
        form: 'entries',
        fields: ['border', 'outline'],
        reason: { in: 'why' },
        // BOTH directions: a count below the record is a finding too, because a
        // baseline describing code that no longer exists has stopped being
        // readable.
        direction: 'both',
      },
    ],
  },
  {
    file: 'docs/evals/negation-baseline.json',
    check: 'check:negation',
    command: 'node scripts/check-negation-ratchet.mjs --update',
    prose: 'metric.note',
    // Three scopes ratcheted separately out of one file, each with its own
    // envelope, its own per-document counts and its own corpus FLOOR: a scope
    // measured over fewer documents than its record is a corpus that vanished,
    // and a ratchet that only fails on a rise would pass it.
    sets: [
      { name: 'bundled', at: 'scopes.bundled.counts', form: 'counts' },
      { name: 'bundled-corpus', at: 'scopes.bundled', form: 'scalar', fields: ['docs'], direction: 'grow-only' },
      { name: 'ide', at: 'scopes.ide.counts', form: 'counts' },
      { name: 'ide-corpus', at: 'scopes.ide', form: 'scalar', fields: ['docs'], direction: 'grow-only' },
      { name: 'actions', at: 'scopes.actions.counts', form: 'counts' },
      { name: 'actions-corpus', at: 'scopes.actions', form: 'scalar', fields: ['docs'], direction: 'grow-only' },
    ],
  },
  {
    file: 'docs/evals/size-fallback-baseline.json',
    check: 'check:size-fallbacks',
    command: 'npm run check:size-fallbacks -- --update',
    prose: 'why',
    sets: [{ name: 'disagreements', at: 'disagreements', form: 'keys' }],
  },
  {
    file: 'docs/evals/text-contrast-baseline.json',
    check: 'check:text-contrast',
    command: 'npm run check:text-contrast -- --update',
    prose: 'measured',
    sets: [
      { name: 'findings', at: 'findings', form: 'entries', fields: ['count'], reason: { in: 'why' } },
    ],
  },
  {
    file: 'docs/evals/undefined-token-baseline.json',
    check: 'check:undefined-tokens',
    command: 'npm run check:undefined-tokens -- --update',
    prose: 'note',
    sets: [
      // TWO counts held down separately, so converting a fallback into a bare
      // use cannot pass by keeping the total flat.
      { name: 'tokens', at: 'tokens', form: 'entries', fields: ['uses', 'bare'] },
      { name: 'totals', at: 'totals', form: 'scalar', fields: ['names', 'uses', 'bare'] },
    ],
  },
];

const BY_FILE = new Map(SHAPES.map((shape) => [shape.file, shape]));

/**
 * The row for a record, by its repo-relative path.
 *
 * A record with no row THROWS rather than falling back to a default shape: a
 * default is how a mis-read becomes an empty set, and an empty baseline reads
 * as a green ratchet.
 *
 * @param {string} file repo-relative path to the record.
 * @returns {RatchetShape}
 */
export function shapeOf(file) {
  const shape = BY_FILE.get(file);
  if (!shape) {
    throw new Error(
      `${file} has no row in scripts/lib/ratchet-shapes.mjs, so the ratchet does not know ` +
        'what shape it is. Survey the record and add its row — a record read on a guessed ' +
        'shape reads as empty, and an empty baseline is a green ratchet.',
    );
  }
  return shape;
}

/**
 * One declared set of a record, by name. The name is optional for a record that
 * has only one — which is nine of the twelve.
 *
 * @param {RatchetShape} shape
 * @param {string} [name]
 * @returns {RatchetSet}
 */
export function setOf(shape, name) {
  if (name === undefined) {
    if (shape.sets.length !== 1) {
      throw new Error(
        `${shape.file} records ${shape.sets.length} sets (${shape.sets.map((s) => s.name).join(', ')}); ` +
          'name the one to open.',
      );
    }
    return shape.sets[0];
  }
  const set = shape.sets.find((s) => s.name === name);
  if (!set) {
    throw new Error(
      `${shape.file} has no set named '${name}'. It records: ${shape.sets.map((s) => s.name).join(', ')}.`,
    );
  }
  return set;
}
