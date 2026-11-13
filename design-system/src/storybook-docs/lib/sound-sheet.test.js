import { describe, expect, it } from 'vitest';

import { SOUND_SPEC } from '@/sound/spec.generated';
import { MOTION_REGISTRY } from '../../../../scripts/lib/tokens/motion-registry.mjs';
import { SOUND_SILENT } from '../../../../scripts/lib/tokens/sound-silence.mjs';
import { silentGroupsOf, soundCellsOf, soundFamiliesOf, soundSheetOf } from './sound-sheet';

describe('soundSheetOf', () => {
  const sheet = soundSheetOf();

  it('has one row per generated token, in plan order', () => {
    expect(sheet.map((r) => r.name)).toEqual(Object.keys(SOUND_SPEC.tokens));
  });

  it('reads family, notes and level from the spec', () => {
    const notify = sheet.find((r) => r.name === 'notify');
    expect(notify).toMatchObject({ token: 'sound.notify', family: 'Notify', notes: 'G4, then C5 + E5', level: 'standard', db: -24, ai: false });
    expect(sheet.find((r) => r.name === 'ai.ready').ai).toBe(true);
  });

  it('measures length from the score, in whole tens of ms', () => {
    for (const row of sheet) {
      expect(row.lengthMs % 10).toBe(0);
      expect(row.lengthMs).toBeGreaterThan(100);
    }
  });

  it('follows a changed spec', () => {
    const spec = structuredClone(SOUND_SPEC);
    spec.tokens.notify.level = 'fuller';
    expect(soundSheetOf(spec).find((r) => r.name === 'notify').db).toBe(spec.levels.fuller);
  });
});

describe('soundFamiliesOf', () => {
  it('groups tokens by family, first-seen order', () => {
    const families = soundFamiliesOf();
    expect(families[0]).toEqual({ family: 'Notify', names: ['notify'] });
    expect(families.find((f) => f.family === 'Done').names).toEqual(['done.sent', 'done.step', 'done.milestone']);
    expect(families.flatMap((f) => f.names)).toHaveLength(Object.keys(SOUND_SPEC.tokens).length);
  });
});

describe('soundCellsOf', () => {
  it('lists every registry event with a sound cell', () => {
    expect(soundCellsOf()).toHaveLength(MOTION_REGISTRY.flatMap((r) => Object.values(r.events)).filter((e) => e.sound).length);
    expect(soundCellsOf()).toContainEqual(
      expect.objectContaining({ row: 'Flag', event: 'enter', token: 'notify', at: 'land' }),
    );
  });


});

describe('silentGroupsOf', () => {
  it('groups the always-silent list by reason, every entry once', () => {
    const groups = silentGroupsOf();
    expect(groups.flatMap((g) => g.rows)).toHaveLength(SOUND_SILENT.length);
    expect(new Set(groups.map((g) => g.why)).size).toBe(groups.length);
    expect(groups.find((g) => g.why.startsWith('Field errors')).rows).toEqual(['Form · error', 'Forms · error', 'Errors · field']);
  });
});
