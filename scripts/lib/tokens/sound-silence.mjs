/**
 * The always-silent list (spec #2230, ADR-043): where sound never plays, as
 * data `check:sound-registry` reads. A `sound` cell on a covered row or event
 * in `motion-registry.mjs` fails the check.
 *
 * Entry: `{ row, event?, why }`. `row` is a registry row name; omit `event`
 * to silence every event of the row. Every entry names a real registry row
 * and event (`check:sound-registry` fails on one that does not); a silent
 * moment with no row of its own stays in the spec's prose until its row lands.
 */
export const SOUND_SILENT = [
  { row: 'Banner', why: 'Banners persist on screen; a sound would repeat what is already visible.' },
  { row: 'Form', event: 'error', why: 'Field errors are corrections, never an alert.' },
  { row: 'Forms', event: 'error', why: 'Field errors are corrections, never an alert.' },
  { row: 'Errors', event: 'field', why: 'Field errors are corrections, never an alert.' },
  { row: 'Forms', event: 'blocked', why: 'A blocked submit shakes and stays silent.' },
  { row: 'Errors', event: 'blocked', why: 'A blocked submit shakes and stays silent.' },
  { row: 'PatternModal', event: 'rejected', why: 'A blocked submit shakes and stays silent.' },
  { row: 'InlineEdit', event: 'rejected', why: 'A blocked submit shakes and stays silent.' },
  { row: 'InlineEditableTextfield', event: 'rejected', why: 'A blocked submit shakes and stays silent.' },
  { row: 'Empty', why: 'An empty state, and a load failure shown in its slot, are silent.' },
  { row: 'AiMessage', event: 'change', why: 'AI generating and streaming are silent.' },
  { row: 'GenerativeBorder', why: 'AI generating and streaming are silent.' },
  { row: 'PromptInput', why: 'AI generating and streaming are silent.' },
  { row: 'Forms', event: 'saving', why: 'Saves are silent.' },
  { row: 'Loading', event: 'action', why: 'Saves are silent.' },
  { row: 'Indicators', event: 'count-first', why: 'Live counts are silent.' },
  { row: 'Frame', why: 'Navigation is silent.' },
  { row: 'Page', why: 'Navigation is silent.' },
  { row: 'Tabs', why: 'Navigation is silent.' },
  { row: 'Breadcrumb', why: 'Navigation is silent.' },
  { row: 'Sidebar', why: 'Navigation is silent.' },
  { row: 'Pagination', why: 'Navigation is silent.' },
  { row: 'Filtering', why: 'Search and filtering are silent.' },
  { row: 'FilterButton', why: 'Search and filtering are silent.' },
  { row: 'FilterMenu', why: 'Search and filtering are silent.' },
];
