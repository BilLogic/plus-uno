/**
 * @fileoverview Graphs component for Admin specs
 * Standalone graph visualization component with Pie, Bar, and Line variants
 */

/**
 * Creates a Graphs component
 * @param {Object} options - Graph configuration
 * @param {string} [options.graphType="Pie"] - Graph type: "Pie", "Bar", or "Line"
 * @param {Object} [options.pieData] - Pie chart data
 * @param {string} [options.pieData.percentage="00%"] - Percentage value to display
 * @param {string} [options.pieData.label="ABC"] - Label text below percentage
 * @param {number} [options.pieData.abcValue=0] - ABC value (0-100)
 * @param {number} [options.pieData.xyzValue=0] - XYZ value (0-100)
 * @param {Object} [options.barData] - Bar chart data
 * @param {Array<Object>} [options.barData.dataPoints] - Array of data points: [{date: string, abc: number, xyz: number}]
 * @param {Array<string>} [options.barData.dates] - Array of date labels
 * @param {Object} [options.lineData] - Line chart data
 * @param {Array<string>} [options.lineData.dates] - Array of date labels
 * @returns {HTMLElement} Graph element
 */
export function createGraphs({
    graphType = "Pie",
    pieData = null,
    barData = null,
    lineData = null
} = {}) {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "var(--size-card-gap-md)";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";
    container.style.padding = "var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)";
    container.style.height = "266px";
    container.style.width = "508px";

    if (graphType === "Pie") {
        const pieChart = createPieChart(pieData);
        container.appendChild(pieChart);
    } else if (graphType === "Bar") {
        const barChart = createBarChart(barData);
        container.appendChild(barChart);
    } else if (graphType === "Line") {
        const lineChart = createLineChart(lineData);
        container.appendChild(lineChart);
    }

    return container;
}

/**
 * Creates a pie chart
 * @param {Object} [data] - Pie chart data
 * @param {string} [data.percentage="00%"] - Percentage value to display
 * @param {string} [data.label="ABC"] - Label text below percentage
 * @param {number} [data.abcValue=0] - ABC value (0-100)
 * @param {number} [data.xyzValue=0] - XYZ value (0-100)
 */
