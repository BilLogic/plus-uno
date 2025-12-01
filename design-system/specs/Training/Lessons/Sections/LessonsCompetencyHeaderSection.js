/**
 * @fileoverview LessonsCompetencyHeaderSection component for Training Lessons specs
 * Section with "Students Overview" title and horizontal scrollable cards
 * Matches Figma design system specifications exactly (node-id=63-178172)
 */

/**
 * Creates a LessonsCompetencyHeaderSection component
 * @param {Object} options - Section configuration
 * @param {Object} [options.studentNeed] - Student need data { competencyArea: string, count: number, total: number }
 * @param {Object} [options.status] - Status data { percentage: number, status: string }
 * @param {Object} [options.effort] - Effort data { completed: number, total: number, percentage: number }
 * @param {Object} [options.progress] - Progress data { completed: number, total: number, percentage: number }
 * @returns {HTMLElement} Section element
 */
export function createLessonsCompetencyHeaderSection({
    studentNeed = { competencyArea: 'relationships', count: 3, total: 3 },
    status = { percentage: 37.5, status: 'outstanding' },
    effort = { completed: 2, total: 10, percentage: 20 },
    progress = { completed: 2, total: 10, percentage: 20 }
} = {}) {
    // Section container - Figma: bg-[var(--neutral-colors/surface-container/surface-container-low,#f3f3f6)], w-[1112px], px-[var(--section/pad-x-md,24px)] py-[var(--section/pad-y-md,24px)], rounded-[var(--section/radius-sm,8px)], gap-[var(--section/gap-md,16px)]
    const section = document.createElement('div');
    section.style.backgroundColor = 'var(--color-surface-container-low)';
    section.style.boxSizing = 'border-box';
    section.style.display = 'flex';
    section.style.flexDirection = 'column';
    section.style.gap = 'var(--size-section-gap-md)';
    section.style.alignItems = 'flex-start';
    section.style.justifyContent = 'center';
    section.style.overflow = 'hidden';
    section.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    section.style.position = 'relative';
    section.style.borderRadius = 'var(--size-section-radius-sm)';
    section.style.maxWidth = '1112px';
    section.style.width = '100%';

    // Title + Cards container - Figma: gap-[var(--legacy/spacing/spacer-3-(base),16px)]
    const titleCardsContainer = document.createElement('div');
    titleCardsContainer.style.display = 'flex';
    titleCardsContainer.style.flexDirection = 'column';
    titleCardsContainer.style.gap = 'var(--size-section-gap-md)'; // 16px
    titleCardsContainer.style.alignItems = 'flex-start';
    titleCardsContainer.style.position = 'relative';
    titleCardsContainer.style.flexShrink = '0';
    titleCardsContainer.style.width = '100%';

    // Title - Figma: font-['Lato:SemiBold'], text-[24px], leading-[1.333]
    const title = document.createElement('p');
    title.style.fontFamily = 'var(--font-family-header)';
    title.style.fontSize = 'var(--font-size-h4)';
    title.style.fontWeight = 'var(--font-weight-semibold-2)';
    title.style.lineHeight = '1.333';
    title.style.fontStyle = 'normal';
    title.style.position = 'relative';
    title.style.flexShrink = '0';
    title.style.color = 'var(--color-on-surface)';
    title.style.whiteSpace = 'nowrap';
    title.textContent = 'Students Overview';
    titleCardsContainer.appendChild(title);

    // Horizontal Scroll container - Figma: gap-[var(--section/gap-sm,8px)]
    const horizontalScroll = document.createElement('div');
    horizontalScroll.style.display = 'flex';
    horizontalScroll.style.flexDirection = 'column';
    horizontalScroll.style.gap = 'var(--size-section-gap-sm)';
    horizontalScroll.style.alignItems = 'flex-start';
    horizontalScroll.style.position = 'relative';
    horizontalScroll.style.flexShrink = '0';
    horizontalScroll.style.width = '100%';

    // Cards container - Figma: gap-[var(--section/gap-md,16px)]
    const cardsContainer = document.createElement('div');
    cardsContainer.style.display = 'flex';
    cardsContainer.style.gap = 'var(--size-section-gap-md)';
    cardsContainer.style.alignItems = 'flex-start';
    cardsContainer.style.position = 'relative';
    cardsContainer.style.flexShrink = '0';
    cardsContainer.style.width = '100%';

    // Card 1: Student Need
    const studentNeedCard = createStudentNeedCard(studentNeed);
    cardsContainer.appendChild(studentNeedCard);

    // Card 2: Status
    const statusCard = createStatusCard(status);
    cardsContainer.appendChild(statusCard);

    // Card 3: Effort
    const effortCard = createEffortCard(effort);
    cardsContainer.appendChild(effortCard);

    // Card 4: Progress
    const progressCard = createProgressCard(progress);
    cardsContainer.appendChild(progressCard);

    horizontalScroll.appendChild(cardsContainer);

    // Scrollbar placeholder - Simplified horizontal scrollbar
    const scrollbar = document.createElement('div');
    scrollbar.style.display = 'flex';
    scrollbar.style.height = '10px'; // Specific scrollbar height from design
    scrollbar.style.alignItems = 'center';
    scrollbar.style.justifyContent = 'center';
    scrollbar.style.position = 'relative';
    scrollbar.style.flexShrink = '0';
    scrollbar.style.width = '100%';
    scrollbar.style.marginTop = '8px';

    const scrollbarTrack = document.createElement('div');
    scrollbarTrack.style.backgroundColor = 'var(--color-outline-variant)';
    scrollbarTrack.style.height = 'var(--size-element-gap-xs)'; // 4px
    scrollbarTrack.style.borderRadius = '2px';
    scrollbarTrack.style.flexGrow = '1';
    scrollbarTrack.style.width = '100%';
    scrollbar.appendChild(scrollbarTrack);

    horizontalScroll.appendChild(scrollbar);
    titleCardsContainer.appendChild(horizontalScroll);
    section.appendChild(titleCardsContainer);

    return section;
}

