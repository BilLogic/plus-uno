/**
 * @fileoverview SessionOverviewSection component for Session Admin specs
 * Section containing 5 data cards with statistics and donut charts
 */

/**
 * Creates a Session Overview Section component with data cards
 * @returns {HTMLElement} Section element
 */
export function createSessionOverviewSection() {
    const section = document.createElement("div");
    section.style.display = "flex";
    section.style.gap = "var(--size-section-gap-sm)";
    section.style.alignItems = "flex-start";
    section.style.minWidth = "2000px";
    section.style.width = "2000px";

    // Create 5 data cards
    const cards = [
        createDataCard({
            title: "Time Allocation by Student Needs",
            tooltip: "Time spent addressing motivation, content or other needs based on session logs.",
            value: "60%",
            valueLabel: "on addressing Motivation Needs",
            tags: [
                { label: "Needs motivation", color: "var(--color-relationship-container)" },
                { label: "Needs content help", color: "var(--color-mastering-content-container)" },
                { label: "Other", color: "#807878" }
            ],
            graphSize: "227.638px"
        }),
        createDataCard({
            title: "Student Attendance",
            tooltip: "Distribution of student attendance statuses recorded by tutors.",
            value: "99%",
            valueLabel: "attended the session",
            tags: [
                { label: "Joined", color: "var(--color-success-container)" },
                { label: "Didn't join", color: "var(--color-danger-container)" },
                { label: "N/A (Not recorded)", color: "var(--color-surface-container-highest)" }
            ],
            graphSize: "228.74px"
        }),
        createDataCard({
            title: "Student Engagement",
            tooltip: "Distribution of engagement levels reported by the tutors among attended students.",
            value: "99%",
            valueLabel: "Present on Zoom",
            tags: [
                { label: "Fully Engaged", color: "var(--color-success-container)" },
                { label: "Partially Engaged", color: "var(--color-warning-container)" },
                { label: "Not Engaged", color: "var(--color-danger-container)" },
                { label: "N/A (Not recorded)", color: "var(--color-surface-container-highest)" }
            ],
            graphSize: "228.74px"
        }),
        createDataCard({
            title: "Tutor Attendance",
            tooltip: "Distribution of tutor attendance statuses.",
            value: "99%",
            valueLabel: "attended the session",
            tags: [
                { label: "Joined", color: "var(--color-success-container)" },
                { label: "Didn't join", color: "var(--color-danger-container)" },
                { label: "N/A (Not recorded)", color: "var(--color-surface-container-highest)" }
            ],
            graphSize: "228.74px"
        }),
        createDataCard({
            title: "Check-in Completion",
            tooltip: "Distribution of attended students who were either marked as goal-checked (in goal-setting schools) or marked as helped (in non-goal-setting schools).",
            value: "99%",
            valueLabel: "Present on Zoom",
            tags: [
                { label: "Marked as checked / helped", color: "var(--color-success-container)" },
                { label: "Not checked / helped", color: "var(--color-danger-container)" }
            ],
            graphSize: "228.74px"
        })
    ];

    cards.forEach((card) => {
        section.appendChild(card);
    });

    return section;
}

/**
 * Creates a data card with donut chart
 * @param {Object} options - Card configuration
 * @param {string} options.title - Card title
 * @param {string} options.tooltip - Tooltip text for info icon
 * @param {string} options.value - Main value (e.g., "60%", "99%")
 * @param {string} options.valueLabel - Label for the value
 * @param {Array<Object>} options.tags - Array of tag objects with label and color
 * @param {string} options.graphSize - Size of the graph (e.g., "227.638px")
 * @returns {HTMLElement} Card element
 */
