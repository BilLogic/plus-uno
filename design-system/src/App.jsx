import React from 'react';
import { Breadcrumb, Button, Navigation } from '@/components';
import { PatternSection } from '@/patterns';

// A simple App component to serve as the entry point
const App = () => {
    return (
        <div className="app-container">
            <Breadcrumb items={[{ text: 'PLUS Design System', href: '#' }]} />
            <div className="d-flex">
                <Navigation
                    items={[
                        { id: 'home', label: 'Home', icon: 'home', active: true },
                        { id: 'components', label: 'Components', icon: 'cubes' },
                        { id: 'admin', label: 'Admin', icon: 'cog' }
                    ]}
                />
                <main className="flex-grow-1" style={{ padding: 'var(--section-pad-y-default) var(--section-pad-x-default)' }}>
                    <div className="container-fluid">
                        <div className="row mb-4">
                            <div className="col">
                                <PatternSection
                                    level="page"
                                    title="Welcome to PLUS Design System"
                                    description="This is the React implementation of the PLUS Design System."
                                    actions={<Button text="Get started" appearance="primary" />}
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                <div className="p-4 bg-white rounded shadow-sm">
                                    <h4>Migration Complete</h4>
                                    <p>All core components have been migrated to React.</p>
                                    <Button appearance="primary" className="mr-2">View Storybook</Button>
                                    <Button>Documentation</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
