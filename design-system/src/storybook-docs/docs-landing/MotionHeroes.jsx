import React from "react";
import { PAINT, HAIRLINE } from "../illustrations/paint.js";
import { CardBox, Rect, SkeletonBar } from "../illustrations/primitives.jsx";
import { Path, SpringTrail } from "../illustrations/shapes.jsx";
import { spring } from "../illustrations/shapes-geometry.js";
import { Pointer } from "./FoundationHeroes.jsx";
import { HeroDrawing } from "./HeroDrawing.jsx";

/**
 * The Motion heroes: stills on a time grid, never animated. Time is drawn as
 * equal steps, lighter early and the accent where it lands; the one accent
 * (brand bold) sits on the subject, lighter steps through opacity. Text is
 * skeleton bars. Coordinates are kit units (1 = 2px) from the stage's corner.
 * The four principle scenes, the shelf and the timeline are composed here from
 * kit primitives; the spring and the path are the kit's own shapes.
 */

/** Vertical lines at equal time steps: the grid a motion still is read on. */
const TimeGrid = ({ x1, x2, y1, y2, step }) => (
  <g data-time-grid="">
    {Array.from({ length: Math.floor((x2 - x1) / step) + 1 }, (_, i) => (
      <line key={i} x1={x1 + i * step} x2={x1 + i * step} y1={y1} y2={y2} stroke={PAINT.axis} style={HAIRLINE} />
    ))}
  </g>
);

const Dashed = ({ x1, x2, y }) => (
  <line x1={x1} x2={x2} y1={y} y2={y} stroke={PAINT.target} strokeDasharray="3 3" style={HAIRLINE} />
);

/** A diamond keyframe mark, `d` from its center to each point. */
const Keyframe = ({ x, y, d = 2, fill }) => (
  <path d={`M${x} ${y - d} l${d} ${d} l${-d} ${d} l${-d} ${-d} z`} fill={fill} />
);

export const PrinciplesHero = () => {
  const cards = [-80, 40, 160, 280];
  const still = (i) => 0.15 + 0.85 * Math.pow(i / 6, 1.5);
  return (
    <HeroDrawing>
      {cards.map((x) => (
        <CardBox key={x} x={x} y={5} w={100} h={150} />
      ))}
      {/* Build understanding: a new row lands in its slot, the path from where it came */}
      {[25, 45, 85].map((y) => (
        <Rect key={y} x={-70} y={y} w={80} h={15} fill={PAINT.placeholderText} corner="shape" />
      ))}
      <Rect x={-70} y={65} w={80} h={15} stroke={PAINT.target} corner="shape" />
      <Rect x={-50} y={123} w={60} h={15} fill={PAINT.accent} corner="shape" opacity={0.25} />
      <Path from={[10, 132]} to={[0, 80]} rect={{ x: -70, y: 65, w: 80, h: 15 }} accent />
      {/* Always responsive: a press answered at once */}
      <Rect x={60} y={65} w={60} h={24} fill={PAINT.accent} corner="full" />
      <circle cx={96} cy={77} r={17} fill="none" stroke={PAINT.accent} opacity={0.35} style={HAIRLINE} />
      <circle cx={96} cy={77} r={25} fill="none" stroke={PAINT.accent} opacity={0.18} style={HAIRLINE} />
      <Pointer x={92} y={74} />
      {/* A spring: one shape at equal steps, settling past its target */}
      <Dashed x1={168} x2={252} y={40} />
      {Array.from({ length: 7 }, (_, i) => (
        <Rect
          key={i}
          x={172 + 11 * i}
          y={(300 - 180 * spring(i * 0.1) - 9) / 2 - 20}
          w={9}
          h={9}
          fill={PAINT.accent}
          corner="shape"
          opacity={still(i)}
        />
      ))}
      {/* Cut the noise: many small neutral moves, one big accent one */}
      {[0, 1, 2].flatMap((r) =>
        [0, 1, 2, 3].map((c) => (
          <Rect key={`${r}${c}`} x={293 + 20 * c} y={20 + 15 * r} w={12} h={7} fill={PAINT.shape} corner="shape" />
        )),
      )}
      <Rect x={300} y={85} w={60} h={55} fill={PAINT.accent} corner="card" />
    </HeroDrawing>
  );
};

export const PhysicsHero = () => (
  <HeroDrawing>
    <TimeGrid x1={-60} x2={360} y1={-8} y2={168} step={40} />
    <SpringTrail x={-70} y={-11} w={440} h={163} n={11} still={26} step={0.072} advance={39} accent accentAll />
  </HeroDrawing>
);

/** Before: a list row. After: a card. Each part's path runs downward, none cross. */
export const TRANSITION_PARTS = {
  media: { from: [66, 14], to: [86.5, 111.5], rect: { x: 39, y: 64, w: 95, h: 95 } },
  title: { from: [121.5, 10.5], to: [196, 73.5], rect: { x: 146, y: 70, w: 100, h: 7 } },
  button: { from: [225.5, 14], to: [230.5, 150], rect: { x: 200, y: 141, w: 61, h: 18 } },
};

