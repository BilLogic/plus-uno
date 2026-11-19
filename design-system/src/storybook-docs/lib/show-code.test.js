import { describe, expect, it } from 'vitest';
import { showCode, sourceOf } from './show-code.js';

const FILE = `import React from 'react';
import { Button, Tag } from '@/components';
import { Frame } from '@/templates';

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
            "import { Button } from '@/components';",
            '',
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
        expect(sourceOf(FILE, 'Other')).toBe("import { Button } from '@/components';\n\nconst Other = () => <Button text=\"Other\" />;");
    });

    it('imports only the names the snippet uses, from the barrels the module imports them from', () => {
        const code = sourceOf("import React, { useState } from 'react';\nimport { Frame, Page } from '@/templates';\nimport { Button } from '@/components';\n\nconst A = () => {\n    const [x] = useState(0);\n    return <Frame><Button text=\"a\" /></Frame>;\n};\n", 'A');
        expect(code.split('\n\n')[0]).toBe([
            "import { useState } from 'react';",
            "import { Frame } from '@/templates';",
            "import { Button } from '@/components';",
        ].join('\n'));
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
