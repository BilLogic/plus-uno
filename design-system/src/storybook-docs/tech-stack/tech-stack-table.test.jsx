import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

import pkg from '../../../../package.json';
import { TECH_STACK, TechStackTable, versionOf } from './tech-stack-table.jsx';

describe('TechStackTable', () => {
    it('reads each version from package.json', () => {
        for (const row of TECH_STACK.filter((r) => r.pkg)) {
            expect(pkg.dependencies[row.pkg], row.pkg).toBeTruthy();
            expect(versionOf(row)).toBe(pkg.dependencies[row.pkg]);
        }
    });

    it('renders one row per package inside a DocsTable wrapper', () => {
        const { container } = render(<TechStackTable />);
        expect(container.querySelector('.sb-ds-doc-table-wrap')).toBeTruthy();
        expect(container.querySelectorAll('tbody tr')).toHaveLength(TECH_STACK.length);
    });
});
