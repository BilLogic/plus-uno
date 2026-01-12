import React from 'react';
import SessionManagementSnackbar from '../../../../../packages/plus-ds/src/components/SessionManagementSnackbar/SessionManagementSnackbar';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Session Management Snackbar (Supervisor)',
    component: SessionManagementSnackbar,
    parameters: {
        layout: 'fullscreen', // Use fullscreen to allow our container to control padding
        docs: {
            description: {
                component: 'Snackbar notifications for supervisor session management actions. Fixed width 300px.'
            }
        }
    },
    argTypes: {
        type: {
            control: { type: 'select' },
            options: ['session created', 'session updated', 'session canceled', 'sessions cancelled']
        },
        timestamp: {
            control: 'text'
        },
        onClose: { action: 'close clicked' }
    }
};

const Template = (args) => <SessionManagementSnackbar {...args} />;

export const AllVariations = () => (
    <div className="d-flex flex-column" style={{ padding: '60px', gap: '60px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <div>
            <h5 className="text-muted mb-2">Session Management Snackbar</h5>
            <p className="text-muted small mb-0">All supported variations. Fixed width: 300px.</p>
        </div>

        <div className="d-flex flex-wrap align-items-start" style={{ gap: '60px' }}>
            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Session Created</h6>
                <SessionManagementSnackbar type="session created" timestamp="1 mins ago" />
            </div>

            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Session Updated</h6>
                <SessionManagementSnackbar type="session updated" timestamp="1 mins ago" />
            </div>

            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Session Canceled</h6>
                <SessionManagementSnackbar type="session canceled" timestamp="1 mins ago" />
            </div>

            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>Sessions Cancelled (Plural)</h6>
                <SessionManagementSnackbar type="sessions cancelled" timestamp="1 mins ago" />
            </div>
        </div>
    </div>
);

// Interactive template for individual testing
export const Interactive = Template.bind({});
Interactive.args = {
    type: 'session created',
    timestamp: '1 mins ago'
};
Interactive.parameters = {
    layout: 'centered'
};
