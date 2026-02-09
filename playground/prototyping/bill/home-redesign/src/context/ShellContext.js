import { createContext } from 'react';

export const ShellContext = createContext({
    setBreadcrumbs: () => { },
    setTopBarUser: () => { },
    setMainClassName: () => { },
    setContentDirect: () => { },
    setFloatingContent: () => { },
    setActiveTabOverride: () => { },
});
