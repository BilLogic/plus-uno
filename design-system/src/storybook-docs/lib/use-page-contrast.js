import { useEffect, useState } from 'react';

/**
 * The page's contrast mode, followed as the toolbar changes it. A pane that
 * sets its own color mode reads this to carry the page's contrast into itself,
 * so the Contrast switch still reaches it.
 */
export const usePageContrast = () => {
    const read = () => (typeof document === 'undefined'
        ? null
        : document.documentElement.getAttribute('data-contrast-mode'));
    const [contrast, setContrast] = useState(read);
    useEffect(() => {
        const observer = new MutationObserver(() => setContrast(read()));
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-contrast-mode'] });
        return () => observer.disconnect();
    }, []);
    return contrast;
};
