import React, { useMemo } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { OpenTabsProvider } from '@/patterns';
import { createMemoryTabsStore } from './shell';

/**
 * A screen story's frame: a router at `path` and a fresh open-tabs store
 * holding the starting tabs, at the boards' 1440 × 1100.
 */
export const ScreenFrame = ({ path = '/', children }) => {
    const store = useMemo(() => createMemoryTabsStore(), []);
    return (
        <OpenTabsProvider store={store}>
            <MemoryRouter initialEntries={[path]}>
                <div style={{ height: '100vh' }}>{children}</div>
            </MemoryRouter>
        </OpenTabsProvider>
    );
};
