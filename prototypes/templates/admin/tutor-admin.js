/**
 * @fileoverview Tutor Admin Page - Main JavaScript
 * Builds the Tutor Admin page using PLUS design system components.
 */

import { 
    createNavigation, 
    createBreadcrumb, 
    createButton, 
    createBadge,
    createCheckbox,
    createModal
} from '../../../design-system/components/molecules/index.js';

/**
 * Selected tutors for bulk actions
 */
let selectedTutors = new Set();

/**
 * Tutor data
 */
const tutors = [
    {
        id: 1,
        name: "Albus Dumbledore",
        email: "pl2-app-demo@gmail.com",
        isAdmin: true,
        groups: 1,
        students: 21
    },
    {
        id: 2,
        name: "Filius Flitwick",
        email: "pl2-app-demo@gmail.com",
        isAdmin: false,
        groups: 0,
        students: 0
    },
    {
        id: 3,
        name: "Minerva McGonagall",
        email: "pl2-app-demo@gmail.com",
        isAdmin: false,
        groups: 0,
        students: 24
    },
    {
        id: 4,
        name: "Remus Lupin",
        email: "pl2-app-demo@gmail.com",
        isAdmin: false,
        groups: 0,
        students: 0
    }
];

/**
 * Initialize the page
 */
function init() {
    buildSidebarNavigation();
    buildBreadcrumb();
    buildTabs();
    buildActionButtons();
    buildTutorTable();
    setupEventHandlers();
}

/**
 * Builds the sidebar navigation
 */
function buildSidebarNavigation() {
    const sidebarNav = document.getElementById('sidebar-nav');
    
    const navItems = [
        {
            text: "Home",
            href: "#",
            selected: false,
            icon: "home"
        },
        {
            text: "Training",
            selected: false,
            disabled: true,
            isSectionHeader: true
        },
        {
            text: "Lessons",
            href: "#",
            selected: false,
            icon: "book"
        },
        {
            text: "Onboarding",
            href: "#",
            selected: false,
            icon: "clipboard"
        },
        {
            text: "Toolkit",
            selected: false,
            disabled: true,
            isSectionHeader: true
        },
        {
            text: "Sessions",
            href: "#",
            selected: false,
            icon: "calendar"
        },
        {
            text: "Admin",
            selected: false,
            disabled: true,
            isSectionHeader: true
        },
        {
            text: "Tutor Admin",
            href: "#",
            selected: true,
            icon: "user"
        },
        {
            text: "Training Admin",
            href: "#",
            selected: false,
            icon: "user-cog"
        },
        {
            text: "Toolkit Admin",
            href: "#",
            selected: false,
            icon: "user-cog"
        }
    ];
    
    // Create navigation sections
    const navContainer = document.createElement('div');
    navContainer.style.display = 'flex';
    navContainer.style.flexDirection = 'column';
    navContainer.style.gap = `var(--size-section-gap-md)`;
    
    let currentSection = null;
    
    navItems.forEach((item) => {
        if (item.isSectionHeader) {
            // Create section header
            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'sidebar-section-title';
            sectionHeader.textContent = item.text;
            navContainer.appendChild(sectionHeader);
            currentSection = document.createElement('div');
            currentSection.className = 'sidebar-section';
            navContainer.appendChild(currentSection);
        } else {
            // Create navigation item
            if (!currentSection) {
                currentSection = document.createElement('div');
                currentSection.className = 'sidebar-section';
                navContainer.appendChild(currentSection);
            }
            
            const navItem = document.createElement('a');
            navItem.href = item.href || '#';
            navItem.className = 'body1-txt';
            navItem.style.display = 'flex';
            navItem.style.alignItems = 'center';
            navItem.style.gap = `var(--size-element-gap-sm)`;
            navItem.style.padding = `var(--size-element-pad-y-sm) var(--size-element-pad-x-sm)`;
            navItem.style.borderRadius = `var(--size-element-radius-sm)`;
            navItem.style.textDecoration = 'none';
            navItem.style.color = item.selected 
                ? 'var(--color-primary)' 
                : 'var(--color-on-surface)';
            navItem.style.backgroundColor = item.selected 
                ? 'var(--color-primary-state-08)' 
                : 'transparent';
            
            if (item.icon) {
                const icon = document.createElement('i');
                icon.className = `fas fa-${item.icon}`;
                navItem.appendChild(icon);
            }
            
            const text = document.createElement('span');
            text.textContent = item.text;
            navItem.appendChild(text);
            
            navItem.addEventListener('mouseenter', () => {
                if (!item.selected) {
                    navItem.style.backgroundColor = 'var(--color-primary-state-08)';
                }
            });
            
            navItem.addEventListener('mouseleave', () => {
                if (!item.selected) {
                    navItem.style.backgroundColor = 'transparent';
                }
            });
            
            currentSection.appendChild(navItem);
        }
    });
    
    sidebarNav.appendChild(navContainer);
}

