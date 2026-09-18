// Compatibility face: the antecedent window lives with Turn now (#623).
//
// The window is what the MODEL reads, not what a person sees, so the rules,
// the deictic test and the framing block sit in `turn/antecedent.ts`. This
// file keeps the import path tests and Slack-side callers already use.
export {
  ANTECEDENT_LIMIT,
  formatAntecedent,
  needsAntecedent,
  type PriorMessage,
} from "../turn/antecedent";
