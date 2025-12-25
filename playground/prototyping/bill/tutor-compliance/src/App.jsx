import React, { useState } from 'react';
/* Import components from design system. 
   Note: DataViz was added to root exports in previous step.
   Form components (Switch, Select) are exported from root as well.
*/
import {
    LineChart,
    BarChart,
    Switch,
    Select,
    Table,
    Badge,
    Button,
    Sidebar,
    Modal
} from '@tutors.plus/design-system';

import ComplianceMonitor from './ComplianceMonitor';

function App() {
    // ---- Navigation State ----
    const [activeTab, setActiveTab] = useState('home');

    // ---- Mock Data ----
    const lineChartData = [
        {
            name: 'Compliance Score',
            data: [65, 78, 75, 82, 85, 88],
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        }
    ];

    const barChartCategories = ['Group A', 'Group B', 'Group C', 'Group D'];
    const barChartSeries = [{
        name: 'Active Tutors',
        data: [20, 35, 15, 40]
    }];

    const [tutors] = useState([
        { id: 1, name: 'Albus Dumbledore', status: 'Compliant', lastCheck: '2025-12-20', score: 98 },
        { id: 2, name: 'Minerva McGonagall', status: 'Compliant', lastCheck: '2025-12-21', score: 95 },
        { id: 3, name: 'Severus Snape', status: 'Non-Compliant', lastCheck: '2025-12-10', score: 45 },
        { id: 4, name: 'Rubeus Hagrid', status: 'Review Needed', lastCheck: '2025-12-15', score: 70 },
    ]);

    // ---- State ----
    const [filterValue, setFilterValue] = useState('all');
    const [showArchived, setShowArchived] = useState(false);
    const [selectedTutor, setSelectedTutor] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ---- Handlers ----
    const handleFilterChange = (e) => setFilterValue(e.target.value);
    const handleToggle = () => setShowArchived(!showArchived);
    const handleTabClick = (tabId) => setActiveTab(tabId);
    const handleHomeClick = () => setActiveTab('home');

    const handleViewDetails = (tutor) => {
        console.log('Opening details for:', tutor.name);
        setSelectedTutor(tutor);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTutor(null);
    };

    return (
        <div style={{
            display: 'flex',
            width: '100%',
            minHeight: '100vh',
            backgroundColor: 'var(--color-surface-container)',
            gap: 'var(--size-surface-gap-sm)',
            padding: 'var(--Surface-Container-pad-y-sm, 12px) var(--Surface-Container-pad-x-sm, 16px)',
            boxSizing: 'border-box'
        }}>
            {/* Sidebar Shell */}
            <div style={{
                flexShrink: 0,
                width: 'fit-content',
                backgroundColor: 'var(--color-surface-container)'
            }}>
                <Sidebar
                    user="supervisor"
                    visible={true}
                    onTabClick={handleTabClick}
                    onHomeClick={handleHomeClick}
                />
            </div>

            {/* Main Content Area */}
            <main style={{
                flex: 1,
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--size-surface-radius, 16px)',
                padding: 'var(--Surface-pad-y, 24px) var(--Surface-pad-x, 32px)',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}>
                {activeTab === 'compliance-monitor' ? (
                    <ComplianceMonitor />
                ) : (
                    <>
                        <h1 style={{ marginBottom: '2rem', fontFamily: 'var(--font-family-header)' }}>Tutor Compliance</h1>

                        {/* Top Charts Section */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                            <div style={{ padding: '1.5rem', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--size-card-radius-md)', backgroundColor: 'var(--color-surface)' }}>
                                <h3 style={{ marginBottom: '1rem' }}>Overall Trend</h3>
                                <LineChart data={lineChartData} height={300} />
                            </div>
                            <div style={{ padding: '1.5rem', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--size-card-radius-md)', backgroundColor: 'var(--color-surface)' }}>
                                <h3 style={{ marginBottom: '1rem' }}>Group Distribution</h3>
                                <BarChart categories={barChartCategories} series={barChartSeries} height={300} />
                            </div>
                        </div>

                        {/* Controls Section */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            gap: '1.5rem',
                            marginBottom: '1.5rem',
                            padding: '1rem',
                            backgroundColor: 'var(--color-surface-container-low)',
                            borderRadius: 'var(--size-card-radius-sm)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="body2-txt">Show Archived</span>
                                <Switch checked={showArchived} onChange={handleToggle} />
                            </div>

                            <div style={{ width: '200px' }}>
                                <Select
                                    value={filterValue}
                                    onChange={handleFilterChange}
                                    options={[
                                        { value: 'all', label: 'All Statuses' },
                                        { value: 'compliant', label: 'Compliant' },
                                        { value: 'non-compliant', label: 'Non-Compliant' }
                                    ]}
                                />
                            </div>
                        </div>

                        {/* Table Section */}
                        <div style={{
                            border: '1px solid var(--color-outline-variant)',
                            borderRadius: 'var(--size-card-radius-sm)',
                            overflow: 'hidden'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: 'var(--color-surface-container-low)' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--color-outline-variant)' }}>Tutor Name</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--color-outline-variant)' }}>Status</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--color-outline-variant)' }}>Last Check</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--color-outline-variant)' }}>Score</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--color-outline-variant)' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tutors.map(tutor => (
                                        <tr key={tutor.id} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                                            <td style={{ padding: '1rem' }}>{tutor.name}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <Badge
                                                    text={tutor.status}
                                                    style={tutor.status === 'Compliant' ? 'success' : tutor.status === 'Non-Compliant' ? 'danger' : 'warning'}
                                                />
                                            </td>
                                            <td style={{ padding: '1rem' }}>{tutor.lastCheck}</td>
                                            <td style={{ padding: '1rem' }}>{tutor.score}%</td>
                                            <td style={{ padding: '1rem' }}>
                                                <Button
                                                    style="secondary"
                                                    size="small"
                                                    onClick={() => handleViewDetails(tutor)}
                                                >
                                                    View Details
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Detail Modal */}
                        {isModalOpen && selectedTutor && (
                            <div style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100vw',
                                height: '100vh',
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1000
                            }}>
                                <Modal
                                    id="tutor-details-modal"
                                    title={`Details: ${selectedTutor.name}`}
                                    type="default"
                                    showBottomButtons={true}
                                    onClose={handleCloseModal}
                                    primaryButton={{
                                        text: 'Close',
                                        onClick: handleCloseModal,
                                        style: 'primary',
                                        fill: 'filled'
                                    }}
                                    width={500}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>Email:</span>
                                            <span className="body1-txt" style={{ fontWeight: 500 }}>{selectedTutor.name.toLowerCase().replace(' ', '.')}@example.com</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>Status:</span>
                                            <Badge
                                                text={selectedTutor.status}
                                                style={selectedTutor.status === 'Compliant' ? 'success' : selectedTutor.status === 'Non-Compliant' ? 'danger' : 'warning'}
                                            />
                                        </div>

                                        <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: 'var(--color-surface-container-low)', borderRadius: 'var(--size-card-radius-sm)' }}>
                                            <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Compliance Checklist</h4>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                                                <span className="body2-txt">Background Check</span>
                                                <i className="fas fa-check-circle" style={{ color: 'var(--color-success)' }}></i>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                                                <span className="body2-txt">Sexual Harassment Training</span>
                                                <i className="fas fa-check-circle" style={{ color: 'var(--color-success)' }}></i>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span className="body2-txt">Tutor Orientation</span>
                                                {selectedTutor.score > 80 ? (
                                                    <i className="fas fa-check-circle" style={{ color: 'var(--color-success)' }}></i>
                                                ) : (
                                                    <i className="fas fa-exclamation-circle" style={{ color: 'var(--color-warning)' }}></i>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '0.5rem' }}>
                                            <h5 style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Notes</h5>
                                            <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                                                Tutor has consistently met weekly session requirements. Ensure to follow up on the missing orientation module if score is low.
                                            </p>
                                        </div>
                                    </div>
                                </Modal>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default App;
