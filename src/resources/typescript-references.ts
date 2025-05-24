import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import chalk from "chalk";

export async function registerTypeScriptReferences(server: McpServer): Promise<void> {
  // TypeScript Best Practices
  server.resource(
    "typescript-best-practices",
    "typescript://best-practices",
    async (uri) => {
      const content = `# TypeScript Best Practices for Python Developers

## Type System Fundamentals

### Strict Mode Configuration
\`\`\`json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
\`\`\`

### Type Annotations
- Always prefer explicit types for function parameters and return values
- Use type assertions sparingly: prefer type guards
- Leverage discriminated unions for complex state management

### Interface vs Type Aliases
- Use interfaces for object shapes that might be extended
- Use type aliases for unions, primitives, and computed types

## Common Patterns for Python Developers

### Error Handling
\`\`\`typescript
// Python-style: exceptions
// TypeScript: Result types
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };
\`\`\`

### Optional Chaining
\`\`\`typescript
// Python: getattr(obj, 'prop', None)
// TypeScript: obj?.prop
const value = user?.profile?.email;
\`\`\`

### Type Guards
\`\`\`typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}
\`\`\`

## Performance Considerations

- Prefer readonly arrays for immutable data
- Use const assertions for literal types
- Leverage tree-shaking with ES modules
- Consider using branded types for domain modeling`;

      return {
        contents: [{
          uri: uri.href,
          mimeType: "text/markdown",
          text: content
        }]
      };
    }
  );

  // Type System Guide
  server.resource(
    "typescript-type-system",
    "typescript://type-system",
    async (uri) => {
      const content = `# TypeScript Type System Guide

## Gradual Typing Migration

### Start with 'any' and Progressively Type
\`\`\`typescript
// Phase 1: Basic conversion
function processData(data: any): any {
  return data.map((item: any) => item.value);
}

// Phase 2: Add input types
function processData(data: Array<{value: number}>): any {
  return data.map(item => item.value);
}

// Phase 3: Complete typing
function processData(data: Array<{value: number}>): number[] {
  return data.map(item => item.value);
}
\`\`\`

## Complex Type Patterns

### Mapped Types
\`\`\`typescript
type Partial<T> = {
  [P in keyof T]?: T[P];
};
\`\`\`

### Conditional Types
\`\`\`typescript
type ApiResponse<T> = T extends string 
  ? { message: T } 
  : { data: T };
\`\`\`

### Template Literal Types
\`\`\`typescript
type EventName<T extends string> = \`on\${Capitalize<T>}\`;
type ClickHandler = EventName<"click">; // "onClick"
\`\`\`

## Common Migration Patterns

### Python Dataclasses → TypeScript Interfaces
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

### Python Enums → TypeScript Union Types
\`\`\`python
class Status(Enum):
    PENDING = "pending"
    COMPLETED = "completed"
\`\`\`

\`\`\`typescript
type Status = "pending" | "completed";
const Status = {
  PENDING: "pending" as const,
  COMPLETED: "completed" as const
} as const;
\`\`\``;

      return {
        contents: [{
          uri: uri.href,
          mimeType: "text/markdown", 
          text: content
        }]
      };
    }
  );

  console.error(chalk.green("✅ Registered TypeScript references"));
} 