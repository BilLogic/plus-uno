/**
 * Login Specs - Elements
 * 
 * Individual form elements and UI components used in login flows.
 * 
 * Components:
 * - InstitutionSelection: Dropdown for selecting institution
 * - AccessCodeForm: Form for entering access code
 * - LoginButtons: Action buttons (try demo, back, continue, log in)
 * - AuthButtons: Authentication provider buttons (Google, Clever)
 * - LoginFooter: Footer component for login pages
 * - LoginAlert: Alert component for login error messages
 */

import React, { useState } from 'react';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import Select from '@/forms/Select';
import Input from '@/forms/Input';
import Footer from '@/components/Footer';

export default {
    title: 'Specs/Login/Elements',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Individual form elements and UI components used in login/authentication flows. These are the building blocks that make up the login cards and pages.',
            },
        },
    },
};

/**
 * Overview
 * All login elements and their purposes.
 */
export const Overview = () => (
    <div style={{
        padding: 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)',
        maxWidth: '800px'
    }}>
        <h2 className="h2" style={{ marginBottom: 'var(--size-section-pad-y-md)' }}>
            Login Elements
        </h2>

        <p className="body1-txt" style={{ marginBottom: 'var(--size-card-gap-lg)' }}>
            Individual form elements and UI components used in login flows.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-md)' }}>
            {[
                { name: 'InstitutionSelection', desc: 'Dropdown for selecting institution with states: empty, filled, open, typing' },
                { name: 'AccessCodeForm', desc: 'Form for entering access code with default and invalid states' },
                { name: 'LoginButtons', desc: 'Action buttons: try demo, back, continue, log in (enabled/disabled)' },
                { name: 'AuthButtons', desc: 'Authentication provider buttons for Google and Clever' },
                { name: 'LoginFooter', desc: 'Footer component for login pages' },
                { name: 'LoginAlert', desc: 'Alert for login error messages and notifications' }
            ].map(item => (
                <div key={item.name} style={{
                    padding: 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)',
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: 'var(--size-card-radius-sm)',
                    backgroundColor: 'var(--color-surface-container)'
                }}>
                    <h4 className="h4" style={{ marginBottom: 'var(--size-element-gap-sm)' }}>{item.name}</h4>
                    <p className="body2-txt">{item.desc}</p>
                </div>
            ))}
        </div>
    </div>
);

/**
 * InstitutionSelection
 * Dropdown for selecting an institution.
 */
export const InstitutionSelection = () => {
    const [selected, setSelected] = useState(null);

    const institutions = [
        { value: 'cmu', label: 'Carnegie Mellon University' },
        { value: 'mit', label: 'Massachusetts Institute of Technology' },
        { value: 'stanford', label: 'Stanford University' },
        { value: 'harvard', label: 'Harvard University' }
    ];

    return (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '400px' }}>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Institution Selection</h6>
            <Select
                label="Select your institution"
                placeholder="Type to search..."
                options={institutions}
                value={selected}
                onChange={setSelected}
                searchable
            />
        </div>
    );
};

/**
 * AccessCodeForm
 * Form for entering access code.
 */
export const AccessCodeForm = () => {
    const [code, setCode] = useState('');
    const [error, setError] = useState(false);

    return (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '400px' }}>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Access Code Form</h6>
            <Input
                label="Enter your access code"
                placeholder="XXXX-XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                error={error}
                errorMessage="Invalid access code. Please try again."
            />
            <div style={{ marginTop: '16px' }}>
                <Button
                    text="Submit"
                    style="primary"
                    onClick={() => setError(!code)}
                />
            </div>
        </div>
    );
};

/**
 * LoginButtons
 * Various action buttons used in login flows.
 */
export const LoginButtons = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Login Action Buttons</h6>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '300px' }}>
            <Button text="Log In" style="primary" />
            <Button text="Try a Demo" style="secondary" />
            <Button text="Continue" style="primary" />
            <Button text="Back to Login Portal" style="ghost" />
            <Button text="Disabled Button" style="primary" disabled />
        </div>
    </div>
);

/**
 * AuthButtons
 * Authentication provider buttons (Google, Clever).
 */
export const AuthButtons = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Authentication Provider Buttons</h6>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px' }}>
            <Button
                text="Sign in with Google"
                style="secondary"
                leadingVisual={<i className="fab fa-google" />}
            />
            <Button
                text="Sign in with Clever"
                style="secondary"
                leadingVisual={<i className="fas fa-graduation-cap" />}
            />
        </div>
    </div>
);

/**
 * LoginAlert
 * Alert component for login messages.
 */
export const LoginAlert = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '500px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Login Alerts</h6>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Alert style="danger" dismissible>
                <Alert.Content>Invalid credentials. Please try again.</Alert.Content>
            </Alert>
            <Alert style="warning">
                <Alert.Content>Your session has expired. Please log in again.</Alert.Content>
            </Alert>
            <Alert style="info">
                <Alert.Content>Password reset link sent to your email.</Alert.Content>
            </Alert>
        </div>
    </div>
);

/**
 * LoginFooter
 * Footer component for login pages.
 */
export const LoginFooterComponent = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Login Footer</h6>
        <div style={{
            backgroundColor: 'var(--color-surface-container)',
            padding: 'var(--size-section-pad-y-md)'
        }}>
            <Footer
                version="v5.2.0"
                copyright="Copyright © Carnegie Mellon University 2024"
                termsText="Terms of Use"
                termsUrl="#"
            />
        </div>
    </div>
);