export const TransitionsHero = () => (
  <HeroDrawing>
    <g opacity={0.55}>
      <Rect x={50} y={-2} w={200} h={32} fill={PAINT.cardSurface} stroke={PAINT.fieldBorder} corner="card" />
      <circle cx={66} cy={14} r={11} fill={PAINT.placeholderText} />
      <SkeletonBar x={84} y={8} w={75} h={5} heading />
      <SkeletonBar x={84} y={17} w={50} h={4} />
      <Rect x={207} y={6} w={37} h={16} fill={PAINT.accent} corner="button" opacity={0.3} />
    </g>
    <CardBox x={30} y={55} w={240} h={113} accent />
    <Rect x={39} y={64} w={95} h={95} fill={PAINT.placeholderText} corner="card" />
    <SkeletonBar x={146} y={70} w={100} h={7} heading />
    <SkeletonBar x={146} y={84} w={110} h={5} />
    <SkeletonBar x={146} y={95} w={90} h={5} />
    <Rect x={200} y={141} w={61} h={18} fill={PAINT.accent} corner="button" />
    {Object.entries(TRANSITION_PARTS).map(([name, p]) => (
      <Path key={name} from={p.from} to={p.to} rect={p.rect} accent />
    ))}
  </HeroDrawing>
);

/** The clips on each track, as fractions of the run: [start, end, kind]. */
const TRACKS = [
  ["row", [[0, 0.14, "exit"]]],
  ["title", [[0.1, 0.62, "parent"]]],
  ["title", [[0.14, 0.34]]],
  [
    "card",
    [
      [0.2, 0.42],
      [0.46, 0.66],
    ],
  ],
  [
    "row",
    [
      [0.29, 0.35],
      [0.37, 0.43],
      [0.45, 0.51],
    ],
  ],
  ["card", [[0.14, 0.3]]],
  ["row", [[0.74, 0.84, "pop"]]],
];

export const ChoreographyHero = () => {
  const x0 = -78;
  const y0 = -2;
  const W = 456;
  const H = 164;
  const labelW = 66;
  const tx = x0 + labelW + 8;
  const tw = W - labelW - 8;
  const ruler = 14;
  const th = (H - ruler - 4) / TRACKS.length;
  const play = 0.4;
  const px = tx + tw * play;
  return (
    <HeroDrawing>
      <CardBox x={-86} y={-8} w={472} h={176} />
      {Array.from({ length: 33 }, (_, k) => {
        const x = tx + (tw * k) / 32;
        return (
          <line key={k} x1={x} x2={x} y1={y0 + (k % 8 === 0 ? 3 : 7)} y2={y0 + ruler - 2} stroke={k % 8 === 0 ? PAINT.annotation : PAINT.axis} style={HAIRLINE} />
        );
      })}
      {Array.from({ length: TRACKS.length + 1 }, (_, i) => (
        <line key={i} x1={x0} x2={x0 + W} y1={y0 + ruler + i * th} y2={y0 + ruler + i * th} stroke={PAINT.axis} style={HAIRLINE} />
      ))}
      {TRACKS.map(([kind, clips], i) => {
        const cy = y0 + ruler + i * th + th / 2;
        const indent = i >= 2 && i <= 4 ? 8 : 0;
        const lx = x0 + indent;
        return (
          <g key={i} data-track={kind}>
            <Rect x={lx} y={cy - 7.5} w={labelW - 4 - indent} h={15} fill={PAINT.cardSurface} stroke={PAINT.illustrationEdge} corner="shape" />
            {kind === "title" && <SkeletonBar x={lx + 6} y={cy - 2} w={30} h={4} />}
            {kind === "card" && (
              <>
                <Rect x={lx + 5} y={cy - 4} w={12} h={8} fill={PAINT.placeholderText} corner="shape" />
                <SkeletonBar x={lx + 21} y={cy - 2} w={22} h={4} />
              </>
            )}
            {kind === "row" && (
              <>
                <circle cx={lx + 8} cy={cy} r={2.5} fill={PAINT.placeholderText} />
                <SkeletonBar x={lx + 14} y={cy - 2} w={28} h={4} />
              </>
            )}
            {clips.map(([s, e, tag]) => {
              const cx0 = tx + tw * s;
              const cw = tw * (e - s);
              const ch = th - 7;
              const top = cy - ch / 2;
              const end = cx0 + cw;
              if (tag === "parent") {
                return (
                  <g key={s}>
                    <Rect x={cx0} y={cy - 1.5} w={cw} h={3} fill={PAINT.annotation} corner="full" opacity={0.5} />
                    <Rect x={cx0} y={top + 2} w={1} h={ch - 4} fill={PAINT.annotation} />
                    <Rect x={end - 1} y={top + 2} w={1} h={ch - 4} fill={PAINT.annotation} />
                  </g>
                );
              }
              const past = end < px;
              const live = !past && cx0 <= px;
              return (
                <g key={s} data-clip={past ? "done" : live ? "live" : "ahead"}>
                  {past && <Rect x={cx0} y={top} w={cw} h={ch} fill={PAINT.cardSurface} stroke={PAINT.fieldBorder} corner="shape" opacity={tag === "exit" ? 0.6 : 1} />}
                  {live && (
                    <>
                      <Rect x={cx0} y={top} w={cw} h={ch} fill={PAINT.accent} stroke={PAINT.accent} corner="shape" opacity={0.14} />
                      <Rect x={cx0} y={top} w={px - cx0} h={ch} fill={PAINT.accent} corner="shape" opacity={0.24} />
                      <Rect x={cx0} y={top} w={cw} h={ch} stroke={PAINT.accent} corner="shape" />
                    </>
                  )}
                  {!past && !live && <Rect x={cx0} y={top} w={cw} h={ch} stroke={PAINT.fieldBorder} corner="shape" />}
                  {[cx0, end].map((kx) => (
                    <Keyframe key={kx} x={kx} y={cy} fill={kx < px ? PAINT.target : PAINT.axis} />
                  ))}
                </g>
              );
            })}
          </g>
        );
      })}
      <line x1={px} x2={px} y1={y0 + 1} y2={y0 + H - 2} stroke={PAINT.accent} style={HAIRLINE} />
      <Rect x={px - 4} y={y0} w={8} h={9} fill={PAINT.accent} corner="shape" />
    </HeroDrawing>
  );
};

