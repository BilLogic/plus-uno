/**
 * Drop comments before any export is matched, leaving strings alone.
 *
 * The barrels carry a running commentary — why `BadgeVariants` is a second
 * export through the deprecation period, why `constants.js` stays private —
 * and some of that commentary is a disabled export line kept for the record.
 * Matching export syntax against raw text cannot tell the two apart.
 *
 * The scan tracks quotes rather than running a regex over the whole file,
 * because a specifier may legally contain `//` — `https://…` in a bare URL
 * import, or any specifier a future bundler resolves. Truncating such a line
 * at the `//` would erase its export from the existence law without a word,
 * which is the failure this reader exists to prevent, pointed the other way.
 *
 * Shared by the DS facts module's barrel reader and the components-index
 * coverage test, which reads the barrel a second, independent way.
 */
export function stripComments(source) {
  let out = '';
  let quote = null; // the delimiter of the string being scanned, or null

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];

    if (quote) {
      out += ch;
      if (ch === '\\') {
        out += source[i + 1] ?? '';
        i += 1;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      out += ch;
      continue;
    }

    if (ch === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i += 1;
      out += '\n';
      continue;
    }

    if (ch === '/' && source[i + 1] === '*') {
      const close = source.indexOf('*/', i + 2);
      i = close === -1 ? source.length : close + 1;
      continue;
    }

    out += ch;
  }

  return out;
}