function createPieChart(data = null) {
    const pieData = data || {
        percentage: "00%",
        label: "ABC",
        abcValue: 90, // Default: mostly ABC
        xyzValue: 10  // Default: small XYZ segment
    };

    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "var(--size-card-gap-md)";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";
    container.style.width = "221px";
    container.style.height = "266px";

    const chartArea = document.createElement("div");
    chartArea.style.width = "227px";
    chartArea.style.height = "227px";
    chartArea.style.position = "relative";
    chartArea.style.display = "flex";
    chartArea.style.alignItems = "center";
    chartArea.style.justifyContent = "center";

    // Calculate donut chart segments based on values
    const total = pieData.abcValue + pieData.xyzValue;
    const abcPercentage = total > 0 ? (pieData.abcValue / total) * 100 : 100;
    const xyzPercentage = total > 0 ? (pieData.xyzValue / total) * 100 : 0;

    // Create SVG for donut chart
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "227");
    svg.setAttribute("height", "227");
    svg.setAttribute("viewBox", "0 0 227 227");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";

    // Calculate angles for donut segments
    const radius = 93.5; // (227 - 40) / 2
    const centerX = 113.5;
    const centerY = 113.5;
    const innerRadius = 53.5; // radius - 40

    // ABC segment (primary-container color) - always show, even if 0%
    const abcStartAngle = -90; // Start from top
    const abcEndAngle = -90 + (abcPercentage / 100) * 360;
    const abcPath = createDonutSegment(centerX, centerY, radius, innerRadius, abcStartAngle, abcEndAngle);
    const abcPathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    abcPathEl.setAttribute("d", abcPath);
    abcPathEl.setAttribute("fill", "var(--color-primary-container)");
    svg.appendChild(abcPathEl);

    // XYZ segment (tertiary-container color) - only show if > 0
    if (xyzPercentage > 0) {
        const xyzStartAngle = -90 + (abcPercentage / 100) * 360;
        const xyzEndAngle = -90 + 360;
        const xyzPath = createDonutSegment(centerX, centerY, radius, innerRadius, xyzStartAngle, xyzEndAngle);
        const xyzPathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
        xyzPathEl.setAttribute("d", xyzPath);
        xyzPathEl.setAttribute("fill", "var(--color-tertiary-container)");
        svg.appendChild(xyzPathEl);
    }

    chartArea.appendChild(svg);

    const centerText = document.createElement("div");
    centerText.style.display = "flex";
    centerText.style.flexDirection = "column";
    centerText.style.alignItems = "center";
    centerText.style.gap = "var(--size-element-gap-xs)";
    centerText.style.position = "relative";
    centerText.style.zIndex = "1";

    const percentage = document.createElement("div");
    percentage.style.fontFamily = "var(--font-family-header)";
    percentage.style.fontSize = "var(--font-size-h1)";
    percentage.style.fontWeight = "var(--font-weight-bold)";
    percentage.style.lineHeight = "1.6";
    percentage.style.color = "var(--color-on-surface)";
    percentage.style.textAlign = "center";
    percentage.textContent = pieData.percentage;
    centerText.appendChild(percentage);

    const label = document.createElement("div");
    label.style.fontFamily = "var(--font-family-body)";
    label.style.fontSize = "var(--font-size-body1)";
    label.style.fontWeight = "var(--font-weight-normal)";
    label.style.lineHeight = "1.5";
    label.style.color = "var(--color-on-surface)";
    label.textContent = pieData.label;
    centerText.appendChild(label);

    chartArea.appendChild(centerText);
    container.appendChild(chartArea);

    // Legend
    const legend = createLegend(["ABC", "XYZ"]);
    container.appendChild(legend);

    return container;
}

/**
 * Creates a donut segment path
 */
function createDonutSegment(cx, cy, outerRadius, innerRadius, startAngle, endAngle) {
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = cx + outerRadius * Math.cos(startAngleRad);
    const y1 = cy + outerRadius * Math.sin(startAngleRad);
    const x2 = cx + outerRadius * Math.cos(endAngleRad);
    const y2 = cy + outerRadius * Math.sin(endAngleRad);
    const x3 = cx + innerRadius * Math.cos(endAngleRad);
    const y3 = cy + innerRadius * Math.sin(endAngleRad);
    const x4 = cx + innerRadius * Math.cos(startAngleRad);
    const y4 = cy + innerRadius * Math.sin(startAngleRad);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
}

/**
 * Creates a bar chart
 * @param {Object} [data] - Bar chart data
 * @param {Array<Object>} [data.dataPoints] - Array of data points: [{date: string, abc: number, xyz: number}]
 * @param {Array<string>} [data.dates] - Array of date labels
 */
