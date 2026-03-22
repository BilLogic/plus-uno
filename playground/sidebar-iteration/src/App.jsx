import React, { useState } from 'react';
import SidebarIteration from './components/SidebarIteration';
import '@/styles/main.scss'; // Assuming this maps to correct gloabl styles

function App() {
    const [variant, setVariant] = useState('standard');
    const [userUser, setUserUser] = useState('tutor');
    const [activeTab, setActiveTab] = useState('home');

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: 'var(--color-surface-container-low)', overflow: 'hidden' }}>

            {/* Sidebar Component */}
            <SidebarIteration
                variant={variant}
                user={userUser}
                activeTabId={activeTab}
                onTabClick={setActiveTab}
                onHomeClick={() => setActiveTab('home')}
            />

            {/* Main Content Area with Controls */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

                {/* Top Bar for Controls */}
                <div style={{ padding: '16px 24px', backgroundColor: 'var(--color-surface-base)', borderBottom: '1px solid var(--color-border-subdued)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ margin: 0 }}>Sidebar Iteration Playground</h2>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label>Variant:</label>
                            <select value={variant} onChange={(e) => setVariant(e.target.value)} style={{ padding: '8px', borderRadius: '4px' }}>
                                <option value="standard">Standard</option>
                                <option value="slim">Slim</option>
                                <option value="floating">Floating</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label>User Role:</label>
                            <select value={userUser} onChange={(e) => setUserUser(e.target.value)} style={{ padding: '8px', borderRadius: '4px' }}>
                                <option value="tutor">Tutor</option>
                                <option value="supervisor">Supervisor</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Content Placeholder */}
                <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h1>Current View: {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
                        <p className="body1-txt" style={{ color: 'var(--color-text-subdued)', marginTop: '16px' }}>
                            This is a placeholder content area to demonstrate the sidebar interaction.
                            Currently viewing the <strong>{variant}</strong> sidebar variant.
                        </p>

                        <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} style={{
                                    height: '120px',
                                    backgroundColor: 'var(--color-surface-base)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-border-subdued)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    Card {i}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
