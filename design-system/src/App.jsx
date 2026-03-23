import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Button, Navbar, Navigation, Jumbotron } from '@/components';

// A simple App component to serve as the entry point
const App = () => {
    return (
        <div className="app-container">
            <Navbar
                brand={{ text: 'PLUS Design System', href: '#' }}
                user={{ name: 'User', avatar: 'https://via.placeholder.com/40' }}
            />
            <div className="d-flex">
                <Navigation
                    items={[
                        { id: 'home', label: 'Home', icon: 'home', active: true },
                        { id: 'components', label: 'Components', icon: 'cubes' },
                        { id: 'admin', label: 'Admin', icon: 'cog' }
                    ]}
                />
                <main className="flex-grow-1" style={{ padding: 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)' }}>
                    <Container fluid>
                        <Row className="mb-4">
                            <Col>
                                <Jumbotron
                                    title="Welcome to PLUS Design System"
                                    description="This is the React implementation of the PLUS Design System."
                                >
                                    <Button btnStyle="primary" btnFill="filled">Get Started</Button>
                                </Jumbotron>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <div className="p-4 bg-white rounded shadow-sm">
                                    <h4>Migration Complete</h4>
                                    <p>All core components have been migrated to React.</p>
                                    <Button btnStyle="primary" btnFill="outline" className="mr-2">View Storybook</Button>
                                    <Button btnStyle="secondary" btnFill="outline">Documentation</Button>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </main>
            </div>
        </div>
    );
};

export default App;
