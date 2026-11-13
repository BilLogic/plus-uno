import React from 'react';
import { PAINT } from './paint.js';
import { Frame, Rect, SkeletonBar, Panel } from './primitives.jsx';
import { VIEW } from './motion-parts.jsx';
import './principle-loops.css';

/**
 * The Motion principles page's figures that are not Do/Don't pairs: the
 * framework strip (one looping card per principle, in P-L-U-S order) and each
 * principle's PLUS moment reel (three frames of a real moment, blocked out in
 * kit shapes, no words). The loops are CSS on the motion spring tokens and stop
 * under reduced motion (`principle-loops.css`).
 */

/** The four principles, in the order of the PLUS framework. */
export const PRINCIPLES = [
  { id: 'responsive', serves: 'Productivity', name: 'Always responsive', sticky: 'Keep up, never hold up.' },
  { id: 'understanding', serves: 'Learning', name: 'Build understanding', sticky: 'Show how, not just what.' },
  { id: 'empathy', serves: 'Uplift', name: 'Lead with empathy', sticky: 'Cheer the wins, cushion the misses.' },
  { id: 'simplicity', serves: 'Simplicity', name: 'Cut the noise', sticky: 'One story at a time.' },
];

const LOOPS = {
  responsive: (
    <>
      <div className="loop-ring" />
      <div className="loop-press" />
    </>
  ),
  understanding: (
    <>
      <div className="loop-bar loop-bar--a" />
      <div className="loop-bar loop-bar--b" />
      <div className="loop-panel" />
    </>
  ),
  empathy: (
    <>
      <div className="loop-win" />
      <div className="loop-miss" />
    </>
  ),
  simplicity: (
    <div className="loop-group">
      <i />
      <i />
      <i />
      <i />
    </div>
  ),
};

/** One card per principle; each leads with its looping shape study. */
export const FrameworkStrip = () => (
  <div className="principle-strip">
    {PRINCIPLES.map((p) => (
      <div key={p.id} className="principle-card" data-principle-card={p.id}>
        <div data-principle-loop="" data-loop={p.id} aria-hidden="true">
          {LOOPS[p.id]}
        </div>
        <div className="principle-card__body">
          <span className="principle-card__framework" data-framework="">{p.serves}</span>
          <b className="principle-card__name">{p.name}</b>
          <span className="principle-card__sticky" data-sticky="">{p.sticky}</span>
        </div>
      </div>
    ))}
  </div>
);

// ---------- Reels: three frames of a PLUS moment ----------

const Page = ({ children }) => (
  <>
    <Frame x={8} y={6} w={144} h={88} />
    <SkeletonBar x={16} y={14} w={70} h={5} heading />
    {children}
  </>
);

const REELS = {
  // Opening a session: the press, the pressed color in the same frame, the state settling.
  responsive: [
    { caption: 'The press', draw: () => (
      <Page>
        <Rect x={44} y={40} w={72} h={22} fill={PAINT.accent} corner="shape" />
      </Page>
    ) },
    { caption: 'Same frame: the pressed color', draw: () => (
      <Page>
        <Rect x={44} y={40} w={72} h={22} fill={PAINT.accent} corner="shape" opacity={0.7} />
      </Page>
    ) },
    { caption: 'About 120 ms later: the state settles', draw: () => (
      <Page>
        <Rect x={44} y={40} w={72} h={22} fill={PAINT.accent} corner="shape" opacity={0.7} />
        <SkeletonBar x={60} y={49} w={40} h={4} tone={PAINT.pageSurface} />
      </Page>
    ) },
  ],
  // Opening notes: the Panel opens from its button's side, settles, and closes back the same way.
  understanding: [
    { caption: 'Notes opens from its button\'s side', draw: () => (
      <Page>
        <Rect x={118} y={12} w={28} h={9} fill={PAINT.accent} corner="shape" />
        <Panel x={96} y={26} w={52} h={62} floating accent />
      </Page>
    ) },
    { caption: 'The Panel settles at the right', draw: () => (
      <Page>
        <Rect x={118} y={12} w={28} h={9} fill={PAINT.accent} corner="shape" />
        <Panel x={96} y={26} w={52} h={62} floating />
      </Page>
    ) },
    { caption: 'It closes back the way it came', draw: () => (
      <Page>
        <Rect x={118} y={12} w={28} h={9} fill={PAINT.placeholderText} corner="shape" />
        <g opacity={0.4}>
          <Panel x={128} y={26} w={20} h={62} floating />
        </g>
      </Page>
    ) },
  ],
  // A win and a miss.
  empathy: [
    { caption: 'A win: one overshoot', draw: () => (
      <Page>
        <Rect x={20} y={58} w={120} h={26} fill={PAINT.cardSurface} corner="card" />
        <circle cx={32} cy={71} r={5} fill={PAINT.flagIconSuccess} />
        <SkeletonBar x={44} y={69} w={60} h={4} />
      </Page>
    ) },
    { caption: 'A miss: it eases in, no shake', draw: () => (
      <Page>
        <Rect x={20} y={58} w={120} h={26} fill={PAINT.dangerSurface} corner="card" opacity={0.5} />
        <circle cx={32} cy={71} r={5} fill={PAINT.flagIconDanger} />
        <SkeletonBar x={44} y={69} w={60} h={4} />
      </Page>
    ) },
    { caption: 'It stays until it is fixed', draw: () => (
      <Page>
        <Rect x={20} y={58} w={120} h={26} fill={PAINT.dangerSurface} corner="card" />
        <circle cx={32} cy={71} r={5} fill={PAINT.flagIconDanger} />
        <SkeletonBar x={44} y={69} w={60} h={4} />
      </Page>
    ) },
  ],
  // Filtering the session list.
  simplicity: [1, 0.35, 1].map((o, i) => ({
    caption: ['Filter applied', 'The whole list fades as one', 'The new list, nothing scattered'][i],
    draw: () => (
      <Page>
        <g opacity={o}>
          {[0, 1, 2, 3].map((r) => (
            <SkeletonBar key={r} x={16} y={30 + r * 14} w={110 - r * 12} h={6} />
          ))}
        </g>
      </Page>
    ),
  })),
};

/** A principle's PLUS moment as three frames in a row. */
export const PrincipleReel = ({ id }) => (
  <div className="principle-reel" data-principle-reel={id}>
    {REELS[id].map((frame) => (
      <figure key={frame.caption} data-reel-frame="">
        <svg viewBox={VIEW} role="img" aria-label={frame.caption}>
          {frame.draw()}
        </svg>
        <figcaption>{frame.caption}</figcaption>
      </figure>
    ))}
  </div>
);
