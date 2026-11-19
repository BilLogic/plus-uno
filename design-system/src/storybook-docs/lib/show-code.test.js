import { describe, expect, it } from 'vitest';
import { showCode, sourceOf } from './show-code.js';

const FILE = `import React from 'react';
import { Button } from '@/components';

/** The label. */
const LABEL = 'Save';

/** A leaf. */
const Leaf = () => <Button text={LABEL} />;

/** The example. */
export const Example = () => (
    <div>
        <Leaf />
    </div>
);

export const Other = () => <Button text="Other" />;
`;

describe('sourceOf', () => {
    it('prints the example\'s own declaration with the declarations it uses first', () => {
        expect(sourceOf(FILE, 'Example')).toBe([
            "const LABEL = 'Save';",
            '',
            'const Leaf = () => <Button text={LABEL} />;',
            '',
            'const Example = () => (',
            '    <div>',
            '        <Leaf />',
            '    </div>',
            ');',
        ].join('\n'));
    });

    it('prints a one-line example on its own', () => {
        expect(sourceOf(FILE, 'Other')).toBe('const Other = () => <Button text="Other" />;');
    });

    it('fails loudly on a name the file does not declare', () => {
        expect(() => sourceOf(FILE, 'Missing')).toThrow(/Missing/);
    });
});

describe('showCode', () => {
    it('maps each name to its printed source', () => {
        expect(Object.keys(showCode(FILE, ['Example', 'Other']))).toEqual(['Example', 'Other']);
    });
});