/**
 * Creates a Student Need card
 */
function createStudentNeedCard({ competencyArea, count, total }) {
    const competencyAreaMap = {
        'relationships': { text: 'Relationships', textColor: 'relationship-text' },
        'social-emotional': { text: 'Social-Emotional', textColor: 'social-emotional-text' },
        'mastering-content': { text: 'Mastering Content', textColor: 'mastering-content-text' },
        'advocacy': { text: 'Advocacy', textColor: 'advocacy-text' },
        'technology-tools': { text: 'Technology Tools', textColor: 'technology-tools-text' }
    };

    const area = competencyAreaMap[competencyArea] || competencyAreaMap['relationships'];

    // Card wrapper
    const card = document.createElement('div');
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = 'var(--size-card-gap-md)';
    card.style.alignItems = 'flex-start';
    card.style.position = 'relative';
    card.style.flexShrink = '0';

    // Card inner - Figma: h-[180px], w-[248px], px-[var(--card/pad-x-md,20px)] py-[var(--card/pad-y-md,20px)], rounded-[var(--card/radius-md,16px)], shadow
    const cardInner = document.createElement('div');
    cardInner.style.boxSizing = 'border-box';
    cardInner.style.display = 'flex';
    cardInner.style.flexDirection = 'column';
    cardInner.style.gap = 'var(--size-card-gap-md)';
    cardInner.style.minHeight = '180px';
    cardInner.style.height = 'auto';
    cardInner.style.alignItems = 'flex-start';
    cardInner.style.overflow = 'hidden';
    cardInner.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    cardInner.style.position = 'relative';
    cardInner.style.borderRadius = 'var(--size-card-radius-md)';
    cardInner.style.boxShadow = 'var(--elevation-light-1)';
    cardInner.style.minWidth = '248px';
    cardInner.style.maxWidth = '248px';
    cardInner.style.width = '100%';
    cardInner.style.flexShrink = '0';
    
    // Background gradient for relationships
    if (competencyArea === 'relationships') {
        cardInner.style.backgroundImage = 'linear-gradient(90deg, rgba(199, 11, 119, 0.08) 0%, rgba(199, 11, 119, 0.08) 100%), linear-gradient(90deg, rgb(249, 249, 252) 0%, rgb(249, 249, 252) 100%)';
    } else {
        cardInner.style.backgroundColor = 'var(--color-surface-bright)';
    }

    // Container - Figma: gap-[var(--spacing/medium/space-200,12px)]
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-lg)'; // 12px
    container.style.alignItems = 'flex-start';
    container.style.position = 'relative';
    container.style.flexShrink = '0';
    container.style.width = '100%';

    // Title Container - Figma: gap-[var(--spacing/small/space-050,4px)]
    const titleContainer = document.createElement('div');
    titleContainer.style.display = 'flex';
    titleContainer.style.gap = 'var(--size-element-gap-xs)'; // 4px
    titleContainer.style.alignItems = 'center';
    titleContainer.style.position = 'relative';
    titleContainer.style.flexShrink = '0';
    titleContainer.style.width = '100%';

    const title = document.createElement('div');
    title.style.fontFamily = 'var(--font-family-header)';
    title.style.fontSize = 'var(--font-size-h6)';
    title.style.fontWeight = 'var(--font-weight-semibold-2)';
    title.style.lineHeight = '1.4';
    title.style.color = `var(--color-${area.textColor})`;
    title.style.whiteSpace = 'nowrap';
    title.textContent = 'Student Need';
    titleContainer.appendChild(title);
    container.appendChild(titleContainer);

    // Body Container - Figma: gap-[var(--spacing/medium/space-300,16px)]
    const bodyContainer = document.createElement('div');
    bodyContainer.style.display = 'flex';
    bodyContainer.style.gap = 'var(--size-section-gap-md)'; // 16px
    bodyContainer.style.alignItems = 'flex-start';
    bodyContainer.style.position = 'relative';
    bodyContainer.style.flexShrink = '0';
    bodyContainer.style.width = '100%';

    // Text Container
    const textContainer = document.createElement('div');
    textContainer.style.display = 'flex';
    textContainer.style.flexDirection = 'column';
    textContainer.style.flexGrow = '1';
    textContainer.style.alignItems = 'flex-start';
    textContainer.style.position = 'relative';
    textContainer.style.flexShrink = '0';

    // Subtitle - Figma: text-[14px], leading-[24px], font-bold
    const subtitle = document.createElement('div');
    subtitle.style.fontFamily = 'var(--font-family-body)';
    subtitle.style.fontSize = 'var(--font-size-body2)';
    subtitle.style.fontWeight = 'var(--font-weight-bold)';
    subtitle.style.lineHeight = '24px';
    subtitle.style.color = `var(--color-${area.textColor})`;
    subtitle.textContent = area.text;
    textContainer.appendChild(subtitle);

    // Body text - Figma: text-[12px], leading-[20px], font-light
    const bodyText = document.createElement('p');
    bodyText.style.fontFamily = 'var(--font-family-body)';
    bodyText.style.fontSize = 'var(--font-size-body3)';
    bodyText.style.fontWeight = 'var(--font-weight-normal)';
    bodyText.style.lineHeight = '20px';
    bodyText.style.color = `var(--color-${area.textColor})`;
    bodyText.textContent = `${count}/${total} students need ${area.text.toLowerCase()} support`;
    textContainer.appendChild(bodyText);

    bodyContainer.appendChild(textContainer);

    // Visualization Container (SMART bars) - Simplified placeholder
    const vizContainer = createSMARTBarsVisualization(competencyArea);
    bodyContainer.appendChild(vizContainer);

    container.appendChild(bodyContainer);
    cardInner.appendChild(container);
    card.appendChild(cardInner);

    return card;
}

