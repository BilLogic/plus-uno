# Bulk Actions Feature - Tutor Admin

## Overview
The Bulk Actions feature is a new workflow enhancement for the Tutor Admin page that allows administrators to select multiple tutors and perform batch operations efficiently.

## Features

### 1. Multi-Select Functionality
- **Select All Checkbox**: Checkbox in the table header to select/deselect all tutors at once
- **Individual Selection**: Each tutor row has a checkbox for individual selection
- **Indeterminate State**: The select-all checkbox shows an indeterminate state when some (but not all) tutors are selected

### 2. Bulk Actions Toolbar
When one or more tutors are selected, a toolbar appears above the action buttons with:
- **Selection Count**: Displays the number of selected tutors
- **Clear Selection**: Button to deselect all tutors
- **Bulk Actions**:
  - **Email Selected**: Send email to all selected tutors
  - **Assign to Group**: Assign selected tutors to a group
  - **Export Data**: Export data for selected tutors as CSV

### 3. Bulk Email Modal
- Allows sending a single email to all selected tutors
- Includes:
  - List of selected tutors
  - Subject field
  - Message textarea
  - Send and Cancel buttons

### 4. Bulk Assign to Group Modal
- Allows assigning multiple tutors to a group at once
- Includes:
  - Selection count
  - Group dropdown selector
  - Assign and Cancel buttons

### 5. Bulk Export
- Exports selected tutor data as CSV file
- Includes: Name, Email, Groups, Students, Is Admin
- Automatically downloads with timestamp in filename

## User Flow

1. **Select Tutors**:
   - Click individual checkboxes to select specific tutors
   - Or use "Select All" checkbox to select all tutors at once

2. **Bulk Actions Toolbar Appears**:
   - Toolbar automatically appears when tutors are selected
   - Shows count of selected tutors

3. **Perform Bulk Action**:
   - Click one of the bulk action buttons (Email, Assign, Export)
   - Complete the action in the modal (if applicable)
   - Action is applied to all selected tutors

4. **Clear Selection**:
   - Click "Clear Selection" to deselect all tutors
   - Toolbar automatically hides when no tutors are selected

## Technical Implementation

### Components Used
- `createCheckbox` - For selection checkboxes
- `createModal` - For bulk action modals
- `createButton` - For action buttons
- Design tokens for all styling

### Design Tokens Used
- Surface container tokens for toolbar background
- Element tokens for spacing and sizing
- Modal tokens for modal styling
- Color tokens for proper color hierarchy

### State Management
- `selectedTutors` Set tracks selected tutor IDs
- Functions update UI based on selection state
- Checkbox states synchronized with selection state

## Benefits

1. **Efficiency**: Perform actions on multiple tutors at once instead of one-by-one
2. **Time Saving**: Reduces repetitive actions for administrators
3. **Consistency**: Ensures all selected tutors receive the same treatment
4. **User Experience**: Clear visual feedback and intuitive workflow

## Future Enhancements

Potential future improvements:
- Bulk status changes
- Bulk role assignment
- Bulk permissions management
- Undo/redo functionality
- Action history/logging


