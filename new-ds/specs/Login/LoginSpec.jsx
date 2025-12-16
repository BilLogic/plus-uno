import React, { useState } from 'react';
import { Container, Row, Col, Form as BootstrapForm } from 'react-bootstrap';
import { Card, Button, Input, Checkbox, Alert } from '@/components';

export const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        alert(`Login attempt: ${email}`);
    };

    return (
        <Card style={{ maxWidth: '400px', margin: '0 auto' }}>
            <div className="p-4">
                <div className="text-center mb-4">
                    <h3 className="h3">Sign In</h3>
                    <p className="body2-txt text-muted">Enter your details to access your account</p>
                </div>

                <BootstrapForm onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <BootstrapForm.Label htmlFor="login-email" className="body2-txt">Email Address</BootstrapForm.Label>
                        <Input
                            id="login-email"
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <BootstrapForm.Label htmlFor="login-password" className="body2-txt mb-0">Password</BootstrapForm.Label>
                            <a href="#" className="body3-txt color-primary">Forgot password?</a>
                        </div>
                        <Input
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="mb-4">
                        <Checkbox
                            id="remember-me"
                            label="Remember me for 30 days"
                            checked={rememberMe}
                            onChange={(checked) => setRememberMe(checked)}
                        />
                    </div>

                    <Button btnStyle="primary" btnFill="filled" style={{ width: '100%' }} type="submit">
                        Sign In
                    </Button>

                    <div className="mt-4 text-center">
                        <p className="body3-txt">
                            Don't have an account? <a href="#" className="color-primary">Sign up</a>
                        </p>
                    </div>
                </BootstrapForm>
            </div>
        </Card>
    );
};

export const LoginSpec = () => {
    return (
        <div className="login-spec-page" style={{ backgroundColor: 'var(--color-surface-container-low)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Container>
                <Row className="justify-content-center">
                    <Col md={8} lg={6} xl={5}>
                        <div className="text-center mb-5">
                            {/* Logo placeholder */}
                            <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--color-primary)', borderRadius: '8px', margin: '0 auto 16px' }}></div>
                            <h2 className="h2">PLUS Design System</h2>
                        </div>
                        <LoginForm />
                    </Col>
                </Row>
            </Container>
        </div>
    );
};
