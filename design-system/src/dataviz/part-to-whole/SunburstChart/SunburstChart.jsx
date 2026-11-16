import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme from '@/dataviz/chartTheme';
import { tooltipPointFormat } from '@/dataviz/chartFormat';
import { mostToLeast } from '@/dataviz/palette';

const sortHierarchy = (nodes) => {
    if (nodes.length <= 1) return nodes;
    const byParent = new Map();
    const ids = new Set();
    for (const node of nodes) {
        if (node.id != null) ids.add(node.id);
    }
    for (const node of nodes) {
        const parentKey = node.parent && ids.has(node.parent) ? node.parent : '';
        if (!byParent.has(parentKey)) byParent.set(parentKey, []);
        byParent.get(parentKey).push(node);
    }

    const totals = new Map();
    const computeTotal = (node) => {
        if (node.id != null && totals.has(node.id)) return totals.get(node.id);
        const children = node.id != null ? (byParent.get(node.id) ?? []) : [];
        const childSum = children.reduce((sum, child) => sum + computeTotal(child), 0);
        const total = typeof node.value === 'number' ? Math.max(node.value, childSum) : childSum;
        if (node.id != null) totals.set(node.id, total);
        return total;
    };
    for (const root of byParent.get('') ?? []) computeTotal(root);

    const ordered = [];
    const visit = (parentKey) => {
        const siblings = byParent.get(parentKey);
        if (!siblings) return;
        const ranked = mostToLeast(
            siblings,
            (node) => (node.id != null ? totals.get(node.id) : undefined) ?? node.value ?? 0,
        );
        for (const node of ranked) {
            ordered.push(node);
            if (node.id != null) visit(node.id);
        }
    };
    visit('');
    return ordered;
};

/**
 * SunburstChart Component
 * Displays hierarchical data as concentric rings.
 */
const SunburstChart = ({
    data = [],
    height = 400,
    sort = true,
}) => {
    const orderedData = useMemo(
        () => (sort ? sortHierarchy(data) : data),
        [data, sort],
    );

    const options = useMemo(() => ({
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            height,
        },
        title: { text: null },
        series: [{
            type: 'sunburst',
            data: orderedData,
            allowTraversingTree: true,
            cursor: 'pointer',
            dataLabels: {
                format: '{point.name}',
            },
            levels: [{
                level: 1,
                levelSize: { unit: 'percentage', value: 33 },
                dataLabels: { enabled: true },
            }, {
                level: 2,
                levelSize: { unit: 'percentage', value: 33 },
            }, {
                level: 3,
                levelSize: { unit: 'percentage', value: 34 },
            }],
        }],
        tooltip: {
            ...chartTheme.tooltip,
            headerFormat: '',
            pointFormat: tooltipPointFormat({ label: '{point.name}', value: '{point.value}' }),
        },
    }), [orderedData, height]);

    return (
        <div style={{ width: '100%', height }}>
            <PlusChart options={options} />
        </div>
    );
};

SunburstChart.propTypes = {
    /** Hierarchical data array { id, parent, name, value } */
    data: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        parent: PropTypes.string,
        name: PropTypes.string,
        value: PropTypes.number,
    })),
    /** Chart height in pixels */
    height: PropTypes.number,
    /** Sort sibling branches and leaves from most to least by default; pass false to keep input order. */
    sort: PropTypes.bool,
};

export default SunburstChart;