/**
 * Builds the breadcrumb navigation
 */
function buildBreadcrumb() {
    const breadcrumbNav = document.getElementById('breadcrumb-nav');
    
    const breadcrumb = createBreadcrumb({
        items: [
            { text: "Home", href: "#" },
            { text: "Tutor Admin" }
        ]
    });
    
    breadcrumbNav.appendChild(breadcrumb);
}

/**
 * Builds the tabs
 */
function buildTabs() {
    const tabsContainer = document.getElementById('tutor-tabs');
    
    const tabs = [
        { id: 'tutors', label: 'Tutors', count: 4, active: true },
        { id: 'groups', label: 'Groups', count: 1, active: false },
        { id: 'students', label: 'Students', count: 38, active: false }
    ];
    
    tabs.forEach((tab) => {
        const tabButton = document.createElement('button');
        tabButton.className = `tutor-tab ${tab.active ? 'active' : ''}`;
        tabButton.setAttribute('data-tab', tab.id);
        
        const label = document.createElement('span');
        label.textContent = tab.label;
        tabButton.appendChild(label);
        
        const badge = createBadge({
            text: tab.count.toString(),
            style: 'primary',
            size: 'b2'
        });
        tabButton.appendChild(badge);
        
        tabButton.addEventListener('click', () => {
            // Remove active class from all tabs
            document.querySelectorAll('.tutor-tab').forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tabButton.classList.add('active');
        });
        
        tabsContainer.appendChild(tabButton);
    });
}

/**
 * Builds the action buttons
 */
function buildActionButtons() {
    const actionButtonsContainer = document.getElementById('action-buttons');
    
    const addTutorBtn = createButton({
        btnText: "Add Tutor",
        btnStyle: "primary",
        btnFill: "filled",
        btnSize: "default",
        icon: "user-plus",
        iconPosition: "left",
        buttonOnClick: () => {
            console.log("Add Tutor clicked");
            showAddTutorModal();
        }
    });
    
    const emailTutorsBtn = createButton({
        btnText: "Email Tutors",
        btnStyle: "primary",
        btnFill: "filled",
        btnSize: "default",
        icon: "envelope",
        iconPosition: "left",
        buttonOnClick: () => {
            console.log("Email Tutors clicked");
            showEmailTutorsModal();
        }
    });
    
    const exportBtn = createButton({
        btnText: "Export Reflection Data",
        btnStyle: "primary",
        btnFill: "filled",
        btnSize: "default",
        icon: "download",
        iconPosition: "left",
        buttonOnClick: () => {
            console.log("Export clicked");
            exportReflectionData();
        }
    });
    
    actionButtonsContainer.appendChild(addTutorBtn);
    actionButtonsContainer.appendChild(emailTutorsBtn);
    actionButtonsContainer.appendChild(exportBtn);
}

/**
 * Builds the tutor table
 */
