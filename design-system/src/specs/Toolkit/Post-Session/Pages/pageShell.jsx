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
        <div style={{ height: '100%', width: '100%', overflow: 'auto', borderRadius: 'var(--size-card-radius-sm)' }}>
            {children}
        </div>
    );
}

BreakpointPreview.propTypes = {
    children: PropTypes.node,
};

/**
 * Shared PageLayout + SideNav shell for single-step page stories.
 * Use this for visual specs of one step. For the full multi-step walkthrough, see Reflection Flow.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Step body (form section)
 * @param {string} [props.activeTab]
 * @param {object[]} [props.students]
 * @param {object} [props.completedSections]
 * @param {boolean} [props.showSelfReflection=true]
 * @param {boolean} [props.showFormFeedback=true]
 * @param {boolean} [props.showSaveExit=false]
 * @param {string} [props.id='post-session-page-story']
 */
export function ReflectionPageShell({
    children,
    activeTab = 'session-information',
    students = DEFAULT_PAGE_STUDENTS,
    completedSections = {},
    showSelfReflection = true,
    showFormFeedback = true,
    showSaveExit = false,
    id = 'post-session-page-story',
}) {
    const [tab, setTab] = useState(activeTab);
    const [saveExitOpen, setSaveExitOpen] = useState(showSaveExit);

    return (
        <div style={{ width: '100%', height: '100%' }}>
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
                <div
                    style={{
                        display: 'flex',
                        gap: 'var(--size-surface-gap-md)',
                        width: '100%',
                        minHeight: '100%',
                        alignItems: 'stretch',
                    }}
                >
                    <SideNavBar
                        students={students}
                        activeTab={tab}
                        completedSections={completedSections}
                        showSelfReflection={showSelfReflection}
                        showFormFeedback={showFormFeedback}
                        onTabClick={setTab}
                    />
                    <div style={{ flex: '1 1 auto', minWidth: 0, width: '100%' }}>
                        {typeof children === 'function'
                            ? children({ openSaveExit: () => setSaveExitOpen(true) })
                            : children}
                    </div>
                </div>
            </PageLayout>
            <ConfirmationPopUp
                show={saveExitOpen}
                type="exit-without-saving"
                onClose={() => setSaveExitOpen(false)}
                onPrimary={() => setSaveExitOpen(false)}
                onSecondary={() => setSaveExitOpen(false)}
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
    showSaveExit: PropTypes.bool,
    id: PropTypes.string,
};
