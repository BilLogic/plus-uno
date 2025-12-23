/**
 * Universal Specs - Sections
 * 
 * Section-level components for universal organisms.
 * These are larger container components used across multiple product pillars.
 * 
 * Components:
 * - Sidebar: Navigation sidebar with tutor and supervisor variants
 * - TopBar: Top navigation bar with breadcrumb and user avatar
 * - Footer: Page footer with copyright and version information
 */

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Breadcrumb from '@/components/Breadcrumb';
import UserAvatar from '@/components/UserAvatar';
import Footer from '@/components/Footer';

export default {
    title: 'Specs/Universal/Sections',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Section-level components for universal organisms. These are larger container components used across multiple product pillars.',
            },
        },
    },
};

/**
 * Overview
 * Comprehensive view of universal section components.
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {/* Sidebar Preview */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Sidebar</h6>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Navigation sidebar with different user type variants (tutor, supervisor).
            </p>
            <div style={{
                width: '250px',
                height: '400px',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <Sidebar user="supervisor" visible={true} />
            </div>
        </section>

        {/* TopBar Preview */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>TopBar</h6>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Top navigation bar with breadcrumb, sidebar toggle, and user avatar.
            </p>
            <TopBarPreview />
        </section>

        {/* Footer Preview */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Footer</h6>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Page footer with version, copyright, and terms of use.
            </p>
            <div style={{
                backgroundColor: 'var(--color-surface-container)',
                padding: 'var(--size-section-pad-y-md)',
                borderRadius: '8px'
            }}>
                <Footer
                    version="v5.2.0"
                    copyright="Copyright © Carnegie Mellon University 2024"
                    termsText="Terms of Use"
                    termsUrl="#"
                />
            </div>
        </section>
    </div>
);

// TopBar preview component
const TopBarPreview = () => (
    <div style={{
        width: '100%',
        backgroundColor: 'var(--color-surface-container)',
        padding: 'var(--size-section-pad-y-sm) var(--size-section-pad-x-md)',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn btn-ghost" style={{ padding: '8px' }}>
                <i className="fas fa-bars" />
            </button>
            <Breadcrumb>
                <Breadcrumb.Item href="#">Home</Breadcrumb.Item>
                <Breadcrumb.Item href="#">Training</Breadcrumb.Item>
                <Breadcrumb.Item active>Strategies</Breadcrumb.Item>
            </Breadcrumb>
        </div>
        <UserAvatar
            firstChar="J"
            name="John Doe"
            type="regular tutor"
            counter
            counterValue={2}
        />
    </div>
);

/**
 * Sidebar Interactive
 * Interactive sidebar with controls for user type and visibility.
 */
export const SidebarInteractive = (args) => (
    <div style={{
        width: args.visible ? '250px' : '0',
        backgroundColor: 'var(--color-surface-container)',
        padding: args.visible ? 'var(--size-section-pad-y-md)' : '0',
        height: '100vh',
        transition: 'width 0.3s, padding 0.3s',
        overflow: 'hidden'
    }}>
        <Sidebar
            user={args.user}
            visible={args.visible}
            onHomeClick={() => console.log('Home clicked')}
            onTabClick={(tabName) => console.log('Tab clicked:', tabName)}
        />
    </div>
);
SidebarInteractive.args = {
    user: 'supervisor',
    visible: true
};
SidebarInteractive.argTypes = {
    user: {
        control: { type: 'select' },
        options: ['tutor', 'supervisor'],
        description: 'User type (determines available sections)'
    },
    visible: {
        control: 'boolean',
        description: 'Toggle sidebar visibility'
    }
};

/**
 * TopBar Interactive
 * Interactive top bar with controls.
 */
export const TopBarInteractive = (args) => (
    <div style={{
        width: '100%',
        backgroundColor: 'var(--color-surface-container)',
        padding: 'var(--size-section-pad-y-sm) var(--size-section-pad-x-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
                className="btn btn-ghost"
                style={{ padding: '8px' }}
                onClick={() => console.log('Sidebar toggle clicked')}
            >
                <i className={`fas fa-${args.mode === 'expanded' ? 'bars' : 'chevron-right'}`} />
            </button>
            <Breadcrumb>
                <Breadcrumb.Item href="#">Strategies</Breadcrumb.Item>
            </Breadcrumb>
        </div>
        <UserAvatar
            firstChar={args.userName.charAt(0)}
            name={args.userName}
            type="regular tutor"
            counter
            counterValue={args.counterValue}
            onClick={() => console.log('User avatar clicked')}
        />
    </div>
);
TopBarInteractive.args = {
    mode: 'expanded',
    userName: 'John Doe',
    counterValue: 2
};
TopBarInteractive.argTypes = {
    mode: {
        control: { type: 'select' },
        options: ['expanded', 'collapsed'],
        description: 'Top Bar mode'
    },
    userName: {
        control: 'text',
        description: 'User name'
    },
    counterValue: {
        control: 'number',
        description: 'Notification counter value'
    }
};

/**
 * Footer Default
 * Default footer with version, copyright, and terms.
 */
export const FooterDefault = () => (
    <div style={{
        width: '100%',
        backgroundColor: 'var(--color-surface-container)',
        padding: 'var(--size-section-pad-y-md)'
    }}>
        <Footer
            version="v5.2.0"
            copyright="Copyright © Carnegie Mellon University 2024"
            termsText="Terms of Use"
            termsUrl="#"
        />
    </div>
);
