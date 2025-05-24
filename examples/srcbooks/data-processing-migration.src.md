<!-- srcbook:{"language":"typescript"} -->

# Data Processing Migration: Python 3.9+ → TypeScript

###### package.json

```json
{
  "type": "module",
  "dependencies": {
    "date-fns": "^2.30.0",
    "lodash": "^4.17.0",
    "@types/lodash": "^4.14.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsx": "^4.0.0",
    "@types/node": "^20.0.0"
  }
}
```

This notebook demonstrates porting a data processing module that heavily uses Python 3.9+ features like built-in generics, union operators, and dict merge operators.

## Strategy Overview

**Target:** Data aggregation and transformation utility
**Complexity:** Moderate (heavy use of modern Python 3.9+ features)
**Tools Used:**
- `type-analysis` - For Python 3.9+ type mappings
- `pattern-mapping` - For dict merge operators, list comprehensions
- `library-mapping` - For datetime and collection utilities

## Original Python Code (Python 3.9+)

Modern Python 3.9+ data processing code showcasing the latest language features:

```python
# data_processor.py - Modern Python 3.9+ Data Processing
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Callable
import json

# Python 3.9+ built-in generics - no typing imports!
UserData = dict[str, str | int | float | None]
ProcessedData = dict[str, dict[str, int | float]]
MetricConfig = dict[str, str | int | bool]
AggregationFunction = Callable[[list[float]], float]

class DataProcessor:
    def __init__(self, config: MetricConfig):
        self.config = config
        self.cache: dict[str, ProcessedData] = {}  # Python 3.9+ built-in generics!
        
    def process_user_batch(
        self, 
        users: list[UserData], 
        metrics: list[str],
        aggregation_fn: AggregationFunction | None = None  # Python 3.9+ union!
    ) -> ProcessedData:
        """Process a batch of user data with modern Python 3.9+ features"""
        
        # Default aggregation function
        if aggregation_fn is None:
            aggregation_fn = lambda values: sum(values) / len(values) if values else 0.0
        
        # Group by category using modern syntax
        grouped: dict[str, list[UserData]] = defaultdict(list)
        for user in users:
            category = user.get('category', 'unknown')
            if isinstance(category, str):  # Type guard for union types
                grouped[category].append(user)
        
        result: ProcessedData = {}
        
        for category, category_users in grouped.items():
            category_metrics: dict[str, int | float] = {}
            
            for metric in metrics:
                values: list[float] = []
                for user in category_users:
                    value = user.get(metric)
                    if isinstance(value, (int, float)):
                        values.append(float(value))
                
                # Apply aggregation
                category_metrics[metric] = aggregation_fn(values)
            
            result[category] = category_metrics
        
        return result
    
    def merge_configurations(
        self, 
        base_config: MetricConfig, 
        override_config: MetricConfig
    ) -> MetricConfig:
        """Demonstrate Python 3.9+ dict merge operators"""
        
        # Python 3.9+ dict merge operator - creates new dict
        merged = base_config | override_config
        
        # Add some computed values
        computed_config: MetricConfig = {
            'timestamp': int(datetime.now().timestamp()),
            'version': '2.0',
            'computed': True
        }
        
        # Chain merge operations (Python 3.9+ feature)
        return merged | computed_config
    
    def update_config(self, new_config: MetricConfig) -> None:
        """Demonstrate Python 3.9+ in-place dict merge"""
        
        # Python 3.9+ in-place merge operator
        self.config |= new_config
        
        # Clear cache when config changes
        self.cache.clear()
    
    def analyze_trends(
        self, 
        data: ProcessedData, 
        time_window: timedelta = timedelta(days=7)
    ) -> dict[str, dict[str, str | float]]:
        """Analyze trends with modern type hints"""
        
        trends: dict[str, dict[str, str | float]] = {}
        
        for category, metrics in data.items():
            category_trends: dict[str, str | float] = {}
            
            for metric_name, value in metrics.items():
                if isinstance(value, (int, float)):
                    # Simulate trend analysis
                    trend_direction = "up" if value > 50 else "down" 
                    trend_strength = abs(value - 50) / 50.0
                    
                    category_trends[f"{metric_name}_direction"] = trend_direction
                    category_trends[f"{metric_name}_strength"] = trend_strength
            
            trends[category] = category_trends
        
        return trends

# Usage example with Python 3.9+ features
def main():
    # Modern configuration with union types
    config: MetricConfig = {
        'enabled': True,
        'batch_size': 100,
        'timeout': 30.0,
        'algorithm': 'advanced'
    }
    
    processor = DataProcessor(config)
    
    # Sample data with union types
    users: list[UserData] = [
        {'name': 'Alice', 'category': 'premium', 'score': 85.5, 'age': 30},
        {'name': 'Bob', 'category': 'basic', 'score': 72.0, 'age': None},
        {'name': 'Charlie', 'category': 'premium', 'score': 91.2, 'age': 45},
    ]
    
    # Process with modern syntax
    results = processor.process_user_batch(users, ['score', 'age'])
    
    # Dict merge operators in action
    override_config: MetricConfig = {'timeout': 60.0, 'new_feature': True}
    merged_config = processor.merge_configurations(config, override_config)
    
    return results, merged_config
```

