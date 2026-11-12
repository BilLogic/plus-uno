import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { Button, PanelBody, PanelContainer, PanelHeader } from '@/components';
import { Backdrop, PatternModal, PatternSection } from '@/patterns';
import { InAppFrame } from '@/storybook-docs/lib/pattern-demo.jsx';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import { CardsSection, DemoPageHeader, PageActions } from '../../patterns/Page/pageDemo.jsx';
import { SessionsBehind, DetailsPanel } from '../../patterns/Panel/panelDemo.jsx';
import { FormFields, FILLED, PageFooter } from '../../patterns/Form/formDemo.jsx';
import { TwoCells } from '../../patterns/PatternModal/modalDemo.jsx';
import { Menu } from '../../patterns/Popup/popupDemo.jsx';

/**
 * The seven pictures on the Templates overview's type grid. Every one is the
 * template drawn at the same stage, in the same browser window: a Frame with
 * its Sidebar holds a Page, a Section or a Form; a Modal and a Popup open over
 * a page; a Panel sits beside one. One stage and one window mean one scale, so
 * the seven read as one set.
 */

/** The stage every thumbnail lays out at, in px. Docs geometry: 16 by 10, so a thumbnail's box has no spare room. */
export const THUMB_STAGE = { width: 1440, height: 900 }; // docs-literal

/** The shared stage: the browser window filling a fixed box. */
const Stage = ({ address = 'app.plus.org/sessions', children }) => (
    <div data-thumb-stage style={{ inlineSize: THUMB_STAGE.width, blockSize: THUMB_STAGE.height }}>
        <BrowserWindow fill address={address}>{children}</BrowserWindow>
    </div>
);

Stage.propTypes = { address: PropTypes.string, children: PropTypes.node };

/** The app frame inside the window, at the window's full height. */
const InFrame = ({ children, ...frame }) => (
    <InAppFrame height="100%" panelStorageKey={null} {...frame}>{children}</InAppFrame>
);

InFrame.propTypes = { children: PropTypes.node };

/** Frame: the Sidebar, the Page, and the AI panel as its own region. */
export const FrameThumb = () => (
    <Stage address="app.plus.org/dashboard">
        <InFrame
            panelLabel="AI chat"
            panelOpen
            panel={(
                <PanelContainer>
                    <PanelHeader title="AI chat" />
                    <PanelBody>Ask about this page.</PanelBody>
                </PanelContainer>
            )}
        >
            <SessionsBehind picked={-1} />
            <CardsSection title="Students" description="Your roster" />
        </InFrame>
    </Stage>
);

/** Page: a header, then Sections, inside the Frame. */
export const PageThumb = () => (
    <Stage address="app.plus.org/sessions">
        <InFrame>
            <DemoPageHeader title="Sessions" actions={<PageActions />} />
            <CardsSection title="Upcoming sessions" description="Next 7 days" />
            <SessionsBehind picked={-1} />
        </InFrame>
    </Stage>
);

/** Section: one Section on the page, a header over a body. */
export const SectionThumb = () => (
    <Stage address="app.plus.org/students">
        <InFrame>
            <SessionsBehind picked={-1} />
        </InFrame>
    </Stage>
);

/** Form: the fields and the footer, in a Section on the page. */
export const FormThumb = () => (
    <Stage address="app.plus.org/settings/sessions">
        <InFrame>
            <PatternSection title="Log a session" fill="subtle">
                <FormFields values={FILLED} onChange={() => {}} errors={{}} setRef={() => {}} />
                <PageFooter sending={false} onSave={() => {}} />
            </PatternSection>
        </InFrame>
    </Stage>
);

/** Modal: over a page, centered on its Backdrop. */
export const ModalThumb = () => (
    <Stage address="app.plus.org/students">
        <div style={{ position: 'relative', blockSize: '100%' }}>
            <InFrame><SessionsBehind /></InFrame>
            <Backdrop inline screenWidth={THUMB_STAGE.width} screenHeight={THUMB_STAGE.height} style={{ position: 'absolute', inset: 0, inlineSize: '100%' }}>
                <PatternModal
                    width="sm"
                    title="Move session?"
                    onClose={() => {}}
                    footer={<TwoCells action="Move session" />}
                >
                    <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>Move Thursday’s session with Ana Ruiz to 4:30 PM? Ana and her tutor get an email with the new time.</p>
                </PatternModal>
            </Backdrop>
        </div>
    </Stage>
);

/** Panel: beside the page, no Backdrop. */
export const PanelThumb = () => (
    <Stage address="app.plus.org/sessions">
        <InFrame panelLabel="Session details" panelOpen panel={<DetailsPanel />}>
            <SessionsBehind />
        </InFrame>
    </Stage>
);

/** Popup: a menu hung off its trigger, over the page. */
export const PopupThumb = () => {
    const [mount, setMount] = useState(null);
    return (
        <Stage address="app.plus.org/sessions">
            <InFrame>
                <div ref={setMount} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 'var(--stack-sm)' }}>
                        <Button text="Add session" appearance="primary" onClick={() => {}} />
                        {mount ? <Menu mount={mount} /> : null}
                    </div>
                    <SessionsBehind />
                </div>
            </InFrame>
        </Stage>
    );
};
