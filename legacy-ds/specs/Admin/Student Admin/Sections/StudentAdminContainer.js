/**
 * @fileoverview StudentAdminContainer component for Student Admin specs
 * Section containing 3 data cards with weekly statistics charts
 */

/**
 * Creates a stacked bar chart matching Figma design exactly
 * @param {Object} options - Chart configuration
 * @param {Array<Object>} options.data - Array of data points with segments (each segment has height in px)
 * @param {Array<string>} options.dates - Array of date labels
 * @param {Array<Object>} options.segments - Array of segment configs with color and label
 * @returns {HTMLElement} Chart element
 */
function createStackedBarChart({ data, dates, segments }) {
    const chartContainer = document.createElement('div');
    chartContainer.style.display = 'flex';
    chartContainer.style.gap = 'var(--size-element-gap-sm)';
    chartContainer.style.width = '100%';
    chartContainer.style.height = '207.205px';
    chartContainer.style.position = 'relative';

    // Y-axis labels container
    const yAxisContainer = document.createElement('div');
    yAxisContainer.style.display = 'flex';
    yAxisContainer.style.flexDirection = 'column';
    yAxisContainer.style.height = '207.205px';
    yAxisContainer.style.alignItems = 'flex-end';
    yAxisContainer.style.justifyContent = 'space-between';
    yAxisContainer.style.width = '32.913px';
    yAxisContainer.style.flexShrink = '0';

    const yLabels = ['100%', '75%', '50%', '25%', '0%'];
    yLabels.forEach(label => {
        const yLabel = document.createElement('div');
        yLabel.style.fontFamily = 'var(--font-family-body)';
        yLabel.style.fontSize = 'var(--font-size-body3)';
        yLabel.style.fontWeight = 'var(--font-weight-normal)';
        yLabel.style.lineHeight = '1.667';
        yLabel.style.color = 'var(--color-on-surface)';
        yLabel.style.textAlign = 'right';
        yLabel.style.width = '34px';
        yLabel.textContent = label;
        yAxisContainer.appendChild(yLabel);
    });

    chartContainer.appendChild(yAxisContainer);

    // Main chart area - using grid layout like Figma
    const chartArea = document.createElement('div');
    chartArea.style.display = 'grid';
    chartArea.style.gridTemplateColumns = 'max-content';
    chartArea.style.gridTemplateRows = 'max-content';
    chartArea.style.flex = '1';
    chartArea.style.position = 'relative';
    chartArea.style.height = '207.205px';
    chartArea.style.placeItems = 'start';

    // Vertical grid line (Y-axis line) - rotated SVG image placeholder
    const yAxisLine = document.createElement('div');
    yAxisLine.style.position = 'absolute';
    yAxisLine.style.left = '0';
    yAxisLine.style.top = '0';
    yAxisLine.style.width = '0';
    yAxisLine.style.height = '207.156px';
    yAxisLine.style.display = 'flex';
    yAxisLine.style.alignItems = 'center';
    yAxisLine.style.justifyContent = 'center';
    // Note: In Figma this is a rotated SVG line, we'll use a simple div with border
    const yAxisLineInner = document.createElement('div');
    yAxisLineInner.style.width = '207.156px';
    yAxisLineInner.style.height = '1px';
    yAxisLineInner.style.backgroundColor = 'var(--color-outline-variant)';
    yAxisLineInner.style.opacity = '0.2';
    yAxisLineInner.style.transform = 'rotate(90deg)';
    yAxisLineInner.style.transformOrigin = 'left center';
    yAxisLine.appendChild(yAxisLineInner);
    chartArea.appendChild(yAxisLine);

    // Horizontal grid line (X-axis line)
    const xAxisLine = document.createElement('div');
    xAxisLine.style.position = 'absolute';
    xAxisLine.style.left = '0';
    xAxisLine.style.top = '207.2px';
    xAxisLine.style.width = '353.944px';
    xAxisLine.style.height = '1px';
    xAxisLine.style.backgroundColor = 'var(--color-outline-variant)';
    xAxisLine.style.opacity = '0.2';
    chartArea.appendChild(xAxisLine);

    // Additional horizontal grid lines
    for (let i = 1; i < 5; i++) {
        const gridLine = document.createElement('div');
        gridLine.style.position = 'absolute';
        gridLine.style.left = '0';
        gridLine.style.width = '353.944px';
        gridLine.style.height = '1px';
        gridLine.style.backgroundColor = 'var(--color-outline-variant)';
        gridLine.style.opacity = '0.2';
        gridLine.style.top = `${(i * 207.205) / 4}px`;
        chartArea.appendChild(gridLine);
    }

    // Bars container - positioned absolutely
    const barsContainer = document.createElement('div');
    barsContainer.style.position = 'absolute';
    barsContainer.style.left = '13.96px';
    barsContainer.style.top = '7px';
    barsContainer.style.display = 'flex';
    barsContainer.style.alignItems = 'flex-end';
    barsContainer.style.justifyContent = 'space-between';
    barsContainer.style.height = '198.228px';
    barsContainer.style.width = '339.987px';

    // Create bars for each date - matching Figma structure exactly
    data.forEach((barData, index) => {
        const barColumn = document.createElement('div');
        barColumn.style.display = 'flex';
        barColumn.style.flexDirection = 'column';
        barColumn.style.alignItems = 'center';
        barColumn.style.justifyContent = 'center';
        barColumn.style.width = '33.661px';
        barColumn.style.height = '198.228px';
        barColumn.style.position = 'relative';
        barColumn.style.padding = `0 7.48px`;
        barColumn.style.paddingBottom = barData.paddingBottom || '0';
        barColumn.style.paddingTop = barData.paddingTop || '0';

        // Stacked bars container - absolute positioned at top-left
        const barsStack = document.createElement('div');
        barsStack.style.position = 'absolute';
        barsStack.style.left = '0';
        barsStack.style.top = '0';
        barsStack.style.width = '33.661px';
        barsStack.style.height = '198.228px';
        barsStack.style.display = 'flex';
        barsStack.style.flexDirection = 'column';
        barsStack.style.alignItems = 'flex-start';

        // Calculate top position for stacking (bars stack from top, first segment at top)
        let topPosition = 0;

        // Create stacked segments (top to bottom) - reverse order so first segment is on top
        // Reverse the segments array to match Figma visual order (top segment first)
        const reversedSegments = [...barData.segments].reverse();

        reversedSegments.forEach((segment, segIndex) => {
            const segmentBar = document.createElement('div');
            segmentBar.style.position = 'absolute';
            segmentBar.style.left = '0';
            segmentBar.style.top = `${topPosition}px`;
            segmentBar.style.width = '100%';
            segmentBar.style.height = `${segment.height}px`; // Use exact pixel height from Figma
            segmentBar.style.backgroundColor = segment.color;
            segmentBar.style.borderRadius = segment.borderRadius || '4.065px';
            barsStack.appendChild(segmentBar);
            
            // Position value label within this segment
            const valueLabel = document.createElement('div');
            valueLabel.style.position = 'absolute';
            valueLabel.style.left = '7.48px';
            valueLabel.style.right = '7.48px';
            valueLabel.style.top = `${topPosition}px`;
            valueLabel.style.height = `${segment.height}px`;
            valueLabel.style.display = 'flex';
            valueLabel.style.alignItems = 'center';
            valueLabel.style.justifyContent = 'center';
            valueLabel.style.fontFamily = 'var(--font-family-body)';
            valueLabel.style.fontSize = 'var(--font-size-body2)';
            valueLabel.style.fontWeight = 'var(--font-weight-normal)';
            valueLabel.style.lineHeight = '1.571';
            valueLabel.style.color = segment.textColor;
            valueLabel.style.textAlign = 'center';
            valueLabel.style.whiteSpace = 'nowrap';
            valueLabel.style.pointerEvents = 'none';
            valueLabel.textContent = segment.value.toString();
            barsStack.appendChild(valueLabel);
            
            topPosition += segment.height;
        });

        barColumn.appendChild(barsStack);
        barsContainer.appendChild(barColumn);
    });

    chartArea.appendChild(barsContainer);

    // X-axis dates - positioned absolutely
    const xAxisContainer = document.createElement('div');
    xAxisContainer.style.position = 'absolute';
    xAxisContainer.style.left = '13.96px';
    xAxisContainer.style.top = '207px';
    xAxisContainer.style.display = 'flex';
    xAxisContainer.style.gap = 'var(--size-element-gap-md)';
    xAxisContainer.style.alignItems = 'center';
    xAxisContainer.style.width = '339.987px';

    dates.forEach(date => {
        const dateLabel = document.createElement('div');
        dateLabel.style.fontFamily = 'var(--font-family-body)';
        dateLabel.style.fontSize = 'var(--font-size-body3)';
        dateLabel.style.fontWeight = 'var(--font-weight-normal)';
        dateLabel.style.lineHeight = '1.667';
        dateLabel.style.color = 'var(--color-on-surface)';
        dateLabel.style.textAlign = 'right';
        dateLabel.style.whiteSpace = 'nowrap';
        dateLabel.textContent = date;
        xAxisContainer.appendChild(dateLabel);
    });

    chartArea.appendChild(xAxisContainer);
    chartContainer.appendChild(chartArea);

    return chartContainer;
}

