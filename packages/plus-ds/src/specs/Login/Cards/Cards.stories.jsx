/**
 * Login Specs - Cards
 * 
 * Card components that contain login forms and authentication interfaces.
 * 
 * Components:
 * - LoginPortal: Complete login portal card with multiple step variants
 */

import React, { useState } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/forms/Input';
import Select from '@/forms/Select';
import Logo from '@/components/Logo';

export default {
    title: 'Specs/Login/Cards',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Card components that contain login forms and authentication interfaces. These are complete, self-contained login experiences.',
            },
        },
    },
};

/**
 * Overview
 * All login card variants.
 */
export const Overview = () => (
    <div style={{
        padding: 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)',
        maxWidth: '800px'
    }}>
        <h2 className="h2" style={{ marginBottom: 'var(--size-section-pad-y-md)' }}>
            Login Cards
        </h2>

        <p className="body1-txt" style={{ marginBottom: 'var(--size-card-gap-lg)' }}>
            Card components containing login forms and authentication interfaces.
        </p>

        <div style={{
            padding: 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)',
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 'var(--size-card-radius-sm)',
            backgroundColor: 'var(--color-surface-container)'
        }}>
            <h4 className="h4" style={{ marginBottom: 'var(--size-element-gap-sm)' }}>LoginPortal</h4>
            <p className="body2-txt" style={{ marginBottom: '8px' }}>
                Complete login portal card with multiple variants:
            </p>
            <ul className="body2-txt" style={{ paddingLeft: '20px', margin: 0 }}>
                <li>Step 1: Institution selection (official or demo)</li>
                <li>Step 2: Access code entry</li>
                <li>Step 3a: Auth provider selection</li>
                <li>Step 3b: Direct credentials entry</li>
            </ul>
        </div>
    </div>
);

/**
 * LoginPortal Step 1 - Official
 * Institution selection for official login.
 */
export const LoginPortalStep1Official = () => {
    const [institution, setInstitution] = useState(null);

    const institutions = [
        { value: 'cmu', label: 'Carnegie Mellon University' },
        { value: 'mit', label: 'Massachusetts Institute of Technology' },
        { value: 'stanford', label: 'Stanford University' }
    ];

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: 'var(--size-section-pad-y-lg)',
            backgroundColor: 'var(--color-surface)'
        }}>
            <Card style={{ width: '400px', padding: '32px', textAlign: 'center' }}>
                <Logo style="mark" size="lg" />
                <h3 className="h3" style={{ margin: '24px 0 8px' }}>Welcome to PLUS</h3>
                <p className="body2-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                    Select your institution to continue
                </p>

                <Select
                    placeholder="Search for your institution..."
                    options={institutions}
                    value={institution}
                    onChange={setInstitution}
                    searchable
                />

                <Button
                    text="Continue"
                    style="primary"
                    disabled={!institution}
                    className="mt-4 w-100"
                />

                <div style={{ marginTop: '24px', borderTop: '1px solid var(--color-outline-variant)', paddingTop: '24px' }}>
                    <Button text="Try a Demo" style="ghost" />
                </div>
            </Card>
        </div>
    );
};

/**
 * LoginPortal Step 1 - Demo
 * Demo mode selection.
 */
export const LoginPortalStep1Demo = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: 'var(--size-section-pad-y-lg)',
        backgroundColor: 'var(--color-surface)'
    }}>
        <Card style={{ width: '400px', padding: '32px', textAlign: 'center' }}>
            <Logo style="mark" size="lg" />
            <h3 className="h3" style={{ margin: '24px 0 8px' }}>Try PLUS Demo</h3>
            <p className="body2-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                Experience PLUS with sample data and features
            </p>

            <Button text="Start Demo" style="primary" className="w-100" />

            <div style={{ marginTop: '16px' }}>
                <Button text="Back to Login Portal" style="ghost" />
            </div>
        </Card>
    </div>
);

/**
 * LoginPortal Step 2 - Access Code
 * Access code entry form.
 */
export const LoginPortalStep2AccessCode = () => {
    const [code, setCode] = useState('');

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: 'var(--size-section-pad-y-lg)',
            backgroundColor: 'var(--color-surface)'
        }}>
            <Card style={{ width: '400px', padding: '32px', textAlign: 'center' }}>
                <Logo style="mark" size="lg" />
                <h3 className="h3" style={{ margin: '24px 0 8px' }}>Enter Access Code</h3>
                <p className="body2-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                    Enter the access code provided by your institution
                </p>

                <Input
                    placeholder="XXXX-XXXX-XXXX"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                />

                <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <Button text="Back" style="ghost" />
                    <Button text="Continue" style="primary" disabled={!code} />
                </div>
            </Card>
        </div>
    );
};

/**
 * LoginPortal Step 3a - Auth Providers
 * Authentication provider selection.
 */
export const LoginPortalStep3aAuthProviders = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: 'var(--size-section-pad-y-lg)',
        backgroundColor: 'var(--color-surface)'
    }}>
        <Card style={{ width: '400px', padding: '32px', textAlign: 'center' }}>
            <Logo style="mark" size="lg" />
            <h3 className="h3" style={{ margin: '24px 0 8px' }}>Sign In</h3>
            <p className="body2-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                Carnegie Mellon University
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Button
                    text="Sign in with Google"
                    style="secondary"
                    leadingVisual={<i className="fab fa-google" />}
                    className="w-100"
                />
                <Button
                    text="Sign in with Clever"
                    style="secondary"
                    leadingVisual={<i className="fas fa-graduation-cap" />}
                    className="w-100"
                />
            </div>

            <div style={{ marginTop: '16px' }}>
                <Button text="Back" style="ghost" />
            </div>
        </Card>
    </div>
);

/**
 * LoginPortal Step 3b - Direct Login
 * Direct credentials entry form.
 */
export const LoginPortalStep3bDirectLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: 'var(--size-section-pad-y-lg)',
            backgroundColor: 'var(--color-surface)'
        }}>
            <Card style={{ width: '400px', padding: '32px' }}>
                <div style={{ textAlign: 'center' }}>
                    <Logo style="mark" size="lg" />
                    <h3 className="h3" style={{ margin: '24px 0 8px' }}>Log In</h3>
                    <p className="body2-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                        Enter your credentials
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Input
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <Button
                    text="Log In"
                    style="primary"
                    className="w-100 mt-4"
                    disabled={!email || !password}
                />

                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <Button text="Forgot Password?" style="ghost" />
                </div>
            </Card>
        </div>
    );
};
