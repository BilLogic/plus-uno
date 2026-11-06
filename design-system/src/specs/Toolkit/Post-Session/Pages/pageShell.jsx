import React, { useCallback, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '@/specs/Universal/Pages';
import { ReflectionChromeContext } from '@/specs/Toolkit/Post-Session/reflectionChrome';
import SideNavBar from '@/specs/Toolkit/Post-Session/Sections/SideNavBar/SideNavBar';
import ConfirmationPopUp from '@/specs/Toolkit/Post-Session/Modals/ConfirmationPopUp/ConfirmationPopUp';

export const DEFAULT_PAGE_STUDENTS = [
    { id: 'kiera', name: 'Kiera Wintervale', status: 'complete' },
    { id: 'baxter', name: 'Baxter Ellington', status: 'complete' },
    { id: 'milo', name: 'Milo Thorne', status: 'complete' },
];

/**
 * Breakpoint-friendly preview wrapper for page stories.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export function BreakpointPreview({ children }) {
    return (
        <div
            style={{
                width: '100%',
                minHeight: '720px',
                height: '100%',
                overflow: 'auto',
                borderRadius: 'var(--size-card-radius-sm)',
            }}
        >
            {children}
        </div>
    );
}

BreakpointPreview.propTypes = {
    children: PropTypes.node,
};

/**
 * The focused Page template for a reflection step: Back, the title and Close in
 * the header row, the step in the reading column, and the step's actions in the
 * footer. Back and Close leave the way the step's Cancel does.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} [props.stepMenu] - The step menu, beside the step's Section.
 * @param {string} [props.id]
 * @param {string} [props.title] - Page name; becomes the page's `<h1>` (see PageLayout).
 * @returns {React.ReactElement}
 */
export function ReflectionPageLayout({ children, stepMenu = null, id = 'post-session-page', title = 'Reflection Form' }) {
    const [footerEl, setFooterEl] = useState(null);
    const cancelRef = useRef(null);
    const registerCancel = useCallback((handler) => {
        cancelRef.current = handler;
    }, []);
    const leave = useCallback(() => cancelRef.current?.(), []);
    const chrome = useMemo(
        () => ({ stepMenu, footerEl, registerCancel }),
        [stepMenu, footerEl, registerCancel],
    );

    return (
        <ReflectionChromeContext.Provider value={chrome}>
            <PageLayout
                frame="focused"
                title={title}
                onBack={leave}
                onClose={leave}
                actions={<div ref={setFooterEl} style={{ display: 'contents' }} />}
                id={id}
                style={{ width: '100%', height: '100%' }}
            >
                {children}
            </PageLayout>
        </ReflectionChromeContext.Provider>
    );
}

ReflectionPageLayout.propTypes = {
    children: PropTypes.node,
    stepMenu: PropTypes.node,
    id: PropTypes.string,
    title: PropTypes.string,
};

/**
 * Shared discard + saved ConfirmationPopUp pair.
 *
 * @param {object} props
 * @param {null|'discard'|'saved'} props.exitModal
 * @param {(next: null|'discard'|'saved') => void} props.setExitModal
 * @param {() => void} [props.onExitWithoutSaving]
 * @param {() => void} [props.onSavedExit]
 * @param {() => void} [props.onDiscardSaveAndExit]
 * @param {() => void} [props.onContinueEditing]
 */
export function ReflectionExitModals({
    exitModal,
    setExitModal,
    onExitWithoutSaving,
    onSavedExit,
    onDiscardSaveAndExit,
    onContinueEditing,
}) {
    return (
        <>
            <ConfirmationPopUp
                show={exitModal === 'discard'}
                type="exit-without-saving"
                onClose={() => setExitModal(null)}
                onPrimary={() => {
                    setExitModal(null);
                    onExitWithoutSaving?.();
                }}
                onSecondary={() => {
                    if (onDiscardSaveAndExit) {
                        onDiscardSaveAndExit();
                    } else {
                        setExitModal('saved');
                    }
                }}
            />
            <ConfirmationPopUp
                show={exitModal === 'saved'}
                type="exit"
                onClose={() => {
                    setExitModal(null);
                    onContinueEditing?.();
                }}
                onPrimary={() => {
                    setExitModal(null);
                    onSavedExit?.();
                }}
                onSecondary={() => {
                    setExitModal(null);
                    onContinueEditing?.();
                }}
            />
        </>
    );
}

ReflectionExitModals.propTypes = {
    exitModal: PropTypes.oneOf([null, 'discard', 'saved']),
    setExitModal: PropTypes.func.isRequired,
    onExitWithoutSaving: PropTypes.func,
    onSavedExit: PropTypes.func,
    onDiscardSaveAndExit: PropTypes.func,
    onContinueEditing: PropTypes.func,
};

/**
 * Shared PageLayout + SideNav shell for single-step page stories.
 * Use this for visual specs of one step. For the full multi-step walkthrough, see Reflection Flow.
 *
 * @param {object} props
 * @param {React.ReactNode|Function} props.children - Step body or render-prop
 * @param {string} [props.activeTab]
 * @param {object[]} [props.students]
 * @param {object} [props.completedSections]
 * @param {boolean} [props.showSelfReflection=true]
 * @param {boolean} [props.showFormFeedback=true]
 * @param {null|'discard'|'saved'} [props.initialExitModal=null]
 * @param {string} [props.id='post-session-page-story']
 */
export function ReflectionPageShell({
    children,
    activeTab = 'session-information',
    students = DEFAULT_PAGE_STUDENTS,
    completedSections = {},
    showSelfReflection = true,
    showFormFeedback = true,
    initialExitModal = null,
    id = 'post-session-page-story',
}) {
    const [tab, setTab] = useState(activeTab);
    /** @type {[null|'discard'|'saved', Function]} */
    const [exitModal, setExitModal] = useState(initialExitModal);

    /**
     * Opens discard modal when draft is dirty; no-ops when clean.
     *
     * @param {object} [_data]
     * @param {boolean} [dirty=true]
     */
    const openDiscard = (_data, dirty = true) => {
        if (!dirty) return;
        setExitModal('discard');
    };

    /**
     * Opens Saved modal (Save & Exit path).
     */
    const openSaved = () => setExitModal('saved');

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReflectionPageLayout
                id={id}
                stepMenu={(
                    <SideNavBar
                        students={students}
                        activeTab={tab}
                        completedSections={completedSections}
                        showSelfReflection={showSelfReflection}
                        showFormFeedback={showFormFeedback}
                        onTabClick={setTab}
                    />
                )}
            >
                {typeof children === 'function'
                    ? children({ openDiscard, openSaved })
                    : children}
            </ReflectionPageLayout>
            <ReflectionExitModals
                exitModal={exitModal}
                setExitModal={setExitModal}
            />
        </div>
    );
}

ReflectionPageShell.propTypes = {
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    activeTab: PropTypes.string,
    students: PropTypes.array,
    completedSections: PropTypes.object,
    showSelfReflection: PropTypes.bool,
    showFormFeedback: PropTypes.bool,
    initialExitModal: PropTypes.oneOf([null, 'discard', 'saved']),
    id: PropTypes.string,
};
