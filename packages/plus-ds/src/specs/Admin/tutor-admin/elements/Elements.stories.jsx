import React from 'react';
import DonutChart from '@/DataViz/DonutChart';
import StackedBarChart from '@/DataViz/StackedBarChart';
import SmartBarChart from '@/DataViz/SmartBarChart';

export default {
    title: 'Specs/Admin/Tutor Admin/Elements',
    tags: ['autodocs'],
};

export const Graphs = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
                <h3>Pie Chart</h3>
                <div style={{ width: '300px', height: '300px' }}>
                    <DonutChart
                        data={[
                            { value: 30, color: 'var(--bs-success)' },
                            { value: 20, color: 'var(--bs-warning)' },
                            { value: 50, color: 'var(--bs-danger)' }
                        ]}
                        total={100}
                    />
                </div>
            </div>
            <div>
                <h3>Bar Chart</h3>
                <div style={{ width: '500px', height: '300px' }}>
                    <StackedBarChart
                        dates={['Mon', 'Tue', 'Wed', 'Thu', 'Fri']}
                        data={[
                            { segments: [{ value: 10, height: '50%', color: 'blue' }, { value: 5, height: '25%', color: 'red' }] },
                            { segments: [{ value: 15, height: '75%', color: 'blue' }, { value: 2, height: '10%', color: 'red' }] },
                            { segments: [{ value: 8, height: '40%', color: 'blue' }, { value: 8, height: '40%', color: 'red' }] },
                            { segments: [{ value: 12, height: '60%', color: 'blue' }, { value: 4, height: '20%', color: 'red' }] },
                            { segments: [{ value: 18, height: '90%', color: 'blue' }, { value: 1, height: '5%', color: 'red' }] },
                        ]}
                    />
                </div>
            </div>
            <div>
                <h3>Line Chart (Smart)</h3>
                <div style={{ width: '300px', height: '200px' }}>
                    <SmartBarChart
                        data={[
                            { letter: 'S', height: '60%', color: 'var(--bs-info)' },
                            { letter: 'M', height: '80%', color: 'var(--bs-primary)' },
                            { letter: 'A', height: '40%', color: 'var(--bs-secondary)' },
                            { letter: 'R', height: '90%', color: 'var(--bs-danger)' },
                            { letter: 'T', height: '70%', color: 'var(--bs-warning)' }
                        ]}
                    />
                </div>
            </div>
        </div>
    )
};
