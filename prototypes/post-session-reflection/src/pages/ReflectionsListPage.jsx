import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/actions/Button/Button';
import Dropdown from '@/components/forms-and-inputs/Dropdown/Dropdown';
import { PageLayout } from '@/specs/Universal/Pages';
import { StatCard } from '@/specs/Toolkit/Pre-Session/Cards/OverviewCard.stories';
import { ReflectionsTableRow, ReflectionsTableHeaderRow } from '@/specs/Toolkit/Pre-Session/Tables/ReflectionsTable.stories';
import { NavHorizontal } from '@/specs/Toolkit/Pre-Session/Tables/NavHorizontal.stories';
import { REFLECTIONS } from '../data/reflections';

const FILTER_OPTIONS = [
    { text: 'Incomplete', value: 'incomplete' },
    { text: 'Completed', value: 'completed' },
    { text: 'Both', value: 'both' },
];

/**
 * Entry list — Full Page / Reflections (Figma 01 - Entry Point).
 * Full-bleed PageLayout (no 1440 max-width gutters).
 */
export default function ReflectionsListPage() {
    const navigate = useNavigate();
    const [selectedTab, setSelectedTab] = useState('reflections');
    const [completionFilter, setCompletionFilter] = useState('incomplete');

    const reflections = useMemo(() => {
        if (completionFilter === 'completed') {
            return REFLECTIONS.filter((row) => row.status === 'completed');
        }
        if (completionFilter === 'incomplete') {
            return REFLECTIONS.filter((row) => row.status === 'incomplete');
        }
        return REFLECTIONS;
    }, [completionFilter]);

    const incompleteCount = REFLECTIONS.filter((row) => row.status === 'incomplete').length;

    const tabs = [
        { id: 'my-sessions', label: 'My sessions', count: 20 },
        { id: 'sign-ups', label: 'Sign-ups', count: 20 },
        { id: 'fill-ins', label: 'Fill-ins', count: 3 },
        { id: 'call-offs', label: 'Call-offs', count: 3 },
        { id: 'reflections', label: 'Reflections', count: incompleteCount },
    ];

    const filterLabel = FILTER_OPTIONS.find((option) => option.value === completionFilter)?.text || 'Incomplete';

    return (
        <PageLayout
            topBarConfig={{
                breadcrumbs: [
                    { text: 'Toolkit', href: '#' },
                    { text: 'Sessions' },
                ],
                user: { name: 'John Doe', role: 'Lead' },
            }}
            sidebarConfig={{ user: 'tutor', activeTab: 'sessions' }}
            id="post-session-reflections-list"
            style={{ width: '100%', height: '100%' }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-section-gap-lg)',
                    width: '100%',
                    minHeight: '100%',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 'var(--size-element-gap-md)',
                    }}
                >
                    <h3 className="h3 m-0" style={{ color: 'var(--color-on-surface)' }}>Sessions</h3>
                    <Button size="medium" fill="filled" style="primary" leadingVisual="user-plus" text="Fill in" />
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: 'var(--size-card-gap-md)',
                        width: '100%',
                    }}
                >
                    <StatCard title="Today's sessions" value="1" icon="fa-solid fa-calendar-day" />
                    <StatCard title="Pending call-offs" value="2" icon="fa-solid fa-hourglass-half" />
                    <StatCard title="Open for fill-ins" value="23" icon="fa-solid fa-right-to-bracket" />
                </div>

                <NavHorizontal tabs={tabs} selectedTab={selectedTab} onTabChange={setSelectedTab} />

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-section-gap-sm)',
                        width: '100%',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 'var(--size-element-gap-sm)',
                        }}
                    >
                        <h5 className="h5 m-0" style={{ color: 'var(--color-on-surface)' }}>Your reflections</h5>
                        <Dropdown
                            buttonText={filterLabel}
                            style="secondary"
                            fill="outline"
                            size="small"
                            items={FILTER_OPTIONS.map((option) => ({
                                text: option.text,
                                selected: completionFilter === option.value,
                                onClick: () => setCompletionFilter(option.value),
                            }))}
                        />
                    </div>
                    <div style={{ width: '100%' }}>
                        <ReflectionsTableHeaderRow />
                        {reflections.map((reflection) => (
                            <ReflectionsTableRow
                                key={reflection.id}
                                date={reflection.date}
                                timeRange={reflection.timeRange}
                                school={reflection.school}
                                teacher={reflection.teacher}
                                status={reflection.status}
                                interactive
                                onAction={() => {
                                    if (reflection.status === 'incomplete') {
                                        navigate(`/reflection/${reflection.id}`);
                                    }
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
