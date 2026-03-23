import React from 'react';
import { Form } from 'react-bootstrap';
import { Button, Card } from '../../../components';
import DashboardLayout from '@/components/layout/DashboardLayout';

const OnboardingInnerPage = () => {
    return (
        <DashboardLayout>
            <div className="d-flex flex-column gap-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
                {/* Header */}
                <div className="d-flex justify-content-between align-items-start">
                    <div>
                        <h2 className="h4 fw-bold">Welcome to PLUS</h2>
                        <p className="text-muted">Description</p>
                        <div className="small text-muted">Estimated Time: 10 minutes</div>
                    </div>
                    <div className="bg-light rounded p-4" style={{ width: '200px', height: '150px' }}>
                        Image Placeholder
                    </div>
                </div>

                {/* Alert */}
                <div className="alert alert-warning d-flex gap-3" role="alert">
                    <i className="fas fa-exclamation-triangle mt-1"></i>
                    <div>
                        <h6 className="alert-heading fw-bold">Don't forget to complete this module</h6>
                        <p className="mb-0 small">Make sure to finish the quiz on the Google Site and answer the reflection question at the bottom of this page to complete this onboarding module.</p>
                    </div>
                </div>

                {/* Content (Iframe Placeholder) */}
                <div className="bg-light rounded border p-5 text-center" style={{ height: '400px' }}>
                    Google Sites Embed Placeholder
                </div>

                {/* Reflection */}
                <Card className="w-100">
                    <Card.Body>
                        <h5 className="h6 fw-bold mb-3">Reflection</h5>
                        <Form.Group className="mb-3">
                            <Form.Label>What's one specific action you plan to take in your next session based on what you learned in this module?</Form.Label>
                            <Form.Control as="textarea" rows={3} placeholder="Type your answer here..." />
                        </Form.Group>
                        <div className="d-flex justify-content-end">
                            <Button style="primary" fill="filled" text="Submit" />
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default OnboardingInnerPage;