function createDataCard({ title, tooltip, value, valueLabel, tags, graphSize }) {
    const card = document.createElement("div");
    card.style.backgroundColor = "var(--color-surface-container-lowest)";
    card.style.borderRadius = "var(--size-card-radius-sm)";
    card.style.padding = "var(--size-card-pad-x-lg)";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.gap = "var(--size-card-gap-md)";
    card.style.height = "376px";
    card.style.maxWidth = "444px";
    card.style.minWidth = "275.33px";
    card.style.flex = "1 1 0";
    card.style.boxShadow = "var(--elevation-light-1)";

    // Header
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.gap = "var(--size-element-gap-md)";
    header.style.alignItems = "center";
    header.style.width = "100%";

    const titleEl = document.createElement("div");
    titleEl.style.fontFamily = "var(--font-family-header)";
    titleEl.style.fontSize = "var(--font-size-h4)";
    titleEl.style.fontWeight = "var(--font-weight-semibold)";
    titleEl.style.lineHeight = "1.333";
    titleEl.style.color = "var(--color-on-surface)";
    titleEl.style.whiteSpace = "nowrap";
    titleEl.textContent = title;
    header.appendChild(titleEl);

    const infoIcon = document.createElement("i");
    infoIcon.className = "fas fa-circle-question";
    infoIcon.style.fontSize = "20px";
    infoIcon.style.color = "var(--color-outline-variant)";
    infoIcon.style.flexShrink = "0";
    if (tooltip) {
        infoIcon.title = tooltip;
    }
    header.appendChild(infoIcon);

    card.appendChild(header);

    // Body container
    const bodyContainer = document.createElement("div");
    bodyContainer.style.display = "flex";
    bodyContainer.style.flexDirection = "column";
    bodyContainer.style.gap = "var(--size-card-gap-md)";
    bodyContainer.style.alignItems = "center";
    bodyContainer.style.justifyContent = "center";
    bodyContainer.style.flex = "1";
    bodyContainer.style.width = "100%";

    // Graph container
    const graphContainer = document.createElement("div");
    graphContainer.style.position = "relative";
    graphContainer.style.width = graphSize;
    graphContainer.style.height = graphSize;
    graphContainer.style.display = "flex";
    graphContainer.style.alignItems = "center";
    graphContainer.style.justifyContent = "center";

    // Create SVG graph based on graph size
    const svgGraph = createDonutChartSVG(graphSize);
    svgGraph.style.position = "absolute";
    svgGraph.style.width = "100%";
    svgGraph.style.height = "100%";
    svgGraph.style.top = "0";
    svgGraph.style.left = "0";
    graphContainer.appendChild(svgGraph);

    // Value container (centered on chart)
    const valueContainer = document.createElement("div");
    valueContainer.style.display = "flex";
    valueContainer.style.flexDirection = "column";
    valueContainer.style.alignItems = "center";
    valueContainer.style.justifyContent = "center";
    valueContainer.style.textAlign = "center";
    valueContainer.style.zIndex = "1";
    valueContainer.style.width = title === "Time Allocation by Student Needs" ? "130.079px" : "105.384px";

    const valueEl = document.createElement("div");
    valueEl.style.fontFamily = "var(--font-family-header)";
    valueEl.style.fontSize = title === "Time Allocation by Student Needs" ? "32.52px" : "var(--font-size-h1)";
    valueEl.style.fontWeight = "var(--font-weight-bold)";
    valueEl.style.lineHeight = "1.6";
    valueEl.style.color = "#000000";
    valueEl.textContent = value;
    valueContainer.appendChild(valueEl);

    const valueLabelEl = document.createElement("div");
    valueLabelEl.style.fontFamily = "var(--font-family-body)";
    valueLabelEl.style.fontSize = "var(--font-size-body1)";
    valueLabelEl.style.fontWeight = "var(--font-weight-light)";
    valueLabelEl.style.lineHeight = "1.5";
    valueLabelEl.style.color = "var(--color-on-surface)";
    valueLabelEl.textContent = valueLabel;
    valueContainer.appendChild(valueLabelEl);

    graphContainer.appendChild(valueContainer);
    bodyContainer.appendChild(graphContainer);

    // Tags container
    const tagsContainer = document.createElement("div");
    tagsContainer.style.display = "flex";
    tagsContainer.style.flexWrap = "wrap";
    tagsContainer.style.gap = "var(--size-element-gap-sm)";
    tagsContainer.style.justifyContent = "center";
    tagsContainer.style.alignItems = "center";
    tagsContainer.style.width = "100%";

    tags.forEach((tag) => {
        const tagEl = document.createElement("div");
        tagEl.style.display = "flex";
        tagEl.style.gap = "3.252px";
        tagEl.style.alignItems = "center";

        const tagIcon = document.createElement("div");
        tagIcon.style.width = "20.113px";
        tagIcon.style.height = "20.113px";
        tagIcon.style.borderRadius = "4.065px";
        tagIcon.style.backgroundColor = tag.color;
        tagIcon.style.flexShrink = "0";
        tagEl.appendChild(tagIcon);

        const tagLabel = document.createElement("div");
        tagLabel.style.fontFamily = "var(--font-family-body)";
        tagLabel.style.fontSize = "var(--font-size-body3)";
        tagLabel.style.fontWeight = "var(--font-weight-light)";
        tagLabel.style.lineHeight = "1.667";
        tagLabel.style.color = "var(--color-on-surface)";
        tagLabel.style.whiteSpace = "nowrap";
        tagLabel.textContent = tag.label;
        tagEl.appendChild(tagLabel);

        tagsContainer.appendChild(tagEl);
    });

    bodyContainer.appendChild(tagsContainer);
    card.appendChild(bodyContainer);

    return card;
}

/**
 * Creates a donut chart SVG based on the graph size
 * @param {string} graphSize - Size of the graph (e.g., "227.638px", "228.74px")
 * @returns {HTMLElement} SVG element
 */