export const PlaygroundHero = () => (
  <HeroDrawing>
    <CardBox x={-70} y={10} w={170} h={140} />
    {[0.62, 0.3, 0.78].map((v, k) => {
      const y = 36 + 36 * k;
      return (
        <g key={k} data-dial={k}>
          <SkeletonBar x={-54} y={y - 12} w={45} h={4} />
          <Rect x={-54} y={y} w={138} h={3} fill={PAINT.placeholderText} corner="full" />
          <Rect x={-54} y={y} w={138 * v} h={3} fill={k === 0 ? PAINT.accent : PAINT.annotation} corner="full" />
          <circle cx={-54 + 138 * v} cy={y + 1.5} r={6} fill={PAINT.cardSurface} stroke={k === 0 ? PAINT.accent : PAINT.fieldBorder} style={HAIRLINE} />
        </g>
      );
    })}
    <SpringTrail x={120} y={7} w={260} h={135} n={7} still={24} step={0.1} advance={33} accent accentAll />
  </HeroDrawing>
);

/** One named motion as a still of itself: four steps of a rise, lighter early. */
const Rise = ({ x, y, w, h, fill }) =>
  [0, 1, 2, 3].map((j) => (
    <Rect
      key={j}
      x={x + w * (0.26 + j * 0.02)}
      y={y + h * (0.66 - j * 0.13) - h * 0.08}
      w={w * (0.48 - j * 0.04)}
      h={h * 0.16}
      fill={fill}
      corner="shape"
      opacity={0.12 + j * 0.29}
    />
  ));

const Fade = ({ x, y, w, h, fill }) =>
  [0, 1, 2, 3].map((j) => (
    <Rect key={j} x={x + w * (0.14 + j * 0.19)} y={y + h * 0.32} w={w * 0.15} h={h * 0.36} fill={fill} corner="shape" opacity={0.15 + j * 0.28} />
  ));

const Scale = ({ x, y, w, h, fill }) =>
  [0.22, 0.36, 0.52].map((s, j) => (
    <Rect key={j} x={x + w * (0.2 + j * 0.26) - (h * s) / 2} y={y + h / 2 - (h * s) / 2} w={h * s} h={h * s} fill={fill} corner="shape" opacity={0.25 + j * 0.37} />
  ));

const Slide = ({ x, y, w, h, fill }) =>
  [0, 1, 2, 3].map((j) => (
    <Rect key={j} x={x + w * 0.1 + j * w * 0.14} y={y + h * 0.34} w={w * 0.34} h={h * 0.32} fill={fill} corner="shape" opacity={0.15 + j * 0.28} />
  ));

export const LibraryHero = () => (
  <HeroDrawing>
    {[
      [-160, Fade],
      [-45, Scale],
      [245, Slide],
      [360, Fade],
    ].map(([x, Still]) => (
      <g key={x}>
        <CardBox x={x} y={35} w={100} h={90} />
        <Still x={x} y={35} w={100} h={90} fill={PAINT.shape} />
      </g>
    ))}
    <CardBox x={70} y={5} w={160} h={150} accent />
    <Rise x={70} y={0} w={160} h={125} fill={PAINT.accent} />
    <SkeletonBar x={90} y={128} w={60} h={5} heading />
    <SkeletonBar x={90} y={139} w={90} h={5} />
  </HeroDrawing>
);
