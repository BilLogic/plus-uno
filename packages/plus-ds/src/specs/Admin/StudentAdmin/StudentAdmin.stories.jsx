import React from 'react';
import { StudentAdminSpec } from './StudentAdminSpec';
import { SpecOverview } from '../../SpecOverview';

export default {
    title: 'Specs/Admin/StudentAdmin',
    component: StudentAdminSpec,
    parameters: {
        layout: 'fullscreen',
    },
};

export const Overview = () => (
    <SpecOverview
        title="Student Admin"
        description="Dashboard for managing student profiles, assigning tutors, and tracking student progress."
        categories={[
            {
                title: 'Features',
                items: [
                    'Student Metrics',
                    'Student List & filtering',
                    'Pagination & Sorting',
                    'Student Assignments'
                ]
            }
        ]}
    />
);

export const Dashboard = () => <StudentAdminSpec />;

export const WithInfoModal = () => <StudentAdminSpec showModal={true} modalType="Info" />;
export const WithSessionsModal = () => <StudentAdminSpec showModal={true} modalType="Sessions" />;
