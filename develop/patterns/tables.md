# Pattern: Tables

**Context**: Data display and organization.
**Layer**: Component (Table)

## 1. Component API

### `createTable(config)`
Creates a standard data table with optional headers, rows, and pagination.

| Property | Type | Description |
| :--- | :--- | :--- |
| `headers` | `Array<string>` | List of column headers. |
| `rows` | `Array<HTMLElement>` | List of row elements (use `createTableRows`). |
| `pagination` | `HTMLElement` | Optional pagination component. |
| `density` | `'sm' \| 'md'` | Row density (default: 'md'). |

**Example**:
```javascript
const table = PlusInterface.createTable({
    headers: ['Name', 'Role', 'Status'],
    rows: myRows,
    density: 'md'
});
```

**Context**: Displaying tabular data.
**Layer**: 2 (Composite)

## 1. Design Pattern (Intent)
**Vocabulary**:
*   **Table**: A grid of data with rows and columns.
*   **Pagination**: Controls for navigating large datasets.

**Usage Rules**:
*   **Table**: Always include headers. Use `striped` for readability.
*   **Pagination**: Use when data exceeds 10-20 rows.

## 2. Component API (Implementation)

### Data Grid
```javascript
// Table
PlusInterface.createTable({
    headers: ["ID", "Name", "Status"],
    rows: [
        ["1", "Alice", "Active"],
        ["2", "Bob", "Inactive"]
    ],
    striped: true,
    hover: true
});

// TableRows (Helper)
PlusInterface.createTableRows(dataArray);
```

### Navigation
```javascript
// Pagination
PlusInterface.createPagination({
    currentPage: 1,
    totalPages: 5,
    onPageChange: (page) => {}
});
```

## 3. Design Tokens (Table Specific)

| Token | Value | Usage |
| :--- | :--- | :--- |
| `var(--size-table-cell-pad)` | 12px | Padding inside cells |
| `var(--size-table-row-radius)` | 4px | Radius for row hover state |
| `var(--size-table-cell-gap)` | 10px | Content gap |

### Row Radius
| Token | Value | Usage |
| :--- | :--- | :--- |
| `var(--size-table-radius-sm)` | 6px | Dense tables |
| `var(--size-table-radius-md)` | 8px | Standard tables |

## 3. Related Components
*   **Pagination**: Use `PlusInterface.createPagination()`.
*   **Search**: Use `PlusInterface.createInput({ icon: 'search' })`.
