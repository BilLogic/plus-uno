import React from 'react';
import PropTypes from 'prop-types';
import ReflectionFlow from './ReflectionFlow';

const BreakpointPreview = ({ children }) => (
    <div style={{ height: '100%', width: '100%', overflow: 'auto', borderRadius: 'var(--size-card-radius-sm)' }}>
        {children}
    </div>
);

BreakpointPreview.propTypes = {
    children: PropTypes.node,
};

export default {
    title: 'Specs/Toolkit/Post-Session/Pages/Reflection Flow',
    parameters: { layout: 'padded' },
    tags: ['!dev', '!autodocs'],
};

/** Interactive end-to-end reflection flow (in-memory). */
export const Default = {
    render: () => (
        <BreakpointPreview>
            <ReflectionFlow />
        </BreakpointPreview>
    ),
};

/** Opens on Session Reflection with prior sections marked complete. */
export const SessionReflectionStep = {
    name: 'Start at Session Reflection',
    render: () => (
        <BreakpointPreview>
            <ReflectionFlow
                initialTab="session-reflection"
                students={[
                    { id: 'kiera', name: 'Kiera Wintervale', status: 'complete' },
                    { id: 'baxter', name: 'Baxter Ellington', status: 'complete' },
                    { id: 'milo', name: 'Milo Thorne', status: 'complete' },
                ]}
            />
        </BreakpointPreview>
    ),
};

/** Save & Exit modal visible on mount for docs / visual QA. */
export const SaveAndExit = {
    name: 'Save & Exit',
    render: () => (
        <BreakpointPreview>
            <ReflectionFlow
                initialTab="session-reflection"
                showSaveAndExitOnMount
                students={[
                    { id: 'kiera', name: 'Kiera Wintervale', status: 'complete' },
                    { id: 'baxter', name: 'Baxter Ellington', status: 'complete' },
                ]}
            />
        </BreakpointPreview>
    ),
};

/** Cadence off — no Self Reflection / Form Feedback tabs (PRD §6–7). */
export const WithoutCadenceSections = {
    name: 'Without Self + Form Feedback',
    render: () => (
        <BreakpointPreview>
            <ReflectionFlow showSelfReflection={false} showFormFeedback={false} />
        </BreakpointPreview>
    ),
};

/** Cancellation branch from Session Information. */
export const CancellationBranch = {
    name: 'Cancellation branch',
    render: () => (
        <BreakpointPreview>
            <ReflectionFlow
                initialSessionInfo={{
                    date: '2026-07-15',
                    sessionOption: 'session-1',
                    didNotHappen: true,
                }}
            />
        </BreakpointPreview>
    ),
};
