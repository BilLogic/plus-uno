/**
 * The frame and layer token sets, and the code name of each variable.
 *
 * These are the Figma collections the Layout Grid Lab settled for the page
 * frame and the layers on it (the lab is the claude.ai artifact the token spec
 * cites; its Tokens tab holds every name and value):
 *
 * - `spacing / layout`: what changes by breakpoint, in modes Medium (768px) ·
 *   Large (1024px) · X-Large (1440px), named as `size / layout` names them.
 *   Folders Topbar · Sidebar · Grid · Content · Modal, and Surface.
 * - `spacing / patterns`: one folder per pattern (Surface container, Section,
 *   Card, Table, Overlay, Modal, Popover), one mode.
 * - `color / patterns`: pattern colors, starting with `Overlay/scrim`.
 *
 * Each is exported to `design-system/src/tokens/source/` with ` / ` written
 * as ` _ `, as the older `size / *` exports are.
 *
 * A variable's code name is its folder plus its last name segment, with no
 * family prefix: Patterns > `Card/pad-sm` is `--card-pad-sm`, Patterns >
 * `Popover/Menu/pad-menu` is `--popover-pad-menu`, Color > `Overlay/scrim` is
 * `--overlay-scrim`. In `spacing / layout` every folder is `--layout-*`
 * (`Topbar/height-topbar` is `--layout-height-topbar`) except Surface, which
 * keeps its own name (`Surface/pad` is `--surface-pad`).
 *
 * The generator, the token registry and the Figma sync all read this list, so
 * a new set is one row here.
 */
export const FRAME_LAYER_COLLECTIONS = [
  { name: 'spacing / layout', layout: true, heading: 'spacing / layout: the frame and the surface, per breakpoint' },
  { name: 'spacing / patterns', heading: 'spacing / patterns' },
  { name: 'color / patterns', heading: 'color / patterns' },
];

const BY_NAME = new Map(FRAME_LAYER_COLLECTIONS.map((c) => [c.name, c]));

/** Whether a Figma collection name is one of these. */
export const isFrameLayerCollection = (name) => BY_NAME.has(name);

/** The export file a set is read from: `spacing / layout` -> `spacing _ layout.json`. */
export const frameLayerFile = (name) => `${name.replace(/ \/ /g, ' _ ')}.json`;

/**
 * The custom property (without `--`) a variable in one of these sets is
 * declared as.
 *
 * @param {string} collection Figma collection name, e.g. `spacing / patterns`
 * @param {string} variable Figma variable name, e.g. `Popover/Menu/pad-menu`
 */
export function frameLayerToken(collection, variable) {
  const c = BY_NAME.get(collection);
  if (!c) throw new Error(`${collection} is not a frame or layer set.`);
  const parts = variable.split('/').map((p) => p.trim());
  if (parts.length < 2) throw new Error(`${collection} > ${variable} sits in no folder; its folder names it.`);
  const folder = parts[0].toLowerCase().replace(/\s+/g, '-');
  const head = c.layout && folder !== 'surface' ? 'layout' : folder;
  return `${head}-${parts[parts.length - 1]}`;
}

/** The folder a variable is grouped under in the stylesheet: `Popover/Menu/pad-menu` -> `Popover`. */
export const frameLayerFolder = (variable) => variable.split('/')[0].trim();
