import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { Button, Toggle, playSound, unlockAudio, useSound } from '@/components';
import { SOUND_SPEC } from '@/sound/spec.generated';
import { C, RefTable } from './foundation-blocks.jsx';
import { silentGroupsOf, soundCellsOf, soundSheetOf } from './lib/sound-sheet.js';

/**
 * Foundations · Sound's live parts: a player per token, the one switch, and the
 * tables, every one read from the generated sound spec and the registry
 * (`lib/sound-sheet.js`). Docs only: the app plays sound through `@/sound`.
 */

/** A token's short name: its last segment, capitalized (`done.sent` → Sent). */
export const soundLabelOf = (name) => {
    const last = name.split('.').pop();
    return last[0].toUpperCase() + last.slice(1);
};

const minus = (n) => String(n).replace('-', '−');

const row = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--inline-sm)' };
const note = { font: 'var(--body-small)', color: 'var(--ds-text-subtle)' };

/**
 * Plays one generated token. It stays pressable with sound off and says why
 * nothing played, as an unavailable action does.
 */
export const SoundPlayer = ({ token }) => {
    const { enabled } = useSound();
    const [silent, setSilent] = useState(false);
    if (!SOUND_SPEC.tokens[token]) throw new Error(`"${token}" is not a sound token`);
    const play = () => {
        if (!enabled) {
            setSilent(true);
            return;
        }
        setSilent(false);
        unlockAudio();
        playSound(token);
    };
    return (
        <span style={row} data-sound-token={token}>
            <Button spacing="compact" iconBefore="play" text={soundLabelOf(token)} onClick={play} />
            {silent && !enabled && <span role="status" style={note}>Sound is off</span>}
        </span>
    );
};

SoundPlayer.propTypes = {
    /** A sound token without the `sound.` prefix, e.g. `notify`. */
    token: PropTypes.string.isRequired,
};

/** The one sound setting, the same switch the app reads. */
export const SoundSwitch = () => {
    const { enabled, setEnabled } = useSound();
    return <Toggle label="Sound" isChecked={enabled} onChange={(e) => setEnabled(e.target.checked)} />;
};

/** The switch, then a player for each token: the nine sounds, or the AI three with `ai`. */
export const SoundPlayers = ({ ai = false }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
        <SoundSwitch />
        <div style={row}>
            {soundSheetOf()
                .filter((r) => r.ai === ai)
                .map((r) => <SoundPlayer key={r.name} token={r.name} />)}
        </div>
    </div>
);

SoundPlayers.propTypes = {
    /** Show the three AI feedback sounds instead of the nine. */
    ai: PropTypes.bool,
};

/** The sound sheet: family, notes, level and length per token, with a player. */
export const SoundSheetTable = ({ ai = false }) => (
    <RefTable
        head={['Token', 'Family', 'Notes', 'Level', 'Length', 'Hear it']}
        rows={soundSheetOf()
            .filter((r) => r.ai === ai)
            .map((r) => [
                <C>{r.token}</C>,
                r.family,
                r.notes,
                `${r.level}, ${minus(r.db)} dB`,
                `${r.lengthMs} ms`,
                <SoundPlayer token={r.name} />,
            ])}
    />
);

SoundSheetTable.propTypes = {
    /** The three AI feedback sounds instead of the nine. */
    ai: PropTypes.bool,
};

/** The level tiers, read from the spec. */
export const SoundLevelTable = () => (
    <RefTable
        head={['Level', 'Loudest 50 ms', 'Used by']}
        rows={Object.entries(SOUND_SPEC.levels).map(([level, db]) => [
            <C>{level}</C>,
            `${minus(db)} dB`,
            soundSheetOf()
                .filter((r) => r.level === level)
                .map((r) => soundLabelOf(r.name))
                .join(', '),
        ])}
    />
);

const AT = { land: 'as its motion lands', start: 'as its motion starts' };

/** Every registry row that plays a sound, from the motion registry's `sound` cells. */
export const SoundRegistryTable = () => (
    <RefTable
        head={['Row', 'Event', 'Sound', 'Plays', 'Only when']}
        rows={soundCellsOf().map((c) => [c.row, c.event, <C>{`sound.${c.token}`}</C>, AT[c.at], c.when])}
    />
);

/** The always-silent list, grouped by reason. */
export const SilentTable = () => (
    <RefTable
        head={['Never plays', 'Rows']}
        rows={silentGroupsOf().map((g) => [g.why, g.rows.join(', ')])}
    />
);
