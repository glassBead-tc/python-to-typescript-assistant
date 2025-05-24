# Python-to-TypeScript Porting Examples

This directory contains example Srcbook (`.src.md`) files that demonstrate systematic Python-to-TypeScript porting workflows using the MCP server tools.

## What Are These Examples?

These are **reference workflows** that show models (and developers) how to:

1. **Use the right tools in the right order** for different complexity levels
2. **Leverage Python 3.9+ features** for optimal TypeScript migration
3. **Structure porting notebooks** with proper validation and testing
4. **Handle common migration patterns** systematically

## Available Examples

### 📁 `srcbooks/`

| Example | Complexity | Focus | Tools Used |
|---------|------------|-------|------------|
| `utility-functions-migration.src.md` | **Low** | Basic patterns, simple types | `type-analysis`, `pattern-mapping` |
| `data-processing-migration.src.md` | **Moderate** | Python 3.9+ features, complex types | `porting-strategy`, `type-analysis`, `pattern-mapping`, `library-mapping` |
| `flask-api-porting.src.md` | **High** | Full-stack application porting | All tools + comprehensive validation |

## How Models Use These Examples

When a model encounters a Python-to-TypeScript porting task, it can:

1. **Access examples via MCP resources**: `examples://porting-workflows`
2. **Choose appropriate complexity level** based on the code being ported
3. **Follow the tool usage patterns** demonstrated in the examples
4. **Adapt the workflow structure** to the specific porting task

## Tool Usage Patterns Demonstrated

### Simple Utilities (Start Here)
```
1. type-analysis → Basic type mappings
2. pattern-mapping → List comprehensions, dict operations  
3. Quick validation testing
```

### Data Processing
```
1. porting-strategy → Complexity analysis
2. type-analysis → Union types, built-in generics
3. pattern-mapping → Dict merge operators, advanced patterns
4. library-mapping → Alternative libraries
5. Comprehensive testing
```

### Web Applications  
```
1. porting-strategy → Full project analysis
2. library-mapping → Framework alternatives
3. type-analysis → API types, request/response
4. pattern-mapping → Decorators, routing
5. Integration testing and validation
```

## Python 3.9+ Optimization Benefits

These examples showcase why Python 3.9+ is ideal for TypeScript migration:

✨ **Perfect Union Syntax**: `str | None` → `string | null`  
✨ **Built-in Generics**: `list[str]` → `string[]` (no imports!)  
✨ **Dict Merge Operators**: `config | updates` → `{...config, ...updates}`  
✨ **Type Clarity**: Modern syntax aligns with TypeScript patterns  

## Example Structure

Each Srcbook follows this pattern:

```markdown
<!-- srcbook:{"language":"typescript"} -->

# Title

###### package.json
```json
{ dependencies and devDependencies }
```

## Strategy Overview
- Complexity assessment
- Tools needed
- Risk analysis

## Original Python Code
- Modern Python 3.9+ examples
- Type annotations
- Real-world patterns

## Tool Usage Analysis
- type-analysis results
- pattern-mapping conversions
- library-mapping alternatives

## TypeScript Conversion
- Type definitions
- Implementation
- Testing

## Migration Notes
- What worked perfectly
- Key differences handled
- Performance considerations
```

## Usage in MCP Server

These examples are automatically registered as resources when the MCP server starts:

- **Main overview**: `examples://porting-workflows`
- **Individual examples**: `examples://srcbooks/{example-id}`

Models can reference these to understand:
- When to use which tools
- How to structure systematic porting workflows
- Best practices for Python 3.9+ → TypeScript migration

## Contributing

When adding new examples:

1. Follow the established structure
2. Focus on specific complexity levels or patterns
3. Demonstrate clear tool usage sequences
4. Include comprehensive validation approaches
5. Highlight Python 3.9+ optimization benefits

These examples serve as **living documentation** of best practices for systematic Python-to-TypeScript migration using the MCP server tools. 