/**
 * A Storybook entry id from its title and name — Storybook's own `toId` and
 * `sanitize` (`storybook/internal/csf`, v10), vendored so the registry
 * generator stays dependency-free: check-harness runs it without a root
 * install. `storybook-id.test.mjs` pins it to ids the live
 * Storybook index carries.
 */

/** Storybook's `sanitize`: lower-case, punctuation to `-`, runs collapsed, ends trimmed. */
export function sanitize(text) {
  return text
    .toLowerCase()
    .replace(/[ ’–—―′¿'`~!@#$%^&*()_|+\-=?;:'",.<>{}[\]\\/]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function sanitizeSafe(text, part) {
  const sanitized = sanitize(text);
  if (sanitized === '') throw new Error(`Invalid ${part} '${text}', must include alphanumeric characters`);
  return sanitized;
}

/**
 * The entry's id, as Storybook's `toId(kind, name)` derives it.
 *
 * @param {string} title - The stories file's `title` (Storybook's kind)
 * @param {string} [name] - The entry's name: `Docs` for an attached docs page
 */
export function storybookId(title, name) {
  return `${sanitizeSafe(title, 'kind')}${name ? `--${sanitizeSafe(name, 'name')}` : ''}`;
}
