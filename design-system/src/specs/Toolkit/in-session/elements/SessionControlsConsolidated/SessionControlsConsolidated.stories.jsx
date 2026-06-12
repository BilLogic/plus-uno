import React, { useState } from 'react';
import SessionControlsConsolidated from './SessionControlsConsolidated';

export default {
    title: 'Specs/Toolkit/In-Session/Elements/Session Controls Consolidated',
    component: SessionControlsConsolidated,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: `Consolidated session controls per Card #2357. Role-aware pattern:
- **Lead tutor**: "Manage session" button + "..." overflow dropdown (Request tutors, View session info, Copy assignments)
- **Non-lead tutor**: "Tutor tools" dropdown (Request lead tutor, View session info, Copy assignments)`
            }
        }
    },
    argTypes: {
        role: {
            control: 'select',
            options: ['lead', 'tutor'],
            description: 'User role determines which control variant renders',
            table: { category: 'Design' }
        }
    }
};

/** Lead tutor — "Manage session" button + "..." overflow */
export const LeadTutorDefault = () => (
    <SessionControlsConsolidated
        role="lead"
        onManageSession={() => console.log('Manage session clicked')}
        onRequestTutors={() => console.log('Request tutors')}
        onViewSessionInfo={() => console.log('View session info')}
        onCopyAssignments={() => console.log('Copy assignments')}
    />
);

/** Non-lead tutor — "Tutor tools" dropdown */
export const NonLeadTutorDefault = () => (
    <SessionControlsConsolidated
        role="tutor"
        onRequestLeadTutor={() => console.log('Request lead tutor')}
        onViewSessionInfo={() => console.log('View session info')}
        onCopyAssignments={() => console.log('Copy assignments')}
    />
);

/** All variations side by side */
export const AllVariations = () => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--size-section-gap-lg)',
        padding: 'var(--size-section-pad-y-lg)',
        backgroundColor: 'var(--color-surface)',
    }}>
        <div>
            <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)', color: 'var(--color-on-surface-variant)' }}>
                Lead Tutor
            </h6>
            <SessionControlsConsolidated
                role="lead"
                onManageSession={() => console.log('Manage session')}
                onRequestTutors={() => console.log('Request tutors')}
                onViewSessionInfo={() => console.log('View session info')}
                onCopyAssignments={() => console.log('Copy assignments')}
            />
        </div>
        <div>
            <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)', color: 'var(--color-on-surface-variant)' }}>
                Non-lead Tutor
            </h6>
            <SessionControlsConsolidated
                role="tutor"
                onRequestLeadTutor={() => console.log('Request lead tutor')}
                onViewSessionInfo={() => console.log('View session info')}
                onCopyAssignments={() => console.log('Copy assignments')}
            />
        </div>
    </div>
);

/** Fully interactive with action log */
export const Interactive = (args) => {
    const [log, setLog] = useState([]);

    const addLog = (action) => {
        setLog((prev) => [action, ...prev].slice(0, 5));
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)',
            padding: 'var(--size-section-pad-y-lg)',
            backgroundColor: 'var(--color-surface)',
            minWidth: 400,
        }}>
            <SessionControlsConsolidated
                role={args.role}
                onManageSession={() => addLog('Manage session')}
                onRequestTutors={() => addLog('Request tutors')}
                onRequestLeadTutor={() => addLog('Request lead tutor')}
                onViewSessionInfo={() => addLog('View session info')}
                onCopyAssignments={() => addLog('Copy assignments')}
            />
            {log.length > 0 && (
                <div style={{
                    padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                    backgroundColor: 'var(--color-surface-container-low)',
                    borderRadius: 'var(--size-card-radius-sm)',
                }}>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', margin: 0, marginBottom: 'var(--size-element-gap-xs)' }}>
                        Action log:
                    </p>
                    {log.map((entry, i) => (
                        <p key={i} className="body2-txt" style={{ margin: 0, color: i === 0 ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)' }}>
                            {entry}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
};

Interactive.args = {
    role: 'lead',
};
