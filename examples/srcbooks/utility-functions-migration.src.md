<!-- srcbook:{"language":"typescript"} -->

# Utility Functions Migration: Python 3.9+ → TypeScript

###### package.json

```json
{
  "type": "module",
  "dependencies": {
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsx": "^4.0.0",
    "@types/node": "^20.0.0"
  }
}
```

This notebook demonstrates migrating common utility functions using Python 3.9+ features. This is an excellent starting point for understanding the tool workflow with simpler, low-risk conversions.

## Quick Strategy Assessment

**Complexity Level:** Low (perfect for incremental migration start)  
**Risk Level:** Minimal (pure functions, no external dependencies)  
**Tools Needed:**
- `type-analysis` - For basic type mappings
- `pattern-mapping` - For list comprehensions and string operations
- Quick validation testing

## Original Python Utilities (Python 3.9+)

Simple but modern Python 3.9+ utility functions showcasing clean syntax:

```python
# utils.py - Modern Python 3.9+ Utilities
from datetime import datetime
from pathlib import Path

# Python 3.9+ type aliases with built-in generics
StringList = list[str]
NumberDict = dict[str, int | float]
OptionalString = str | None

def clean_and_validate_strings(
    inputs: list[str | None], 
    min_length: int = 1
) -> list[str]:
    """Clean and validate string inputs using Python 3.9+ features"""
    
    # List comprehension with union type handling
    cleaned = [
        s.strip() 
        for s in inputs 
        if s is not None and isinstance(s, str) and len(s.strip()) >= min_length
    ]
    
    return cleaned

def merge_user_preferences(
    defaults: dict[str, str | int | bool],
    user_prefs: dict[str, str | int | bool] | None = None
) -> dict[str, str | int | bool]:
    """Merge user preferences with defaults using Python 3.9+ dict merge"""
    
    if user_prefs is None:
        return defaults.copy()
    
    # Python 3.9+ dict merge operator
    return defaults | user_prefs

def calculate_stats(numbers: list[int | float]) -> dict[str, float]:
    """Calculate basic statistics with modern type hints"""
    
    if not numbers:
        return {'count': 0.0, 'mean': 0.0, 'min': 0.0, 'max': 0.0}
    
    return {
        'count': float(len(numbers)),
        'mean': sum(numbers) / len(numbers),
        'min': float(min(numbers)),
        'max': float(max(numbers))
    }

def format_file_sizes(
    file_paths: list[str | Path]
) -> dict[str, str | None]:
    """Format file sizes with path handling"""
    
    result: dict[str, str | None] = {}
    
    for path in file_paths:
        try:
            # Convert to Path object if string
            path_obj = Path(path) if isinstance(path, str) else path
            
            if path_obj.exists() and path_obj.is_file():
                size_bytes = path_obj.stat().st_size
                
                # Simple size formatting
                if size_bytes < 1024:
                    formatted = f"{size_bytes} B"
                elif size_bytes < 1024 * 1024:
                    formatted = f"{size_bytes / 1024:.1f} KB"
                else:
                    formatted = f"{size_bytes / (1024 * 1024):.1f} MB"
                
                result[str(path_obj)] = formatted
            else:
                result[str(path)] = None
                
        except Exception:
            result[str(path)] = None
    
    return result

def group_by_prefix(
    items: list[str], 
    separator: str = "_"
) -> dict[str, list[str]]:
    """Group strings by prefix using modern Python 3.9+ syntax"""
    
    grouped: dict[str, list[str]] = {}
    
    for item in items:
        if separator in item:
            prefix = item.split(separator, 1)[0]
        else:
            prefix = "no_prefix"
        
        if prefix not in grouped:
            grouped[prefix] = []
        
        grouped[prefix].append(item)
    
    return grouped

# Usage example
def demo():
    # Test data with union types
    mixed_strings: list[str | None] = ["  hello  ", None, "world", "", "  test  "]
    
    # Clean strings
    clean = clean_and_validate_strings(mixed_strings)
    
    # Merge preferences
    defaults = {"theme": "light", "notifications": True, "timeout": 30}
    user_settings = {"theme": "dark", "language": "en"}
    merged = merge_user_preferences(defaults, user_settings)
    
    # Calculate stats
    numbers = [1, 2, 3, 4, 5]
    stats = calculate_stats(numbers)
    
    return clean, merged, stats
```

## Type Analysis

Using `type-analysis` tool for the modern Python types:

