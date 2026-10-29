import React, { useState } from 'react';
import { NavTabs } from '@/components';
import OverviewTab from './OverviewTab';
import FlagsTab from './FlagsTab';
import TutorsTab from './TutorsTab';
import DiagnosisTab from './DiagnosisTab';
import { FLAG_INSTANCES, ROSTER, AUDIT_HISTORY } from '../data';
import { statusFor, isOpen, auditUnits } from './audit';

/**
 * v2 — one page, four tabs, one filter bar per tab.
 *
 * Category and priority are filters over a single list rather than nested
 * navigation, which is what flattened the old pills → tabs → page chain.
 */
const RedesignOption = ({
    decisions = {},
    annotations = {},
    flags = FLAG_INSTANCES,
    relabels = {},
    cleanChecks = [],
    onOpenRecording,
    onOpenTutor,
    tab: controlledTab,
    onTabChange,
}) => {
    // Controlled by the app when it is passed, so the tab survives a trip to a
    // tutor or recording page and back.
    const [localTab, setLocalTab] = useState('overview');
    const tab = controlledTab ?? localTab;
    const setTab = onTabChange ?? setLocalTab;

    // A flag is open while any of its sessions waits on a verdict.
    const openCount = flags.filter((f) => isOpen(f, decisions)).length;
    // One audit per session judged, plus every violation a supervisor added.
    const auditedCount = auditUnits(flags, decisions, relabels).length + cleanChecks.length;
    // Your tutors who aren't on track — the same two groups the Tutors tab opens with.
    const needAttention = ROSTER
        .filter((t) => t.assigned && statusFor(t, flags, decisions, relabels) !== 'On Track').length;

    const TABS = [
        { key: 'overview', label: 'Overview' },
        { key: 'tutors', label: `Tutors (${needAttention} need attention)` },
        { key: 'flags', label: `Compliance flags (${openCount} to review)` },
        // Matches the tab's own total: this week's audits plus earlier weeks'.
        { key: 'diagnosis', label: `AI diagnosis (${auditedCount + AUDIT_HISTORY.length})` },
    ];

    return (
        <div className="v2">
            <div className="compliance-page__tabs v2-tabs">
                <NavTabs activeKey={tab} onSelect={setTab}>
                    {TABS.map((t) => (
                        <NavTabs.Item key={t.key} eventKey={t.key} active={tab === t.key}>
                            {t.label}
                        </NavTabs.Item>
                    ))}
                </NavTabs>
            </div>

            {tab === 'overview' && (
                <OverviewTab decisions={decisions} relabels={relabels} flags={flags} onOpenRecording={onOpenRecording} />
            )}
            {tab === 'tutors' && <TutorsTab decisions={decisions} relabels={relabels} flags={flags} onOpenTutor={onOpenTutor} />}
            {tab === 'flags' && (
                <FlagsTab decisions={decisions} relabels={relabels} flags={flags} onOpenRecording={onOpenRecording} />
            )}
            {tab === 'diagnosis' && (
                <DiagnosisTab
                    decisions={decisions}
                    annotations={annotations}
                    relabels={relabels}
                    cleanChecks={cleanChecks}
                    flags={flags}
                    onOpenRecording={onOpenRecording}
                />
            )}
        </div>
    );
};

export default RedesignOption;
