import React from 'react';
import MATHiaGoalStatusBanner from './MATHiaGoalStatusBanner';

export default {
    title: 'Specs/Toolkit/In-Session/Elements/MATHia Goal Status Banner',
    component: MATHiaGoalStatusBanner,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: `
MATHia Goal Status Banner displays alert messages indicating whether a MATHia session
is a goal-setting or non-goal-setting session. Supports both dashboard and modal variants.

**Dashboard alerts** include a title (h5) and body text (body2-txt) and are dismissable.
**Modal alerts** show simple body text (body2-txt) and are not dismissable.
                `,
            },
        },
    },
    argTypes: {
        type: {
            control: { type: 'select' },
            options: ['dashboard', 'modal'],
            description: 'Banner type: dashboard (with title) or modal (simple text)',
            table: { category: 'Design' },
        },
        sessionType: {
            control: { type: 'select' },
            options: ['goal-setting', 'non-goal-setting'],
            description: 'Session type: goal-setting or non-goal-setting',
            table: { category: 'Content' },
        },
        dismissable: {
            control: 'boolean',
            description: 'Whether the banner can be dismissed (defaults based on type)',
            table: { category: 'Behavior' },
        },
        onDismiss: {
            action: 'dismissed',
            description: 'Callback when banner is dismissed',
            table: { category: 'Behavior' },
        },
    },
};

/**
 * Dashboard Alert - Goal Setting
 * Banner shown at the top of the dashboard for goal-setting sessions.
 */
export const DashboardGoalSetting = {
    args: {
        type: 'dashboard',
        sessionType: 'goal-setting',
    },
};

/**
 * Dashboard Alert - Non-Goal Setting
 * Banner shown at the top of the dashboard for non-goal-setting sessions.
 */
export const DashboardNonGoalSetting = {
    args: {
        type: 'dashboard',
        sessionType: 'non-goal-setting',
    },
};

/**
 * Modal Alert - Goal Setting
 * Simple banner shown in modals for goal-setting sessions.
 */
export const ModalGoalSetting = {
    args: {
        type: 'modal',
        sessionType: 'goal-setting',
    },
};

/**
 * Modal Alert - Non-Goal Setting
 * Simple banner shown in modals for non-goal-setting sessions.
 */
export const ModalNonGoalSetting = {
    args: {
        type: 'modal',
        sessionType: 'non-goal-setting',
    },
};

/**
 * Overview
 * Shows all four variants of the MATHia Goal Status Banner.
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
        <div>
            <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>
                Dashboard Alerts
            </h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)' }}>
                <MATHiaGoalStatusBanner type="dashboard" sessionType="goal-setting" />
                <MATHiaGoalStatusBanner type="dashboard" sessionType="non-goal-setting" />
            </div>
        </div>

        <div>
            <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>
                Modal Alerts
            </h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)' }}>
                <MATHiaGoalStatusBanner type="modal" sessionType="goal-setting" />
                <MATHiaGoalStatusBanner type="modal" sessionType="non-goal-setting" />
            </div>
        </div>
    </div>
);

/**
 * Interactive Playground
 */
export const Interactive = {
    args: {
        type: 'dashboard',
        sessionType: 'goal-setting',
        dismissable: true,
    },
};




