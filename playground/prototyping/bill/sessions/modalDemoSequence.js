export const modalDemoSequence = [
    // 1. Initial wait for page load
    {
        type: 'wait',
        duration: 2000,
        description: 'Wait for page load'
    },
    // 2. Move to "Arlene McCoy" row's "See Details" button
    // Assuming Arlene is the 1st row. We can target by text or nth-child.
    {
        type: 'move',
        target: 'tr:first-child button',
        duration: 1000,
        description: 'Move to See Details button'
    },
    // 3. Click "See Details"
    {
        type: 'click',
        target: 'tr:first-child button',
        duration: 200,
        description: 'Click See Details'
    },
    // 4. Wait for Modal Progressive Disclosure
    // Skeleton (800ms) + Header (300ms) + Content Stagger (400ms) ~ 1.5s total minimum.
    // Give it 2.5s to be safe and let user see the build-up.
    {
        type: 'wait',
        duration: 2500,
        description: 'Wait for modal animations'
    },
    // 5. Move to First Column (Student Momentum)
    {
        type: 'move',
        target: '.student-insights-content > div:nth-child(1)',
        duration: 1000,
        description: 'Move to Student Momentum'
    },
    // 6. Click to Spotlight Col 1
    {
        type: 'click',
        target: '.student-insights-content > div:nth-child(1)',
        duration: 300,
        description: 'Spotlight Student Momentum'
    },
    {
        type: 'wait',
        duration: 2000,
        description: 'Observe Student Momentum'
    },
    // 7. Move to Second Column (Key Observations)
    {
        type: 'move',
        target: '.student-insights-content > div:nth-child(2)',
        duration: 1000,
        description: 'Move to Key Observations'
    },
    // 8. Click to Spotlight Col 2
    {
        type: 'click',
        target: '.student-insights-content > div:nth-child(2)',
        duration: 300,
        description: 'Spotlight Key Observations'
    },
    {
        type: 'wait',
        duration: 2000,
        description: 'Observe Key Observations'
    },
    // 9. Move to Third Column (Talking Points) -> "Where to Help" (Last Item)
    // Accordion headers are buttons. "Where to Help?" is the 3rd item (index 2).
    {
        type: 'move',
        target: '.student-insights-content > div:nth-child(3) .accordion-item:nth-child(3) button',
        duration: 1000,
        description: 'Move to Where to Help accordion'
    },
    // 10. Click Accordion (Triggering open + Spotlight Col 3)
    {
        type: 'click',
        target: '.student-insights-content > div:nth-child(3) .accordion-item:nth-child(3) button',
        duration: 300,
        description: 'Click Where to Help'
    },
    {
        type: 'wait',
        duration: 3000,
        description: 'Read Talking Point content'
    },
    // 11. Fade Out
    {
        type: 'fadeOut',
        duration: 500,
        description: 'End Demo'
    }
];

export const getElementCenter = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
};
