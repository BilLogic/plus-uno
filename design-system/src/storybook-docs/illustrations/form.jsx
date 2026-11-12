import React from 'react';
import { PAINT } from './paint.js';
import { Illustration } from './Illustration.jsx';
import { Backdrop, ButtonShape, Field, Panel, Rect, Row, Rule, Section, SkeletonBar } from './primitives.jsx';

/**
 * The Form template's do and don't drawings. Each lesson is about where the
 * form's pieces sit in a host, so every drawing is blocked out: no words,
 * buttons as flat strips, one accent on the subject. Every pair shares one
 * canvas, so a do and its don't compare at one scale.
 */

const W = 168;
const H = 104;
const FIELD_W = 56;

const Canvas = ({ title, children }) => (
  <Illustration width={W} height={H} title={title}>
    <Rect x={0} y={0} w={W} h={H} fill={PAINT.frameSunken} />
    {children}
  </Illustration>
);

/** A Section with the subtle fill holding the fields; the buttons sit where the caller puts them. */
const PageForm = ({ fields = 2, children, columns = 1 }) => (
  <g>
    <Rect x={8} y={8} w={W - 16} h={H - 16} fill={PAINT.pageSurface} corner="section" />
    <Section x={14} y={14} w={W - 28} h={H - 28} subtle rows={0} />
    <SkeletonBar x={22} y={22} w={36} h={5} heading />
    {Array.from({ length: fields }, (_, i) => {
      const col = columns === 2 ? i % 2 : 0;
      const row = columns === 2 ? Math.floor(i / 2) : i;
      return <Field key={i} x={22 + col * (FIELD_W + 10)} y={34 + row * 27} w={columns === 2 ? FIELD_W : FIELD_W + 34} />;
    })}
    {children}
  </g>
);

/** Do: Primary first, left-aligned under the fields. */
export const PageButtonsLeft = ({ title = 'A page form with its buttons under the fields at the start, the primary first' }) => (
  <Canvas title={title}>
    <PageForm fields={2}>
      <ButtonShape x={22} y={84} w={26} appearance="primary" />
      <ButtonShape x={52} y={84} w={26} />
      <Rect x={20} y={82} w={60} h={12} fill="none" stroke={PAINT.accent} corner="button" />
    </PageForm>
  </Canvas>
);

/** Don't: the buttons pushed to the far end of the page, away from the fields they save. */
export const PageButtonsFarRight = ({ title = 'A page form with its buttons at the far end of the page, the primary last, away from the fields' }) => (
  <Canvas title={title}>
    <PageForm fields={2}>
      <ButtonShape x={W - 66} y={84} w={20} />
      <ButtonShape x={W - 42} y={84} w={20} appearance="primary" />
      <Rect x={W - 68} y={82} w={48} h={12} fill="none" stroke={PAINT.accent} corner="button" />
    </PageForm>
  </Canvas>
);

const MODAL = { x: 34, y: 10, w: 100, h: 84 };

/** The Modal's surface over a Backdrop, with its header and fields; the footer is the caller's. */
const ModalShell = ({ children }) => (
  <g>
    <Backdrop x={0} y={0} w={W} h={H} />
    <Rect x={MODAL.x} y={MODAL.y} w={MODAL.w} h={MODAL.h} fill={PAINT.modalSurface} corner="modal" />
    <SkeletonBar x={MODAL.x + 8} y={MODAL.y + 8} w={36} h={5} heading />
    <Field x={MODAL.x + 8} y={MODAL.y + 20} w={MODAL.w - 16} />
    <Field x={MODAL.x + 8} y={MODAL.y + 44} w={MODAL.w - 16} />
    <Rule x1={MODAL.x} x2={MODAL.x + MODAL.w} y1={MODAL.y + MODAL.h - 14} y2={MODAL.y + MODAL.h - 14} stroke={PAINT.modalDivider} />
    {children}
  </g>
);

/** Do: two buttons filling the footer edge to edge, Primary furthest right. */
export const ModalFooterFullBleed = ({ title = 'A Modal whose footer is two buttons filling it edge to edge, the primary furthest right' }) => (
  <Canvas title={title}>
    <ModalShell>
      <ButtonShape x={MODAL.x} y={MODAL.y + MODAL.h - 10} w={MODAL.w / 2} />
      <ButtonShape x={MODAL.x + MODAL.w / 2} y={MODAL.y + MODAL.h - 10} w={MODAL.w / 2} appearance="primary" />
      <Rect x={MODAL.x} y={MODAL.y + MODAL.h - 14} w={MODAL.w} h={14} fill="none" stroke={PAINT.accent} corner="button" />
    </ModalShell>
  </Canvas>
);

/** Don't: small buttons inset in a footer that grows around them. */
export const ModalFooterInset = ({ title = 'A Modal whose footer holds two small inset buttons at the end, with spare footer on both sides' }) => (
  <Canvas title={title}>
    <ModalShell>
      <ButtonShape x={MODAL.x + MODAL.w - 56} y={MODAL.y + MODAL.h - 10} w={22} />
      <ButtonShape x={MODAL.x + MODAL.w - 30} y={MODAL.y + MODAL.h - 10} w={22} appearance="primary" />
      <Rect x={MODAL.x + MODAL.w - 58} y={MODAL.y + MODAL.h - 12} w={52} h={12} fill="none" stroke={PAINT.accent} corner="button" />
    </ModalShell>
  </Canvas>
);

/** Do: a short edit in a Panel, the page still in view beside it. */
export const EditInPanel = ({ title = 'A short edit in a Panel at the end, with the page and its rows still in view beside it' }) => (
  <Canvas title={title}>
    <Rect x={0} y={0} w={W - 64} h={H} fill={PAINT.pageSurface} />
    {[0, 1, 2, 3].map((i) => <Row key={i} x={10} y={14 + i * 18} w={W - 84} />)}
    <Panel x={W - 64} y={0} w={64} h={H} accent />
  </Canvas>
);

/** Don't: the same short edit in a Modal that covers the page. */
export const EditInModal = ({ title = 'A short edit in a Modal over a Backdrop, with the page and its rows covered' }) => (
  <Canvas title={title}>
    <Rect x={0} y={0} w={W} h={H} fill={PAINT.pageSurface} />
    {[0, 1, 2, 3].map((i) => <Row key={i} x={10} y={14 + i * 18} w={W - 20} />)}
    <Backdrop x={0} y={0} w={W} h={H} />
    <Rect x={44} y={14} w={80} h={76} fill={PAINT.modalSurface} stroke={PAINT.accent} corner="modal" />
    <Field x={52} y={24} w={64} />
    <Field x={52} y={52} w={64} />
  </Canvas>
);

/** Do: one column, with a pair side by side only where the two belong together. */
export const OneColumn = ({ title = 'A page form in one column of fields, one pair side by side' }) => (
  <Canvas title={title}>
    <PageForm fields={2} />
    <Rect x={20} y={32} w={W - 40} h={52} fill="none" stroke={PAINT.accent} corner="field" />
  </Canvas>
);

/** Don't: fields scattered across two columns, so the eye zigzags. */
export const TwoColumns = ({ title = 'A page form with its fields scattered across two columns' }) => (
  <Canvas title={title}>
    <PageForm fields={4} columns={2} />
    <Rect x={20} y={32} w={W - 40} h={56} fill="none" stroke={PAINT.accent} corner="field" />
  </Canvas>
);
