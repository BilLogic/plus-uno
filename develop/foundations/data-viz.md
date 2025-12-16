# Data Visualization

To ensure consistent and interactive charting across the application, we use [Highcharts](https://www.highcharts.com/) as our standard visualization library.

## Framework & Dependencies

We rely on the following packages:
- **`highcharts`**: (v12.4.0) The core charting library.
- **`highcharts-react-official`**: (v3.2.3) The official React wrapper for Highcharts.

## Usage Guidelines

All chart components should be located in `src/components/DataViz`. These components act as wrappers around Highcharts to enforce design system styling (colors, fonts, tooltips) by default.

### Available Components
We provide a set of pre-configured components for common visualization needs:

1.  **`DonutChart`**: For part-to-whole relationships (e.g., Progress).
2.  **`LineChart`**: For trends over time.
3.  **`AreaChart`**: For viewing volume or magnitude trends.
4.  **`BarChart`**: For category comparisons (supports vertical and horizontal).
5.  **`SmartBarChart`**: Specialized "Target vs Value" bar (Pill style).
6.  **`StackedBarChart`**: For stacked categorical data.
7.  **`ComboChart`**: For mixing Bars and Lines (Dual axis).
8.  **`ScatterChart`**: For correlation analysis.

### Component Implementation

When creating a new chart component:
1.  Import `Highcharts` and `HighchartsReact`.
2.  Import `chartTheme` from `./chartTheme`.
3.  Inject data via props.
4.  Apply `...chartTheme` to your options object.

### Example

```jsx
import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from './chartTheme';

const MyChart = ({ data }) => {
  const options = {
    ...chartTheme, // Apply global theme
    chart: { type: 'column', ...chartTheme.chart },
    title: { text: 'My Chart' },
    series: [{ data }]
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
};
export default MyChart;
```
