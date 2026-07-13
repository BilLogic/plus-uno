import React, { useState } from 'react';
import Badge from '@/components/status-and-loading/Badge';
import Card from '@/components/layout-and-structure/Card';
import Alert from '@/components/messaging/Alert';
import Button from '@/components/actions/Button';
import Input from '@/components/forms-and-inputs/Input';
import { Textarea } from '@/components/forms-and-inputs';
import './RoundtripPage.scss';

export default function RoundtripPage() {
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');

    return (
        <div className="roundtrip-pilot" data-roundtrip-frame="Roundtrip Pilot">
            <header className="roundtrip-pilot__header">
                <h1 className="roundtrip-pilot__title h3">Quick check-in</h1>
                <p className="roundtrip-pilot__subtitle body2-txt">
                    A minimal form to validate Figma ↔ code roundtrip with registry-mapped components.
                </p>
            </header>

            <Badge style="info" size="b3">
                Roundtrip pilot
            </Badge>

            <Card
                title="Send a note"
                subtitle="Share a quick update with your coach before the next session."
            >
                <Alert style="info" title="Registry test">
                    This alert confirms the Alert set maps correctly through component-registry.json.
                </Alert>

                <div className="roundtrip-pilot__fields">
                    <Input
                        label="Your name"
                        placeholder="Alex Morgan"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Textarea
                        label="Message"
                        variant="short"
                        rows={3}
                        placeholder="What went well today?"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </div>

                <div className="roundtrip-pilot__actions">
                    <Button fill="filled" style="primary" text="Submit" />
                    <Button fill="outline" style="secondary" text="Cancel" />
                </div>
            </Card>
        </div>
    );
}
