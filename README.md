# 🐍➡️📘 Python-to-TypeScript Porting MCP Server

A comprehensive Model Context Protocol (MCP) server that provides systematic tools and references for porting Python code to TypeScript. This server combines **model enhancement capabilities** with practical porting resources to address the challenges identified in Python-to-TypeScript migration projects.

## 🎯 Purpose

Based on research showing that current AI translation approaches achieve only a **47% success rate** for real-world Python-to-TypeScript conversions, this MCP server provides:

- **Systematic thinking frameworks** for breaking down complex porting tasks
- **Type analysis tools** for understanding Python types and suggesting TypeScript equivalents  
- **Library mapping database** with migration guidance and alternatives
- **Pattern recognition** for converting Python idioms to TypeScript best practices
- **Validation strategies** for ensuring porting correctness
- **Quality references** with TypeScript best practices for Python developers

## 🚀 Features

### 🛠️ Tools

1. **`porting-strategy`** - Systematic framework for analyzing and planning porting projects
   - Strategic analysis with complexity assessment
   - Risk evaluation and phased migration planning
   - Dependency graph analysis and critical path identification
   - Effort estimation and timeline recommendations

2. **`type-analysis`** - Python type analysis with TypeScript mapping recommendations
   - Comprehensive type system mapping (primitives, collections, generics, unions)
   - Migration complexity assessment
   - Runtime considerations and testing approaches
   - Library-specific type mappings (datetime, pathlib, dataclasses, etc.)

3. **`library-mapping`** - Find TypeScript/JavaScript equivalents for Python libraries
   - Extensive library database with confidence ratings
   - Installation commands and API difference notes
   - Migration complexity assessment
   - Alternative approaches when no direct equivalent exists

4. **`pattern-mapping`** - Convert Python language patterns to TypeScript equivalents
   - List/dict comprehensions → Array methods
   - Context managers → try/finally patterns
   - Multiple assignment → destructuring
   - Code examples with caveats and best practices

5. **`validation-strategy`** - Testing and validation approaches for conversions
   - Type safety validation strategies
   - Behavioral equivalence testing
   - Performance validation techniques

### 📚 Resources

1. **`typescript://best-practices`** - TypeScript best practices for Python developers
2. **`typescript://type-system`** - Comprehensive TypeScript type system guide
3. **`guides://methodology`** - Step-by-step porting methodology
4. **`db://libraries`** - Quick reference library mapping database

### 💬 Prompts

1. **`analyze-python-file`** - Generate prompts for analyzing Python code complexity
2. **`review-typescript-conversion`** - Generate prompts for reviewing converted code

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm
- TypeScript 5.0+
- An MCP-compatible client (like Claude Desktop)

### Build from Source

```bash
# Clone the repository
git clone <repository-url>
cd python-to-typescript

# Install dependencies
npm install

# Build the project
npm run build

# Test the server
npm start
```

## 🔧 Configuration

### Claude Desktop

Add this configuration to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "python-to-typescript-porting": {
      "command": "node",
      "args": ["/path/to/python-to-typescript/dist/index.js"],
      "env": {}
    }
  }
}
```

### Other MCP Clients

The server uses stdio transport and can be integrated with any MCP-compatible client that supports subprocess communication.

## 🐳 Docker Support

The project includes comprehensive Docker support for both development and production environments.

### Quick Start with Docker

```bash
# Build and run with Docker Compose
npm run compose:up

# View logs
npm run compose:logs

# Stop the server
npm run compose:down
```

### Development with Docker

```bash
# Start development environment with hot reloading
npm run compose:dev