function buildTutorTable() {
    const tableBody = document.getElementById('tutor-table-body');
    
    // Add select all checkbox to header
    const headerRow = document.querySelector('.tutor-table thead tr');
    const selectAllHeader = document.createElement('th');
    selectAllHeader.style.width = '40px';
    
    const selectAllCheckbox = createCheckbox({
        label: '',
        name: 'select-all',
        value: 'all',
        id: 'select-all-tutors',
        checked: false,
        onChange: (e) => {
            const checked = e.target.checked;
            tutors.forEach((tutor) => {
                if (checked) {
                    selectedTutors.add(tutor.id);
                } else {
                    selectedTutors.delete(tutor.id);
                }
            });
            updateRowCheckboxes();
            updateBulkActionsToolbar();
        }
    });
    selectAllHeader.appendChild(selectAllCheckbox);
    headerRow.insertBefore(selectAllHeader, headerRow.firstChild);
    
    tutors.forEach((tutor) => {
        const row = document.createElement('tr');
        row.setAttribute('data-tutor-id', tutor.id);
        
        // Select checkbox column
        const selectCell = document.createElement('td');
        const checkbox = createCheckbox({
            label: '',
            name: 'tutor-select',
            value: tutor.id.toString(),
            id: `tutor-select-${tutor.id}`,
            checked: selectedTutors.has(tutor.id),
            onChange: (e) => {
                if (e.target.checked) {
                    selectedTutors.add(tutor.id);
                } else {
                    selectedTutors.delete(tutor.id);
                }
                updateSelectAllCheckbox();
                updateBulkActionsToolbar();
            }
        });
        selectCell.appendChild(checkbox);
        row.appendChild(selectCell);
        
        // Name column
        const nameCell = document.createElement('td');
        const nameContainer = document.createElement('div');
        nameContainer.className = 'tutor-name-cell';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-user';
        icon.style.marginRight = 'var(--size-element-gap-sm)';
        nameContainer.appendChild(icon);
        
        const nameWrapper = document.createElement('div');
        const name = document.createElement('div');
        name.className = 'body1-txt';
        name.textContent = tutor.name;
        nameWrapper.appendChild(name);
        
        const email = document.createElement('div');
        email.className = 'tutor-email';
        email.textContent = tutor.email;
        nameWrapper.appendChild(email);
        
        nameContainer.appendChild(nameWrapper);
        
        if (tutor.isAdmin) {
            const adminBadge = createBadge({
                text: 'Admin',
                style: 'primary',
                size: 'b2'
            });
            adminBadge.style.marginLeft = 'var(--size-element-gap-sm)';
            nameContainer.appendChild(adminBadge);
        }
        
        nameCell.appendChild(nameContainer);
        row.appendChild(nameCell);
        
        // Groups column
        const groupsCell = document.createElement('td');
        if (tutor.groups > 0) {
            const groupsText = document.createElement('span');
            groupsText.textContent = `${tutor.groups} Group${tutor.groups > 1 ? 's' : ''}`;
            groupsCell.appendChild(groupsText);
            
            const dropdownIcon = document.createElement('i');
            dropdownIcon.className = 'fas fa-chevron-down';
            dropdownIcon.style.marginLeft = 'var(--size-element-gap-xs)';
            dropdownIcon.style.cursor = 'pointer';
            groupsCell.appendChild(dropdownIcon);
        } else {
            groupsCell.textContent = 'None';
            groupsCell.style.color = 'var(--color-on-surface-variant)';
        }
        row.appendChild(groupsCell);
        
        // Students column
        const studentsCell = document.createElement('td');
        if (tutor.students > 0) {
            const studentsText = document.createElement('span');
            studentsText.textContent = `${tutor.students} Student${tutor.students > 1 ? 's' : ''}`;
            studentsCell.appendChild(studentsText);
            
            const dropdownIcon = document.createElement('i');
            dropdownIcon.className = 'fas fa-chevron-down';
            dropdownIcon.style.marginLeft = 'var(--size-element-gap-xs)';
            dropdownIcon.style.cursor = 'pointer';
            studentsCell.appendChild(dropdownIcon);
        } else {
            studentsCell.textContent = 'None';
            studentsCell.style.color = 'var(--color-on-surface-variant)';
        }
        row.appendChild(studentsCell);
        
        // Action column
        const actionCell = document.createElement('td');
        const actionContainer = document.createElement('div');
        actionContainer.className = 'tutor-actions';
        
        const editLink = document.createElement('a');
        editLink.href = '#';
        editLink.className = 'tutor-action-link';
        editLink.textContent = 'Edit';
        editLink.addEventListener('click', (e) => {
            e.preventDefault();
            showEditTutorModal(tutor);
        });
        actionContainer.appendChild(editLink);
        
        const viewProgressLink = document.createElement('a');
        viewProgressLink.href = '#';
        viewProgressLink.className = 'tutor-action-link';
        viewProgressLink.textContent = 'View Progress';
        viewProgressLink.addEventListener('click', (e) => {
            e.preventDefault();
            showViewProgressModal(tutor);
        });
        actionContainer.appendChild(viewProgressLink);
        
        actionCell.appendChild(actionContainer);
        row.appendChild(actionCell);
        
        tableBody.appendChild(row);
    });
    
    // Add bulk actions toolbar
    addBulkActionsToolbar();
}

/**
 * Updates all row checkboxes based on selectedTutors
 */