function createBarChart(data = null) {
    const barData = data || {
        dataPoints: [
            { date: "10/11", abc: 12, xyz: 6 },
            { date: "10/12", abc: 16, xyz: 8 },
            { date: "10/13", abc: 12, xyz: 5 },
            { date: "10/17", abc: 12, xyz: 1 },
            { date: "10/18", abc: 12, xyz: 2 },
            { date: "10/19", abc: 20, xyz: 9 }
        ],
        dates: ["10/11", "10/12", "10/13", "10/17", "10/18", "10/19"]
    };

    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "var(--size-card-gap-md)";
    container.style.width = "100%";
    container.style.height = "266px";

    const graphArea = document.createElement("div");
    graphArea.style.display = "flex";
    graphArea.style.gap = "10.472px";
    graphArea.style.alignItems = "center";
    graphArea.style.justifyContent = "center";
    graphArea.style.height = "225px";
    graphArea.style.width = "100%";

    // Y-axis labels
    const yAxis = document.createElement("div");
    yAxis.style.display = "flex";
    yAxis.style.flexDirection = "column";
    yAxis.style.justifyContent = "space-between";
    yAxis.style.height = "207.205px";
    yAxis.style.width = "32.913px";
    yAxis.style.fontFamily = "var(--font-family-body)";
    yAxis.style.fontSize = "var(--font-size-body3)";
    yAxis.style.fontWeight = "var(--font-weight-normal)";
    yAxis.style.lineHeight = "1.667";
    yAxis.style.color = "var(--color-on-surface)";
    yAxis.style.textAlign = "right";

    ["100%", "75%", "50%", "25%", "0%"].forEach(label => {
        const labelEl = document.createElement("div");
        labelEl.textContent = label;
        yAxis.appendChild(labelEl);
    });

    graphArea.appendChild(yAxis);

    // Chart area with bars
    const chartArea = document.createElement("div");
    chartArea.style.display = "flex";
    chartArea.style.gap = "20px"; // Fixed spacing for chart bars
    chartArea.style.alignItems = "flex-end";
    chartArea.style.flex = "1";
    chartArea.style.height = "207.156px";
    chartArea.style.position = "relative";

    // Find max value for scaling
    const maxValue = Math.max(...barData.dataPoints.map(d => d.abc + d.xyz), 24);

    barData.dataPoints.forEach((dataPoint, index) => {
        const abcValue = dataPoint.abc || 0;
        const xyzValue = dataPoint.xyz || 0;

        const barGroup = document.createElement("div");
        barGroup.style.display = "flex";
        barGroup.style.flexDirection = "column";
        barGroup.style.gap = "0";
        barGroup.style.width = "33.661px";
        barGroup.style.height = "198.228px";
        barGroup.style.position = "relative";
        barGroup.style.alignItems = "center";
        barGroup.style.justifyContent = "flex-end";

        // Calculate bar heights (scale to 198px max height)
        const abcHeight = (abcValue / maxValue) * 198.228;
        const xyzHeight = (xyzValue / maxValue) * 198.228;

        // XYZ bar (top, lighter teal)
        const xyzBar = document.createElement("div");
        xyzBar.style.backgroundColor = "var(--color-tertiary-container)";
        xyzBar.style.height = `${xyzHeight}px`;
        xyzBar.style.width = "100%";
        xyzBar.style.position = "absolute";
        xyzBar.style.bottom = `${abcHeight}px`;
        xyzBar.style.left = "0";
        barGroup.appendChild(xyzBar);

        // ABC bar (bottom, darker teal)
        const abcBar = document.createElement("div");
        abcBar.style.backgroundColor = "var(--color-primary-container)";
        abcBar.style.height = `${abcHeight}px`;
        abcBar.style.width = "100%";
        abcBar.style.position = "absolute";
        abcBar.style.bottom = "0";
        abcBar.style.left = "0";
        barGroup.appendChild(abcBar);

        // Value labels
        const xyzLabel = document.createElement("div");
        xyzLabel.style.fontFamily = "var(--font-family-body)";
        xyzLabel.style.fontSize = "var(--font-size-body2)";
        xyzLabel.style.fontWeight = "var(--font-weight-normal)";
        xyzLabel.style.lineHeight = "1.571";
        xyzLabel.style.color = "white";
        xyzLabel.style.textAlign = "center";
        xyzLabel.style.position = "absolute";
        xyzLabel.style.bottom = `${abcHeight + xyzHeight / 2}px`;
        xyzLabel.style.width = "100%";
        xyzLabel.textContent = xyzValue.toString();
        barGroup.appendChild(xyzLabel);

        const abcLabel = document.createElement("div");
        abcLabel.style.fontFamily = "var(--font-family-body)";
        abcLabel.style.fontSize = "var(--font-size-body2)";
        abcLabel.style.fontWeight = "var(--font-weight-normal)";
        abcLabel.style.lineHeight = "1.571";
        abcLabel.style.color = "white";
        abcLabel.style.textAlign = "center";
        abcLabel.style.position = "absolute";
        abcLabel.style.bottom = `${abcHeight / 2}px`;
        abcLabel.style.width = "100%";
        abcLabel.textContent = abcValue.toString();
        barGroup.appendChild(abcLabel);

        chartArea.appendChild(barGroup);
    });

    graphArea.appendChild(chartArea);

    // X-axis labels
    const xAxis = document.createElement("div");
    xAxis.style.display = "flex";
    xAxis.style.gap = "20px"; // Fixed spacing for chart dates
    xAxis.style.justifyContent = "center";
    xAxis.style.fontFamily = "var(--font-family-body)";
    xAxis.style.fontSize = "var(--font-size-body3)";
    xAxis.style.fontWeight = "var(--font-weight-normal)";
    xAxis.style.lineHeight = "1.667";
    xAxis.style.color = "var(--color-on-surface)";
    xAxis.style.textAlign = "right";
    xAxis.style.marginLeft = "17.06px";
    xAxis.style.width = "352.522px";

    barData.dates.forEach(date => {
        const dateEl = document.createElement("div");
        dateEl.style.flex = "1 0 0";
        dateEl.textContent = date;
        xAxis.appendChild(dateEl);
    });

    container.appendChild(graphArea);
    container.appendChild(xAxis);

    // Legend
    const legend = createLegend(["ABC", "XYZ"]);
    container.appendChild(legend);

    return container;
}