/**
 * Creates SMART bars visualization (simplified placeholder)
 */
function createSMARTBarsVisualization(competencyArea) {
    const vizContainer = document.createElement('div');
    vizContainer.style.display = 'flex';
    vizContainer.style.gap = 'var(--size-element-gap-xs)'; // 4px
    vizContainer.style.alignItems = 'flex-start';
    vizContainer.style.position = 'relative';
    vizContainer.style.flexShrink = '0';

    const smartLabels = ['S', 'M', 'A', 'R', 'T'];
    const smartAreas = ['social-emotional', 'mastering-content', 'advocacy', 'relationships', 'technology-tools'];
    const smartColors = {
        'social-emotional': { container: 'social-emotional-container', text: 'social-emotional-text' },
        'mastering-content': { container: 'mastering-content-container', text: 'mastering-content-text' },
        'advocacy': { container: 'advocacy-container', text: 'advocacy-text' },
        'relationships': { container: 'relationship-container', text: 'relationship-text' },
        'technology-tools': { container: 'technology-tools-container', text: 'technology-tools-text' }
    };

    smartAreas.forEach((smartArea, index) => {
        const barContainer = document.createElement('div');
        barContainer.style.display = 'flex';
        barContainer.style.flexDirection = 'column';
        barContainer.style.gap = 'var(--size-element-gap-xs)'; // 4px
        barContainer.style.alignItems = 'center';
        barContainer.style.position = 'relative';
        barContainer.style.flexShrink = '0';

        // Bar visualization - Simplified placeholder
        const barWrapper = document.createElement('div');
        barWrapper.style.display = 'grid';
        barWrapper.style.gridTemplateColumns = 'max-content';
        barWrapper.style.gridTemplateRows = 'max-content';
        barWrapper.style.placeItems = 'start';
        barWrapper.style.position = 'relative';
        barWrapper.style.width = '6px';
        barWrapper.style.height = '80px';

        // Background bar
        const bgBar = document.createElement('div');
        bgBar.style.gridArea = '1 / 1';
        bgBar.style.display = 'flex';
        bgBar.style.height = '80px';
        bgBar.style.alignItems = 'center';
        bgBar.style.justifyContent = 'center';
        bgBar.style.position = 'relative';
        bgBar.style.width = '6px';

        const bgBarRotated = document.createElement('div');
        bgBarRotated.style.transform = 'rotate(270deg)';
        bgBarRotated.style.flex = 'none';

        const bgBarInner = document.createElement('div');
        bgBarInner.style.backgroundColor = 'var(--color-surface-container-lowest)';
        bgBarInner.style.height = '6px';
        bgBarInner.style.borderRadius = 'var(--size-card-radius-md)';
        bgBarInner.style.width = '80px';
        bgBarRotated.appendChild(bgBarInner);
        bgBar.appendChild(bgBarRotated);
        barWrapper.appendChild(bgBar);

        // Foreground bar (filled based on competency area)
        const fgBar = document.createElement('div');
        const barHeight = smartArea === competencyArea ? '71.735px' : '60px';
        const barTop = smartArea === competencyArea ? '8.26px' : '20px';
        fgBar.style.gridArea = '1 / 1';
        fgBar.style.display = 'flex';
        fgBar.style.height = barHeight;
        fgBar.style.alignItems = 'center';
        fgBar.style.justifyContent = 'center';
        fgBar.style.marginTop = barTop;
        fgBar.style.position = 'relative';
        fgBar.style.width = '6px';

        const fgBarRotated = document.createElement('div');
        fgBarRotated.style.transform = 'rotate(270deg)';
        fgBarRotated.style.flex = 'none';

        const fgBarInner = document.createElement('div');
        const barWidth = smartArea === competencyArea ? '71.735px' : '60px';
        fgBarInner.style.backgroundColor = `var(--color-${smartColors[smartArea].container})`;
        fgBarInner.style.height = '6px';
        fgBarInner.style.borderRadius = 'var(--size-card-radius-md)';
        fgBarInner.style.width = barWidth;
        fgBarRotated.appendChild(fgBarInner);
        fgBar.appendChild(fgBarRotated);
        barWrapper.appendChild(fgBar);

        barContainer.appendChild(barWrapper);

        // Label - Figma: text-[12px], leading-[20px], uppercase
        const label = document.createElement('div');
        label.style.fontFamily = 'var(--font-family-body)';
        label.style.fontSize = 'var(--font-size-body3)';
        label.style.fontWeight = 'var(--font-weight-normal)';
        label.style.lineHeight = '20px';
        label.style.color = `var(--color-${smartColors[smartArea].text})`;
        label.style.textAlign = smartArea === 'mastering-content' || smartArea === 'advocacy' ? 'center' : 'left';
        label.style.textTransform = 'uppercase';
        label.style.whiteSpace = 'nowrap';
        label.textContent = smartLabels[index];
        barContainer.appendChild(label);

        vizContainer.appendChild(barContainer);
    });

    return vizContainer;
}

