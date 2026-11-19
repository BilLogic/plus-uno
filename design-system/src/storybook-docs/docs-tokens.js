import registry from '../../agent-views/tokens.json';
import { allTokens, tokenCollections } from '@/storybook-docs/lib/token-collections.mjs';

/**
 * The one token list the docs read: the generated token table, placed in
 * ordered collections. Every token block, page and the Library draws from
 * these, so a token added to the source shows once the table is regenerated.
 */
export const TOKEN_COLLECTIONS = tokenCollections(registry.tokens);

/** Every token of the collections as one list, in page order. */
export const TOKENS = allTokens(TOKEN_COLLECTIONS);
