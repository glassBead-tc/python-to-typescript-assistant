import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TextContent } from "@modelcontextprotocol/sdk/types.js";
import chalk from "chalk";

interface ValidationStrategy {
  name: string;
  description: string;
  complexity: "simple" | "moderate" | "complex";
  tools: string[];
  steps: string[];
  examples: string[];
}

class ValidationHelper {
  private strategies: Record<string, ValidationStrategy> = {
    "type-safety": {
      name: "Type Safety Validation",
      description: "Ensure TypeScript types correctly represent Python behavior",
      complexity: "moderate",
      tools: ["TypeScript compiler", "tsc --noEmit", "ESLint TypeScript rules"],
      steps: [
        "Enable strict mode in tsconfig.json",
        "Use TypeScript compiler to check for type errors",
        "Set up ESLint with TypeScript rules",
        "Add type assertions for complex conversions",
        "Use branded types for domain-specific values"
      ],
      examples: [
        "Verify union types handle all Python cases",
        "Check optional types for None handling",
        "Validate generic type parameters"
      ]
    },
    "behavioral": {
      name: "Behavioral Equivalence Testing",
      description: "Verify TypeScript code produces same results as Python",
      complexity: "complex",
      tools: ["Jest", "Property-based testing", "Golden master testing"],
      steps: [
        "Set up parallel test suites",
        "Create property-based tests with fast-check",
        "Implement golden master testing for complex functions",
        "Test edge cases and error conditions",
        "Compare outputs with structured diff tools"
      ],
      examples: [
        "Compare function outputs for same inputs",
        "Test error handling equivalence",
        "Validate data structure transformations"
      ]
    },
    "performance": {
      name: "Performance Validation",
      description: "Ensure TypeScript version meets performance requirements",
      complexity: "moderate",
      tools: ["Node.js profiler", "Benchmark.js", "Chrome DevTools"],
      steps: [
        "Set up performance benchmarks",
        "Profile memory usage patterns",
        "Compare execution times",
        "Identify performance bottlenecks",
        "Optimize critical paths"
      ],
      examples: [
        "Benchmark algorithm implementations",
        "Memory usage comparison",
        "Throughput testing for data processing"
      ]
    }
  };

  public getValidationStrategy(input: unknown): { content: TextContent[]; isError?: boolean } {
    try {
      const data = input as { validationType: string; context?: string };
      
      if (!data.validationType || typeof data.validationType !== 'string') {
        throw new Error('validationType is required and must be a string');
      }
      
      const strategy = this.strategies[data.validationType.toLowerCase()];
      
      if (!strategy) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              validationType: data.validationType,
              found: false,
              availableStrategies: Object.keys(this.strategies),
              message: "Available validation strategies: " + Object.keys(this.strategies).join(", ")
            }, null, 2)
          }]
        };
      }
      
      const visualization = this.visualizeStrategy(strategy);
      console.error(visualization);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(strategy, null, 2)
        }]
      };
      
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            status: 'failed'
          }, null, 2)
        }],
        isError: true
      };
    }
  }

  private visualizeStrategy(strategy: ValidationStrategy): string {
    let output = `\n${chalk.bold(`✅ VALIDATION STRATEGY: ${strategy.name}`)}\n\n`;
    
    output += `${chalk.cyan('Description:')} ${strategy.description}\n`;
    output += `${chalk.cyan('Complexity:')} ${strategy.complexity}\n\n`;
    
    output += `${chalk.yellow('Required Tools:')}\n`;
    strategy.tools.forEach(tool => {
      output += `  • ${tool}\n`;
    });
    output += '\n';
    
    output += `${chalk.green('Implementation Steps:')}\n`;
    strategy.steps.forEach((step, index) => {
      output += `  ${index + 1}. ${step}\n`;
    });
    output += '\n';
    
    output += `${chalk.blue('Examples:')}\n`;
    strategy.examples.forEach(example => {
      output += `  • ${example}\n`;
    });
    
    return output;
  }
}

export async function registerValidationTool(server: McpServer): Promise<void> {
  const helper = new ValidationHelper();
  
  server.tool(
    "validation-strategy",
    "Get validation strategies for ensuring correctness of Python-to-TypeScript conversions.",
    {
      validationType: z.enum(["type-safety", "behavioral", "performance"]).describe("Type of validation strategy needed"),
      context: z.string().optional().describe("Additional context about the validation needs")
    },
    {
      title: "Porting Validation Strategy",
      readOnlyHint: true,
      idempotentHint: true
    },
    async (args) => helper.getValidationStrategy(args)
  );
  
  console.error(chalk.green("✅ Registered validation tool"));
} 