/**
 * Creates a Status card
 */
function createStatusCard({ percentage, status }) {
    const card = document.createElement('div');
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = 'var(--size-card-gap-md)';
    card.style.alignItems = 'flex-start';
    card.style.position = 'relative';
    card.style.flexShrink = '0';

    const cardInner = document.createElement('div');
    cardInner.style.backgroundColor = 'var(--color-surface-bright)';
    cardInner.style.boxSizing = 'border-box';
    cardInner.style.display = 'flex';
    cardInner.style.flexDirection = 'column';
    cardInner.style.gap = 'var(--size-card-gap-md)';
    cardInner.style.height = '180px';
    cardInner.style.alignItems = 'flex-start';
    cardInner.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    cardInner.style.position = 'relative';
    cardInner.style.borderRadius = 'var(--size-card-radius-md)';
    cardInner.style.boxShadow = 'var(--elevation-light-1)';
    cardInner.style.width = '248px';
    cardInner.style.flexShrink = '0';

    // Title Container
    const titleContainer = document.createElement('div');
    titleContainer.style.display = 'flex';
    titleContainer.style.gap = 'var(--size-element-gap-xs)'; // 4px
    titleContainer.style.alignItems = 'center';
    titleContainer.style.position = 'relative';
    titleContainer.style.flexShrink = '0';
    titleContainer.style.width = '100%';

    const title = document.createElement('div');
    title.style.fontFamily = 'var(--font-family-header)';
    title.style.fontSize = 'var(--font-size-h6)';
    title.style.fontWeight = 'var(--font-weight-semibold-2)';
    title.style.lineHeight = '1.4';
    title.style.color = 'var(--color-on-surface-variant)';
    title.style.whiteSpace = 'nowrap';
    title.textContent = 'Status';
    titleContainer.appendChild(title);
    cardInner.appendChild(titleContainer);

    // Body Container
    const bodyContainer = document.createElement('div');
    bodyContainer.style.display = 'flex';
    bodyContainer.style.gap = 'var(--size-section-gap-md)'; // 16px
    bodyContainer.style.alignItems = 'flex-start';
    bodyContainer.style.position = 'relative';
    bodyContainer.style.flexShrink = '0';
    bodyContainer.style.width = '100%';

    // Text Container
    const textContainer = document.createElement('div');
    textContainer.style.display = 'flex';
    textContainer.style.flexDirection = 'column';
    textContainer.style.flexGrow = '1';
    textContainer.style.alignItems = 'flex-start';
    textContainer.style.position = 'relative';
    textContainer.style.flexShrink = '0';

    const percentageText = document.createElement('div');
    percentageText.style.fontFamily = 'var(--font-family-body)';
    percentageText.style.fontSize = 'var(--font-size-body2)';
    percentageText.style.fontWeight = 'var(--font-weight-bold)';
    percentageText.style.lineHeight = '24px';
    percentageText.style.color = 'var(--color-on-surface-variant)';
    percentageText.textContent = `${percentage}%`;
    textContainer.appendChild(percentageText);

    const statusText = document.createElement('p');
    statusText.style.fontFamily = 'var(--font-family-body)';
    statusText.style.fontSize = 'var(--font-size-body3)';
    statusText.style.fontWeight = 'var(--font-weight-normal)';
    statusText.style.lineHeight = '20px';
    statusText.style.color = 'var(--color-on-surface-variant)';
    statusText.innerHTML = `students has status: <span style="text-transform:capitalize;">${status}</span>.`;
    textContainer.appendChild(statusText);

    bodyContainer.appendChild(textContainer);

    // Visualization Container (circular progress placeholder)
    const vizContainer = document.createElement('div');
    vizContainer.style.display = 'flex';
    vizContainer.style.flexDirection = 'column';
    vizContainer.style.height = '96px';
    vizContainer.style.alignItems = 'center';
    vizContainer.style.justifyContent = 'flex-end';
    vizContainer.style.position = 'relative';
    vizContainer.style.flexShrink = '0';

    const percentageDisplay = document.createElement('div');
    percentageDisplay.style.fontFamily = 'var(--font-family-header)';
    percentageDisplay.style.fontSize = 'var(--font-size-h4)';
    percentageDisplay.style.fontWeight = 'var(--font-weight-semibold-2)';
    percentageDisplay.style.lineHeight = '1.333';
    percentageDisplay.style.color = 'var(--color-on-surface-variant)';
    percentageDisplay.style.textAlign = 'center';
    percentageDisplay.style.width = '96px';
    percentageDisplay.style.height = '96px';
    percentageDisplay.style.display = 'flex';
    percentageDisplay.style.alignItems = 'center';
    percentageDisplay.style.justifyContent = 'center';
    percentageDisplay.textContent = `${percentage}%`;
    vizContainer.appendChild(percentageDisplay);

    bodyContainer.appendChild(vizContainer);
    cardInner.appendChild(bodyContainer);
    card.appendChild(cardInner);

    return card;
}

