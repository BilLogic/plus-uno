import React from 'react';
import { OverlayContainer } from '@/lib/overlay';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { holdMenuOpen } from '@/storybook-docs/lib/hold-menu-open.jsx';
import { holdPopupOpen } from '@/storybook-docs/lib/hold-popup-open.jsx';
import { openModals } from '@/storybook-docs/lib/inline-modals.jsx';
import { PopupStage } from './popupDemo.jsx';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './PopupExamples.jsx';
import examplesSource from './PopupExamples.jsx?raw';

/**
 * The live do and don't examples on the Popup template page, composed from
 * `Popup`, `DropdownMenu`, `Modal`, `FooterActions`, `TextField` and `Button`,
 * drawn open by `holdMenuOpen`, `holdPopupOpen` and `openModals`.
 */

/** The stand-in screen width a Modal's Blanket is drawn at. Docs geometry, px. */
const SCREEN_WIDTH = 1024; // docs-literal

/** An example's layer drawn open: a menu with `isOpen`, a Popup with `show`. */
const open = (element) => holdPopupOpen(holdMenuOpen(element));

/** The height of the stage a held-open menu has room in. Docs geometry, px. */
const MENU_STAGE = 230; // docs-literal

/** The height of the stage a form in a Popup has room in. Docs geometry, px. */
const FORM_STAGE = 300; // docs-literal: the form's popup is about 190 px tall; the stage leaves room below it

/** The height of the stage a long read has room in. Docs geometry, px. */
const LONG_READ_STAGE = 330; // docs-literal

/** The Show code for each example, read from `PopupExamples.jsx`. */
export const CODE = showCode(examplesSource, [
    'EndAligned',
    'StartAlignedAtEnd',
    'AsWideAsTrigger',
    'NarrowerThanTrigger',
    'AtCap',
    'LongReadInPopup',
    'OneFlatMenu',
    'PopupBesidePopup',
    'FieldsInModal',
    'FormInPopup',
]);

/** A stage that holds the example's layer open inside its own box, with room under the trigger. */
const Held = ({ side, height = MENU_STAGE, children }) => (
    <PopupStage height={height} side={side}>
        {(mount) => <OverlayContainer container={mount} boundary={null}>{children}</OverlayContainer>}
    </PopupStage>
);

/** More sits at the end of the bar, so its menu aligns to its end edge and grows into the page. */
export const EndAligned = () => <Held side="end">{open(Example.EndAligned())}</Held>;

/** An end trigger with a start-aligned menu: it runs off the edge of the page. */
export const StartAlignedAtEnd = () => <Held side="end">{open(Example.StartAlignedAtEnd())}</Held>;

/** The Popup is at least as wide as the trigger it hangs off, so their edges line up. */
export const AsWideAsTrigger = () => <Held>{open(Example.AsWideAsTrigger())}</Held>;

/** A 3-col step under a wider trigger: the Popup ends short of it. */
export const NarrowerThanTrigger = () => <Held>{open(Example.NarrowerThanTrigger())}</Held>;

/** A content Popup at 4-col, the cap. */
export const AtCap = () => <Held>{open(Example.AtCap())}</Held>;

/** A long read in a Popup: three paragraphs at the cap. */
export const LongReadInPopup = () => <Held height={LONG_READ_STAGE}>{open(Example.LongReadInPopup())}</Held>;

/** One flat menu: a choice with two forms is two rows. */
export const OneFlatMenu = () => <Held>{open(Example.OneFlatMenu())}</Held>;

/** A menu row that opens a second Popup beside it: two layers off one trigger. */
export const PopupBesidePopup = () => <Held>{open(Example.PopupBesidePopup())}</Held>;

/** Fields the person must finish sit in a Modal over a Blanket. */
export const FieldsInModalCase = () => (
    <FitStage width={SCREEN_WIDTH} reflow={false}>
        <div className="sb-ds-modal-stack" style={{ '--plus-overlay-screen': `${SCREEN_WIDTH}px`, '--plus-overlay-screen-height': '300px' /* demo frame */ }}>
            {openModals(Example.FieldsInModal())}
        </div>
    </FitStage>
);

/** A form placed inside a Popup closes on an outside click and loses edits. */
export const FormInPopupCase = () => (
    // The stage fills the well: in the example's centered column it would shrink to the trigger and clip the popup.
    <div style={{ inlineSize: '100%' }}>
        <Held height={FORM_STAGE}>{open(Example.FormInPopup())}</Held>
    </div>
);
