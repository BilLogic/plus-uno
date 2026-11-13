import React from "react";
import { PAINT, HAIRLINE } from "../illustrations/paint.js";
import { CardBox, Rect, SkeletonBar } from "../illustrations/primitives.jsx";
import { Waveform, SpringTrail } from "../illustrations/shapes.jsx";
import { chime, doubleChime, spring, swell, tap } from "../illustrations/shapes-geometry.js";
import { HeroDrawing } from "./HeroDrawing.jsx";

/**
 * The Sound heroes: stills, never played. A sound is a waveform, loud where it
 * is struck and fading after; the one accent (brand bold) marks the sound the
 * page is about, and the rest are neutral. Text is skeleton bars. Coordinates are
 * kit units (1 = 2px) from the stage's corner; the waveform is the kit's own shape.
 */

/** The round play button on a sound row: a ring and a triangle, filled when it plays. */
const PlayButton = ({ cx, cy, on }) => (
  <g data-play={on ? "on" : "off"}>
    <circle cx={cx} cy={cy} r={9} fill={on ? PAINT.accent : PAINT.cardSurface} stroke={on ? undefined : PAINT.illustrationEdge} style={HAIRLINE} />
    <path d={`M${cx - 2.5} ${cy - 4} L${cx + 4} ${cy} L${cx - 2.5} ${cy + 4} Z`} fill={on ? PAINT.buttonPrimaryText : PAINT.annotation} />
  </g>
);

/** Three sounds as three waveforms: a tap, a chime, a swell. The chime is ringed. */
export const OverviewHero = () => (
  <HeroDrawing>
    <CardBox x={-65} y={15} w={130} h={130} />
    <Waveform x={-52} y={15} w={108} h={130} n={24} envelope={tap} tone={PAINT.annotation} />
    <CardBox x={85} y={5} w={130} h={150} accent />
    <Waveform x={98} y={5} w={108} h={150} n={24} envelope={doubleChime} accent />
    <CardBox x={235} y={15} w={130} h={130} />
    <Waveform x={248} y={15} w={108} h={130} n={24} envelope={swell} tone={PAINT.annotation} />
  </HeroDrawing>
);

/** A run of events along one line; only three of them make a sound. */
const EVENTS = [
  [0.04, 0],
  [0.12, 0],
  [0.2, 1],
  [0.3, 0],
  [0.38, 0],
  [0.47, 0],
  [0.55, 2],
  [0.64, 0],
  [0.72, 0],
  [0.8, 0],
  [0.9, 1],
];

export const WhenToPlayHero = () => (
  <HeroDrawing>
    <line x1={-70} x2={370} y1={105} y2={105} stroke={PAINT.axis} style={HAIRLINE} />
    {EVENTS.map(([t, kind]) => {
      const x = -70 + 440 * t;
      const sounds = kind > 0;
      const hit = kind === 2;
      return (
        <g key={t} data-event={sounds ? "sound" : "silent"}>
          {sounds && <Waveform x={x - 20} y={0} w={45} h={60} n={10} envelope={hit ? doubleChime : chime} accent={hit} tone={PAINT.annotation} />}
          <circle
            cx={x}
            cy={105}
            r={4}
            fill={sounds ? (hit ? PAINT.accent : PAINT.annotation) : PAINT.frameSunken}
            stroke={sounds ? undefined : PAINT.annotation}
            style={HAIRLINE}
          />
        </g>
      );
    })}
  </HeroDrawing>
);

