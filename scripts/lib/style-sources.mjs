/**
 * Finding a component's style file by name, not by path.
 *
 * The illustration kit records which stylesheet each drawn role reads (a file
 * name such as `Button.scss`). A name is looked up across the tracked style
 * files in the library, so moving a component's stylesheet to another folder
 * needs no edit in the kit. Two stylesheets can share a name (`Table.scss` is
 * both the component and the template); a source then carries the folder it sits
 * in by its top-level area (`components`, two stars, `Table.scss`, which survives a move
 * between groups inside `components`), and a name that still matches several,
 * or none, is an error naming the matches.
 */

import { LIBRARY_ROOT } from './ds-facts.mjs';
import { trackedFiles } from './tracked-sources.mjs';

const STYLE = /\.(scss|css)$/;

/** Every tracked style file under the library, relative to `LIBRARY_ROOT`. */
export function libraryStyleFiles(repoRoot) {
  return trackedFiles(repoRoot, [LIBRARY_ROOT], { untracked: true, skipHidden: true })
    .filter((file) => STYLE.test(file))
    .map((file) => file.slice(LIBRARY_ROOT.length + 1));
}

/**
 * The one file in `files` that `source` names: a file name or path suffix on a
 * folder boundary, optionally under an area (`area`, a slash, two stars, a slash, then the name). Throws when none, or
 * more than one, matches.
 */
export function resolveStyleSource(files, source) {
  const [area, name] = source.includes('/**/') ? source.split('/**/') : [null, source];
  const matches = files.filter(
    (file) => (area === null || file.startsWith(`${area}/`)) && (file === name || file.endsWith(`/${name}`)),
  );
  if (matches.length === 1) return matches[0];
  throw new Error(
    matches.length === 0
      ? `No style file matches "${source}"`
      : `"${source}" matches ${matches.length} style files (${matches.join(', ')}): name the folder too`,
  );
}