function createDonutChartSVG(graphSize) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    
    // Determine which SVG to use based on size
    const isTimeAllocation = graphSize === "227.638px";
    
    if (isTimeAllocation) {
        // First SVG: Time Allocation by Student Needs (228x228)
        svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        svg.setAttribute("width", "228");
        svg.setAttribute("height", "228");
        svg.setAttribute("viewBox", "0 0 228 228");
        svg.setAttribute("fill", "none");
        svg.style.width = "100%";
        svg.style.height = "100%";
        
        // Path 1: Pink segment
        const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path1.setAttribute("d", "M227.638 113.819C227.638 131.781 223.387 149.488 215.232 165.492C207.078 181.496 195.251 195.343 180.72 205.9C166.189 216.458 149.365 223.427 131.624 226.236C113.883 229.046 95.7296 227.618 78.6469 222.067C61.5642 216.517 46.0377 207.002 33.3368 194.301C20.6359 181.6 11.1212 166.074 5.57069 148.991C0.0201886 131.908 -1.40855 113.754 1.4013 96.0137C4.21115 78.273 11.1798 61.4492 21.7375 46.9178L49.3619 66.9881C41.9715 77.1601 37.0935 88.9368 35.1266 101.355C33.1597 113.774 34.1598 126.481 38.0452 138.439C41.9305 150.397 48.5908 161.266 57.4814 170.156C66.3721 179.047 77.2406 185.707 89.1985 189.593C101.156 193.478 113.864 194.478 126.283 192.511C138.701 190.544 150.478 185.666 160.65 178.276C170.822 170.886 179.1 161.193 184.808 149.99C190.516 138.787 193.492 126.392 193.492 113.819H227.638Z");
        path1.setAttribute("fill", "#FFD9E4");
        svg.appendChild(path1);
        
        // Path 2: Purple segment
        const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path2.setAttribute("d", "M180.72 21.7375C195.242 32.288 207.062 46.1235 215.216 62.1141C223.37 78.1048 227.626 95.7972 227.638 113.747L193.492 113.768C193.484 101.204 190.505 88.819 184.797 77.6255C179.089 66.4321 170.815 56.7473 160.65 49.3619L180.72 21.7375Z");
        path2.setAttribute("fill", "#F2DAFF");
        svg.appendChild(path2);
        
        // Path 3: Gray segment
        const path3 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path3.setAttribute("d", "M21.695 46.9763C30.4729 34.8784 41.5477 24.6279 54.2871 16.8101C67.0265 8.99227 81.181 3.7602 95.9424 1.41262C110.704 -0.934961 125.783 -0.352075 140.319 3.128C154.855 6.60807 168.564 12.9172 180.662 21.6951L160.609 49.3322C152.14 43.1877 142.544 38.7713 132.369 36.3353C122.194 33.8992 111.638 33.4912 101.305 35.1345C90.9723 36.7778 81.0642 40.4403 72.1466 45.9127C63.2291 51.3852 55.4767 58.5606 49.3322 67.0291L21.695 46.9763Z");
        path3.setAttribute("fill", "#807878");
        svg.appendChild(path3);
    } else {
        // Second SVG: Other cards (229x229)
        svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        svg.setAttribute("width", "229");
        svg.setAttribute("height", "229");
        svg.setAttribute("viewBox", "0 0 229 229");
        svg.setAttribute("fill", "none");
        svg.style.width = "100%";
        svg.style.height = "100%";
        
        // Path 1: Green segment
        const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path1.setAttribute("d", "M228.74 114.37C228.74 144.392 216.936 173.21 195.875 194.604C174.813 215.999 146.185 228.254 116.167 228.726C86.1485 229.198 57.1488 217.847 35.426 197.125C13.7032 176.402 0.999436 147.969 0.0564345 117.963C-0.886567 87.9557 10.0068 58.7812 30.3856 36.7356C50.7643 14.69 78.9942 1.54118 108.983 0.126964C138.971 -1.28725 168.313 9.14654 190.676 29.1765C213.039 49.2065 226.629 77.2263 228.514 107.189L194.271 109.343C192.952 88.3694 183.438 68.7555 167.784 54.7346C152.13 40.7136 131.591 33.41 110.599 34.3999C89.6069 35.3899 69.846 44.594 55.5809 60.0259C41.3158 75.4578 33.6904 95.88 34.3505 116.885C35.0106 137.89 43.9033 157.793 59.1092 172.298C74.3152 186.804 94.615 194.749 115.628 194.419C136.64 194.089 156.68 185.51 171.423 170.534C186.166 155.558 194.429 135.385 194.429 114.37H228.74Z");
        path1.setAttribute("fill", "#A1EB83");
        svg.appendChild(path1);
        
        // Path 2: Red segment
        const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path2.setAttribute("d", "M228.462 106.392C228.629 108.782 228.721 111.176 228.737 113.572L194.427 113.811C194.415 112.134 194.351 110.458 194.234 108.785L228.462 106.392Z");
        path2.setAttribute("fill", "#FFDAD6");
        svg.appendChild(path2);
    }
    
    return svg;
}


