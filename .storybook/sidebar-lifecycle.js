// Sidebar lifecycle badges and root grouping, the pure half of the manager's sidebar
// config (manager.js adds the React element and the painting).
//
// A component's meta carries one of three tags when its lifecycle is known: `new`
// (a whole component just landed), `beta` (usable, still moving) or `deprecated`
// (still ships, do not start new work on it). Storybook's own tag filter in the
// sidebar lists every custom tag in the index, so tagging is also what makes the
// list filterable; the badge is what makes it readable without opening the filter.

export const LIFECYCLE_TAGS = ['new', 'beta', 'deprecated'];

/** Worst first: an entry tagged both `new` and `deprecated` reads as deprecated. */
const PRECEDENCE = ['deprecated', 'beta', 'new'];

/** The lifecycle an entry's tags name, or null. */
export const lifecycleOf = (tags) => PRECEDENCE.find((tag) => tags?.includes(tag)) ?? null;

/**
 * The lifecycle an entry shows. A component row has no tags of its own worth
 * trusting, so it reads its children's through `getData`.
 */
export const lifecycleOfEntry = (item, getData) => {
  const own = lifecycleOf(item?.tags);
  if (own || item?.type !== 'component' || !getData) return own;
  const kids = (item.children ?? []).map((id) => lifecycleOf(getData(id)?.tags));
  return kids.length && kids.every(Boolean) ? lifecycleOf(kids) : null;
};

/**
 * Roots that start closed, by id (the title slug, which is what the sidebar matches).
 * Get started stays open as the way in; the selected entry's root opens itself.
 */
export const COLLAPSED_ROOTS = ['foundations', 'components', 'patterns', 'ai', 'tools', 'data-visualizations', 'specs'];

/**
 * The badge's CSS, written as a rule because the manager has no stylesheet that
 * could hold custom properties (same reason as the selected row). The look is the
 * Tag's: a hue on the border, neutral text, a transparent ground.
 */
// The badge's colors are tokens. Its size (16px high, 10px type, 4px radius and padding)
// is literal: the manager has no stylesheet of tokens, and the theme's own type and
// radius stay literal for the same reason (manager.js).
export const badgeRules = (vars = {}) =>
  [
    `.plus-lifecycle-badge { display: inline-flex; align-items: center; box-sizing: border-box; height: 16px; margin-left: 6px; padding: 0 4px; border: 1px solid; border-radius: 4px; font-size: 10px; font-weight: 600; line-height: 1; letter-spacing: 0.02em; text-transform: lowercase; white-space: nowrap; color: ${vars['--plus-manager-badge-text']}; }`,
    // On the selected row the brand ground is dark: the badge takes the row's own ink.
    `.sidebar-container [data-selected='true'] .plus-lifecycle-badge { color: inherit; border-color: currentColor; }`,
    ...LIFECYCLE_TAGS.map(
      (tag) => `.plus-lifecycle-badge[data-lifecycle='${tag}'] { border-color: ${vars[`--plus-manager-badge-${tag}-border`]}; }`,
    ),
  ].join('\n');