**Simple Type Mappings:**
- `str | None` → `string | null` ✨ Perfect!
- `list[str]` → `string[]` ✨ Clean!
- `dict[str, int | float]` → `Record<string, number>` ✨ Direct!
- `list[str | Path]` → `(string | Path)[]` ✨ Union alignment!

**Migration Complexity:** Trivial to Simple

## Pattern Analysis 

Using `pattern-mapping` tool for conversion patterns:

### List Comprehensions
**Python:** `[s.strip() for s in inputs if s is not None and len(s) >= min_length]`  
**TypeScript:** `.filter().map()` chain  
**Complexity:** Simple

### Dict Merge (Python 3.9+)
**Python:** `defaults | user_prefs` ✨  
**TypeScript:** `{...defaults, ...user_prefs}`  
**Complexity:** Simple (perfect pattern alignment!)

## TypeScript Conversion

### Type Definitions

###### types.ts

```typescript
// Type definitions derived from Python 3.9+ types
export type StringList = string[];
export type NumberDict = Record<string, number>;
export type OptionalString = string | null;

export interface FileStats {
  count: number;
  mean: number;
  min: number;
  max: number;
}

export interface UserPreferences {
  [key: string]: string | number | boolean;
}
```

### Core Utility Functions

###### utils.ts

```typescript
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';

// Clean and validate strings (Python list comprehension → TypeScript filter/map)
export function cleanAndValidateStrings(
  inputs: (string | null)[], // Python list[str | None] → (string | null)[]
  minLength: number = 1
): string[] {
  // Python list comprehension → TypeScript filter + map chain
  return inputs
    .filter((s): s is string => s !== null && typeof s === 'string') // Type guard
    .map(s => s.trim())
    .filter(s => s.length >= minLength);
}

// Merge user preferences (Python 3.9+ dict merge → TypeScript spread)
export function mergeUserPreferences(
  defaults: UserPreferences,
  userPrefs?: UserPreferences | null // Python | None → | null
): UserPreferences {
  if (!userPrefs) {
    return { ...defaults }; // Copy defaults
  }
  
  // Python: defaults | user_prefs → TypeScript: {...defaults, ...userPrefs}
  return { ...defaults, ...userPrefs };
}

// Calculate statistics (direct translation with proper typing)
export function calculateStats(numbers: number[]): FileStats {
  if (numbers.length === 0) {
    return { count: 0, mean: 0, min: 0, max: 0 };
  }
  
  return {
    count: numbers.length,
    mean: numbers.reduce((sum, n) => sum + n, 0) / numbers.length,
    min: Math.min(...numbers),
    max: Math.max(...numbers)
  };
}

// Format file sizes (async for Node.js file operations)
export async function formatFileSizes(
  filePaths: string[]
): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};
  
  for (const filePath of filePaths) {
    try {
      const fullPath = resolve(filePath);
      const stats = await stat(fullPath);
      
      if (stats.isFile()) {
        const sizeBytes = stats.size;
        
        // Simple size formatting (same logic as Python)
        let formatted: string;
        if (sizeBytes < 1024) {
          formatted = `${sizeBytes} B`;
        } else if (sizeBytes < 1024 * 1024) {
          formatted = `${(sizeBytes / 1024).toFixed(1)} KB`;
        } else {
          formatted = `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
        }
        
        result[fullPath] = formatted;
      } else {
        result[filePath] = null;
      }
    } catch {
      result[filePath] = null;
    }
  }
  
  return result;
}

// Group by prefix (Python dict operations → TypeScript Record operations)
export function groupByPrefix(
  items: string[],
  separator: string = "_"
): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  
  for (const item of items) {
    const prefix = item.includes(separator) 
      ? item.split(separator, 1)[0] 
      : "no_prefix";
    
    if (!grouped[prefix]) {
      grouped[prefix] = [];
    }
    
    grouped[prefix].push(item);
  }
  
  return grouped;
}
```

### Usage Example and Demo

###### demo.ts

```typescript
import { 
  cleanAndValidateStrings, 
  mergeUserPreferences, 
  calculateStats, 
  formatFileSizes, 
  groupByPrefix 
} from './utils.js';
import type { UserPreferences } from './types.js';

