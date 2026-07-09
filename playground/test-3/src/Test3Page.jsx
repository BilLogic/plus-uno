import React, { useState } from 'react';
import Badge from '@/components/Badge';
import Card from '@/components/Card';
import Alert from '@/components/Alert';
import Button from '@/components/Button';
import Progress from '@/components/Progress';
import Input from '@/forms/Input';
import Select from '@/forms/Select';
import Switch from '@/forms/Switch';
import Checkbox from '@/forms/Checkbox';
import { Textarea } from '@/forms';

import './Test3Page.scss';

const COHORT_OPTIONS = [
    { value: 'cohort-a', label: 'Cohort A — Morning' },
    { value: 'cohort-b', label: 'Cohort B — Afternoon' },
    { value: 'cohort-c', label: 'Cohort C — Evening' },
];

const CARD_ITEMS = [
    'Session prep complete — due today',
    'Reflection submitted — yesterday',
    'Goal check-in pending — overdue',
];

export default function Test3Page() {
    const [name, setName] = useState('');
    const [cohort, setCohort] = useState('');
    const [notes, setNotes] = useState('');
    const [notify, setNotify] = useState(true);
    const [agree, setAgree] = useState(false);

    return (
        <div className="lab" data-roundtrip-frame="Test 3">
            <header className="lab__header">
                <div className="lab__intro">
                    <div className="lab__badges">
                        <Badge style="primary" size="b3">Variant lab</Badge>
                        <Badge style="success" size="b3">Roundtrip</Badge>
                        <Badge style="warning" size="b3" counter={3} />
                        <Badge style="info" size="b3" dismissible onDismiss={() => {}}>
                            Dismissible
                        </Badge>
                    </div>
                    <h1 className="lab__title h3">Component variant showcase</h1>
                    <p className="lab__subtitle body2-txt">
                        Exercises Alert, Card, Button, Badge, Progress, and form sub-components with distinct variants for Figma write-back.
                    </p>
                </div>
                <div className="lab__header-actions">
                    <Button fill="filled" style="primary" text="Primary action" />
                    <Button fill="tonal" style="secondary" text="Tonal" />
                    <Button fill="outline" style="success" text="Outline" />
                    <Button fill="text" style="danger" text="Text danger" />
                </div>
            </header>

            <section className="lab__alerts" aria-label="Alert variants">
                <Alert style="success" title="Success" dismissable={false}>
                    Roster sync completed — all session notes are current.
                </Alert>
                <Alert style="warning" title="Warning">
                    Two students have goals past their target date.
                </Alert>
                <Alert style="danger" title="Action required">
                    Missing reflection for last week&apos;s session.
                </Alert>
                <Alert style="info" title="Tip" dismissable={false}>
                    Add session notes within 24 hours for the best recall.
                </Alert>
            </section>

            <section className="lab__metrics">
                <Card title="Active tutors" subtitle="12 this week" paddingSize="sm" />
                <Card title="Sessions logged" subtitle="48 completed" paddingSize="md" showBorder={false} />
                <Card
                    title="Avg. rating"
                    subtitle="4.7 / 5.0"
                    header="Performance"
                    footer="Updated hourly"
                    actionButton={{ text: 'View report', fill: 'text', style: 'primary' }}
                />
            </section>

            <div className="lab__grid">
                <Card
                    title="Session intake"
                    subtitle="Mix form controls and card sub-structure."
                    header="New check-in"
                    footer="All fields required unless marked optional."
                >
                    <div className="lab__fields">
                        <Input
                            label="Student name"
                            placeholder="Alex Morgan"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <Select
                            label="Cohort"
                            placeholder="Select a cohort"
                            options={COHORT_OPTIONS}
                            value={cohort}
                            onChange={setCohort}
                        />
                        <Textarea
                            label="Session notes"
                            variant="short"
                            rows={3}
                            placeholder="What went well today?"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                        <Switch label="Send email notification" checked={notify} onChange={setNotify} />
                        <Checkbox label="I confirm this information is accurate" checked={agree} onChange={setAgree} />
                    </div>
                    <div className="lab__form-actions">
                        <Button fill="filled" style="primary" text="Submit" />
                        <Button fill="outline" style="secondary" text="Save draft" />
                        <Button fill="text" style="tertiary" text="Cancel" />
                    </div>
                </Card>

                <div className="lab__side">
                    <Card
                        title="Task queue"
                        subtitle="List items inside card body."
                        items={CARD_ITEMS}
                        links={[{ href: '#', text: 'View all tasks' }]}
                    />

                    <div className="lab__progress">
                        <h2 className="lab__section-label h6">Progress variants</h2>
                        <Progress style="primary" value={72} label="Primary" showLabel />
                        <Progress style="success" value={100} label="Success" showLabel striped animated />
                        <Progress style="warning" value={45} label="Warning" showLabel size="small" />
                        <Progress style="danger" value={18} label="Danger" showLabel size="large" />
                    </div>
                </div>
            </div>

            <footer className="lab__footer">
                <Button fill="filled" style="success" text="Approve roster" />
                <Button fill="tonal" style="warning" text="Request review" />
                <Button fill="outline" style="danger" text="Archive term" />
            </footer>
        </div>
    );
}
