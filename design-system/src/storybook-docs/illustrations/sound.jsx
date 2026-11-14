import React from 'react';

import { scoreFor, scoreLength } from '@/sound/score';
import { soundStartFor, springT90 } from '@/components';
import { Illustration, IllustrationFigure } from './Illustration.jsx';
import { springFor, stepOf } from './motion.jsx';
import { PAINT } from './paint.js';
import { Rect, Rule } from './primitives.jsx';
import { ChartAxis, ChartCurve } from './primitives-motion.jsx';

/**
 * Foundations › Expression › Sound's one figure: the land rule, drawn from the generated
 * spring and the generated score. The plot is the motion's position over time;
 * the lane under it is the sound, its pickup ticks and then its notes. Both
 * guides are read from the runtime, so the figure moves when a token does.
 * Built from kit primitives only; no primitive of its own.
 */
const W = 300;
const PLOT = { x: 10, y: 8, w: W, h: 56 };
const LANE = { y: 76, h: 16 };
const SAMPLES = 90;

export const LandRuleFigure = ({ spring = 'spatial.default', sound = 'notify', caption }) => {
  const t90 = springT90(spring);
  const start = soundStartFor(spring, sound);
  const score = scoreFor(sound);
  const span = start + scoreLength(score);
  const x = (t) => PLOT.x + (PLOT.w * t) / span;
  const step = stepOf(springFor(spring));
  const values = Array.from({ length: SAMPLES + 1 }, (_, i) => Math.min(1, step((span * i) / SAMPLES)));
  const lane = LANE.y;
  const laneBottom = LANE.y + LANE.h;

  return (
    <IllustrationFigure caption={caption}>
      <Illustration
        width={W + 20}
        height={laneBottom + 8}
        title={`The ${spring} motion reaches 90% at ${Math.round(t90 * 1000)} ms; the ${sound} sound starts one pickup earlier, so its first note lands with it.`}
      >
        <ChartAxis x={PLOT.x} y={PLOT.y} w={PLOT.w} h={PLOT.h} />
        <ChartCurve x={PLOT.x} y={PLOT.y} w={PLOT.w} h={PLOT.h} values={values} />
        <Rule x1={PLOT.x} x2={PLOT.x + PLOT.w} y1={laneBottom} y2={laneBottom} />
        <Rule x1={x(start)} x2={x(start)} y1={PLOT.y} y2={laneBottom} dash="2 2" />
        <Rule x1={x(t90)} x2={x(t90)} y1={PLOT.y} y2={laneBottom} stroke={PAINT.ink} dash="3 3" />
        {score.events.map((e, i) =>
          e.kind === 'tone' ? (
            <Rect
              key={i}
              x={x(start + e.at)}
              y={lane + 2}
              w={Math.max(2, x(start + e.at + e.end) - x(start + e.at))}
              h={4}
              fill={PAINT.accent}
              corner="full"
              opacity={Math.min(1, e.peak * 4)}
            />
          ) : (
            <Rect key={i} x={x(start + e.at)} y={lane + 9} w={1.5} h={5} fill={PAINT.ink} corner="none" />
          ),
        )}
      </Illustration>
    </IllustrationFigure>
  );
};
