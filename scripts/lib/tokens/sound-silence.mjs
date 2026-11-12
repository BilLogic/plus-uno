/**
 * The always-silent list (spec #2230, ADR-043): where sound never plays, as
 * data `check:sound-registry` reads. A `sound` cell on a covered row or event
 * in `motion-registry.mjs` fails the check.
 *
 * Entry: `{ row, event?, why }`. `row` is a registry row name; omit `event`
 * to silence every event of the row. An entry may name a row the registry
 * does not hold yet, so the rule is in force before the row lands.
 */
export const SOUND_SILENT = [
  { row: 'Banner', why: 'Banners persist on screen; a sound would repeat what is already visible.' },
  { row: 'FieldBox', event: 'error', why: 'Field errors are corrections, never an alert.' },
  { row: 'Field', event: 'error', why: 'Field errors are corrections, never an alert.' },
  { row: 'Form', event: 'blocked', why: 'A blocked submit shakes and stays silent.' },
  { row: 'EmptyState', event: 'error', why: 'Load failures in the empty-state slot are silent.' },
  { row: 'AiMessage', event: 'generating', why: 'AI generating and streaming are silent.' },
  { row: 'AiMessage', event: 'streaming', why: 'AI generating and streaming are silent.' },
  { row: 'AiMessage', event: 'revise', why: '"Revise your response" is silent.' },
  { row: 'Goal', event: 'updated', why: '"Goal updated" is silent.' },
  { row: 'Save', why: 'Saves are silent.' },
  { row: 'Counter', event: 'change', why: 'Live counts are silent.' },
  { row: 'Copy', why: '"Copied" is silent.' },
  { row: 'Navigation', why: 'Navigation is silent.' },
  { row: 'Search', why: 'Search is silent.' },
  { row: 'Filter', why: 'Filtering is silent.' },
  { row: 'FilterButton', why: 'Filtering is silent.' },
  { row: 'FilterMenu', why: 'Filtering is silent.' },
  { row: 'Strike', why: 'Strikes and coaching flags are silent.' },
  { row: 'CoachingFlag', why: 'Strikes and coaching flags are silent.' },
  { row: 'Escalation', why: 'Escalations are silent.' },
  { row: 'Concern', why: 'Any concern a student can hear is silent.' },
];
