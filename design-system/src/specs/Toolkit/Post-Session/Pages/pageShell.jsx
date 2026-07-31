import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '@/specs/Universal/Pages';
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
 * Shared PageLayout chrome for Post-Session page stories and ReflectionFlow.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.id]
 * @returns {React.ReactElement}
 */
export function ReflectionPageLayout({ children, id = 'post-session-page' }) {
    return (
        <PageLayout
            topBarConfig={{
                breadcrumbs: [
                    { text: 'Toolkit', href: '#' },
                    { text: 'Sessions', href: '#' },
                    { text: 'Reflection Form' },
                ],
                user: { name: 'John Doe', role: 'Lead' },
            }}
            sidebarConfig={{ user: 'tutor', activeTab: 'sessions' }}
            id={id}
            style={{ width: '100%', height: '100%' }}
        >
            {children}
        </PageLayout>
    );
}

ReflectionPageLayout.propTypes = {
    children: PropTypes.node,
    id: PropTypes.string,
};

/**
 * Flex row wrapping SideNav + main step body.
 *
 * @param {object} props
 * @param {React.ReactNode} props.sideNav
 * @param {React.ReactNode} props.children
 */
export function ReflectionContentRow({ sideNav, children }) {
    return (
        <div
            style={{
                display: 'flex',
                gap: 'var(--size-surface-gap-md)',
                width: '100%',
                minHeight: '100%',
                alignItems: 'stretch',
            }}
        >
            {sideNav}
            <div style={{ flex: '1 1 auto', minWidth: 0, width: '100%' }}>
                {children}
            </div>
        </div>
    );
}

ReflectionContentRow.propTypes = {
    sideNav: PropTypes.node,
    children: PropTypes.node,
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
            <ReflectionPageLayout id={id}>
                <ReflectionContentRow
                    sideNav={(
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
                </ReflectionContentRow>
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
