import React from 'react';
import { Illustration } from './Illustration.jsx';
import { Breadcrumb, SkeletonBar, Section } from './primitives.jsx';

/**
 * The Navigation pattern's own do and don't drawing: the record page with its
 * breadcrumb. Its don't is the Page template's area page with a breadcrumb
 * (`BreadcrumbOnAreaPage` in page.jsx), so the pair compares at one canvas
 * and one scale. Blocked out: no words, one accent on the subject.
 */

const W = 168;
const H = 104;
const X = 8;
const INNER = W - 2 * X;

/** Do: a record page, its parents on a row above the title. */
export const BreadcrumbOnRecordPage = ({ title = 'A record page with a breadcrumb row of its parents above the title, then a Section' }) => (
  <Illustration width={W} height={H} title={title}>
    <Breadcrumb x={X} y={8} w={96} count={3} accent />
    <SkeletonBar x={X} y={22} w={52} h={8} heading />
    <Section x={X} y={46} w={INNER} h={50} rows={3} />
  </Illustration>
);
