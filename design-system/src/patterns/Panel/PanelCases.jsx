import React from 'react';
import { Button, FooterActions, StatusTag } from '@/components';
import {
    PanelBody,
    PanelCloseAction,
    PanelContainer,
    PanelFooter,
    PanelHeader,
    PanelSubheader,
} from '@/patterns';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';

/**
 * The live do and don't examples of the Panel template page, built from
 * `PanelContainer`, `PanelHeader`, `PanelBody`, `PanelFooter` and `FooterActions`.
 */

const ReadingPanel = ({ footer, inlineSize }) => (
    <CaseSurface
        padding="none"
        style={{
            maxInlineSize: inlineSize ?? 'var(--panel-width-default)',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
        }}
    >
        <HeadingLevelContext.Provider value={4}>
            <PanelContainer>
                <PanelHeader title="Ben Okafor · Thu 5:00 PM" actions={<PanelCloseAction onClick={() => {}} />} />
                <PanelSubheader><StatusTag appearance="warning">Needs a tutor</StatusTag></PanelSubheader>
                <PanelBody>
                    <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>
                        Math · 60 minutes · Room 2. Ben worked through fractions last week.
                    </p>
                </PanelBody>
                {footer ? <PanelFooter>{footer}</PanelFooter> : null}
            </PanelContainer>
        </HeadingLevelContext.Provider>
    </CaseSurface>
);

/** Reading: a header and a body, nothing to save. */
export const ReadingNoFooter = () => <ReadingPanel />;

/** The same Panel squeezed to a third of its default width. */
export const ReadingNarrow = () => <ReadingPanel inlineSize="calc(var(--panel-width-default) / 3)" />;

/** A footer of buttons on a Panel that is only read. */
export const ReadingWithFooter = () => (
    <ReadingPanel
        footer={(
            <FooterActions>
                <Button text="Done" appearance="primary" onClick={() => {}} />
            </FooterActions>
        )}
    />
);
