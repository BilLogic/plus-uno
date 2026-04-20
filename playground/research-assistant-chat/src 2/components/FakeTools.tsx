import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// --- Shared Tool Card Component ---
export function ToolCard({ title, description, children, className = '' }: { title?: string; description?: string; children: React.ReactNode; className?: string }) {
    return (
        <div
            className={className}
            style={{
                background: 'var(--chat-surface, #ffffff)',
                border: '1px solid var(--chat-outline, #d1d5db)',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '12px',
                fontFamily: 'var(--font-family-body)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
        >
            {(title || description) && (
                <div style={{
                    padding: '20px 20px 16px 20px',
                    borderBottom: title && description ? '1px solid var(--chat-outline, #e5e7eb)' : 'none',
                }}>
                    {title && <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--chat-on-surface, #111827)' }}>{title}</h3>}
                    {description && <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--chat-on-surface-muted, #6b7280)' }}>{description}</p>}
                </div>
            )}
            <div style={{ padding: '0' }}>
                {children}
            </div>
        </div>
    );
}

// --- Tool: Terminal ---
export function ToolTerminal({ title, logs = [] }: { title?: string; logs: string[] }) {
    const [lines, setLines] = useState<string[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (lines.length < logs.length) {
            const t = setTimeout(() => {
                setLines(logs.slice(0, lines.length + 1));
            }, 700);
            return () => clearTimeout(t);
        }
    }, [lines, logs]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [lines]);

    return (
        <ToolCard className="tool-terminal">
            <div style={{ background: '#1e1e1e', color: '#f0f0f0', padding: '0' }}>
                {title && (
                    <div style={{ padding: '8px 16px', background: '#2d2d2d', borderBottom: '1px solid #333', fontSize: '12px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
                            <span style={{ marginLeft: '8px' }}>{title}</span>
                        </span>
                        <span style={{ color: '#888', fontFamily: 'monospace' }}>bash</span>
                    </div>
                )}
                <div ref={scrollRef} style={{ padding: '16px', fontFamily: '"Fira Code", monospace', fontSize: '12px', lineHeight: '1.6', minHeight: '120px', maxHeight: '200px', overflowY: 'auto' }}>
                    {lines.map((line, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#4caf50', userSelect: 'none' }}>➜</span>
                            <span>{line}</span>
                        </div>
                    ))}
                    {lines.length < logs.length && (
                        <motion.div
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            style={{ width: '8px', height: '14px', background: '#4caf50', marginTop: '4px', marginLeft: '20px' }}
                        />
                    )}
                </div>
            </div>
        </ToolCard>
    );
}

// --- Sparkline Component ---
// Pure SVG mini chart with optional fill (for background effect)
function Sparkline({
    data,
    color = 'var(--color-primary, #0472a8)',
    width = 80,
    height = 24,
    showFill = false,
    fillOpacity = 0.09,
    className = ''
}: {
    data: number[];
    color?: string;
    width?: number;
    height?: number;
    showFill?: boolean;
    fillOpacity?: number;
    className?: string;
}) {
    if (!data || data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    // For fill, create a closed path
    const fillPath = showFill ? `${points} ${width},${height} 0,${height}` : '';

    return (
        <svg width={width} height={height} style={{ display: 'block' }} className={className}>
            {showFill && (
                <polygon
                    points={fillPath}
                    fill={color}
                    fillOpacity={fillOpacity}
                    stroke="none"
                />
            )}
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// --- Format Value Helper ---
function formatValue(value: number, format?: { kind: 'currency' | 'percent' | 'number' | 'text'; currency?: string; decimals?: number; compact?: boolean; basis?: 'unit' | 'percent' }): string {
    if (!format || format.kind === 'number') {
        if (format?.compact) {
            if (value >= 1000000) return `${(value / 1000000).toFixed(format.decimals ?? 1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(format.decimals ?? 1)}K`;
        }
        return value.toFixed(format?.decimals ?? 0);
    }

    if (format.kind === 'currency') {
        const symbol = format.currency === 'USD' ? '$' : format.currency || '$';
        const formatted = value.toLocaleString('en-US', { minimumFractionDigits: format.decimals ?? 0, maximumFractionDigits: format.decimals ?? 0 });
        return `${symbol}${formatted}`;
    }

    if (format.kind === 'percent') {
        const displayValue = format.basis === 'unit' ? value : value / 100;
        return `${displayValue.toFixed(format.decimals ?? 1)}%`;
    }

    return String(value);
}

// --- Enhanced Stats Display ---
type StatItem = {
    key: string;
    label: string;
    value: number;
    format?: { kind: 'currency' | 'percent' | 'number' | 'text'; currency?: string; decimals?: number; compact?: boolean; basis?: 'unit' | 'percent' };
    sparkline?: { data: number[]; color?: string };
    diff?: { value: number; decimals?: number; upIsPositive?: boolean; label?: string };
};

export function ToolStats({
    title,
    description,
    stats
}: {
    title?: string;
    description?: string;
    stats: StatItem[];
}) {
    return (
        <ToolCard title={title || "Key Metrics"} description={description}>
            <div style={{
                padding: '0',
                display: 'flex',
                flexWrap: 'nowrap',
                width: '100%'
            }}>
                {stats.map((stat, index) => {
                    // Determine if the change is positive based on upIsPositive flag
                    // If upIsPositive is true (default), positive diff values are good (green)
                    // If upIsPositive is false, negative diff values are good (green)
                    const upIsPositive = stat.diff?.upIsPositive ?? true;
                    const isPositive = upIsPositive ? (stat.diff?.value ?? 0) > 0 : (stat.diff?.value ?? 0) < 0;
                    const diffColor = isPositive ? '#16a34a' : '#dc2626';
                    const diffBg = isPositive ? '#dcfce7' : '#fee2e2';
                    const sparklineColor = stat.sparkline?.color || 'var(--color-primary, #0472a8)';

                    return (
                        <div
                            key={stat.key}
                            style={{
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                padding: '24px 24px',
                                minHeight: '140px',
                                justifyContent: 'flex-start',
                                flex: 1,
                                minWidth: 0,
                                borderLeft: index > 0 ? '1px solid var(--chat-outline, #e5e7eb)' : 'none',
                                background: '#f9fafb',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Background Sparkline - positioned absolutely */}
                            {stat.sparkline && (
                                <div style={{
                                    position: 'absolute',
                                    right: 0,
                                    bottom: 0,
                                    pointerEvents: 'none',
                                    opacity: 0.72,
                                }}>
                                    <Sparkline
                                        data={stat.sparkline.data}
                                        color={sparklineColor}
                                        width={180}
                                        height={70}
                                        showFill
                                        fillOpacity={0.03}
                                    />
                                </div>
                            )}

                            <span style={{
                                fontSize: '11px',
                                fontWeight: 500,
                                color: 'var(--chat-on-surface-muted, #6b7280)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                position: 'relative',
                                zIndex: 1
                            }}>
                                {stat.label}
                            </span>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                flexWrap: 'nowrap',
                                gap: '8px',
                                position: 'relative',
                                zIndex: 1,
                                paddingBottom: '8px'
                            }}>
                                <span style={{
                                    fontSize: stats.length === 1 ? '40px' : '28px',
                                    fontWeight: '300',
                                    color: 'var(--chat-on-surface, #111827)',
                                    letterSpacing: '-0.5px',
                                    lineHeight: '1.2'
                                }}>
                                    {formatValue(stat.value, stat.format)}
                                </span>

                                {stat.diff && (
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        whiteSpace: 'nowrap',
                                        gap: '4px',
                                        color: diffColor,
                                        background: diffBg,
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                    }}>
                                        {stat.diff.value > 0 ? '↑' : '↓'} {Math.abs(stat.diff.value).toFixed(stat.diff.decimals ?? 1)}%
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </ToolCard>
    );
}

// --- Tool: Item Carousel ---
export function ToolCarousel({ items, title, description }: { title?: string; description?: string; items: { title: string; desc: string; icon?: React.ReactNode }[] }) {
    return (
        <ToolCard title={title || "Strategies"} description={description}>
            <div style={{ padding: '20px 0 20px 20px', display: 'flex', gap: '12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {items.map((item, i) => (
                    <div
                        key={i}
                        style={{
                            minWidth: '220px',
                            width: '220px',
                            padding: '16px',
                            background: '#ffffff',
                            border: '1px solid var(--chat-outline, #e5e7eb)',
                            borderRadius: '8px',
                            flexShrink: 0,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '6px',
                                background: 'var(--color-surface-container, #f3f4f6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '18px'
                            }}>
                                {item.icon}
                            </div>
                            <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--chat-on-surface, #111827)' }}>{item.title}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--chat-on-surface-muted, #6b7280)', margin: 0, lineHeight: '1.5' }}>
                            {item.desc}
                        </p>
                    </div>
                ))}
                {/* Spacer for right padding */}
                <div style={{ width: '8px', flexShrink: 0 }} />
            </div>
        </ToolCard>
    );
}