/**
 * Creates an Effort card
 */
function createEffortCard({ completed, total, percentage }) {
    return createProgressTypeCard('Effort', completed, total, percentage, 'students have fulfilled their effort goals.');
}

/**
 * Creates a Progress card
 */
function createProgressCard({ completed, total, percentage }) {
    return createProgressTypeCard('Progress', completed, total, percentage, 'students have fulfilled their progress goals.');
}

/**
 * Creates a progress-type card (Effort or Progress)
 */
function createProgressTypeCard(title, completed, total, percentage, description) {
    const card = document.createElement('div');
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = 'var(--size-card-gap-md)';
    card.style.alignItems = 'flex-start';
    card.style.position = 'relative';
    card.style.flexShrink = '0';

    const cardInner = document.createElement('div');
    cardInner.style.backgroundColor = 'var(--color-surface-bright)';
    cardInner.style.boxSizing = 'border-box';
    cardInner.style.display = 'flex';
    cardInner.style.flexDirection = 'column';
    cardInner.style.gap = 'var(--size-card-gap-md)';
    cardInner.style.height = '180px';
    cardInner.style.alignItems = 'flex-start';
    cardInner.style.padding = 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)';
    cardInner.style.position = 'relative';
    cardInner.style.borderRadius = 'var(--size-card-radius-md)';
    cardInner.style.boxShadow = 'var(--elevation-light-1)';
    cardInner.style.width = '248px';
    cardInner.style.flexShrink = '0';

    // Title Container
    const titleContainer = document.createElement('div');
    titleContainer.style.display = 'flex';
    titleContainer.style.gap = 'var(--size-element-gap-xs)'; // 4px
    titleContainer.style.alignItems = 'center';
    titleContainer.style.position = 'relative';
    titleContainer.style.flexShrink = '0';
    titleContainer.style.width = '100%';

    const titleEl = document.createElement('div');
    titleEl.style.fontFamily = 'var(--font-family-header)';
    titleEl.style.fontSize = 'var(--font-size-h6)';
    titleEl.style.fontWeight = 'var(--font-weight-semibold-2)';
    titleEl.style.lineHeight = '1.4';
    titleEl.style.color = 'var(--color-on-surface-variant)';
    titleEl.style.whiteSpace = 'nowrap';
    titleEl.textContent = title;
    titleContainer.appendChild(titleEl);
    cardInner.appendChild(titleContainer);

    // Body Container
    const bodyContainer = document.createElement('div');
    bodyContainer.style.display = 'flex';
    bodyContainer.style.gap = 'var(--size-section-gap-md)'; // 16px
    bodyContainer.style.alignItems = 'flex-start';
    bodyContainer.style.position = 'relative';
    bodyContainer.style.flexShrink = '0';
    bodyContainer.style.width = '100%';

    // Text Container
    const textContainer = document.createElement('div');
    textContainer.style.display = 'flex';
    textContainer.style.flexDirection = 'column';
    textContainer.style.flexGrow = '1';
    textContainer.style.alignItems = 'flex-start';
    textContainer.style.position = 'relative';
    textContainer.style.flexShrink = '0';

    const countText = document.createElement('div');
    countText.style.fontFamily = 'var(--font-family-body)';
    countText.style.fontSize = 'var(--font-size-body2)';
    countText.style.fontWeight = 'var(--font-weight-bold)';
    countText.style.lineHeight = '24px';
    countText.style.color = 'var(--color-on-surface-variant)';
    countText.textContent = `${completed}/${total}`;
    textContainer.appendChild(countText);

    const descriptionText = document.createElement('p');
    descriptionText.style.fontFamily = 'var(--font-family-body)';
    descriptionText.style.fontSize = 'var(--font-size-body3)';
    descriptionText.style.fontWeight = 'var(--font-weight-normal)';
    descriptionText.style.lineHeight = '20px';
    descriptionText.style.color = 'var(--color-on-surface-variant)';
    descriptionText.textContent = description;
    textContainer.appendChild(descriptionText);

    bodyContainer.appendChild(textContainer);

    // Visualization Container (circular progress placeholder)
    const vizContainer = document.createElement('div');
    vizContainer.style.display = 'flex';
    vizContainer.style.flexDirection = 'column';
    vizContainer.style.alignItems = 'center';
    vizContainer.style.justifyContent = 'flex-end';
    vizContainer.style.position = 'relative';
    vizContainer.style.flexShrink = '0';

    const percentageDisplay = document.createElement('div');
    percentageDisplay.style.fontFamily = 'var(--font-family-header)';
    percentageDisplay.style.fontSize = 'var(--font-size-h4)';
    percentageDisplay.style.fontWeight = 'var(--font-weight-semibold-2)';
    percentageDisplay.style.lineHeight = '1.333';
    percentageDisplay.style.color = 'var(--color-on-surface-variant)';
    percentageDisplay.style.textAlign = 'center';
    percentageDisplay.style.width = '96px';
    percentageDisplay.style.height = '96px';
    percentageDisplay.style.display = 'flex';
    percentageDisplay.style.alignItems = 'center';
    percentageDisplay.style.justifyContent = 'center';
    percentageDisplay.textContent = `${percentage}%`;
    vizContainer.appendChild(percentageDisplay);

    bodyContainer.appendChild(vizContainer);
    cardInner.appendChild(bodyContainer);
    card.appendChild(cardInner);

    return card;
}

