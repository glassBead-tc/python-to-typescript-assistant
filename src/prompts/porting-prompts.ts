import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import chalk from "chalk";

export async function registerPortingPrompts(server: McpServer): Promise<void> {
  server.prompt(
    "analyze-python-file",
    "Generate a prompt to analyze a Python file for porting complexity and recommendations.",
    {
      pythonCode: z.string().describe("The Python code to analyze"),
      focusArea: z.enum(["types", "libraries", "patterns", "overall"]).optional().describe("Specific area to focus analysis on")
    },
    ({ pythonCode, focusArea = "overall" }) => {
      const prompts: Record<string, string> = {
        types: `Analyze the following Python code and identify all type-related challenges for porting to TypeScript:

${pythonCode}

Please provide:
1. Type annotations present or missing
2. Dynamic typing patterns that need TypeScript equivalents
3. Union types and optional values to handle
4. Generic types and their TypeScript mappings
5. Recommended TypeScript type definitions`,

        libraries: `Analyze the following Python code for library dependencies and suggest TypeScript equivalents:

${pythonCode}

Please provide:
1. All imported libraries and their purposes
2. TypeScript/JavaScript equivalents for each library
3. Migration complexity for each dependency
4. Alternative approaches if no direct equivalent exists
5. Installation commands for recommended packages`,

        patterns: `Analyze the following Python code for language patterns and idioms that need conversion:

${pythonCode}

Please provide:
1. Python-specific patterns used (list comprehensions, context managers, etc.)
2. TypeScript equivalents for each pattern
3. Code examples showing the conversion
4. Performance and readability considerations
5. Best practices for the TypeScript implementation`,

        overall: `Provide a comprehensive analysis of this Python code for porting to TypeScript:

${pythonCode}

Please analyze:
1. Overall complexity assessment (simple/moderate/complex/critical)
2. Type system challenges and recommendations
3. Library dependencies and TypeScript alternatives  
4. Language pattern conversions needed
5. Recommended porting approach and timeline
6. Potential risks and mitigation strategies
7. Testing strategy for validation`
      };

      return {
        messages: [{
          role: "user" as const,
          content: {
            type: "text" as const,
            text: prompts[focusArea] || prompts.overall
          }
        }]
      };
    }
  );

  server.prompt(
    "review-typescript-conversion",
    "Generate a prompt to review a TypeScript conversion of Python code.",
    {
      originalPython: z.string().describe("Original Python code"),
      convertedTypeScript: z.string().describe("Converted TypeScript code"),
      reviewFocus: z.enum(["correctness", "types", "performance", "style"]).optional().describe("Focus area for the review")
    },
    ({ originalPython, convertedTypeScript, reviewFocus = "correctness" }) => {
      const prompt = `Review this Python to TypeScript conversion with focus on ${reviewFocus}:

## Original Python Code:
\`\`\`python
${originalPython}
\`\`\`

## Converted TypeScript Code:
\`\`\`typescript
${convertedTypeScript}
\`\`\`

Please provide:
1. Correctness assessment - does the TypeScript version maintain the same behavior?
2. Type safety evaluation - are the types appropriate and safe?
3. Code quality review - style, readability, and maintainability
4. Performance considerations - any potential performance impacts
5. Recommended improvements or corrections
6. Missing error handling or edge cases
7. Overall conversion quality rating (1-10) with justification`;

      return {
        messages: [{
          role: "user" as const,
          content: {
            type: "text" as const,
            text: prompt
          }
        }]
      };
    }
  );

  console.error(chalk.green("✅ Registered porting prompts"));
} 