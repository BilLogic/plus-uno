import React from 'react';
import { Illustration } from './Illustration.jsx';
import { Breadcrumb, ButtonShape, Field, Row, Section, SkeletonBar, Tabs } from './primitives.jsx';

/**
 * The Page template's do and don't drawings. Each lesson is about where a part
 * sits in the page header, so every drawing is blocked out: no words, buttons
 * as flat strips, one accent on the subject. Every pair shares one canvas, so
 * a do and its don't compare at one scale.
 */

const W = 168;
const H = 104;
const X = 8;
const INNER = W - 2 * X;

const Canvas = ({ title, children }) => (
  <Illustration width={W} height={H} title={title}>
    {children}
  </Illustration>
);

/** The page's title: one heading bar, with an optional description line under it. */
const Title = ({ y, accent = false, description = true, w = 52 }) => (
  <g>
    <SkeletonBar x={X} y={y} w={w} h={8} accent={accent} heading />
    {description && <SkeletonBar x={X} y={y + 13} w={w * 1.4} />}
  </g>
);

/** The collection's view bar: one pill at the start; `primary` adds the labeled Primary at the end. */
const ViewBar = ({ y, primary = false }) => (
  <g>
    <Tabs x={X} y={y - 4} w={24} count={1} />
    {primary && <ButtonShape x={W - X - 26} y={y} w={26} appearance="primary" />}
  </g>
);

const Rows = ({ y, count = 3 }) => (
  <g>
    {Array.from({ length: count }, (_, i) => <Row key={i} x={X} y={y + i * 15} w={INNER} />)}
  </g>
);

/** One h1 in the page header; the Section under it opens at h2. */
export const HeaderIsTheH1 = ({ title = 'A page header holding the one large title, with a Section under it whose heading is smaller' }) => (
  <Canvas title={title}>
    <Title y={8} accent />
    <Section x={X} y={40} w={INNER} h={56} rows={3} />
  </Canvas>
);

/** Sections standing in for the title: two headings the size of a page title, no header. */
export const SectionsAsTitles = ({ title = 'Two Sections whose headings are as large as a page title, and no page header above them' }) => (
  <Canvas title={title}>
    <SkeletonBar x={X} y={10} w={52} h={8} accent heading />
    <Rows y={24} count={2} />
    <SkeletonBar x={X} y={62} w={52} h={8} heading />
    <Rows y={76} count={1} />
  </Canvas>
);

/** The Primary that adds rows ends the collection's view bar; the header carries only the title. */
export const AddInViewBar = ({ title = 'A page header with only its title, and the one primary button at the end of the collection view bar' }) => (
  <Canvas title={title}>
    <Title y={8} description={false} />
    <ViewBar y={34} primary />
    <Rows y={52} />
  </Canvas>
);

/** The same Primary twice: in the page header and again in the view bar. */
export const AddTwice = ({ title = 'The same primary button in the page header and again at the end of the view bar' }) => (
  <Canvas title={title}>
    <Title y={8} description={false} />
    <ButtonShape x={W - X - 26} y={8} w={26} appearance="primary" />
    <ViewBar y={34} primary />
    <Rows y={52} />
  </Canvas>
);

/** An area page: the title alone, with nothing above it. */
export const AreaPageTitleAlone = ({ title = 'An area page whose header is the title alone, with nothing above it' }) => (
  <Canvas title={title}>
    <Title y={12} accent description={false} />
    <Section x={X} y={36} w={INNER} h={56} rows={3} />
  </Canvas>
);

/** A breadcrumb on an area page, repeating the Sidebar's place. */
export const BreadcrumbOnAreaPage = ({ title = 'An area page with a breadcrumb row above its title, repeating the place the sidebar already shows' }) => (
  <Canvas title={title}>
    <Breadcrumb x={X} y={8} w={64} count={2} accent />
    <Title y={22} description={false} />
    <Section x={X} y={46} w={INNER} h={50} rows={3} />
  </Canvas>
);

/** One detail line under the title. */
export const OneLineDescription = ({ title = 'A page title with one short line of description under it, then the first Section' }) => (
  <Canvas title={title}>
    <Title y={8} />
    <Section x={X} y={40} w={INNER} h={56} rows={3} />
  </Canvas>
);

/** A paragraph under the title: three lines pushing the Sections down. */
export const ParagraphUnderTitle = ({ title = 'A page title with a three-line paragraph under it that pushes the first Section down the page' }) => (
  <Canvas title={title}>
    <SkeletonBar x={X} y={8} w={52} h={8} heading />
    <SkeletonBar x={X} y={21} w={INNER * 0.9} accent />
    <SkeletonBar x={X} y={29} w={INNER * 0.85} accent />
    <SkeletonBar x={X} y={37} w={INNER * 0.5} accent />
    <Section x={X} y={54} w={INNER} h={44} rows={2} />
  </Canvas>
);

/** Page tabs, and under them a Section whose views are one field at the start of its bar. */
export const OneTabSystem = ({ title = 'Page tabs under the title, and a Section whose views are one field at the start of its bar' }) => (
  <Canvas title={title}>
    <Title y={6} description={false} />
    <Tabs x={X} y={20} w={72} count={3} />
    <Field x={X} y={46} w={44} accent />
    <Rows y={72} count={2} />
  </Canvas>
);

/** Page tabs and pill views under them: two tab systems on one page. */
export const TwoTabSystems = ({ title = 'Page tabs under the title, and pill views in the Section bar under them: two tab systems on one page' }) => (
  <Canvas title={title}>
    <Title y={6} description={false} />
    <Tabs x={X} y={20} w={72} count={3} />
    <Tabs x={X} y={42} w={48} count={2} accent />
    <Rows y={62} count={2} />
  </Canvas>
);
