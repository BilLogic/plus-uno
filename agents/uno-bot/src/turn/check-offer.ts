// The blueprint check offer — the Check it button a milestone is followed by.
//
// A staged PRD's card and a reply handing a build to the IDE are milestones
// (`blueprint-upkeep/milestone.ts`). Nothing of the blueprint runs in front of
// either (#1321): once the card or the reply is up, a quick service-change
// judgement (`TurnDeps.serviceChangeJudgement`) decides whether the idea
// touches today's blueprint, and only a match is offered. The check itself is
// a job someone asks for by pressing the button (`slack/blueprint-check.ts`);
// what it will need is kept under the offer's ts.
//
// Its own module because it changes for its own reasons: what the judgement
// is asked, when an offer is made and what it keeps edit this file and leave
// the turn loop (`turn.ts`) and card staging (`card-staging.ts`) alone. It is
// a courtesy beside the card, so it fails quiet: the card or the reply stands
// whatever happens here.
//
// PURE as the turn is: no `Env`, no Workers type, no fetch.

import type { Milestone } from "../blueprint-upkeep/milestone";
import { cardExpiresAt } from "../card-expiry";
import { rethrowIfBudget } from "../net";
import type { CardConversation, CardOrigin } from "./card-staging";
import type { PostResult } from "./delivery";
import type { TurnDeps } from "./turn";

/**
 * Where a Check it offer goes and whose it is: the thread, the requester, and
 * the card it posts under — absent at a hand-off to the IDE, which stages
 * none (#1324).
 */
type CheckOfferPlace = CardOrigin & CardConversation & {
  cardTs?: string;
  /** The card's matter (`supersedeKey`), which the results' action finds
   *  the matter's current card by (#1323). */
  cardKey?: string;
};

/**
 * Offer the blueprint check under a milestone's card (#1321) or its hand-off
 * reply (#1324), when the quick judgement finds the idea touches today's
 * blueprint: the offer posts after them, and what its check will need is kept
 * under the offer's ts. Null — nothing posted — for no port, no match, a
 * failed judgement, or an offer that did not post. Fails quiet past a budget
 * stop: the card or the reply stands.
 *
 * @param milestone - The idea the card stages or the reply hands off
 * @param at - The thread and requester, and the card's ts when there is one
 * @param now - When the offer goes up, for its deadline
 */
export async function offerCheck(
  milestone: Milestone,
  at: CheckOfferPlace,
  deps: Pick<TurnDeps, "serviceChangeJudgement" | "delivery" | "threadState">,
  now: number,
): Promise<PostResult | null> {
  if (!deps.serviceChangeJudgement) return null;
  try {
    const match = await deps.serviceChangeJudgement(milestone.idea);
    if (!match) return null;
    const expiresAt = cardExpiresAt(now);
    const posted = await deps.delivery.postCheckOffer({ scenario: match.scenario, expiresAt, underCard: !!at.cardTs });
    if (!posted.ok || !posted.ts) return null;
    await deps.threadState.putCheckOffer({
      offerTs: posted.ts,
      channel: at.channel,
      threadTs: at.threadTs,
      ...(at.replyTs ? { replyTs: at.replyTs } : {}),
      userMsgTs: at.userMsgTs,
      requesterUserId: at.requesterUserId,
      surface: at.surface,
      ...(at.conversationType ? { conversationType: at.conversationType } : {}),
      ...(at.cardTs ? { cardTs: at.cardTs } : {}),
      ...(at.cardKey ? { cardKey: at.cardKey } : {}),
      milestone: milestone.kind,
      idea: milestone.idea,
      ...match,
      expiresAt,
    });
    return posted;
  } catch (err) {
    rethrowIfBudget(err);
    console.warn(`[blueprint-check] offer not made: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}