// Demo function showing converted functionality
export async function runDemo() {
  console.log('🚀 Running TypeScript Utility Demo...');
  
  // Test 1: String cleaning (Python list comprehension → TypeScript filter/map)
  console.log('\n1. String Cleaning:');
  const mixedStrings: (string | null)[] = ["  hello  ", null, "world", "", "  test  "];
  const cleaned = cleanAndValidateStrings(mixedStrings);
  console.log('Input:', mixedStrings);
  console.log('Cleaned:', cleaned);
  
  // Test 2: Preference merging (Python 3.9+ dict merge → TypeScript spread)
  console.log('\n2. Preference Merging:');
  const defaults: UserPreferences = { theme: "light", notifications: true, timeout: 30 };
  const userSettings: UserPreferences = { theme: "dark", language: "en" };
  const merged = mergeUserPreferences(defaults, userSettings);
  console.log('Defaults:', defaults);
  console.log('User settings:', userSettings);
  console.log('Merged:', merged);
  
  // Test 3: Statistics calculation
  console.log('\n3. Statistics:');
  const numbers = [1, 2, 3, 4, 5];
  const stats = calculateStats(numbers);
  console.log('Numbers:', numbers);
  console.log('Stats:', stats);
  
  // Test 4: File size formatting (async in TypeScript)
  console.log('\n4. File Size Formatting:');
  try {
    const filePaths = ['./package.json', './nonexistent.txt'];
    const sizes = await formatFileSizes(filePaths);
    console.log('File sizes:', sizes);
  } catch (error) {
    console.log('File size error:', error);
  }
  
  // Test 5: Grouping by prefix
  console.log('\n5. Grouping by Prefix:');
  const items = ['user_alice', 'user_bob', 'admin_charlie', 'guest_diana', 'standalone'];
  const grouped = groupByPrefix(items);
  console.log('Items:', items);
  console.log('Grouped:', grouped);
  
  console.log('\n✅ Demo completed successfully!');
}

// Run the demo
runDemo().catch(console.error);
```

### Quick Validation Tests

###### test-utils.ts

```typescript
import { 
  cleanAndValidateStrings, 
  mergeUserPreferences, 
  calculateStats, 
  groupByPrefix 
} from './utils.js';

// Quick tests to validate conversion correctness
function runQuickTests() {
  console.log('🧪 Running Quick Validation Tests...');
  
  // Test 1: String cleaning edge cases
  console.log('\nTest 1: String cleaning');
  const result1 = cleanAndValidateStrings([null, "", "  ", "valid"], 1);
  console.log(`✅ Cleaned result: ${JSON.stringify(result1)} (expected: ["valid"])`);
  
  // Test 2: Preference merging overrides
  console.log('\nTest 2: Preference merging');
  const base = { a: 1, b: 2 };
  const override = { b: 3, c: 4 };
  const merged = mergeUserPreferences(base, override);
  console.log(`✅ Merged b=${merged.b} (expected: 3), c=${merged.c} (expected: 4)`);
  
  // Test 3: Empty array stats
  console.log('\nTest 3: Empty array statistics');
  const emptyStats = calculateStats([]);
  console.log(`✅ Empty stats count: ${emptyStats.count} (expected: 0)`);
  
  // Test 4: Basic grouping
  console.log('\nTest 4: Basic grouping');
  const grouped = groupByPrefix(['a_1', 'a_2', 'b_1']);
  const aGroup = grouped['a'];
  console.log(`✅ Group 'a' length: ${aGroup?.length} (expected: 2)`);
  
  console.log('\n✅ All quick tests passed!');
}

// Run tests
runQuickTests();
```

## Migration Assessment

### What Went Perfect ✨

**Type Syntax Alignment:**
- `str | None` → `string | null` (identical!)
- `list[str]` → `string[]` (clean and direct)
- `dict[str, int]` → `Record<string, number>` (clear mapping)

**Pattern Alignment:**
- Dict merge `|` → Object spread `{...}` (very similar)
- List comprehensions → `.filter().map()` (readable conversion)
- Type guards translate naturally

### Key Differences Handled

**Runtime vs Compile-time:**
- Python type hints → TypeScript static types
- Runtime `isinstance()` → Compile-time type guards

**Async Operations:**
- File operations became async (Node.js pattern)
- Promise handling for file stats

**Library Differences:**
- Python `pathlib.Path` → Node.js `path` module
- Different but equivalent functionality

### Migration Strategy Success

This demonstrates the **incremental approach** working perfectly:

1. **Low risk** - Pure utility functions
2. **High confidence** - Simple type mappings
3. **Easy validation** - Pure function testing
4. **Quick wins** - Immediate productivity

### Python 3.9+ Advantages for Migration

✨ **Syntax Harmony:** Modern Python aligns beautifully with TypeScript  
✨ **Type Clarity:** Built-in generics eliminate import confusion  
✨ **Pattern Consistency:** Union types and dict operations translate cleanly  

This example shows how Python 3.9+ creates an ideal migration starting point with simple, reliable conversions that build confidence for tackling more complex modules. 