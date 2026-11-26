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

export const CODE = showCode(examplesSource, ['BreadcrumbOnRecordPage', 'BreadcrumbOnAreaPage', 'OpenItemsByTimeAndWho', 'OpenItemsCarryEverything', 'OneTabSystem', 'TwoTabSystems']);

const OnRecordPage = ({ children, level = 5 }) => (
    <CaseSurface border="none" padding="none" surface={false}>
        <HeadingLevelContext.Provider value={level}>{children}</HeadingLevelContext.Provider>
    </CaseSurface>
);

/** The picture's links are plain hrefs, as a consumer writes them; a click here stays on the docs page. */
const stayOnPage = (event) => {
    if (event.target.closest?.('a[href^="#"]')) event.preventDefault();
};

export const BreadcrumbCase = ({ record = true }) => (
    <div onClickCapture={stayOnPage}>
        <OnRecordPage level={4}>
            {record ? <Example.BreadcrumbOnRecordPage /> : <Example.BreadcrumbOnAreaPage />}
        </OnRecordPage>
    </div>
);

/** The Sidebar sits in the docked rail box it has in a Frame, in a column as wide as a card. */
const SidebarStage = ({ children }) => (
    <div style={{ padding: 'var(--page-pad)', boxSizing: 'border-box', inlineSize: 'var(--card-min-width-md)' }}>
        <div className="plus-frame__sidebar plus-frame__sidebar--docked not-prose sb-unstyled">{children}</div>
    </div>
);

/** Do: an open item is named by its time and who, with the school in its tooltip. */
export const OpenItemsDoCase = () => <SidebarStage><Example.OpenItemsByTimeAndWho /></SidebarStage>;

/** Don't: an open item that carries everything, so the time it is found by is cut off. */
export const OpenItemsDontCase = () => <SidebarStage><Example.OpenItemsCarryEverything /></SidebarStage>;

/** Do: under page tabs the Section has no views row; Status is a quick filter after Search. */
export const OneTabSystemCase = () => <OnRecordPage><Example.OneTabSystem /></OnRecordPage>;

/** Don't: pill views under page tabs make two tab systems on one page. */
export const TwoTabSystemsCase = () => <OnRecordPage><Example.TwoTabSystems /></OnRecordPage>;