/**
 * Creates a line chart
 * @param {Object} [data] - Line chart data
 * @param {Array<string>} [data.dates] - Array of date labels
 */
function createLineChart(data = null) {
    const lineData = data || {
        dates: ["06/03/24", "06/10/24", "06/17/24", "06/24/24", "07/01/24"]
    };

    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";
    container.style.width = "100%";
    container.style.height = "266px";

    // Graph wrapper
    const graphWrapper = document.createElement("div");
    graphWrapper.style.display = "flex";
    graphWrapper.style.flexDirection = "column";
    graphWrapper.style.gap = "10px";
    graphWrapper.style.alignItems = "center";
    graphWrapper.style.justifyContent = "center";
    graphWrapper.style.width = "100%";
    graphWrapper.style.position = "relative";

    // Main graph area
    const graphArea = document.createElement("div");
    graphArea.style.display = "flex";
    graphArea.style.gap = "var(--size-element-gap-sm)"; // 8px
    graphArea.style.alignItems = "flex-start";
    graphArea.style.height = "226.193px";
    graphArea.style.width = "100%";
    graphArea.style.position = "relative";

    // Y-axis labels
    const yAxis = document.createElement("div");
    yAxis.style.display = "flex";
    yAxis.style.flexDirection = "column";
    yAxis.style.justifyContent = "space-between";
    yAxis.style.height = "207.205px";
    yAxis.style.width = "32.913px";
    yAxis.style.fontFamily = "var(--font-family-body)";
    yAxis.style.fontSize = "var(--font-size-body3)";
    yAxis.style.fontWeight = "var(--font-weight-normal)";
    yAxis.style.lineHeight = "1.667";
    yAxis.style.color = "var(--color-on-surface)";
    yAxis.style.textAlign = "right";

    ["100%", "75%", "50%", "25%", "0%"].forEach(label => {
        const labelEl = document.createElement("div");
        labelEl.style.display = "flex";
        labelEl.style.flexDirection = "column";
        labelEl.style.flex = "1 0 0";
        labelEl.style.justifyContent = "center";
        labelEl.textContent = label;
        yAxis.appendChild(labelEl);
    });

    graphArea.appendChild(yAxis);

    // Main chart area with grid layout
    const mainChartArea = document.createElement("div");
    mainChartArea.style.display = "grid";
    mainChartArea.style.gridTemplateColumns = "max-content";
    mainChartArea.style.gridTemplateRows = "max-content";
    mainChartArea.style.placeItems = "start";
    mainChartArea.style.position = "relative";
    mainChartArea.style.flex = "1";
    mainChartArea.style.height = "207.205px";

    // Y-axis line (vertical, rotated 90deg)
    const yAxisLineContainer = document.createElement("div");
    yAxisLineContainer.style.gridArea = "1 / 1";
    yAxisLineContainer.style.display = "flex";
    yAxisLineContainer.style.height = "206.148px";
    yAxisLineContainer.style.alignItems = "center";
    yAxisLineContainer.style.justifyContent = "center";
    yAxisLineContainer.style.marginLeft = "0.33px";
    yAxisLineContainer.style.marginTop = "0";
    yAxisLineContainer.style.width = "0";
    yAxisLineContainer.style.position = "relative";

    const yAxisLineRotated = document.createElement("div");
    yAxisLineRotated.style.transform = "rotate(90deg)";
    yAxisLineRotated.style.width = "206.148px";
    yAxisLineRotated.style.height = "0";

    const yAxisLine = document.createElement("div");
    yAxisLine.style.width = "100%";
    yAxisLine.style.height = "1.49px";
    yAxisLine.style.backgroundColor = "var(--color-outline-variant)";
    yAxisLineRotated.appendChild(yAxisLine);
    yAxisLineContainer.appendChild(yAxisLineRotated);
    mainChartArea.appendChild(yAxisLineContainer);

    // X-axis line with dates
    const xAxisContainer = document.createElement("div");
    xAxisContainer.style.gridArea = "1 / 1";
    xAxisContainer.style.display = "flex";
    xAxisContainer.style.flexDirection = "column";
    xAxisContainer.style.alignItems = "flex-start";
    xAxisContainer.style.marginLeft = "0";
    xAxisContainer.style.marginTop = "206.19px";
    xAxisContainer.style.width = "362.372px";
    xAxisContainer.style.position = "relative";

    // X-axis horizontal line
    const xAxisLine = document.createElement("div");
    xAxisLine.style.width = "100%";
    xAxisLine.style.height = "1.49px";
    xAxisLine.style.backgroundColor = "var(--color-outline-variant)";
    xAxisLine.style.position = "relative";
    xAxisLine.style.top = "-1.49px";
    xAxisContainer.appendChild(xAxisLine);

    // X-axis date labels
    const xAxisDates = document.createElement("div");
    xAxisDates.style.display = "flex";
    xAxisDates.style.gap = "20.843px";
    xAxisDates.style.alignItems = "center";
    xAxisDates.style.width = "100%";
    xAxisDates.style.fontFamily = "var(--font-family-body)";
    xAxisDates.style.fontSize = "var(--font-size-body3)";
    xAxisDates.style.fontWeight = "var(--font-weight-light)";
    xAxisDates.style.lineHeight = "1.667";
    xAxisDates.style.color = "var(--color-on-surface)";
    xAxisDates.style.whiteSpace = "nowrap";
    xAxisDates.style.textAlign = "right";

    lineData.dates.forEach(date => {
        const dateEl = document.createElement("div");
        dateEl.style.display = "flex";
        dateEl.style.flexDirection = "column";
        dateEl.style.justifyContent = "center";
        dateEl.style.flexShrink = "0";
        dateEl.textContent = date;
        xAxisDates.appendChild(dateEl);
    });

    xAxisContainer.appendChild(xAxisDates);
    mainChartArea.appendChild(xAxisContainer);

    // XYZ line (tertiary-container color, lighter teal) - positioned absolutely
    const xyzLineContainer = document.createElement("div");
    xyzLineContainer.style.position = "absolute";
    xyzLineContainer.style.left = "60px";
    xyzLineContainer.style.top = "62px";
    xyzLineContainer.style.width = "302.809px";
    xyzLineContainer.style.height = "115.381px";

    const svgXYZ = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgXYZ.setAttribute("width", "305");
    svgXYZ.setAttribute("height", "118");
    svgXYZ.setAttribute("viewBox", "0 0 305 118");
    svgXYZ.setAttribute("fill", "none");
    svgXYZ.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgXYZ.style.width = "100%";
    svgXYZ.style.height = "100%";

    const xyzLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    xyzLine.setAttribute("d", "M0.744141 116.385L76.4464 48.9312L152.149 1.00391L227.851 105.734L303.553 50.7063");
    xyzLine.setAttribute("stroke", "#85ECD5"); // tertiary-container color
    xyzLine.setAttribute("stroke-width", "1.48878");
    xyzLine.setAttribute("stroke-linecap", "round");
    xyzLine.setAttribute("fill", "none");
    svgXYZ.appendChild(xyzLine);
    xyzLineContainer.appendChild(svgXYZ);
    mainChartArea.appendChild(xyzLineContainer);

    // ABC line (primary color, darker blue) - positioned absolutely
    const abcLineContainer = document.createElement("div");
    abcLineContainer.style.position = "absolute";
    abcLineContainer.style.left = "59px";
    abcLineContainer.style.top = "83px";
    abcLineContainer.style.width = "302.809px";
    abcLineContainer.style.height = "96.771px";

    const svgABC = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgABC.setAttribute("width", "305");
    svgABC.setAttribute("height", "118");
    svgABC.setAttribute("viewBox", "0 0 305 118");
    svgABC.setAttribute("fill", "none");
    svgABC.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgABC.style.width = "100%";
    svgABC.style.height = "100%";

    const abcLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    abcLine.setAttribute("d", "M0.744141 116.385L76.4464 48.9312L152.149 1.00391L227.851 105.734L303.553 50.7063");
    abcLine.setAttribute("stroke", "#0472a8"); // primary color
    abcLine.setAttribute("stroke-width", "1.48878");
    abcLine.setAttribute("stroke-linecap", "round");
    abcLine.setAttribute("fill", "none");
    svgABC.appendChild(abcLine);
    abcLineContainer.appendChild(svgABC);
    mainChartArea.appendChild(abcLineContainer);

    graphArea.appendChild(mainChartArea);
    graphWrapper.appendChild(graphArea);
    container.appendChild(graphWrapper);

    // Legend
    const legend = createLegend(["ABC", "XYZ"]);
    container.appendChild(legend);

    return container;
}