/** Two stacked tracks: the shape's motion above, the sound below, one tick where it lands. */
export const WithMotionHero = () => {
  const L = -60;
  const R = 360;
  const n = 12;
  const step = 0.075;
  const advance = 33;
  const still = 14;
  const landIndex = Array.from({ length: n }, (_, i) => i).find((i) => spring(i * step) >= 1);
  const land = L + still / 2 + landIndex * advance;
  const soundY = 122;
  const waveW = R - land;
  return (
    <HeroDrawing>
      <CardBox x={-80} y={-4} w={460} h={168} />
      {Array.from({ length: 41 }, (_, k) => {
        const x = L + ((R - L) * k) / 40;
        return <line key={k} x1={x} x2={x} y1={k % 8 === 0 ? 3 : 6} y2={11} stroke={k % 8 === 0 ? PAINT.annotation : PAINT.axis} style={HAIRLINE} />;
      })}
      <line x1={-72} x2={372} y1={83} y2={83} stroke={PAINT.axis} style={HAIRLINE} />
      {/* track heads: a shape for motion, bars for sound */}
      <Rect x={-72} y={42} w={6} h={6} fill={PAINT.annotation} corner="shape" />
      <Rect x={-72} y={119} w={1.5} h={6} fill={PAINT.annotation} corner="full" />
      <Rect x={-69} y={117} w={1.5} h={10} fill={PAINT.annotation} corner="full" />
      <SpringTrail x={L} y={0} w={R - L} h={75} n={n} still={still} step={step} advance={advance} accent accentAll />
      <line x1={L} x2={land} y1={soundY} y2={soundY} stroke={PAINT.axis} style={HAIRLINE} />
      <Waveform x={land} y={soundY - 30} w={waveW} h={60} n={Math.floor(waveW / 4.5)} envelope={chime} accent />
      {/* the sync tick through both tracks */}
      <Rect x={land - 0.5} y={2} w={1} h={156} fill={PAINT.accent} />
      <Rect x={land - 3.5} y={0} w={7} h={8} fill={PAINT.accent} corner="shape" />
      <g data-sync="">
        <circle cx={land} cy={25.25} r={3} fill={PAINT.cardSurface} stroke={PAINT.accent} style={HAIRLINE} />
        <circle cx={land} cy={soundY} r={3} fill={PAINT.cardSurface} stroke={PAINT.accent} style={HAIRLINE} />
      </g>
    </HeroDrawing>
  );
};

/** The library as a list: play, waveform, name; one sound playing. */
export const SoundsHero = () => {
  const x = -20;
  const w = 340;
  const envelopes = [tap, chime, doubleChime, swell];
  return (
    <HeroDrawing>
      <CardBox x={x} y={-3} w={w} h={166} />
      {envelopes.map((envelope, i) => {
        const top = -3 + 11 + i * 37;
        const cy = top + 18.5;
        const on = i === 2;
        return (
          <g key={i} data-sound={on ? "playing" : "idle"}>
            {on && (
              <>
                <Rect x={x + 4} y={top + 2} w={w - 8} h={33} fill={PAINT.accent} corner="shape" opacity={0.1} />
                <Rect x={x + 4} y={top + 2} w={w - 8} h={33} stroke={PAINT.accent} corner="shape" />
              </>
            )}
            <PlayButton cx={x + 23} cy={cy} on={on} />
            <SkeletonBar x={x + 42} y={cy - 2} w={60} h={4} />
            <Waveform x={x + 125} y={cy - 14} w={198} h={28} n={36} envelope={envelope} accent={on} tone={PAINT.annotation} />
            {(i === 0 || i === 2) && <line x1={x + 12} x2={x + w - 12} y1={top + 37} y2={top + 37} stroke={PAINT.axis} style={HAIRLINE} />}
          </g>
        );
      })}
    </HeroDrawing>
  );
};

/** Sound turned off and the volume down: the person decides. */
export const SettingsHero = () => (
  <HeroDrawing>
    <CardBox x={0} y={15} w={300} h={130} />
    <SkeletonBar x={20} y={36} w={80} h={6} heading />
    <SkeletonBar x={20} y={47} w={120} h={4} />
    <g data-switch="off">
      <Rect x={220} y={34} w={48} h={24} fill={PAINT.placeholderText} corner="full" />
      <circle cx={235} cy={46} r={9} fill={PAINT.cardSurface} stroke={PAINT.illustrationEdge} style={HAIRLINE} />
    </g>
    <Rect x={20} y={90} w={200} h={4} fill={PAINT.placeholderText} corner="full" />
    <Rect x={20} y={90} w={60} h={4} fill={PAINT.accent} corner="full" />
    <circle cx={80} cy={92} r={8} fill={PAINT.cardSurface} stroke={PAINT.accent} style={HAIRLINE} />
    <g opacity={0.5}>
      <Waveform x={230} y={79.5} w={54} h={25} n={12} envelope={swell} tone={PAINT.annotation} />
    </g>
  </HeroDrawing>
);
