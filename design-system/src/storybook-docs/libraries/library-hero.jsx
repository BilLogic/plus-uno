import React from 'react';

import { FoundationHero } from '@/storybook-docs/foundation-page.jsx';

/** The hero of every Libraries page: the shared page hero, with the kind label "Library". Kept apart from the gallery so a page without one loads none of its demos. */
export const LibraryHero = (props) => <FoundationHero {...props} kind="Library" />;
