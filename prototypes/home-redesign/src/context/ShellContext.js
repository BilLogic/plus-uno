import { createContext } from 'react';

const noop = () => { };

export const ShellContext = createContext({
    setBreadcrumbs: noop,
    setTopBarUser: noop,
    setMainClassName: noop,
    setContentDirect: noop,
    setFloatingContent: noop,
    setActiveTabOverride: noop,
    openStudentInsights: noop,
});

