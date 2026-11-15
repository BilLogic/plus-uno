/**
 * The regions an anatomy leader line must never cross unless the leader labels
 * them: the Frame's docked Sidebar and its AI Panel. `LiveAnatomy` reads this to
 * pick each marker's gutter, and the play assertions read it to check the result.
 */
export const ANATOMY_REGIONS = '.plus-frame__sidebar, .plus-frame__panel';

/** Whether `region` is the part's own element, or holds it, or sits inside it: a leader to a part is allowed to touch those. */
export const isOwnRegion = (region, target) => region === target || region.contains(target) || target.contains(region);
