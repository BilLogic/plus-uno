// Who is who for card follow-ups: the Team Members directory first, a name
// search second.
//
// The daily role-map sync keeps a Notion user → Slack person map from each
// Team Members row's Notion Person (`../usage/team-roles-sync.ts`). A Notion
// person that map holds is tagged as the map says, and a Slack person it maps
// from exactly one Notion user is matched back the same way. Anyone it does
// not hold falls back to the lookups underneath, which search by name.
//
// Free of `Env`: the map's read is passed in (`./env.ts` binds it), and is
// made once for the life of the object — one job or one reaction.

import { notionPersonOfSlack, slackPersonOfNotion, type NotionPeople } from "../usage/roles";
import type { CardPeople } from "./run";

/**
 * Card people that ask the directory before `base`.
 *
 * @param base - The name-search lookups
 * @param directory - The stored Notion people map; a failed read is no map
 */
export function throughDirectory(base: CardPeople, directory: () => Promise<NotionPeople>): CardPeople {
  let map: Promise<NotionPeople> | undefined;
  const read = () => (map ??= directory());
  return {
    slackIdForName: (name) => base.slackIdForName(name),
    async slackIdForNotionUser(notionUserId, name) {
      return slackPersonOfNotion(notionUserId, await read()) ?? base.slackIdForNotionUser(notionUserId, name);
    },
    async notionUserForSlack(slackUserId) {
      return notionPersonOfSlack(slackUserId, await read()) ?? base.notionUserForSlack(slackUserId);
    },
  };
}
