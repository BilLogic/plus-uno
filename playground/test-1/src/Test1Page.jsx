import React, { useState } from 'react';
import Badge from '@/components/Badge';
import Card from '@/components/Card';
import Alert from '@/components/Alert';
import Button from '@/components/Button';
import Input from '@/forms/Input';

import './Test1Page.scss';

export default function Test1Page() {
    const [email, setEmail] = useState('');

    return (
        <div className="test-1" data-roundtrip-frame="Test 1">
            <header className="test-1__header">
                <Badge style="info" size="b3">
                    Test 1
                </Badge>
                <h1 className="test-1__title h3">How was your session?</h1>
                <p className="test-1__subtitle body2-txt">
                    A second roundtrip prototype to validate Figma ↔ code parity with registry-mapped components.
                </p>
            </header>

            <Card
                title="Share quick feedback"
                subtitle="Your coach reviews this before the next check-in."
            >
                <Alert style="info" title="Registry-mapped">
                    Badge, Card, Alert, Input, and Button all resolve through component-registry.json.
                </Alert>

                <div className="test-1__fields">
                    <Input
                        label="Email"
                        type="email"
                        placeholder="alex@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="test-1__actions">
                    <Button fill="filled" style="primary" text="Send feedback" />
                    <Button fill="outline" style="secondary" text="Skip" />
                </div>
            </Card>
        </div>
    );
}
