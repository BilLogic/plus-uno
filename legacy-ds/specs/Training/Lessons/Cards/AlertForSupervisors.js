/**
 * @fileoverview AlertForSupervisors component for Training Lessons specs
 * Alert card for supervisors reviewing student training performance
 * Matches Figma design system specifications
 */

/**
 * Creates an AlertForSupervisors component
 * @param {Object} options - Alert configuration
 * @param {boolean} [options.aiFeature=true] - Whether AI feature is enabled
 * @param {string} [options.studentName="[Student Name]"] - Student name to display
 * @returns {HTMLElement} Alert element
 */
export function createAlertForSupervisors({
    aiFeature = true,
    studentName = "[Student Name]"
} = {}) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'flex-start';
    container.style.maxWidth = '680px';
    container.style.width = '100%';
    container.setAttribute('data-node-id', aiFeature ? '63:177693' : '63:177695');

    if (!aiFeature) {
        // Disabled state - Warning alert
        const alert = document.createElement('div');
        alert.style.backgroundColor = 'var(--color-warning-state-08)';
        alert.style.border = '1px solid var(--color-warning)';
        alert.style.borderStyle = 'solid';
        alert.style.boxSizing = 'border-box';
        alert.style.display = 'flex';
        alert.style.alignItems = 'center';
        alert.style.borderRadius = 'var(--size-modal-radius-md)';
        alert.style.maxWidth = '680px';
        alert.style.width = '100%';
        alert.setAttribute('data-node-id', '63:177696');

        const alertContent = document.createElement('div');
        alertContent.style.display = 'flex';
        alertContent.style.flexDirection = 'row';
        alertContent.style.flexGrow = '1';
        alertContent.style.alignItems = 'center';
        alertContent.style.alignSelf = 'stretch';
        alertContent.style.gap = 'var(--size-modal-gap-sm)';
        alertContent.style.padding = 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-md)';
        alertContent.setAttribute('data-node-id', 'I63:177696;4312:21011');

        const message = document.createElement('div');
        message.style.display = 'flex';
        message.style.flexDirection = 'column';
        message.style.gap = 'var(--size-element-gap-xs)'; // 4px - gap between message elements
        message.style.flexGrow = '1';
        message.style.alignItems = 'flex-start';
        message.style.justifyContent = 'center';
        message.setAttribute('data-node-id', 'I63:177696;4312:21011;4215:23102');

        const messageText = document.createElement('div');
        messageText.style.fontFamily = 'var(--font-family-body)';
        messageText.style.fontSize = 'var(--font-size-body1)';
        messageText.style.fontWeight = 'var(--font-weight-normal)';
        messageText.style.lineHeight = '1.5';
        messageText.style.color = 'var(--color-on-warning-container)';
        messageText.style.width = '100%';
        messageText.setAttribute('data-node-id', 'I63:177696;4312:21011;4215:23103');

        // Build message with bold student name
        const text1 = document.createTextNode('You are reviewing ');
        const boldName = document.createElement('span');
        boldName.style.fontWeight = 'var(--font-weight-bold)';
        boldName.textContent = studentName;
        const text2 = document.createTextNode('\'s training performance. AI-powered feedback was ');
        const boldDisabled = document.createElement('span');
        boldDisabled.style.fontWeight = 'var(--font-weight-bold)';
        boldDisabled.textContent = 'disabled';
        const text3 = document.createTextNode(' for this lesson.');

        messageText.appendChild(text1);
        messageText.appendChild(boldName);
        messageText.appendChild(text2);
        messageText.appendChild(boldDisabled);
        messageText.appendChild(text3);

        message.appendChild(messageText);
        alertContent.appendChild(message);
        alert.appendChild(alertContent);
        container.appendChild(alert);
    } else {
        // Enabled state - Info alert
        const alert = document.createElement('div');
        alert.style.backgroundColor = 'var(--color-info-state-08)';
        alert.style.border = '1px solid var(--color-info)';
        alert.style.borderStyle = 'solid';
        alert.style.boxSizing = 'border-box';
        alert.style.display = 'flex';
        alert.style.alignItems = 'center';
        alert.style.borderRadius = 'var(--size-modal-radius-md)'; // Consistent with disabled state
        alert.style.maxWidth = '680px';
        alert.style.width = '100%';
        alert.setAttribute('data-node-id', '63:177694');

        const alertContent = document.createElement('div');
        alertContent.style.display = 'flex';
        alertContent.style.flexDirection = 'row';
        alertContent.style.flexGrow = '1';
        alertContent.style.alignItems = 'center';
        alertContent.style.alignSelf = 'stretch';
        alertContent.style.gap = 'var(--size-modal-gap-sm)';
        alertContent.style.padding = 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-md)';
        alertContent.setAttribute('data-node-id', 'I63:177694;4312:21025');

        const message = document.createElement('div');
        message.style.display = 'flex';
        message.style.flexDirection = 'column';
        message.style.gap = 'var(--size-element-gap-xs)'; // 4px - gap between message elements
        message.style.flexGrow = '1';
        message.style.alignItems = 'flex-start';
        message.style.justifyContent = 'center';
        message.setAttribute('data-node-id', 'I63:177694;4312:21025;4215:23102');

        const messageText = document.createElement('div');
        messageText.style.fontFamily = 'var(--font-family-body)';
        messageText.style.fontSize = 'var(--font-size-body1)';
        messageText.style.fontWeight = 'var(--font-weight-normal)';
        messageText.style.lineHeight = '1.5';
        messageText.style.color = 'var(--color-on-info-container)';
        messageText.style.width = '100%';
        messageText.setAttribute('data-node-id', 'I63:177694;4312:21025;4215:23103');

        // Build message with bold student name
        const text1 = document.createTextNode('You are reviewing ');
        const boldName = document.createElement('span');
        boldName.style.fontWeight = 'var(--font-weight-bold)';
        boldName.textContent = studentName;
        const text2 = document.createTextNode('\'s training performance. AI-powered feedback was ');
        const boldEnabled = document.createElement('span');
        boldEnabled.style.fontWeight = 'var(--font-weight-bold)';
        boldEnabled.textContent = 'enabled';
        const text3 = document.createTextNode(' for this lesson to provide real-time insights.');

        messageText.appendChild(text1);
        messageText.appendChild(boldName);
        messageText.appendChild(text2);
        messageText.appendChild(boldEnabled);
        messageText.appendChild(text3);

        message.appendChild(messageText);
        alertContent.appendChild(message);
        alert.appendChild(alertContent);
        container.appendChild(alert);
    }

    return container;
}

