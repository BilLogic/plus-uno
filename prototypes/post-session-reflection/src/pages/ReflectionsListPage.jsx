import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/actions/Button/Button';
import Dropdown from '@/components/forms-and-inputs/Dropdown/Dropdown';
import { PageLayout } from '@/specs/Universal/Pages';
import { StatCard } from '@/specs/Toolkit/Pre-Session/Cards/OverviewCard.stories';
import { ReflectionsTableRow, ReflectionsTableHeaderRow } from '@/specs/Toolkit/Pre-Session/Tables/ReflectionsTable.stories';
import { NavHorizontal } from '@/specs/Toolkit/Pre-Session/Tables/NavHorizontal.stories';
import { REFLECTIONS } from '../data/reflections';

const tabs = [
    { id: 'my-sessions', label: 'My sessions', count: 20 },
    { id: 'sign-ups', label: 'Sign-ups', count: 20 },
    { id: 'fill-ins', label: 'Fill-ins', count: 3 },
    { id: 'call-offs', label: 'Call-offs', count: 3 },
    { id: 'reflections', label: 'Reflections' },
];

const FILTER_OPTIONS = [
    { text: 'Incomplete', value: 'incomplete' },
    { text: 'Completed', value: 'completed' },
    { text: 'Both', value: 'both' },
];

/**
 * Entry list — Full Page / Reflections (Figma 01 - Entry Point).
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

    const filterLabel = FILTER_OPTIONS.find((option) => option.value === completionFilter)?.text || 'Incomplete';

    return (
        <div style={{ maxWidth: '1440px', height: '100%', margin: '0 auto' }}>
            <PageLayout
                topBarConfig={{
                    breadcrumbs: [
                        { text: 'Toolkit', href: '#' },
                        { text: 'Sessions' },
                    ],
                    user: { name: 'John Doe', type: 'lead tutor' },
                }}
                sidebarConfig={{ user: 'tutor', activeTab: 'sessions' }}
                id="post-session-reflections-list"
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-section-gap-lg)',
                        width: '100%',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="h3 m-0" style={{ color: 'var(--color-on-surface)' }}>Sessions</h3>
                        <Button size="default" fill="filled" style="primary" leadingVisual="user-plus" text="Fill in" />
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)' }}>
                        <StatCard title="Today's sessions" value="1" icon="fa-solid fa-calendar-day" />
                        <StatCard title="Pending call-offs" value="2" icon="fa-solid fa-hourglass-half" />
                        <StatCard title="Open for fill-ins" value="23" icon="fa-solid fa-right-to-bracket" />
                    </div>

                    <NavHorizontal tabs={tabs} selectedTab={selectedTab} onTabChange={setSelectedTab} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                        <div>
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
        </div>
    );
}
