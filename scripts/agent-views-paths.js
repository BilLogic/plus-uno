/**
 * Shared paths for the generated agent-views facts.
 *
 * These are generated *facts* — the component existence list and the token
 * list. The per-component skeleton pipeline that used to live here was deleted
 * (#156): it emitted 56 placeholders that told an agent to go read the JSX,
 * waiting on frontmatter present in 0 of 387 MDX files. The authored half
 * returns under #165/#166, derived from source rather than from a new input.
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..');
export const AGENT_ROOT = path.join(REPO_ROOT, 'design-system/agent-views');
