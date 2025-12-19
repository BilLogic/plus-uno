import React from 'react';
import { LoginSpec, LoginForm } from './LoginSpec';

export default {
    title: 'Specs/Login',
    component: LoginSpec,
    parameters: {
        layout: 'fullscreen',
    },
};

export const Page = () => <LoginSpec />;

export const CardOnly = {
    render: () => (
        <div className="p-5 bg-light">
            <LoginForm />
        </div>
    )
};