/**
 * Creates a Student Admin Container section component
 * @returns {HTMLElement} Section element
 */
export function createStudentAdminContainer() {
    const section = document.createElement('div');
    section.style.display = 'flex';
    section.style.gap = 'var(--size-section-gap-sm)';
    section.style.alignItems = 'flex-start';
    section.style.width = '100%';
    section.style.minWidth = '1500px';
    section.style.flexWrap = 'wrap';

    // Helper to create a data card with chart
    const createDataCard = ({
        title,
        tooltip,
        chartData,
        dates,
        legend
    }) => {
        const card = document.createElement('div');
        card.style.backgroundColor = 'var(--color-surface-container-lowest)';
        card.style.borderRadius = '8px';
        card.style.padding = 'var(--size-card-pad-y-lg) var(--size-card-pad-x-lg)';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = 'var(--size-section-pad-y-md)';
        card.style.width = '445.33px';
        card.style.height = '376px';
        card.style.flexShrink = '0';

        // Header with title and info icon
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.gap = 'var(--size-element-gap-md)';
        header.style.alignItems = 'center';
        header.style.width = '100%';

        const titleEl = document.createElement('div');
        titleEl.style.fontFamily = 'var(--font-family-header)';
        titleEl.style.fontSize = 'var(--font-size-h4)';
        titleEl.style.fontWeight = 'var(--font-weight-semibold-2)';
        titleEl.style.lineHeight = '1.333';
        titleEl.style.color = 'var(--color-on-surface)';
        titleEl.style.whiteSpace = 'nowrap';
        titleEl.textContent = title;
        header.appendChild(titleEl);

        const infoIcon = document.createElement('i');
        infoIcon.className = 'fas fa-circle-info';
        infoIcon.style.fontSize = '14px';
        infoIcon.style.color = 'var(--color-on-surface-state-16)';
        infoIcon.style.flexShrink = '0';
        infoIcon.style.width = '14px';
        infoIcon.title = tooltip;
        header.appendChild(infoIcon);

        card.appendChild(header);

        // Chart container
        const chartContainer = document.createElement('div');
        chartContainer.style.display = 'flex';
        chartContainer.style.flexDirection = 'column';
        chartContainer.style.gap = 'var(--size-card-gap-md)';
        chartContainer.style.height = '266px';
        chartContainer.style.alignItems = 'center';
        chartContainer.style.justifyContent = 'center';
        chartContainer.style.width = '100%';

        // Create stacked bar chart
        const chart = createStackedBarChart({
            data: chartData,
            dates: dates,
            segments: legend
        });
        chartContainer.appendChild(chart);

        // Legend
        const legendContainer = document.createElement('div');
        legendContainer.style.display = 'flex';
        legendContainer.style.gap = 'var(--size-card-gap-sm)';
        legendContainer.style.alignItems = 'center';
        legendContainer.style.justifyContent = title === 'Student Needs Distribution (Weekly)' ? 'flex-start' : 'center';
        legendContainer.style.flexWrap = 'wrap';
        legendContainer.style.width = '100%';

        legend.forEach(tag => {
            const tagWrapper = document.createElement('div');
            tagWrapper.style.display = 'flex';
            tagWrapper.style.gap = 'var(--size-element-gap-sm)';
            tagWrapper.style.alignItems = 'center';

            const tagIcon = document.createElement('div');
            tagIcon.style.backgroundColor = tag.color;
            tagIcon.style.borderRadius = 'var(--size-element-radius-sm)';
            tagIcon.style.width = title === 'Student Needs Distribution (Weekly)' ? '25px' : '20px';
            tagIcon.style.height = title === 'Student Needs Distribution (Weekly)' ? '25px' : '20px';
            tagIcon.style.flexShrink = '0';
            tagWrapper.appendChild(tagIcon);

            const tagText = document.createElement('div');
            tagText.style.fontFamily = 'var(--font-family-body)';
            tagText.style.fontSize = 'var(--font-size-body3)';
            tagText.style.fontWeight = 'var(--font-weight-normal)';
            tagText.style.lineHeight = '1.667';
            tagText.style.color = 'var(--color-on-surface)';
            tagText.style.whiteSpace = 'nowrap';
            tagText.textContent = tag.text;
            tagWrapper.appendChild(tagText);

            legendContainer.appendChild(tagWrapper);
        });
        chartContainer.appendChild(legendContainer);

        card.appendChild(chartContainer);

        return card;
    };

    const dates = ['06/03/24', '06/10/24', '06/17/24', '06/24/24', '07/01/24'];

    // Card 1: Student Needs Distribution (Weekly) - matching Figma exactly
    // Order: Pink (relationship) on top, Purple (mastering-content) on bottom
    const needsCard = createDataCard({
        title: 'Student Needs Distribution (Weekly)',
        tooltip: 'Weekly trend of student need across recent sessions.',
        dates: dates,
        chartData: [
            {
                segments: [
                    { value: 12, height: 118.937, color: 'var(--color-relationship-container)', textColor: 'var(--color-relationship)', borderRadius: 'var(--size-element-radius-sm)' }, // Pink on top
                    { value: 6, height: 79.291, color: 'var(--color-mastering-content-container)', textColor: 'var(--color-mastering-content-text)', borderRadius: 'var(--size-element-radius-sm)' } // Purple on bottom
                ],
                paddingBottom: '25.91px',
                paddingTop: '5.91px',
                valueGap: '70.97px'
            },
            {
                segments: [
                    { value: 16, height: 131.654, color: 'var(--color-relationship-container)', textColor: 'var(--color-relationship)', borderRadius: '4.065px' }, // Pink on top
                    { value: 8, height: 66.575, color: 'var(--color-mastering-content-container)', textColor: 'var(--color-mastering-content-text)', borderRadius: '4.065px' } // Purple on bottom
                ],
                paddingBottom: '38.898px',
                paddingTop: '21.9px',
                valueGap: '74.75px'
            },
            {
                segments: [
                    { value: 12, height: 127.913, color: 'var(--color-relationship-container)', textColor: 'var(--color-relationship)', borderRadius: '4.065px' }, // Pink on top
                    { value: 5, height: 70.315, color: 'var(--color-mastering-content-container)', textColor: 'var(--color-mastering-content-text)', borderRadius: '4.065px' } // Purple on bottom
                ],
                paddingBottom: '46.378px',
                paddingTop: '24.38px',
                valueGap: '76.5px'
            },
            {
                segments: [
                    { value: 12, height: 169.803, color: 'var(--color-relationship-container)', textColor: 'var(--color-relationship)', borderRadius: '4.065px' }, // Pink on top
                    { value: 1, height: 28.425, color: 'var(--color-mastering-content-container)', textColor: 'var(--color-mastering-content-text)', borderRadius: '4.065px' } // Purple on bottom
                ],
                paddingBottom: '0',
                paddingTop: '3.21px',
                valueGap: '66.69px'
            },
            {
                segments: [
                    { value: 12, height: 169.803, color: 'var(--color-relationship-container)', textColor: 'var(--color-relationship)', borderRadius: '4.065px' }, // Pink on top
                    { value: 1, height: 28.425, color: 'var(--color-mastering-content-container)', textColor: 'var(--color-mastering-content-text)', borderRadius: '4.065px' } // Purple on bottom
                ],
                paddingBottom: '0',
                paddingTop: '3.21px',
                valueGap: '66.69px'
            }
        ],
        legend: [
            { text: 'Needs motivation', color: 'var(--color-relationship-container)' },
            { text: 'Needs motivation', color: 'var(--color-mastering-content-container)' },
            { text: 'Other', color: '#807878' }
        ]
    });
    section.appendChild(needsCard);

    // Card 2: Student Attendance (Weekly) - matching Figma exactly
    // Order: Green (success/joined) on top, Red/Pink (danger/didn't join) on bottom
    const attendanceCard = createDataCard({
        title: 'Student Attendance (Weekly)',
        tooltip: 'Weekly trend of student attendance rate across recent sessions.',
        dates: dates,
        chartData: [
            {
                segments: [
                    { value: 12, height: 118.937, color: 'var(--color-success-container)', textColor: 'var(--color-success-text)', borderRadius: '4.085px' }, // Green on top
                    { value: 6, height: 79.291, color: 'var(--color-danger-container)', textColor: 'var(--color-danger-text)', borderRadius: '4.085px' } // Red on bottom
                ],
                paddingBottom: '25.91px',
                paddingTop: '5.91px',
                valueGap: '70.97px'
            },
            {
                segments: [
                    { value: 16, height: 131.654, color: 'var(--color-success-container)', textColor: 'var(--color-success-text)', borderRadius: '4.085px' }, // Green on top
                    { value: 8, height: 66.575, color: 'var(--color-danger-container)', textColor: 'var(--color-danger-text)', borderRadius: '4.085px' } // Red on bottom
                ],
                paddingBottom: '38.898px',
                paddingTop: '21.9px',
                valueGap: '74.75px'
            },
            {
                segments: [
                    { value: 12, height: 127.913, color: 'var(--color-success-container)', textColor: 'var(--color-success-text)', borderRadius: '4.085px' }, // Green on top
                    { value: 5, height: 70.315, color: 'var(--color-danger-container)', textColor: 'var(--color-danger-text)', borderRadius: '4.085px' } // Red on bottom
                ],
                paddingBottom: '46.378px',
                paddingTop: '24.38px',
                valueGap: '76.5px'
            },
            {
                segments: [
                    { value: 12, height: 169.803, color: 'var(--color-success-container)', textColor: 'var(--color-success-text)', borderRadius: '4.085px' }, // Green on top
                    { value: 1, height: 28.425, color: 'var(--color-danger-container)', textColor: 'var(--color-danger-text)', borderRadius: '4.085px' } // Red on bottom
                ],
                paddingBottom: '0',
                paddingTop: '3.21px',
                valueGap: '66.69px'
            },
            {
                segments: [
                    { value: 12, height: 169.803, color: 'var(--color-success-container)', textColor: 'var(--color-success-text)', borderRadius: '4.085px' }, // Green on top
                    { value: 1, height: 28.425, color: 'var(--color-danger-container)', textColor: 'var(--color-danger-text)', borderRadius: '4.085px' } // Red on bottom
                ],
                paddingBottom: '0',
                paddingTop: '3.21px',
                valueGap: '66.69px'
            }
        ],
        legend: [
            { text: 'Joined', color: 'var(--color-success-container)' },
            { text: 'Didn\'t join', color: 'var(--color-danger-container)' },
            { text: 'N/A (Not recorded)', color: 'var(--color-surface-container-highest)' }
        ]
    });
    section.appendChild(attendanceCard);

    // Card 3: Student Engagement (Weekly) - matching Figma exactly
    // Order: Green (success/fully engaged) on top, Red/Pink (danger/not engaged) on bottom
    const engagementCard = createDataCard({
        title: 'Student Engagement (Weekly)',
        tooltip: 'Weekly trend of student engagement rate across recent sessions.',
        dates: dates,
        chartData: [
            {
                segments: [
                    { value: 12, height: 118.937, color: 'var(--color-success-container)', textColor: 'var(--color-success-text)', borderRadius: '4.085px' }, // Green on top
                    { value: 6, height: 79.291, color: 'var(--color-danger-container)', textColor: 'var(--color-danger-text)', borderRadius: '4.085px' } // Red on bottom
                ],
                paddingBottom: '25.91px',
                paddingTop: '5.91px',
                valueGap: '70.97px'
            },
            {
                segments: [
                    { value: 16, height: 131.654, color: 'var(--color-success-container)', textColor: 'var(--color-success-text)', borderRadius: '4.085px' }, // Green on top
                    { value: 8, height: 66.575, color: 'var(--color-danger-container)', textColor: 'var(--color-danger-text)', borderRadius: '4.085px' } // Red on bottom
                ],
                paddingBottom: '38.898px',
                paddingTop: '21.9px',
                valueGap: '74.75px'
            },
            {
                segments: [
                    { value: 12, height: 127.913, color: 'var(--color-success-container)', textColor: 'var(--color-success-text)', borderRadius: '4.085px' }, // Green on top
                    { value: 5, height: 70.315, color: 'var(--color-danger-container)', textColor: 'var(--color-danger-text)', borderRadius: '4.085px' } // Red on bottom
                ],
                paddingBottom: '46.378px',
                paddingTop: '24.38px',
                valueGap: '76.5px'
            },
            {
                segments: [
                    { value: 12, height: 169.803, color: 'var(--color-success-container)', textColor: 'var(--color-success-text)', borderRadius: '4.085px' }, // Green on top
                    { value: 1, height: 28.425, color: 'var(--color-danger-container)', textColor: 'var(--color-danger-text)', borderRadius: '4.085px' } // Red on bottom
                ],
                paddingBottom: '0',
                paddingTop: '3.21px',
                valueGap: '66.69px'
            },
            {
                segments: [
                    { value: 12, height: 169.803, color: 'var(--color-success-container)', textColor: 'var(--color-success-text)', borderRadius: '4.085px' }, // Green on top
                    { value: 1, height: 28.425, color: 'var(--color-danger-container)', textColor: 'var(--color-danger-text)', borderRadius: '4.085px' } // Red on bottom
                ],
                paddingBottom: '0',
                paddingTop: '3.21px',
                valueGap: '66.69px'
            }
        ],
        legend: [
            { text: 'Fully Engaged', color: 'var(--color-success-container)' },
            { text: 'Partially Engaged', color: 'var(--color-warning-container)' },
            { text: 'Not Engaged', color: 'var(--color-danger-container)' },
            { text: 'N/A (Not recorded)', color: 'var(--color-surface-container-highest)' }
        ]
    });
    section.appendChild(engagementCard);

    return section;
}