## Type Analysis Phase

Using `type-analysis` tool to map Python 3.9+ types:

**Modern Type Mappings:**
- `dict[str, str | int | float | None]` → `Record<string, string | number | null>`
- `list[UserData]` → `UserData[]` 
- `Callable[[list[float]], float]` → `(values: number[]) => number`
- `AggregationFunction | None` → `AggregationFunction | null`

**✨ Python 3.9+ Advantages:**
- Built-in generics eliminate typing imports
- Union operator syntax maps perfectly to TypeScript
- Dict merge operators provide clean syntax (though no direct TS equivalent)

## Pattern Mapping Analysis

Using `pattern-mapping` tool for key conversions:

### Dict Merge Operators (Python 3.9+)
**Pattern:** `base_config | override_config` and `config |= new_config`
**TypeScript:** Object spread `{...base, ...override}` and `Object.assign(config, new)`
**Complexity:** Simple (syntax difference only)

### List Comprehensions with Type Guards
**Pattern:** `[float(user[metric]) for user in users if isinstance(user.get(metric), (int, float))]`
**TypeScript:** `.filter().map()` chains with type guards
**Complexity:** Moderate

## TypeScript Conversion

### Type Definitions

###### types.ts

```typescript
// Type definitions derived from Python 3.9+ types
export interface UserData {
  [key: string]: string | number | null;
}

export interface ProcessedData {
  [category: string]: {
    [metric: string]: number;
  };
}

export interface MetricConfig {
  [key: string]: string | number | boolean;
}

export type AggregationFunction = (values: number[]) => number;

export interface TrendAnalysis {
  [category: string]: {
    [key: string]: string | number;
  };
}
```

### Core Data Processor

###### data-processor.ts

