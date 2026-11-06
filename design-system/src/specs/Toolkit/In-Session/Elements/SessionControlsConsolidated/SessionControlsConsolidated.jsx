import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Button, IconButton, DropdownMenu, ButtonItem } from '@/components';
import StatusTag from '@/components/labels/StatusTag';
import './SessionControlsConsolidated.scss';
import { iconClass } from '../../../../../lib/icon';

/**
 * SessionControlsConsolidated
 *
 * In-session header controls, consolidated per the "Session Controls Consolidation"
 * spec (Figma Web App Specs 149-110250; Notion hand-off, v2.3 Jul 2026).
 *
 * Button hierarchy (spec): tonal = the live info badges · filled = the primary action
 * (Manage session) · outlined = the secondary overflow ("…" / "Tutor tools"). "View
 * session info" lives inside the overflow menu — there is no standalone ℹ.
 *
 * - Lead: [student · tutor · room badges] · Manage session (filled) · "…" (outlined)
 *         → Request tutors · View session info · Copy assignments
 * - Non-lead: [student · tutor badges] · Tutor tools (outlined)
 *         → Request lead tutor · View session info · Copy assignments
 */

/** Live session-info badges (tonal). Room count is lead-only. */
const SessionInfoBadges = ({ studentCount, tutorCount, roomCount, showRoom }) => (
    <div className="plus-session-controls__badges">
        <StatusTag appearance="info" leadingVisual={<i className={iconClass('user-graduate')} aria-hidden="true"></i>} className="fw-normal" title="Students marked present / listed on roster for this session">{studentCount}</StatusTag>
        <StatusTag appearance="discovery" leadingVisual={<i className={iconClass('chalkboard-user')} aria-hidden="true"></i>} className="fw-normal" title="Tutors marked present / listed on roster for this session">{tutorCount}</StatusTag>
        {showRoom && (
            <StatusTag appearance="neutral" leadingVisual={<i className={iconClass('door-open')} aria-hidden="true"></i>} className="fw-normal" title={roomCount === '—'
                    ? 'Assign students to tutors to size breakout rooms'
                    : 'Rooms to create in Zoom (includes each tutor\'s buffer)'}>{roomCount}</StatusTag>
        )}
    </div>
);

const SessionControlsConsolidated = ({
    role = 'lead',
    studentCount = '6/8',
    tutorCount = '2/2',
    roomCount = '10',
    onManageSession,
    onRequestTutors,
    onRequestLeadTutor,
    onViewSessionInfo,
    onCopyAssignments,
}) => {
    const [copyState, setCopyState] = useState('default'); // 'default' | 'copied'

    const handleCopyAssignments = useCallback(() => {
        setCopyState('copied');
        if (onCopyAssignments) onCopyAssignments();
        setTimeout(() => setCopyState('default'), 2000);
    }, [onCopyAssignments]);

    // "Copy assignments" flips to a non-interactive "Copied" confirmation for ~2s.
    const copyRow = (
        <ButtonItem
            key="copy"
            onClick={handleCopyAssignments}
            elemBefore={<i className={iconClass(copyState === 'copied' ? 'check' : 'copy')} aria-hidden="true" />}
            data-keep-open={copyState === 'copied' ? 'true' : undefined}
        >
            {copyState === 'copied' ? 'Copied' : 'Copy assignments'}
        </ButtonItem>
    );

    if (role === 'lead') {
        return (
            <div className="plus-session-controls">
                <SessionInfoBadges
                    studentCount={studentCount}
                    tutorCount={tutorCount}
                    roomCount={roomCount}
                    showRoom
                />
                <Button
                    text="Manage session"
                    appearance="primary"
                    spacing="compact"
                    iconBefore="gear"
                    onClick={onManageSession}
                />
                <DropdownMenu
                    id="session-overflow"
                    trigger={<IconButton spacing="compact" icon="ellipsis" label="More session actions" />}
                >
                    <ButtonItem onClick={onRequestTutors} elemBefore={<i className={iconClass('user-plus')} aria-hidden="true" />}>
                        Request tutors
                    </ButtonItem>
                    <ButtonItem onClick={onViewSessionInfo} elemBefore={<i className={iconClass('circle-info')} aria-hidden="true" />}>
                        View session info
                    </ButtonItem>
                    {copyRow}
                </DropdownMenu>
            </div>
        );
    }

    // Non-lead tutor: student + tutor badges (no room count) + "Tutor tools" (outlined).
    return (
        <div className="plus-session-controls">
            <SessionInfoBadges
                studentCount={studentCount}
                tutorCount={tutorCount}
                showRoom={false}
            />
            <DropdownMenu
                id="tutor-tools"
                trigger={(
                    <Button
                        text="Tutor tools"
                        appearance="default"
                        spacing="compact"
                        iconAfter={<i className="fa-solid fa-chevron-down" aria-hidden="true" />}
                    />
                )}
            >
                <ButtonItem onClick={onRequestLeadTutor} elemBefore={<i className={iconClass('user-plus')} aria-hidden="true" />}>
                    Request lead tutor
                </ButtonItem>
                <ButtonItem onClick={onViewSessionInfo} elemBefore={<i className={iconClass('circle-info')} aria-hidden="true" />}>
                    View session info
                </ButtonItem>
                {copyRow}
            </DropdownMenu>
        </div>
    );
};

SessionInfoBadges.propTypes = {
    studentCount: PropTypes.string,
    tutorCount: PropTypes.string,
    roomCount: PropTypes.string,
    showRoom: PropTypes.bool,
};

SessionControlsConsolidated.propTypes = {
    role: PropTypes.oneOf(['lead', 'tutor']),
    /** Student count badge text, e.g. "6/8" (present / roster). */
    studentCount: PropTypes.string,
    /** Tutor count badge text, e.g. "2/2". */
    tutorCount: PropTypes.string,
    /** Room count badge text (lead only), e.g. "10" or "—" while waiting. */
    roomCount: PropTypes.string,
    onManageSession: PropTypes.func,
    onRequestTutors: PropTypes.func,
    onRequestLeadTutor: PropTypes.func,
    onViewSessionInfo: PropTypes.func,
    onCopyAssignments: PropTypes.func,
};

export default SessionControlsConsolidated;
