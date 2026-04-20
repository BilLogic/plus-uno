import React from 'react';
import { Table, Badge } from 'react-bootstrap';
import { Button } from '../../../components';
import DashboardLayout from '@/components/layout/DashboardLayout';
import OnboardingModuleCard from '@/components/training/OnboardingModuleCard';

const OnboardingOverviewPage = () => {
    const featuredModules = [
        { title: 'Welcome to PLUS', duration: '9 mins' },
        { title: 'Your Role at PLUS', duration: '9 mins' },
        { title: 'Tutoring Session Overview', duration: '9 mins' },
    ];

    const allModules = [
        { title: 'Welcome to PLUS', duration: '11mins', stage: 'not started' },
        { title: 'Your role at PLUS', duration: '11mins', stage: 'not started' },
        { title: 'Tutoring Session Overview', duration: '11mins', stage: 'not started' },
        { title: 'Tutor Session Flow/Responsibilities', duration: '11mins', stage: 'not started' },
    ];

    return (
        <DashboardLayout>
            <div className="d-flex flex-column gap-5">
                {/* Featured Modules */}
                <div className="d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="h5 fw-bold m-0">Featured Modules</h4>
                        <div className="d-flex gap-2">
                            <Button style="default" fill="outline" size="small" icon="arrow-left" disabled />
                            <Button style="primary" fill="outline" size="small" icon="arrow-right" />
                        </div>
                    </div>
                    <div className="d-flex gap-3 overflow-auto pb-2">
                        {featuredModules.map((m, i) => (
                            <OnboardingModuleCard key={i} {...m} />
                        ))}
                    </div>
                </div>

                {/* All Modules */}
                <div className="d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="h5 fw-bold m-0">All Modules</h4>
                        {/* Sorting Dropdown Placeholder */}
                    </div>
                    <div className="bg-white rounded border overflow-hidden">
                        <Table hover className="m-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="py-3 px-4 border-bottom">Module Title</th>
                                    <th className="py-3 px-4 border-bottom">Duration</th>
                                    <th className="py-3 px-4 border-bottom">Stage</th>
                                    <th className="py-3 px-4 border-bottom">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allModules.map((m, i) => (
                                    <tr key={i}>
                                        <td className="py-3 px-4">{m.title}</td>
                                        <td className="py-3 px-4">{m.duration}</td>
                                        <td className="py-3 px-4"><Badge bg="secondary">{m.stage}</Badge></td>
                                        <td className="py-3 px-4"><Button style="primary" fill="text" size="small" text="Start" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default OnboardingOverviewPage;