function updateRowCheckboxes() {
    tutors.forEach((tutor) => {
        const checkbox = document.getElementById(`tutor-select-${tutor.id}`);
        if (checkbox) {
            checkbox.checked = selectedTutors.has(tutor.id);
        }
    });
}

/**
 * Updates the select all checkbox state
 */
function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('select-all-tutors');
    if (selectAllCheckbox) {
        if (selectedTutors.size === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (selectedTutors.size === tutors.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }
}

/**
 * Adds the bulk actions toolbar
 */
function addBulkActionsToolbar() {
    const contentArea = document.querySelector('.tutor-admin-content');
    const toolbar = document.createElement('div');
    toolbar.id = 'bulk-actions-toolbar';
    toolbar.style.display = 'none';
    toolbar.style.padding = `var(--size-section-pad-y-sm) var(--size-section-pad-x-md)`;
    toolbar.style.backgroundColor = 'var(--color-primary-container)';
    toolbar.style.borderRadius = `var(--size-card-radius-sm)`;
    toolbar.style.marginBottom = `var(--size-section-gap-md)`;
    toolbar.style.display = 'flex';
    toolbar.style.alignItems = 'center';
    toolbar.style.justifyContent = 'space-between';
    toolbar.style.gap = `var(--size-element-gap-md)`;
    
    const leftSection = document.createElement('div');
    leftSection.style.display = 'flex';
    leftSection.style.alignItems = 'center';
    leftSection.style.gap = `var(--size-element-gap-md)`;
    
    const selectedCount = document.createElement('span');
    selectedCount.id = 'selected-count';
    selectedCount.className = 'body1-txt';
    selectedCount.style.color = 'var(--color-on-primary-container)';
    leftSection.appendChild(selectedCount);
    
    const clearSelection = createButton({
        btnText: "Clear Selection",
        btnStyle: "primary",
        btnFill: "text",
        btnSize: "default",
        buttonOnClick: () => {
            selectedTutors.clear();
            updateRowCheckboxes();
            updateSelectAllCheckbox();
            updateBulkActionsToolbar();
        }
    });
    clearSelection.style.color = 'var(--color-on-primary-container)';
    leftSection.appendChild(clearSelection);
    
    toolbar.appendChild(leftSection);
    
    const rightSection = document.createElement('div');
    rightSection.style.display = 'flex';
    rightSection.style.gap = `var(--size-element-gap-sm)`;
    
    const bulkEmailBtn = createButton({
        btnText: "Email Selected",
        btnStyle: "primary",
        btnFill: "filled",
        btnSize: "default",
        icon: "envelope",
        iconPosition: "left",
        buttonOnClick: () => showBulkEmailModal()
    });
    rightSection.appendChild(bulkEmailBtn);
    
    const bulkAssignBtn = createButton({
        btnText: "Assign to Group",
        btnStyle: "primary",
        btnFill: "filled",
        btnSize: "default",
        icon: "users",
        iconPosition: "left",
        buttonOnClick: () => showBulkAssignModal()
    });
    rightSection.appendChild(bulkAssignBtn);
    
    const bulkExportBtn = createButton({
        btnText: "Export Data",
        btnStyle: "primary",
        btnFill: "outline",
        btnSize: "default",
        icon: "download",
        iconPosition: "left",
        buttonOnClick: () => exportSelectedTutorsData()
    });
    rightSection.appendChild(bulkExportBtn);
    
    toolbar.appendChild(rightSection);
    
    // Insert before action buttons
    const actionButtons = document.getElementById('action-buttons');
    contentArea.insertBefore(toolbar, actionButtons);
}

/**
 * Updates the bulk actions toolbar visibility and count
 */
function updateBulkActionsToolbar() {
    const toolbar = document.getElementById('bulk-actions-toolbar');
    const selectedCount = document.getElementById('selected-count');
    
    if (selectedTutors.size > 0) {
        toolbar.style.display = 'flex';
        selectedCount.textContent = `${selectedTutors.size} tutor${selectedTutors.size > 1 ? 's' : ''} selected`;
    } else {
        toolbar.style.display = 'none';
    }
}

/**
 * Shows the bulk email modal
 */
function showBulkEmailModal() {
    const selectedTutorNames = tutors
        .filter(t => selectedTutors.has(t.id))
        .map(t => t.name)
        .join(', ');
    
    const modalBody = document.createElement('div');
    modalBody.style.display = 'flex';
    modalBody.style.flexDirection = 'column';
    modalBody.style.gap = `var(--size-modal-gap-md)`;
    
    const infoText = document.createElement('p');
    infoText.className = 'body1-txt';
    infoText.textContent = `Send email to ${selectedTutors.size} selected tutor${selectedTutors.size > 1 ? 's' : ''}:`;
    modalBody.appendChild(infoText);
    
    const tutorList = document.createElement('div');
    tutorList.className = 'body2-txt';
    tutorList.style.color = 'var(--color-on-surface-variant)';
    tutorList.textContent = selectedTutorNames;
    modalBody.appendChild(tutorList);
    
    const subjectLabel = document.createElement('label');
    subjectLabel.className = 'body2-txt';
    subjectLabel.textContent = 'Subject';
    subjectLabel.style.marginBottom = 'var(--size-element-gap-xs)';
    modalBody.appendChild(subjectLabel);
    
    const subjectInput = document.createElement('input');
    subjectInput.type = 'text';
    subjectInput.className = 'plus-text-field body2-txt';
    subjectInput.placeholder = 'Enter email subject';
    subjectInput.style.marginBottom = 'var(--size-modal-gap-md)';
    modalBody.appendChild(subjectInput);
    
    const messageLabel = document.createElement('label');
    messageLabel.className = 'body2-txt';
    messageLabel.textContent = 'Message';
    messageLabel.style.marginBottom = 'var(--size-element-gap-xs)';
    modalBody.appendChild(messageLabel);
    
    const messageTextarea = document.createElement('textarea');
    messageTextarea.className = 'plus-textarea body2-txt';
    messageTextarea.rows = 5;
    messageTextarea.placeholder = 'Enter email message';
    modalBody.appendChild(messageTextarea);
    
    const modal = createModal({
        id: 'bulk-email-modal',
        title: 'Email Selected Tutors',
        body: modalBody,
        type: 'scrollable',
        showBottomButtons: true,
        primaryButton: {
            text: 'Send Email',
            style: 'primary',
            fill: 'filled',
            onClick: () => {
                const subject = subjectInput.value;
                const message = messageTextarea.value;
                if (subject && message) {
                    console.log('Sending bulk email:', { subject, message, tutors: Array.from(selectedTutors) });
                    alert(`Email sent to ${selectedTutors.size} tutor${selectedTutors.size > 1 ? 's' : ''}!`);
                    hideModal('bulk-email-modal');
                } else {
                    alert('Please fill in both subject and message.');
                }
            }
        },
        secondaryButton: {
            text: 'Cancel',
            style: 'secondary',
            fill: 'tonal',
            onClick: () => hideModal('bulk-email-modal')
        },
        onClose: () => hideModal('bulk-email-modal'),
        width: 500
    });
    
    showModal(modal);
}

/**
 * Shows the bulk assign to group modal
 */
function showBulkAssignModal() {
    const modalBody = document.createElement('div');
    modalBody.style.display = 'flex';
    modalBody.style.flexDirection = 'column';
    modalBody.style.gap = `var(--size-modal-gap-md)`;
    
    const infoText = document.createElement('p');
    infoText.className = 'body1-txt';
    infoText.textContent = `Assign ${selectedTutors.size} selected tutor${selectedTutors.size > 1 ? 's' : ''} to a group:`;
    modalBody.appendChild(infoText);
    
    const groupLabel = document.createElement('label');
    groupLabel.className = 'body2-txt';
    groupLabel.textContent = 'Select Group';
    groupLabel.style.marginBottom = 'var(--size-element-gap-xs)';
    modalBody.appendChild(groupLabel);
    
    const groupSelect = document.createElement('select');
    groupSelect.className = 'plus-select body2-txt';
    groupSelect.style.marginBottom = 'var(--size-modal-gap-md)';
    groupSelect.style.width = '100%';
    groupSelect.style.padding = `var(--size-element-pad-y-md) var(--size-element-pad-x-md)`;
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Select a group --';
    groupSelect.appendChild(defaultOption);
    
    // Example groups
    const groups = ['Group A', 'Group B', 'Group C'];
    groups.forEach((group, index) => {
        const option = document.createElement('option');
        option.value = `group-${index + 1}`;
        option.textContent = group;
        groupSelect.appendChild(option);
    });
    
    modalBody.appendChild(groupSelect);
    
    const modal = createModal({
        id: 'bulk-assign-modal',
        title: 'Assign Tutors to Group',
        body: modalBody,
        type: 'default',
        showBottomButtons: true,
        primaryButton: {
            text: 'Assign',
            style: 'primary',
            fill: 'filled',
            onClick: () => {
                const selectedGroup = groupSelect.value;
                if (selectedGroup) {
                    console.log('Assigning tutors to group:', { group: selectedGroup, tutors: Array.from(selectedTutors) });
                    alert(`${selectedTutors.size} tutor${selectedTutors.size > 1 ? 's' : ''} assigned to ${groupSelect.options[groupSelect.selectedIndex].text}!`);
                    hideModal('bulk-assign-modal');
                    // Refresh the table or update UI
                    selectedTutors.clear();
                    updateRowCheckboxes();
                    updateSelectAllCheckbox();
                    updateBulkActionsToolbar();
                } else {
                    alert('Please select a group.');
                }
            }
        },
        secondaryButton: {
            text: 'Cancel',
            style: 'secondary',
            fill: 'tonal',
            onClick: () => hideModal('bulk-assign-modal')
        },
        onClose: () => hideModal('bulk-assign-modal'),
        width: 400
    });
    
    showModal(modal);
}

/**
 * Exports data for selected tutors
 */
function exportSelectedTutorsData() {
    const selectedTutorData = tutors.filter(t => selectedTutors.has(t.id));
    console.log('Exporting data for tutors:', selectedTutorData);
    
    // Create CSV content
    const headers = ['Name', 'Email', 'Groups', 'Students', 'Is Admin'];
    const rows = selectedTutorData.map(t => [
        t.name,
        t.email,
        t.groups,
        t.students,
        t.isAdmin ? 'Yes' : 'No'
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tutors-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert(`Exported data for ${selectedTutors.size} tutor${selectedTutors.size > 1 ? 's' : ''}!`);
}

/**
 * Shows a modal
 * @param {HTMLElement} modal - Modal element
 */
function showModal(modal) {
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.id = 'modal-backdrop';
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100%';
    backdrop.style.height = '100%';
    backdrop.style.backgroundColor = 'var(--color-scrim)';
    backdrop.style.zIndex = '1040';
    backdrop.style.display = 'flex';
    backdrop.style.alignItems = 'center';
    backdrop.style.justifyContent = 'center';
    
    modal.style.position = 'relative';
    modal.style.zIndex = '1050';
    
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
            hideModal(modal.id);
        }
    });
}

