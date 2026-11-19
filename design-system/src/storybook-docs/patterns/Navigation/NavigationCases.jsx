import React from 'react';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './NavigationExamples.jsx';
import examplesSource from './NavigationExamples.jsx?raw';

/**
 * Live Do / Don't breadcrumb cases on the Navigation pattern page: each one is
 * an example from `NavigationExamples.jsx`, staged on a borderless
 * `CaseSurface`, and Show code prints the example's own source. `record={true}`
 * shows Maya Rodriguez's record page with only her sessions; `record={false}`
 * shows the Students area page where a breadcrumb does not belong.
 */

export const CODE = showCode(examplesSource, ['BreadcrumbOnRecordPage', 'BreadcrumbOnAreaPage']);

export const BreadcrumbCase = ({ record = true }) => (
    <CaseSurface border="none" padding="none" surface={false}>
        <HeadingLevelContext.Provider value={5}>
            {record ? <Example.BreadcrumbOnRecordPage /> : <Example.BreadcrumbOnAreaPage />}
        </HeadingLevelContext.Provider>
    </CaseSurface>
);
