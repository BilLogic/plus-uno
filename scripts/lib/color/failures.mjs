/**
 * Every color check over every plan, plus plan parity, as findings. Shared by
 * `check:color-system` and the generator, which refuses to write while any fail.
 */

import { REPO_ROOT } from '../corpus.mjs';
import { buildAllPlans } from './build.mjs';
import { colorChecks, planParity } from './checks.mjs';

/**
 * @param {{root?: string}} [options]
 * @returns {import('../findings.mjs').Finding[]}  each message names the check, the plan and the mode
 */
export function colorFailures({ root = REPO_ROOT } = {}) {
  const plans = buildAllPlans({ root });
  const found = [];
  for (const [key, { semantics }] of Object.entries(plans)) {
    for (const [check, failures] of Object.entries(colorChecks(semantics))) {
      for (const failure of failures) found.push({ message: `${check}, Plan ${key}: ${failure}` });
    }
  }
  const semantics = Object.fromEntries(Object.entries(plans).map(([key, p]) => [key, p.semantics]));
  for (const failure of planParity(semantics)) found.push({ message: `plan parity: ${failure}` });
  return found;
}
