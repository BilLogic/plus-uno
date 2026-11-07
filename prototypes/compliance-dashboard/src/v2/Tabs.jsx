import React from 'react';
import { Tabs as PlusTabs } from '@/components';

/**
 * The one place this prototype reaches for Tabs. Callers pass `items` as
 * `{ key, label }`; `appearance` is `tabs` (page level, underline) or `pills`
 * (a filter inside a section, pill fill).
 */
const Tabs = ({ items, value, onChange, appearance = 'tabs', label }) => (
    <PlusTabs
        activeKey={value}
        onSelect={onChange}
        appearance={appearance === 'pills' ? 'pill' : 'default'}
        aria-label={label}
    >
        {items.map((t) => (
            <PlusTabs.Tab key={t.key} eventKey={t.key}>{t.label}</PlusTabs.Tab>
        ))}
    </PlusTabs>
);

export default Tabs;