/**
 * Hides a modal
 * @param {string} modalId - Modal ID
 */
function hideModal(modalId) {
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) {
        backdrop.remove();
    }
}

/**
 * Sets up event handlers
 */
function setupEventHandlers() {
    // Collapse sidebar button
    const collapseBtn = document.getElementById('collapse-btn');
    const sidebar = document.getElementById('sidebar');
    
    collapseBtn.addEventListener('click', () => {
        sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
        const icon = collapseBtn.querySelector('i');
        icon.className = sidebar.style.display === 'none' 
            ? 'fas fa-chevron-right' 
            : 'fas fa-chevron-left';
    });
    
    // Table sorting
    document.querySelectorAll('.tutor-table th.sortable').forEach((th) => {
        th.addEventListener('click', () => {
            const sortBy = th.getAttribute('data-sort');
            sortTable(sortBy);
        });
    });
}

/**
 * Sorts the table by column
 * @param {string} sortBy - Column to sort by
 */
function sortTable(sortBy) {
    // Implementation for table sorting
    console.log(`Sorting by ${sortBy}`);
}

/**
 * Shows the Add Tutor modal
 */
function showAddTutorModal() {
    // This will be implemented as part of the new feature
    console.log("Show Add Tutor Modal");
}

/**
 * Shows the Email Tutors modal
 */
function showEmailTutorsModal() {
    // This will be implemented as part of the new feature
    console.log("Show Email Tutors Modal");
}

/**
 * Exports reflection data
 */
function exportReflectionData() {
    // This will be implemented as part of the new feature
    console.log("Export Reflection Data");
}

/**
 * Shows the Edit Tutor modal
 * @param {Object} tutor - Tutor object
 */
function showEditTutorModal(tutor) {
    // This will be implemented as part of the new feature
    console.log("Show Edit Tutor Modal", tutor);
}

/**
 * Shows the View Progress modal
 * @param {Object} tutor - Tutor object
 */
function showViewProgressModal(tutor) {
    // This will be implemented as part of the new feature
    console.log("Show View Progress Modal", tutor);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

