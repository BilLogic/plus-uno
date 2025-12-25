/**
 * Login Specs - Pages
 * 
 * Complete page-level components for login/authentication.
 * 
 * Components:
 * - SignInPortal: Complete sign-in portal page with full login experience
 */

import React, { useState } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/forms/Input';
import Select from '@/forms/Select';
import Logo from '@/components/Logo';
import Footer from '@/components/Footer';

export default {
    title: 'Specs/Login/Pages',
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Complete page-level components for login/authentication. These are full-page experiences that combine multiple elements, cards, and sections.',
            },
        },
    },
};

/**
 * Overview
 * Login pages summary.
 */
export const Overview = () => (
    <div style={{
        padding: 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)',
        maxWidth: '800px'
    }}>
        <h2 className="h2" style={{ marginBottom: 'var(--size-section-pad-y-md)' }}>
            Login Pages
        </h2>

        <p className="body1-txt" style={{ marginBottom: 'var(--size-card-gap-lg)' }}>
            Complete page-level components for login/authentication.
        </p>

        <div style={{
            padding: 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)',
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 'var(--size-card-radius-sm)',
            backgroundColor: 'var(--color-surface-container)'
        }}>
            <h4 className="h4" style={{ marginBottom: 'var(--size-element-gap-sm)' }}>SignInPortal</h4>
            <p className="body2-txt">
                Complete sign-in portal page that combines all login elements, cards, and flows into a full page experience. This is the main entry point for the login/authentication flow.
            </p>
        </div>
    </div>
);

/**
 * SignInPortal
 * Complete login page with multi-step flow.
 */
export const SignInPortal = () => {
    const [step, setStep] = useState(1);
    const [institution, setInstitution] = useState(null);
    const [code, setCode] = useState('');

    const institutions = [
        { value: 'cmu', label: 'Carnegie Mellon University' },
        { value: 'mit', label: 'Massachusetts Institute of Technology' },
        { value: 'stanford', label: 'Stanford University' }
    ];

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--color-surface)'
        }}>
            {/* Main Content */}
            <main style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--size-section-pad-y-lg)'
            }}>
                <Card style={{ width: '440px', padding: '40px', textAlign: 'center' }}>
                    <Logo style="mark" size="lg" />

                    {/* Step 1: Institution Selection */}
                    {step === 1 && (
                        <>
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
                                onClick={() => setStep(2)}
                                className="mt-4 w-100"
                            />

                            <div style={{ marginTop: '24px', borderTop: '1px solid var(--color-outline-variant)', paddingTop: '24px' }}>
                                <Button text="Try a Demo" style="ghost" />
                            </div>
                        </>
                    )}

                    {/* Step 2: Access Code */}
                    {step === 2 && (
                        <>
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
                                <Button text="Back" style="ghost" onClick={() => setStep(1)} />
                                <Button
                                    text="Continue"
                                    style="primary"
                                    disabled={!code}
                                    onClick={() => setStep(3)}
                                />
                            </div>
                        </>
                    )}

                    {/* Step 3: Auth Providers */}
                    {step === 3 && (
                        <>
                            <h3 className="h3" style={{ margin: '24px 0 8px' }}>Sign In</h3>
                            <p className="body2-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                                {institution?.label || 'Your Institution'}
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
                                <Button text="Back" style="ghost" onClick={() => setStep(2)} />
                            </div>
                        </>
                    )}
                </Card>
            </main>

            {/* Footer */}
            <footer style={{
                backgroundColor: 'var(--color-surface-container)',
                padding: 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)',
                borderTop: '1px solid var(--color-outline-variant)'
            }}>
                <Footer
                    version="v5.2.0"
                    copyright="Copyright © Carnegie Mellon University 2024"
                    termsText="Terms of Use"
                    termsUrl="#"
                />
            </footer>
        </div>
    );
};

/**
 * SignInPortal Interactive
 * Interactive version with step control.
 */
export const SignInPortalInteractive = (args) => {
    const [institution, setInstitution] = useState(null);
    const [code, setCode] = useState('');

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-surface)',
            padding: 'var(--size-section-pad-y-lg)'
        }}>
            <Card style={{ width: '440px', padding: '40px', textAlign: 'center' }}>
                <Logo style="mark" size="lg" />

                {args.step === 1 && (
                    <>
                        <h3 className="h3" style={{ margin: '24px 0 8px' }}>Welcome to PLUS</h3>
                        <Select
                            placeholder="Search for your institution..."
                            options={[{ value: 'cmu', label: 'Carnegie Mellon University' }]}
                            value={institution}
                            onChange={setInstitution}
                            searchable
                        />
                        <Button text="Continue" style="primary" className="mt-4 w-100" />
                    </>
                )}

                {args.step === 2 && (
                    <>
                        <h3 className="h3" style={{ margin: '24px 0 8px' }}>Enter Access Code</h3>
                        <Input placeholder="XXXX-XXXX-XXXX" value={code} onChange={(e) => setCode(e.target.value)} />
                        <Button text="Continue" style="primary" className="mt-4" />
                    </>
                )}

                {args.step === 3 && (
                    <>
                        <h3 className="h3" style={{ margin: '24px 0 8px' }}>Sign In</h3>
                        <Button text="Sign in with Google" style="secondary" className="w-100" />
                    </>
                )}
            </Card>
        </div>
    );
};
SignInPortalInteractive.args = {
    step: 1
};
SignInPortalInteractive.argTypes = {
    step: {
        control: { type: 'select' },
        options: [1, 2, 3],
        description: 'Current step in login flow'
    }
};