# View development logs
docker-compose logs -f mcp-server-dev
```

### Available Docker Scripts

| Script | Description |
|--------|-------------|
| `npm run docker:build` | Build production Docker image |
| `npm run docker:build-dev` | Build development Docker image |
| `npm run compose:up` | Start production services |
| `npm run compose:dev` | Start development services |
| `npm run compose:down` | Stop all services |
| `npm run compose:logs` | View service logs |

### Docker Features

- **Multi-stage builds** for optimized production images
- **Development environment** with hot reloading
- **Health checks** and resource limits
- **Non-root user** for security
- **Alpine Linux** base for minimal footprint

For detailed Docker documentation, see [DOCKER.md](DOCKER.md).

## 🎯 Usage Examples

### Analyzing a Python Project

```typescript
// Use the porting-strategy tool
{
  "projectId": "my-flask-app",
  "projectName": "Flask API Server",
  "stage": "analysis",
  "components": [
    {
      "name": "app.py",
      "type": "module",
      "complexity": "medium",
      "dependencies": ["flask", "sqlalchemy"],
      "challenges": ["Dynamic routing", "ORM relationships"],
      "portingApproach": "Convert to Express.js + TypeORM",
      "estimatedEffort": 16
    }
  ]
}
```

### Analyzing Python Types

```typescript
// Use the type-analysis tool
{
  "pythonType": "Dict[str, Optional[List[User]]]",
  "context": "API response format"
}
```

### Finding Library Equivalents

```typescript
// Use the library-mapping tool
{
  "pythonLibrary": "requests"
}
```

### Converting Python Patterns

```typescript
// Use the pattern-mapping tool
{
  "pattern": "list comprehension"
}
```

## 🧠 Model Enhancement Approach

This server implements "model enhancement" patterns inspired by the [Sequential Thinking](https://medium.com/p/afbd459d49e3) approach, providing:

- **Systematic problem decomposition** for complex porting tasks
- **Context maintenance** across long migration operations  
- **Decision framework** tools for evaluating migration strategies
- **Progressive refinement** of porting approaches
- **Risk assessment** and mitigation planning

## 📊 Research Foundation

The server addresses specific challenges identified in Python-to-TypeScript migration research:

- **Type system mismatch** - Python's dynamic typing vs TypeScript's static types
- **Library ecosystem gaps** - Missing TypeScript equivalents for Python libraries
- **Pattern translation** - Converting Python idioms to TypeScript best practices
- **Validation complexity** - Ensuring behavioral equivalence after migration
- **Strategic planning** - Systematic approaches to large-scale migrations

## 🏗️ Architecture

```
src/
├── index.ts              # Main server entry point
├── tools/                # MCP tools for analysis and mapping
│   ├── porting-strategy.ts   # Strategic planning framework
│   ├── type-analysis.ts      # Type system analysis
│   ├── library-mapping.ts    # Library equivalents database
│   ├── pattern-mapping.ts    # Pattern conversion guide
│   └── validation.ts         # Testing strategies
├── resources/            # Reference materials and guides
│   ├── typescript-references.ts
│   ├── porting-guides.ts
│   └── library-database.ts
└── prompts/             # Template prompts for common tasks
    └── porting-prompts.ts
```

## 🔬 Testing

The server includes comprehensive testing strategies:

```bash
# Run the development server
npm run dev

# Test with MCP Inspector
npx @modelcontextprotocol/inspector
```

### Manual Testing

1. **Strategy Analysis**: Test with a sample Python project structure
2. **Type Mapping**: Try complex Python type annotations
3. **Library Lookup**: Test common Python libraries
4. **Pattern Conversion**: Test Python idioms and patterns

## 🤝 Contributing

Contributions are welcome! Key areas for improvement:

- **Extended library mappings** - Add more Python-to-TypeScript library equivalents
- **Pattern database** - Expand Python pattern recognition and conversion
- **Validation tools** - Improve testing and validation strategies
- **Type inference** - Enhance Python type analysis capabilities
- **Performance optimization** - Improve server response times

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by research from Anthropic's [Model Context Protocol](https://modelcontextprotocol.io)
- Sequential Thinking patterns from the [MCP 101 series](https://medium.com/p/afbd459d49e3)
- Python-to-TypeScript migration research and real-world case studies
- The TypeScript and Python communities for best practices and tooling

## 📖 Related Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Python-to-TypeScript Migration Guide](./src/resources/porting-guides.ts)
- [Sequential Thinking MCP Patterns](https://medium.com/p/afbd459d49e3)

---

**Built with ❤️ for the Python and TypeScript communities** # python-to-typescript-assistant