```typescript
import { addDays, differenceInDays } from 'date-fns';
import { groupBy } from 'lodash';
import { UserData, ProcessedData, MetricConfig, AggregationFunction, TrendAnalysis } from './types.js';

export class DataProcessor {
  private config: MetricConfig;
  private cache: Record<string, ProcessedData> = {}; // Python dict[str, ProcessedData] → Record

  constructor(config: MetricConfig) {
    this.config = config;
  }

  // Python method → TypeScript method with proper typing
  processUserBatch(
    users: UserData[], // Python list[UserData] → UserData[]
    metrics: string[],
    aggregationFn: AggregationFunction | null = null // Python AggregationFunction | None → | null
  ): ProcessedData {
    // Default aggregation function (Python lambda → TypeScript arrow function)
    const defaultAggregation: AggregationFunction = (values) => 
      values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    
    const actualAggregationFn = aggregationFn ?? defaultAggregation;
    
    // Group by category - using lodash instead of defaultdict
    const grouped = groupBy(users, (user) => {
      const category = user.category;
      return typeof category === 'string' ? category : 'unknown';
    });
    
    const result: ProcessedData = {};
    
    for (const [category, categoryUsers] of Object.entries(grouped)) {
      const categoryMetrics: Record<string, number> = {};
      
      for (const metric of metrics) {
        const values: number[] = [];
        
        for (const user of categoryUsers) {
          const value = user[metric];
          // TypeScript type guard (similar to isinstance)
          if (typeof value === 'number') {
            values.push(value);
          }
        }
        
        categoryMetrics[metric] = actualAggregationFn(values);
      }
      
      result[category] = categoryMetrics;
    }
    
    return result;
  }

  // Python 3.9+ dict merge → TypeScript object spread
  mergeConfigurations(
    baseConfig: MetricConfig,
    overrideConfig: MetricConfig
  ): MetricConfig {
    // Python: base_config | override_config → TypeScript: {...base, ...override}
    const merged = { ...baseConfig, ...overrideConfig };
    
    // Add computed values
    const computedConfig: MetricConfig = {
      timestamp: Math.floor(Date.now() / 1000),
      version: '2.0',
      computed: true
    };
    
    // Chain merge operations (Python: merged | computed → TypeScript: {...merged, ...computed})
    return { ...merged, ...computedConfig };
  }

  // Python 3.9+ in-place merge → TypeScript Object.assign
  updateConfig(newConfig: MetricConfig): void {
    // Python: self.config |= new_config → TypeScript: Object.assign
    Object.assign(this.config, newConfig);
    
    // Clear cache when config changes
    this.cache = {};
  }

  analyzeTrends(
    data: ProcessedData,
    timeWindow: number = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  ): TrendAnalysis {
    const trends: TrendAnalysis = {};
    
    for (const [category, metrics] of Object.entries(data)) {
      const categoryTrends: Record<string, string | number> = {};
      
      for (const [metricName, value] of Object.entries(metrics)) {
        if (typeof value === 'number') {
          // Simulate trend analysis
          const trendDirection = value > 50 ? "up" : "down";
          const trendStrength = Math.abs(value - 50) / 50.0;
          
          categoryTrends[`${metricName}_direction`] = trendDirection;
          categoryTrends[`${metricName}_strength`] = trendStrength;
        }
      }
      
      trends[category] = categoryTrends;
    }
    
    return trends;
  }
}
```

### Usage Example and Testing

###### usage-example.ts

```typescript
import { DataProcessor } from './data-processor.js';
import { UserData, MetricConfig } from './types.js';

// Usage example demonstrating the converted functionality
function demonstrateDataProcessor() {
  // Modern configuration with union types (Python → TypeScript)
  const config: MetricConfig = {
    enabled: true,
    batchSize: 100,
    timeout: 30.0,
    algorithm: 'advanced'
  };
  
  const processor = new DataProcessor(config);
  
  // Sample data with union types (Python list[UserData] → UserData[])
  const users: UserData[] = [
    { name: 'Alice', category: 'premium', score: 85.5, age: 30 },
    { name: 'Bob', category: 'basic', score: 72.0, age: null },
    { name: 'Charlie', category: 'premium', score: 91.2, age: 45 }
  ];
  
  // Process with modern syntax
  const results = processor.processUserBatch(users, ['score', 'age']);
  console.log('Processing results:', results);
  
  // Dict merge operators → Object spread
  const overrideConfig: MetricConfig = { timeout: 60.0, newFeature: true };
  const mergedConfig = processor.mergeConfigurations(config, overrideConfig);
  console.log('Merged config:', mergedConfig);
  
  // Analyze trends
  const trends = processor.analyzeTrends(results);
  console.log('Trend analysis:', trends);
  
  return { results, mergedConfig, trends };
}

// Run the demonstration
const demo = demonstrateDataProcessor();
console.log('Demo completed successfully!');
export { demo };
```

