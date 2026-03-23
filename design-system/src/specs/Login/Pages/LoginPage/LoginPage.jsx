import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Logo } from '@/components';
import { LoginForm } from '@/specs/Login/Sections';

/**
 * Login Page
 * 
 * Standard authentication page with logo and login form.
 */
const LoginPage = () => {
    return (
        <div className="login-page" style={{
            backgroundColor: 'var(--color-surface-container-low)',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <Container>
                <Row className="justify-content-center">
                    <Col md={8} lg={6} xl={5}>
                        <div className="text-center mb-5">
                            <div className="mb-3 d-flex justify-content-center">
                                <Logo style="default" size="medium" />
                            </div>
                            <h2 className="h2">PLUS Design System</h2>
                        </div>
                        <LoginForm />
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default LoginPage;
