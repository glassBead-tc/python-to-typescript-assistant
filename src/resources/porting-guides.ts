import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import chalk from "chalk";

export async function registerPortingGuides(server: McpServer): Promise<void> {
  server.resource(
    "porting-methodology",
    "guides://methodology",
    async (uri) => {
      const content = `# Python-to-TypeScript Porting Methodology

## Phase 1: Assessment and Planning

### Codebase Analysis
1. **Inventory Components**
   - Count files, classes, functions
   - Identify external dependencies
   - Map data flow and architecture

2. **Complexity Assessment**
   - Dynamic type usage patterns
   - Metaprogramming features used
   - Performance-critical sections

3. **Risk Analysis**
   - Third-party library dependencies
   - Custom Python extensions
   - Integration points

### Migration Strategy Selection

#### Big Bang Approach
- **Best for**: Small codebases (<10k lines)
- **Timeline**: 1-4 weeks
- **Risk**: High
- **Benefits**: Clean cut, no maintenance overhead

#### Incremental Approach  
- **Best for**: Medium codebases (10k-100k lines)
- **Timeline**: 2-6 months
- **Risk**: Medium
- **Benefits**: Gradual validation, reduced risk

#### Hybrid Approach
- **Best for**: Large codebases (>100k lines)
- **Timeline**: 6-18 months  
- **Risk**: Low
- **Benefits**: Parallel development, gradual transition

## Phase 2: Environment Setup

### Development Environment
\`\`\`bash
# Initialize TypeScript project
npm init -y
npm install typescript @types/node
npx tsc --init

# Configure strict mode
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node"
  }
}
\`\`\`

### Testing Framework
\`\`\`bash
# Install testing tools
npm install --save-dev jest @types/jest
npm install --save-dev @fast-check/jest
\`\`\`

### Build Pipeline
- Set up TypeScript compilation
- Configure linting with ESLint
- Set up automated testing
- Configure deployment pipeline

## Phase 3: Core Migration

### Order of Operations
1. **Utilities and Constants**: Start with simple, independent code
2. **Data Models**: Convert classes and interfaces
3. **Business Logic**: Core algorithms and processing
4. **Integration Layer**: APIs and external interfaces
5. **Application Layer**: Main application logic

### Common Patterns

#### Data Classes → Interfaces
\`\`\`python
@dataclass
class User:
    id: int
    name: str
    email: Optional[str] = None
\`\`\`

\`\`\`typescript
interface User {
  readonly id: number;
  readonly name: string;
  readonly email?: string;
}
\`\`\`

#### Error Handling
\`\`\`python
try:
    result = risky_operation()
except ValueError as e:
    handle_error(e)
\`\`\`

\`\`\`typescript
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

const result = riskyOperation();
if (!result.success) {
  handleError(result.error);
}
\`\`\`

## Phase 4: Validation and Testing

### Test Strategy
1. **Unit Tests**: Component-level validation
2. **Integration Tests**: End-to-end workflows  
3. **Property Tests**: Behavioral equivalence
4. **Performance Tests**: Ensure acceptable performance

### Validation Checklist
- [ ] All TypeScript compiler errors resolved
- [ ] ESLint rules passing
- [ ] Test coverage maintained
- [ ] Performance benchmarks met
- [ ] Documentation updated

## Phase 5: Deployment and Monitoring

### Gradual Rollout
1. Deploy TypeScript version alongside Python
2. Route small percentage of traffic to TypeScript
3. Monitor error rates and performance
4. Gradually increase traffic percentage
5. Decommission Python version

### Monitoring
- Error rate comparison
- Performance metrics
- Memory usage patterns
- User experience metrics`;

      return {
        contents: [{
          uri: uri.href,
          mimeType: "text/markdown",
          text: content
        }]
      };
    }
  );

  console.error(chalk.green("✅ Registered porting guides"));
} 