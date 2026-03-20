import React from 'react';
import Card from '@/components/Card';
import UserAvatar from '@/components/UserAvatar';

export default function StudentCard({ student, highlighted = false, children }) {
    return (
        <Card
            paddingSize="md"
            gapSize="md"
            radiusSize="sm"
            showBorder={true}
            style={{
                borderColor: highlighted ? 'var(--color-warning)' : undefined,
                borderWidth: highlighted ? '2px' : undefined,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-md)' }}>
                <UserAvatar
                    firstChar={student.name.charAt(0)}
                    name={student.name}
                    counter={false}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="body1-txt" style={{ fontWeight: 'var(--font-weight-body1-semibold)' }}>
                        {student.name}
                    </span>
                    <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        {student.grade}
                    </span>
                </div>
            </div>
            {children}
        </Card>
    );
}
