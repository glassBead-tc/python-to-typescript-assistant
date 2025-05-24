export const NUMPY_EXAMPLES = {
  "numpy-to-typescript-data": {
    title: "🔢 NumPy Data Processing to TypeScript",
    content: `# NumPy Data Processing to TypeScript

## Overview

Converting Python data science workflows using NumPy and Pandas to TypeScript equivalents, based on real-world data analysis patterns.

## Python NumPy/Pandas Original

\`\`\`python
import numpy as np
import pandas as pd
from typing import List, Dict, Union, Optional, Literal
from dataclasses import dataclass
from enum import Enum

# Data structures for analysis
@dataclass
class DataPoint:
    timestamp: float
    value: float
    category: str
    metadata: Optional[Dict[str, Union[str, float]]] = None

class AggregationType(Enum):
    MEAN = "mean"
    SUM = "sum"
    COUNT = "count"
    MIN = "min"
    MAX = "max"

class DataProcessor:
    def __init__(self, data: List[DataPoint]):
        self.data = data
        self.df = self._to_dataframe()
    
    def _to_dataframe(self) -> pd.DataFrame:
        """Convert data points to pandas DataFrame"""
        return pd.DataFrame([
            {
                'timestamp': dp.timestamp,
                'value': dp.value,
                'category': dp.category,
                **(dp.metadata or {})
            } for dp in self.data
        ])
    
    def aggregate_by_category(
        self, 
        agg_type: AggregationType
    ) -> Dict[str, float]:
        """Aggregate values by category"""
        if agg_type == AggregationType.MEAN:
            result = self.df.groupby('category')['value'].mean()
        elif agg_type == AggregationType.SUM:
            result = self.df.groupby('category')['value'].sum()
        elif agg_type == AggregationType.COUNT:
            result = self.df.groupby('category')['value'].count()
        elif agg_type == AggregationType.MIN:
            result = self.df.groupby('category')['value'].min()
        elif agg_type == AggregationType.MAX:
            result = self.df.groupby('category')['value'].max()
        
        return result.to_dict()
    
    def time_series_analysis(
        self, 
        window_size: int = 5
    ) -> np.ndarray:
        """Calculate rolling average"""
        sorted_df = self.df.sort_values('timestamp')
        return np.convolve(
            sorted_df['value'].values, 
            np.ones(window_size) / window_size, 
            mode='valid'
        )
    
    def statistical_summary(self) -> Dict[str, float]:
        """Calculate statistical measures"""
        values = self.df['value'].values
        return {
            'mean': np.mean(values),
            'std': np.std(values),
            'median': np.median(values),
            'q25': np.percentile(values, 25),
            'q75': np.percentile(values, 75),
            'min': np.min(values),
            'max': np.max(values)
        }

# Usage example
data_points = [
    DataPoint(1609459200, 25.5, "sensor_a", {"location": "north"}),
    DataPoint(1609462800, 27.2, "sensor_b", {"location": "south"}),
    DataPoint(1609466400, 23.1, "sensor_a", {"location": "north"}),
]

processor = DataProcessor(data_points)
category_means = processor.aggregate_by_category(AggregationType.MEAN)
rolling_avg = processor.time_series_analysis(window_size=3)
stats = processor.statistical_summary()
\`\`\`

## TypeScript Equivalent Implementation

### 1. Type Definitions

\`\`\`typescript
// Data structures - exact TypeScript equivalents
export interface DataPoint {
  timestamp: number; // Unix timestamp as number
  value: number;
  category: string;
  metadata?: Record<string, string | number> | null;
}

export type AggregationType = 'mean' | 'sum' | 'count' | 'min' | 'max';

export interface StatisticalSummary {
  mean: number;
  std: number;
  median: number;
  q25: number;
  q75: number;
  min: number;
  max: number;
}

export type CategoryAggregation = Record<string, number>;
\`\`\`

### 2. Core Data Processing Class

\`\`\`typescript
// Utility functions for statistical operations (replacing NumPy)
class MathUtils {
  static mean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  static sum(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0);
  }

  static std(values: number[]): number {
    const avg = this.mean(values);
    const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
    return Math.sqrt(this.mean(squaredDiffs));
  }

  static median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  static percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) return sorted[lower];
    
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  static convolve(data: number[], kernel: number[]): number[] {
    const result: number[] = [];
    for (let i = 0; i <= data.length - kernel.length; i++) {
      let sum = 0;
      for (let j = 0; j < kernel.length; j++) {
        sum += data[i + j] * kernel[j];
      }
      result.push(sum);
    }
    return result;
  }
}

// Group operations (replacing pandas groupby)
class GroupOperations {
  static groupBy<T, K extends keyof T>(
    items: T[], 
    key: K
  ): Map<T[K], T[]> {
    const groups = new Map<T[K], T[]>();
    
    for (const item of items) {
      const groupKey = item[key];
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(item);
    }
    
    return groups;
  }

  static aggregateGroups<T>(
    groups: Map<string, T[]>,
    valueExtractor: (item: T) => number,
    aggregationType: AggregationType
  ): Record<string, number> {
    const result: Record<string, number> = {};

    for (const [groupKey, groupItems] of groups) {
      const values = groupItems.map(valueExtractor);
      
      switch (aggregationType) {
        case 'mean':
          result[groupKey] = MathUtils.mean(values);
          break;
        case 'sum':
          result[groupKey] = MathUtils.sum(values);
          break;
        case 'count':
          result[groupKey] = values.length;
          break;
        case 'min':
          result[groupKey] = Math.min(...values);
          break;
        case 'max':
          result[groupKey] = Math.max(...values);
          break;
      }
    }

    return result;
  }
}

// Main data processor class
export class DataProcessor {
  constructor(private data: DataPoint[]) {}

  aggregateByCategory(aggType: AggregationType): CategoryAggregation {
    const groups = GroupOperations.groupBy(this.data, 'category');
    return GroupOperations.aggregateGroups(
      groups,
      (dp: DataPoint) => dp.value,
      aggType
    );
  }

  timeSeriesAnalysis(windowSize: number = 5): number[] {
    // Sort by timestamp (equivalent to pandas sort_values)
    const sortedData = [...this.data].sort((a, b) => a.timestamp - b.timestamp);
    const values = sortedData.map(dp => dp.value);
    
    // Create moving average kernel (equivalent to np.ones(windowSize) / windowSize)
    const kernel = new Array(windowSize).fill(1 / windowSize);
    
    return MathUtils.convolve(values, kernel);
  }

  statisticalSummary(): StatisticalSummary {
    const values = this.data.map(dp => dp.value);
    
    return {
      mean: MathUtils.mean(values),
      std: MathUtils.std(values),
      median: MathUtils.median(values),
      q25: MathUtils.percentile(values, 25),
      q75: MathUtils.percentile(values, 75),
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  // Additional utility method for data export/visualization
  toCsvString(): string {
    const headers = ['timestamp', 'value', 'category', 'metadata'];
    const rows = this.data.map(dp => [
      dp.timestamp.toString(),
      dp.value.toString(),
      dp.category,
      JSON.stringify(dp.metadata || {})
    ]);
    
    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\\n');
  }
}
\`\`\`

### 3. Usage Example

\`\`\`typescript
// Exact equivalent usage
export function demonstrateDataProcessing() {
  const dataPoints: DataPoint[] = [
    { timestamp: 1609459200, value: 25.5, category: "sensor_a", metadata: { location: "north" }},
    { timestamp: 1609462800, value: 27.2, category: "sensor_b", metadata: { location: "south" }},
    { timestamp: 1609466400, value: 23.1, category: "sensor_a", metadata: { location: "north" }},
  ];

  const processor = new DataProcessor(dataPoints);
  
  // Aggregation operations
  const categoryMeans = processor.aggregateByCategory('mean');
  console.log('Category means:', categoryMeans);
  
  // Time series analysis  
  const rollingAvg = processor.timeSeriesAnalysis(3);
  console.log('Rolling average:', rollingAvg);
  
  // Statistical summary
  const stats = processor.statisticalSummary();
  console.log('Statistics:', stats);
  
  // TypeScript provides compile-time type safety
  const meanValue: number = stats.mean; // ✅ Type-safe
  const categories: string[] = Object.keys(categoryMeans); // ✅ Type-safe
}
\`\`\`

## Key Conversion Patterns

### NumPy → Native JavaScript/TypeScript

| NumPy Function | TypeScript Equivalent | Implementation |
|---------------|----------------------|----------------|
| \`np.mean()\` | \`MathUtils.mean()\` | Array reduce with division |
| \`np.std()\` | \`MathUtils.std()\` | Variance calculation with sqrt |
| \`np.median()\` | \`MathUtils.median()\` | Sort and find middle value |
| \`np.percentile()\` | \`MathUtils.percentile()\` | Linear interpolation |
| \`np.convolve()\` | \`MathUtils.convolve()\` | Sliding window operation |
| \`np.min/max()\` | \`Math.min/max(...array)\` | Spread operator with Math |

### Pandas → Custom Operations

| Pandas Pattern | TypeScript Equivalent | Notes |
|---------------|----------------------|-------|
| \`df.groupby()\` | \`GroupOperations.groupBy()\` | Map-based grouping |
| \`df.agg()\` | \`GroupOperations.aggregateGroups()\` | Switch-based aggregation |
| \`df.sort_values()\` | \`[...array].sort()\` | Native array sort |
| \`df.to_dict()\` | Direct object mapping | Native JavaScript objects |

### Benefits of TypeScript Conversion

1. **Performance**: Eliminates Python interpreter overhead for data operations
2. **Type Safety**: Compile-time checking prevents data shape errors
3. **Deployment**: Single JavaScript runtime, no Python dependencies
4. **Integration**: Seamless with web frontends and Node.js backends
5. **Debugging**: Better stack traces and IDE support

### Considerations

- **Large Datasets**: For heavy numerical computation, keep Python/NumPy and expose via API
- **Specialized Functions**: Complex statistical functions may require libraries like ml-js
- **Memory Usage**: JavaScript numbers are all float64, plan accordingly
- **Testing**: Verify numerical precision matches Python implementations

This approach is successfully used by data visualization libraries and real-time analytics dashboards that need client-side data processing.`,
    tags: ["numpy", "pandas", "data-science", "mathematics", "analytics"],
    language: "typescript" as const
  }
}; 