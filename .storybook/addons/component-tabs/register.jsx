/**
 * Registers the component tabs with the Storybook manager (#168).
 *
 * Imported for its side effect by `.storybook/manager.js`, which also has to
 * merge `PREVIEW_TABS` into its `addons.setConfig` call — renaming the built-in
 * canvas tab to `Examples` is config, not registration.
 *
 * These are real Storybook tabs (`types.TAB`), not sidebar entries: a component
 * keeps one place in the sidebar and the four faces sit above the canvas, which
 * is the whole point — four sidebar entries per component would fragment
 * navigation for humans, and nothing about the agent-facing `index.md` changes
 * either way.
 *
 * KNOWN, MEASURED: Storybook 10.5 logs `Addon tabs are deprecated and will be
 * removed in Storybook 11` as soon as more than one tab is registered
 * (`storybook/dist/manager/runtime.js`, in `Preview`). The warning is real and
 * is left unsuppressed. The tabs work in 10.x; the upgrade to 11 has to replace
 * this mechanism, and `README.md` in this folder records what with.
 */
import React from 'react';
import { addons, types } from 'storybook/manager-api';

import { TAB_IDS } from './contract.js';
import { ChangelogPanel, CodePanel, UsagePanel } from './panels.jsx';

const ADDON_ID = 'plus/component-tabs';

/**
 * Storybook renders every registered tab for every entry — the tab list is not
 * filtered per story, only the tools are — so each panel answers the
 * not-a-component case itself rather than pretending it can be hidden here.
 */
const TABS = [
  { id: TAB_IDS.code, title: 'Code', Panel: CodePanel },
  { id: TAB_IDS.usage, title: 'Usage', Panel: UsagePanel },
  { id: TAB_IDS.changelog, title: 'Changelog', Panel: ChangelogPanel },
];

addons.register(ADDON_ID, () => {
  for (const { id, title, Panel } of TABS) {
    addons.add(id, {
      type: types.TAB,
      title,
      route: ({ storyId, refId }) => (refId ? `/story/${refId}_${storyId}` : `/story/${storyId}`),
      match: ({ viewMode }) => viewMode === 'story' || viewMode === 'docs',
      render: ({ active }) => (active ? <Panel /> : null),
    });
  }
});
