import React, { useState } from 'react';
import Badge from '@/components/Badge';
import Card from '@/components/Card';
import Alert from '@/components/Alert';
import Button from '@/components/Button';
import Input from '@/forms/Input';
import { Textarea } from '@/forms';

import './Test2Page.scss';

const STATS = [
    { label: 'Sessions this week', value: '12 completed' },
    { label: 'Goals on track', value: '8 of 10' },
    { label: 'Average rating', value: '4.6 / 5.0' },
];

export default function Test2Page() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');

    return (
        <div className="dash" data-roundtrip-frame="Test 2">
            <header className="dash__header">
                <div className="dash__intro">
                    <Badge style="info" size="b3">
                        Dashboard
                    </Badge>
                    <h1 className="dash__title h3">Coaching overview</h1>
                    <p className="dash__subtitle body2-txt">
                        Track sessions, goals, and feedback across your roster in one place.
                    </p>
                </div>
                <div className="dash__header-actions">
                    <Button fill="filled" style="primary" text="New session" />
                    <Button fill="outline" style="secondary" text="Export" />
                </div>
            </header>

            <section className="dash__stats">
                {STATS.map((s) => (
                    <Card key={s.label} title={s.label} subtitle={s.value} />
                ))}
            </section>

            <section className="dash__grid">
                <Card
                    title="Session details"
                    subtitle="Capture notes before your next check-in."
                >
                    <div className="dash__fields">
                        <Input
                            label="Student name"
                            placeholder="Alex Morgan"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <Input
                            label="Email"
                            type="email"
                            placeholder="alex@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Textarea
                            label="Session notes"
                            variant="short"
                            rows={3}
                            placeholder="What went well today?"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                    <div className="dash__form-actions">
                        <Button fill="filled" style="primary" text="Save" />
                        <Button fill="text" style="secondary" text="Cancel" />
                    </div>
                </Card>

                <div className="dash__alerts">
                    <Alert style="success" title="All synced">
                        Your roster is up to date with the latest session data.
                    </Alert>
                    <Alert style="warning" title="2 goals overdue">
                        Two students have goals past their target date.
                    </Alert>
                    <Alert style="info" title="Tip">
                        Add session notes within 24 hours for the best recall.
                    </Alert>
                </div>
            </section>

            <footer className="dash__footer">
                <Button fill="tonal" style="primary" text="Archive term" />
                <Button fill="text" style="secondary" text="Help" />
            </footer>
        </div>
    );
}
