import React, { useState } from 'react';
import { Card, Table, Badge, Button, NavTabs, NavPills } from '@/components';
import { FLAG_CATEGORIES, FLAG_GROUPS } from '../data';

/**
 * Flag review.
 *
 * Two groups — Priority (what supervisors said they care about most) and
 * Other — with one tab per category inside the selected group. Opens on
 * Priority › Communication & Conduct.
 */
const ImmediateReviewPage = ({ onOpenRecording, decisions, onDecide }) => {
    const [group, setGroup] = useState('priority');
    const [category, setCategory] = useState('conduct');

    const decide = (id, verdict) => onDecide(id, verdict);

    const inGroup = FLAG_CATEGORIES.filter((c) => c.group === group);
    const active = inGroup.find((c) => c.id === category) ?? inGroup[0];

    const selectGroup = (next) => {
        setGroup(next);
        setCategory(FLAG_CATEGORIES.find((c) => c.group === next).id);
    };

    const groupCount = (id) => FLAG_CATEGORIES
        .filter((c) => c.group === id)
        .reduce((n, c) => n + c.flags.length, 0);
    const open = active.flags.filter((f) => !decisions[f.id]);

    const headers = [
        { text: 'Tutor', width: '180px' },
        { text: 'Type', width: '110px' },
        { text: 'Session', width: '220px' },
        { text: 'What the AI flagged' },
        { text: 'Decision', width: '260px', align: 'right' },
    ];

    const rows = active.flags.map((flag) => {
        const decided = decisions[flag.id];
        return [
            <p key={`${flag.id}-tutor`} className="body2-txt compliance-review__tutor">{flag.tutor}</p>,
            <Badge key={`${flag.id}-tag`} style={flag.tone} text={flag.tag} />,
            <div key={`${flag.id}-session`}>
                <p className="body2-txt">{flag.session}</p>
                <Button
                    text="Open recording"
                    style="primary"
                    fill="ghost"
                    size="small"
                    leadingVisual="play"
                    disabled={!flag.moments}
                    onClick={() => onOpenRecording(flag, active.name)}
                />
            </div>,
            <div key={`${flag.id}-evidence`}>
                <p className="body2-txt">{flag.quote}</p>
                <p className="body3-txt compliance-review__muted">
                    AI confidence {Math.round(flag.confidence * 100)}%
                </p>
            </div>,
            {
                align: 'right',
                content: decided ? (
                    <Badge
                        style={decided === 'confirmed' ? 'danger' : 'secondary'}
                        text={decided === 'confirmed' ? 'Confirmed — meeting needed' : 'Dismissed — not a violation'}
                    />
                ) : (
                    <div className="compliance-review__actions">
                        <Button
                            text="Not a violation"
                            style="primary"
                            fill="outline"
                            size="small"
                            onClick={() => decide(flag.id, 'dismissed')}
                        />
                        <Button
                            text="Confirm"
                            style="primary"
                            fill="filled"
                            size="small"
                            onClick={() => decide(flag.id, 'confirmed')}
                        />
                    </div>
                ),
            },
        ];
    });

    return (
        <>
            <div className="compliance-review__groups">
                <NavPills activeKey={group} onSelect={selectGroup}>
                    {FLAG_GROUPS.map((g) => (
                        <NavPills.Item key={g.id} eventKey={g.id} active={group === g.id}>
                            {g.name} ({groupCount(g.id)})
                        </NavPills.Item>
                    ))}
                </NavPills>
            </div>

            <div className="compliance-page__tabs compliance-review__tabs">
                <NavTabs activeKey={active.id} onSelect={setCategory}>
                    {inGroup.map((c) => (
                        <NavTabs.Item key={c.id} eventKey={c.id} active={category === c.id}>
                            <span className={c.severe ? 'compliance-review__tab--severe' : undefined}>
                                {c.severe && (
                                    <i
                                        className="fa-solid fa-triangle-exclamation compliance-review__tab-icon"
                                        aria-hidden="true"
                                    />
                                )}
                                {c.name} ({c.flags.length})
                                {c.severe && <span className="visually-hidden"> — severe</span>}
                            </span>
                        </NavTabs.Item>
                    ))}
                </NavTabs>
            </div>

            <p className="body2-txt compliance-review__lede">
                {active.id === 'conduct'
                    ? 'Communication & Conduct flags are acted on individually — one flag is enough. Confirming a flag records it against the tutor; dismissing it removes it from their pattern count.'
                    : `${active.name} reaches this page only as a pattern: the same flag across a quarter or more of a tutor's sessions.`}
            </p>

            <Card paddingSize="lg" showBorder={false} className="compliance-surface compliance-chart-card">
                <div className="compliance-review__header">
                    <div>
                        <div className="compliance-review__title-row">
                            <h3 className="h5 compliance-chart-card__title">{active.name}</h3>
                            {active.severe && (
                                <Badge
                                    style="danger"
                                    text="Severe"
                                    leadingVisual={<i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />}
                                />
                            )}
                        </div>
                        <p className="body3-txt compliance-chart-card__caption">
                            {open.length} of {active.flags.length} still open
                        </p>
                    </div>
                    <Button text="Export" style="primary" fill="outline" size="medium" leadingVisual="download" />
                </div>

                {active.flags.length === 0 ? (
                    <p className="body2-txt compliance-review__muted">
                        Nothing awaiting a decision in this category.
                    </p>
                ) : (
                    <Table headers={headers} rows={rows} hover density="lg" />
                )}
            </Card>

        </>
    );
};

export default ImmediateReviewPage;
