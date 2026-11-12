/**
 * Foundations · Sound's live parts, run in the Storybook tests: every player
 * plays a generated token, the switch turns them all off, and the land figure
 * draws from the generated spring and score.
 *
 * Run: npx vitest run --project=storybook design-system/src/styles/Sound.stories.jsx
 */
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { SOUND_TOKENS, setSoundEnabled } from '@/components';
import { LandRuleFigure } from '@/storybook-docs/illustrations/sound.jsx';
import { SoundPlayers, SoundSheetTable } from '@/storybook-docs/sound-docs.jsx';

export default {
  // The Sounds page's figures: `!dev` keeps them out of the sidebar. The page
  // itself is Foundations/Sound/Sounds (SoundSounds.mdx).
  title: 'Foundations/Sound/Sounds',
  tags: ['!dev', '!autodocs'],
  parameters: { layout: 'padded' },
};

const playersIn = (canvasElement) => [...canvasElement.querySelectorAll('[data-sound-token]')];

/** The nine sounds, one player each, every one a generated token. */
export const Players = {
  render: () => <SoundPlayers />,
  play: async ({ canvasElement }) => {
    const tokens = playersIn(canvasElement).map((el) => el.dataset.soundToken);
    await expect(tokens).toHaveLength(9);
    tokens.forEach((t) => expect(SOUND_TOKENS).toContain(t));
  },
};

/** The three AI feedback sounds. */
export const AiPlayers = {
  render: () => <SoundPlayers ai />,
  play: async ({ canvasElement }) => {
    const tokens = playersIn(canvasElement).map((el) => el.dataset.soundToken);
    await expect(tokens).toEqual(['ai.ready', 'ai.strong', 'ai.refine']);
  },
};

/** The sound sheet covers every token between its two tables. */
export const Sheet = {
  render: () => (
    <>
      <SoundSheetTable />
      <SoundSheetTable ai />
    </>
  ),
  play: async ({ canvasElement }) => {
    const tokens = playersIn(canvasElement).map((el) => el.dataset.soundToken);
    await expect([...tokens].sort()).toEqual([...SOUND_TOKENS].sort());
  },
};

/** With the switch off, a player stays pressable and says nothing played. */
export const SwitchedOff = {
  render: () => <SoundPlayers />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    try {
      await userEvent.click(canvas.getByRole('switch', { name: 'Sound' }));
      await waitFor(() => expect(canvas.getByRole('switch', { name: 'Sound' })).not.toBeChecked());
      await userEvent.click(canvas.getByRole('button', { name: 'Notify' }));
      await expect(await canvas.findByRole('status')).toHaveTextContent('Sound is off');
    } finally {
      setSoundEnabled(true);
    }
  },
};

/** The land rule, drawn from `spatial.default` and Notify. */
export const LandRule = {
  render: () => <LandRuleFigure caption="Notify starts one pickup before the Flag reaches 90%." />,
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector('svg[role="img"]');
    await expect(svg.getAttribute('aria-label')).toMatch(/spatial\.default motion reaches 90% at \d+ ms/);
  },
};
