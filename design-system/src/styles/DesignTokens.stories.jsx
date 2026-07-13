import React from 'react';

export default {
    title: 'Foundations/Design tokens',
    tags: ['!dev', '!autodocs'],
};

const code = (t) => <code style={{ fontSize: '0.82em', wordBreak: 'break-word' }}>{t}</code>;

export const Collections = () => (
    <div style={{ maxWidth: '1200px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: '1px solid var(--color-outline-variant)' }}>
            <colgroup>
                <col style={{ width: '20%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '58%' }} />
            </colgroup>
            <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-container-low)', borderBottom: '2px solid var(--color-outline)' }}>
                    {['Figma collection', 'CSS source', 'Contents'].map(h => (
                        <th key={h} className="body2-txt" style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {[
                    ['colors / accent', '_colors.scss', <>Primary, secondary, status (danger, success, warning, info), SMART competency colors, and their {code('-container')} / {code('on-')} / {code('-state-*')} variants</>],
                    ['colors / neutral', '_colors.scss', <>Surface, the surface-container ladder ({code('--color-surface-container-lowest')} → {code('-low')} → base → {code('-high')} → {code('-highest')}), on-surface/on-surface-variant, outline/outline-variant, inverse surface, plus state layers ({code('-state-08/12/16')})</>],
                    ['size / primitive', '_primitives.scss', <>Raw spacing steps ({code('--size-spacing-{small|medium|large}-space-*')}), border-radius and stroke primitives — never used directly</>],
                    ['size / semantics', '_spacing_semantics.scss', <>Per-context tokens: {code('--size-element-*')}, {code('--size-card-*')}, {code('--size-section-*')}, {code('--size-modal-*')}, {code('--size-surface-*')}, {code('--size-table-*')}</>],
                ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                        <td className="body2-txt" style={{ padding: '10px 12px', wordBreak: 'break-word' }}>{row[0]}</td>
                        <td style={{ padding: '10px 12px', wordBreak: 'break-word' }}>{code(row[1])}</td>
                        <td className="body2-txt" style={{ padding: '10px 12px', wordBreak: 'break-word' }}>{row[2]}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
