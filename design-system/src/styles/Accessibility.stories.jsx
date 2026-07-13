import React from 'react';

export default {
    title: 'Foundations/Accessibility',
    tags: ['!dev', '!autodocs'],
};

const code = (t) => <code style={{ fontSize: '0.85em', wordBreak: 'break-word' }}>{t}</code>;

export const ContrastPairings = () => (
    <div style={{ maxWidth: '1200px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: '1px solid var(--color-outline-variant)' }}>
            <colgroup>
                <col style={{ width: '34%' }} />
                <col style={{ width: '30%' }} />
                <col style={{ width: '36%' }} />
            </colgroup>
            <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-container-low)', borderBottom: '2px solid var(--color-outline)' }}>
                    {['Content', 'Token', 'Pairs with'].map(h => (
                        <th key={h} className="body2-txt" style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {[
                    ['Primary text', <>{code('--color-on-surface')}</>, 'Any surface / surface-container step'],
                    ['Secondary text (subtitles, metadata, timestamps)', <>{code('--color-on-surface-variant')}</>, 'Any surface / surface-container step'],
                    ['Text on filled color', <>{code('--color-on-primary')}, {code('--color-on-*')}</>, <>The matching {code('--color-{role}')} / {code('-container')} fill</>],
                ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                        <td className="body2-txt" style={{ padding: '10px 12px', wordBreak: 'break-word' }}>{row[0]}</td>
                        <td style={{ padding: '10px 12px', wordBreak: 'break-word' }}>{row[1]}</td>
                        <td className="body2-txt" style={{ padding: '10px 12px', wordBreak: 'break-word' }}>{row[2]}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
