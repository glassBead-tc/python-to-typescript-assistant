# Python-to-TypeScript Porting Data Files

This directory contains structured data files that power the Python-to-TypeScript porting MCP server. These files externalize the knowledge base from hardcoded implementations, making the server more maintainable and extensible.

## File Structure

### Core Mapping Databases

#### `library-mappings.json`
**Purpose**: Comprehensive mapping of Python libraries to TypeScript/JavaScript equivalents

**Structure**:
- Organized by categories (web_frameworks, data_processing, http_clients, etc.)
- Each mapping includes:
  - Confidence levels (high/medium/low)
  - Installation commands
  - Migration guides
  - API differences
  - Architectural considerations

**Usage**: Powers the `library-mapping` tool to suggest TypeScript alternatives for Python packages.

**Example**:
```json
{
  "web_frameworks": {
    "flask": {
      "typeScriptEquivalents": [
        {
          "name": "Express.js",
          "confidence": "high",
          "installCommand": "npm install express @types/express"
        }
      ]
    }
  }
}
```

#### `type-mappings.json`
**Purpose**: Detailed mappings between Python and TypeScript type systems

**Structure**:
- `builtin_types`: Python built-ins → TypeScript equivalents
- `standard_library`: Python stdlib types → TypeScript/JS equivalents  
- `typing_module`: Python typing module → TypeScript type constructs
- `complex_mappings`: Strategies for complex type transformations

**Usage**: Powers the `type-analysis` tool for intelligent type conversion suggestions.

**Key Features**:
- Runtime considerations
- Testing approaches by complexity
- Alternative type options
- Confidence scoring

#### `patterns.json`
**Purpose**: Language pattern conversions (list comprehensions, decorators, etc.)

**Structure**:
- `language_patterns`: Array of pattern mappings
- Each pattern includes:
  - Python syntax example
  - TypeScript equivalent
  - Complexity level
  - Caveats and gotchas
  - Multiple examples

**Usage**: Powers the `pattern-mapping` tool for converting Python idioms to TypeScript.

#### `stdlib-mappings.json`
**Purpose**: Complete Python standard library to JavaScript/TypeScript mapping

**Structure**:
- Organized by Python modules (`builtins`, `os`, `sys`, `json`, etc.)
- Each function/class mapped to JS equivalent
- Includes usage examples and notes

**Usage**: Quick reference for converting Python standard library usage.

### Supporting Data

#### `testing-strategies.json`
**Purpose**: Testing approaches organized by migration complexity and pattern types

**Structure**:
- `by_complexity`: Testing strategies for trivial → requires_redesign
- `by_pattern_type`: Specific approaches for data structures, control flow, etc.
- `validation_frameworks`: Differential testing, property-based testing, etc.
- `test_data_strategies`: Boundary values, representative samples, error conditions

**Usage**: Powers the `validation` tool and provides testing guidance.

#### `python-version-compatibility.json`
**Purpose**: Python version-specific typing features and migration considerations

**Structure**:
- `python_versions`: Version-specific typing features (3.7 → 3.11)
- `typescript_compatibility`: Mapping recommendations by Python version
- `migration_strategies`: Approaches for legacy vs modern Python
- `real_world_usage`: Insights from py-ts-interfaces and typed Python articles
- `tooling_recommendations`: Development environment setup

**Usage**: Helps tools provide version-aware type mappings and migration strategies.

#### `README.md` (this file)
**Purpose**: Documentation and usage guidelines for the data directory

## Data Usage Patterns

### Loading Data in Tools
Tools should load data files and cache them for performance:

```typescript
import libraryMappings from '../data/library-mappings.json';
import typeMappings from '../data/type-mappings.json';

class LibraryMapper {
  private mappings = libraryMappings;
  
  findMapping(pythonLib: string) {
    // Use this.mappings instead of hardcoded data
  }
}
```

### Extending the Data
To add new mappings:

1. **Library Mappings**: Add new entries under appropriate categories
2. **Type Mappings**: Add to the correct section (builtin_types, standard_library, etc.)
3. **Patterns**: Add new pattern objects to the language_patterns array
4. **Testing**: Add strategies for new complexity levels or pattern types

### Data Validation
Consider adding JSON Schema validation for data files to ensure consistency:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "pythonLibrary": { "type": "string" },
    "confidence": { "enum": ["high", "medium", "low"] }
  }
}
```

## Benefits of External Data Files

### Maintainability
- Easy to update mappings without touching code
- Clear separation of data and logic
- Version control tracks data changes

### Extensibility  
- Add new libraries without code changes
- Community can contribute mappings via PRs
- A/B test different mapping strategies

### Consistency
- Standardized data structure across tools
- Shared confidence levels and patterns
- Consistent terminology and categorization

### Performance
- JSON files load faster than code evaluation
- Can be cached and pre-processed
- Enable build-time optimizations

## Future Enhancements

### Planned Data Files
- `migration-templates.json`: Code transformation templates
- `compatibility-matrix.json`: Python/TypeScript version compatibility
- `performance-benchmarks.json`: Expected performance characteristics
- `error-patterns.json`: Common migration errors and solutions

### Data Sources
- Community contributions
- Automated extraction from documentation
- Analysis of successful migration projects
- Static analysis of popular Python packages

### Quality Assurance
- Automated testing of mappings
- Confidence score validation
- Link checking for documentation references
- Regular updates for new library versions

## Contributing

When adding or updating data:

1. **Follow existing structure** - Match the patterns in existing files
2. **Include examples** - Provide code examples for clarity
3. **Add confidence scores** - Be honest about mapping quality
4. **Document caveats** - Note important differences or limitations
5. **Test thoroughly** - Verify mappings work in practice

The data files are the knowledge base that makes this MCP server valuable - high-quality, comprehensive data directly improves the porting experience.

## Web-Grounded Validation

These data files have been validated and enhanced using real-world sources:

### Primary Sources
- **[Typed Python for TypeScript Developers](https://python.plainenglish.io/typed-python-for-typescript-developers-791145e7171c)**: Comprehensive guide covering Python 3.9+ typing features, development environment setup, and practical type mapping examples
- **[py-ts-interfaces GitHub Project](https://github.com/cs-cordero/py-ts-interfaces)**: Proven type mappings from a production Python-to-TypeScript interface generator, including detailed supported type conversion table

### Key Validation Points
1. **Type Mappings**: Confirmed against py-ts-interfaces' production mappings (None→null, str→string, etc.)
2. **Python Version Features**: Incorporated Python 3.9 built-in generic types (list[T], dict[K,V]) vs older typing imports
3. **Development Environment**: Added VS Code + Pylance recommendations from TypeScript developers article
4. **Real-World Patterns**: Enhanced dataclass and TypedDict patterns based on proven conversion approaches
5. **Optional Handling**: Clarified None→null vs undefined semantics based on practical usage

### Confidence Scoring
- **High confidence**: Mappings validated by multiple sources and production usage
- **Medium confidence**: Mappings with known limitations but practical alternatives  
- **Low confidence**: Mappings requiring significant manual work or architectural changes

This grounding ensures our data reflects real-world migration challenges and proven solutions rather than theoretical mappings. 