/**
 * Creates a legend
 * @param {Array<string>} labels - Array of legend labels (e.g., ["ABC", "XYZ"])
 */
function createLegend(labels) {
    const legend = document.createElement("div");
    legend.style.display = "flex";
    legend.style.gap = "24px"; // Figma: var(--space-500,24px) - no semantic token available for 24px
    legend.style.alignItems = "center";
    legend.style.justifyContent = "center";

    // Map labels to colors: ABC = primary, XYZ = tertiary-container
    const colorMap = {
        "ABC": "var(--color-primary)", // #0472a8
        "XYZ": "var(--color-tertiary-container)" // #85ECD5
    };

    labels.forEach((label) => {
        const legendItem = document.createElement("div");
        legendItem.style.display = "flex";
        legendItem.style.gap = "var(--size-element-gap-xs)"; // 4px spacing for legend icon-text
        legendItem.style.alignItems = "center";

        const colorBox = document.createElement("div");
        colorBox.style.width = "25px";
        colorBox.style.height = "25px";
        colorBox.style.backgroundColor = colorMap[label] || "var(--color-primary-container)";
        colorBox.style.borderRadius = "5px";
        legendItem.appendChild(colorBox);

        const labelText = document.createElement("div");
        labelText.style.fontFamily = "var(--font-family-body)";
        labelText.style.fontSize = "var(--font-size-body3)";
        labelText.style.fontWeight = "var(--font-weight-normal)";
        labelText.style.lineHeight = "1.667";
        labelText.style.color = "var(--color-on-surface)";
        labelText.style.whiteSpace = "nowrap";
        labelText.textContent = label;
        legendItem.appendChild(labelText);

        legend.appendChild(legendItem);
    });

    return legend;
}

