/**
 * The `typography` collection, and the code name of each of its variables.
 *
 * One collection in four folders: `Font size/*` and `Line height/*` (hidden
 * from publishing, named by rem × 100), `Family/*` and `Weight/*`. It is
 * exported to `design-system/src/tokens/source/typography.json`, beside the
 * text styles that bind every property to one of these variables.
 *
 * A variable's code name is its folder's prefix plus its leaf:
 * `Font size/075` is `--font-size-075`, `Line height/125` is
 * `--line-height-125`, `Family/heading` is `--type-family-heading` and
 * `Weight/medium` is `--type-weight-medium`. Each variable's WEB code syntax
 * in Figma names the same token.
 *
 * The generator and the token registry both read this table, so the two
 * cannot name one variable two ways.
 */
export const TYPOGRAPHY_COLLECTION = 'typography';

/** The export file the collection is read from. */
export const TYPOGRAPHY_FILE = 'typography.json';

/** Each folder: its Figma path prefix, its CSS prefix, and its kind of value. */
export const TYPOGRAPHY_FOLDERS = [
  { figma: 'Font size/', css: '--font-size-', kind: 'size' },
  { figma: 'Line height/', css: '--line-height-', kind: 'size' },
  { figma: 'Family/', css: '--type-family-', kind: 'family' },
  { figma: 'Weight/', css: '--type-weight-', kind: 'weight' },
];

/** The folder a variable path is in, or `null`. */
export const typographyFolder = (name) => TYPOGRAPHY_FOLDERS.find((f) => name.startsWith(f.figma)) ?? null;

/** A variable path's CSS name (`Family/heading` -> `--type-family-heading`), or `null` outside the folders. */
export function typographyToken(name) {
  const folder = typographyFolder(name);
  return folder ? `${folder.css}${name.slice(folder.figma.length)}` : null;
}
