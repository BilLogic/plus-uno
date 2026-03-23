import React, { useState } from 'react';
import PageLayout from '@plus-ds/specs/Universal/Pages/PageLayout/PageLayout';
import Card from '@plus-ds/components/Card';
import Button from '@plus-ds/components/Button';
import Badge from '@plus-ds/components/Badge';

// We will split the wizard steps into separate components to keep it clean.
import Step1Baseline from './Step1Baseline';
import Step2Schedule from './Step2Schedule';
import Step3Goals from './Step3Goals';

function App() {
    const [currentStep, setCurrentStep] = useState(1);

    // Global state holding all wizard selections
    const [wizardData, setWizardData] = useState({
        primaryBarrier: null,
        schedule: null,
        goals: []
    });

    const updateData = (key, value) => {
        setWizardData(prev => ({ ...prev, [key]: value }));
    };

    const handleNext = () => {
        if (currentStep < 3) setCurrentStep(currentStep + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleFinish = () => {
        alert("Wizard Complete! Check console for data.");
        console.log("FINAL WIZARD DATA:", wizardData);
    };

    const stepTitles = [
        "Baseline Assessment",
        "Scheduling Preferences",
        "Initial Goal Draft"
    ];

    return (
        <PageLayout
            topBarConfig={{
                breadcrumbs: [
                    { text: 'Dashboard', href: '#' },
                    { text: 'New Student Match', active: true }
                ],
                user: { name: 'Admin Tutor', role: 'admin' }
            }}
            sidebarConfig={{
                activeTabId: 'students'
            }}
        >
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg)' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 className="h2-txt" style={{ margin: 0, marginBottom: 'var(--size-element-gap-sm)' }}>
                            Student Setup: Liam Smith
                        </h1>
                        <p className="body1-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                            Complete this quick setup to tailor Liam's learning path.
                        </p>
                    </div>
                    <Badge style="info" fill="tonal">Step {currentStep} of 3</Badge>
                </div>

                {/* Main Content Area */}
                <Card title={stepTitles[currentStep - 1]}>
                    <div style={{ padding: 'var(--size-element-pad-y-md) 0', minHeight: '300px' }}>
                        {currentStep === 1 && <Step1Baseline data={wizardData} updateData={updateData} />}
                        {currentStep === 2 && <Step2Schedule data={wizardData} updateData={updateData} />}
                        {currentStep === 3 && <Step3Goals data={wizardData} updateData={updateData} />}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--size-section-gap-md)', paddingTop: 'var(--size-element-pad-y-md)', borderTop: '1px solid var(--color-outline-variant)' }}>
                        <Button
                            text="Back"
                            style="secondary"
                            fill="outline"
                            onClick={handleBack}
                            disabled={currentStep === 1}
                        />
                        <Button
                            text={currentStep === 3 ? "Finish Setup" : "Continue"}
                            style="primary"
                            fill="filled"
                            onClick={currentStep === 3 ? handleFinish : handleNext}
                        />
                    </div>
                </Card>
            </div>
        </PageLayout>
    );
}

export default App;