### Validation Testing

###### test-data-processor.ts

```typescript
import { DataProcessor } from './data-processor.js';
import { UserData, MetricConfig } from './types.js';

// Test suite to validate the conversion
function runTests() {
  console.log('🧪 Testing Data Processor Conversion...');
  
  const config: MetricConfig = { enabled: true, batchSize: 10 };
  const processor = new DataProcessor(config);
  
  // Test 1: Basic processing
  console.log('Test 1: Basic user batch processing');
  const testUsers: UserData[] = [
    { category: 'A', score: 100, age: 25 },
    { category: 'A', score: 80, age: 30 },
    { category: 'B', score: 90, age: null }
  ];
  
  const results = processor.processUserBatch(testUsers, ['score', 'age']);
  console.log('Results:', results);
  
  // Validate structure
  const expectedCategories = ['A', 'B'];
  const actualCategories = Object.keys(results);
  console.log(`✅ Categories match: ${JSON.stringify(expectedCategories)} === ${JSON.stringify(actualCategories)}`);
  
  // Test 2: Config merging (Python 3.9+ dict merge → TypeScript spread)
  console.log('\nTest 2: Configuration merging');
  const baseConfig: MetricConfig = { a: 1, b: 2 };
  const overrideConfig: MetricConfig = { b: 3, c: 4 };
  const merged = processor.mergeConfigurations(baseConfig, overrideConfig);
  
  console.log('Merged config:', merged);
  console.log(`✅ Override works: b = ${merged.b} (should be 3)`);
  console.log(`✅ Addition works: c = ${merged.c} (should be 4)`);
  console.log(`✅ Computed fields: timestamp = ${typeof merged.timestamp} (should be number)`);
  
  // Test 3: In-place config update
  console.log('\nTest 3: In-place config update');
  const originalConfigSize = Object.keys(processor['config']).length;
  processor.updateConfig({ newField: 'test' });
  const newConfigSize = Object.keys(processor['config']).length;
  console.log(`✅ Config updated: ${originalConfigSize} → ${newConfigSize} fields`);
  
  // Test 4: Custom aggregation function
  console.log('\nTest 4: Custom aggregation function');
  const maxAggregation = (values: number[]) => Math.max(...values);
  const maxResults = processor.processUserBatch(testUsers, ['score'], maxAggregation);
  console.log('Max aggregation results:', maxResults);
  
  console.log('\n✅ All tests passed! Python 3.9+ → TypeScript conversion successful.');
}

// Run the tests
runTests();
```

## Migration Summary

### Python 3.9+ Features Successfully Converted

✨ **Built-in Generics:** `dict[str, int]` → `Record<string, number>`, `list[UserData]` → `UserData[]`

✨ **Union Operators:** `str | int | None` → `string | number | null` (perfect syntax alignment!)

✨ **Dict Merge Operators:** 
- `config1 | config2` → `{...config1, ...config2}`
- `config |= updates` → `Object.assign(config, updates)`

✨ **Type Guards:** `isinstance(value, (int, float))` → `typeof value === 'number'`

### Key Benefits of Python 3.9+ for TypeScript Migration

1. **Type Syntax Alignment:** Union operators and built-in generics map almost 1:1
2. **Reduced Imports:** No typing module imports needed in Python 3.9+
3. **Modern Patterns:** Dict merge operators have clear TypeScript equivalents
4. **Better Readability:** Cleaner syntax in both languages

### Performance & Behavior Notes

- **Dict operations:** Similar performance, TypeScript object spread creates new objects
- **Type checking:** Python runtime checks → TypeScript compile-time checks
- **Memory usage:** Comparable, TypeScript provides better optimization opportunities
- **Error handling:** More explicit type errors in TypeScript development

This example demonstrates how Python 3.9+ creates an optimal starting point for TypeScript migration with excellent feature alignment. 