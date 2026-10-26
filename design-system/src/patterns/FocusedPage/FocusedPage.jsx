import React from 'react';
import PropTypes from 'prop-types';
import { Button, CloseButton } from '@/components';
import Frame from '../Frame';
import './FocusedPage.scss';

/**
 * Focused page pattern: a page template for one task, with no sidebar.
 * Mirrors the Figma `Pattern/Focused page` and its parts `_Focused topbar`
 * and `_Focused footer`, the sibling of `Pattern/Page template`.
 *
 * - It is the `Frame` with no sidebar and three rows, `--surface-container-stack`
 *   8 apart inside `--surface-container-pad` 8: the topbar, the surface, and
 *   the footer.
 * - **Topbar** (a `header`, the banner), 32 high: Back on the start, a
 *   secondary text button with `arrow-left`; the title in the middle, the
 *   page's one `h1` at Heading/xsmall, on one line and truncated; Close on the
 *   end, the `CloseButton`. Its parts sit `--element-inline-lg` 12 apart.
 * - **Surface** (the `main`): the frame's surface at reading width, its content
 *   capped at `--layout-max-width-reading` 864 and centered, never under
 *   `--layout-min-width-content` 720. It scrolls on its own.
 * - **Footer** (a `footer`, named "Page actions"): the actions, end-aligned,
 *   `--size-element-gap-sm` 8 apart, in a column as wide as the content and
 *   lined up with it. It stays put while the surface scrolls.
 *
 * Focus order follows the DOM: Back, Close, the content, then the actions.
 */
const FocusedPage = ({
    title,
    onBack,
    backHref,
    backLabel = 'Back',
    onClose,
    closeLabel = 'Close',
    actions,
    actionsLabel = 'Page actions',
    id,
    className = '',
    style,
    children,
    ...props
}) => {
    const hasBack = Boolean(onBack || backHref);

    const topbar = (
        <header className="plus-focused-page__topbar">
            <div className="plus-focused-page__start">
                {hasBack ? (
                    <Button
                        className="plus-focused-page__back"
                        style="secondary"
                        fill="text"
                        size="medium"
                        leadingVisual="arrow-left"
                        text={backLabel}
                        href={backHref}
                        onClick={onBack}
                    />
                ) : null}
            </div>
            <h1 className="plus-focused-page__title">{title}</h1>
            <div className="plus-focused-page__end">
                {onClose ? (
                    <CloseButton
                        className="plus-focused-page__close"
                        aria-label={closeLabel}
                        onClick={onClose}
                    />
                ) : null}
            </div>
        </header>
    );

    return (
        <Frame
            id={id}
            topbar={topbar}
            width="reading"
            contentAs="main"
            contentClassName="plus-focused-page__content"
            footer={actions ? (
                <footer className="plus-focused-page__footer" aria-label={actionsLabel}>
                    <div className="plus-focused-page__actions">{actions}</div>
                </footer>
            ) : null}
            className={['plus-focused-page', className].filter(Boolean).join(' ')}
            style={style}
            {...props}
        >
            {children}
        </Frame>
    );
};

FocusedPage.propTypes = {
    /** The task's name: the page's `h1`, in the topbar */
    title: PropTypes.node.isRequired,
    /** Called when Back is pressed. With this or `backHref`, the topbar shows Back */
    onBack: PropTypes.func,
    /** Where Back goes, as a link */
    backHref: PropTypes.string,
    /** Back's label */
    backLabel: PropTypes.string,
    /** Called when Close is pressed. Without it there is no Close */
    onClose: PropTypes.func,
    /** Close's accessible name */
    closeLabel: PropTypes.string,
    /** Footer actions, end-aligned, the primary action last. Without them there is no footer */
    actions: PropTypes.node,
    /** The footer's accessible name */
    actionsLabel: PropTypes.string,
    id: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    /** Content slot: the task's sections */
    children: PropTypes.node,
};

export default FocusedPage;
