import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TextContent } from "@modelcontextprotocol/sdk/types.js";
import chalk from "chalk";

interface PatternMapping {
  pythonPattern: string;
  description: string;
  typeScriptEquivalent: string;
  explanation: string;
  complexity: "simple" | "moderate" | "complex";
  caveats: string[];
  examples: {
    python: string;
    typescript: string;
    notes?: string;
  }[];
}

class PatternMapper {
  private patterns: PatternMapping[] = [
    {
      pythonPattern: "List Comprehension",
      description: "Python list comprehension syntax (Python 3.9+ with built-in generics)",
      typeScriptEquivalent: "Array.map/filter/reduce",
      explanation: "Convert list comprehensions to functional array methods",
      complexity: "simple",
      caveats: ["Less readable for complex expressions", "May need multiple chained calls"],
      examples: [
        {
          python: "# Python 3.9+\nnumbers: list[int] = [1, 2, 3, 4]\nresult: list[int] = [x * 2 for x in numbers if x > 0]",
          typescript: "const numbers: number[] = [1, 2, 3, 4];\nconst result: number[] = numbers.filter(x => x > 0).map(x => x * 2);",
          notes: "Python 3.9+ list[T] syntax maps directly to TypeScript T[]"
        }
      ]
    },
    {
      pythonPattern: "Dict Comprehension",
      description: "Python dictionary comprehension",
      typeScriptEquivalent: "Object.fromEntries + Array methods",
      explanation: "Use Object.fromEntries with array transformations",
      complexity: "moderate",
      caveats: ["More verbose", "Consider Map for dynamic keys"],
      examples: [
        {
          python: "{k: v * 2 for k, v in items.items() if v > 0}",
          typescript: "Object.fromEntries(Object.entries(items).filter(([k, v]) => v > 0).map(([k, v]) => [k, v * 2]))",
          notes: "Use Map for better performance with dynamic keys"
        }
      ]
    },
    {
      pythonPattern: "Context Manager (with statement)",
      description: "Python context manager pattern",
      typeScriptEquivalent: "try/finally or using pattern",
      explanation: "Manual resource management or using disposable pattern",
      complexity: "complex",
      caveats: ["No automatic resource management", "Must remember cleanup"],
      examples: [
        {
          python: "with open('file.txt') as f:\n    content = f.read()",
          typescript: "const f = await fs.open('file.txt');\ntry {\n  const content = await f.readFile();\n} finally {\n  await f.close();\n}",
          notes: "Consider using library wrappers for common patterns"
        }
      ]
    },
    {
      pythonPattern: "Multiple Assignment",
      description: "Tuple unpacking and multiple assignment",
      typeScriptEquivalent: "Destructuring assignment",
      explanation: "Use array/object destructuring",
      complexity: "simple",
      caveats: ["Array destructuring for sequences", "Object destructuring for named values"],
      examples: [
        {
          python: "a, b = get_pair()",
          typescript: "const [a, b] = getPair();",
          notes: "TypeScript destructuring is very similar"
        }
      ]
    },
    {
      pythonPattern: "Union Type Operator (Python 3.9+)",
      description: "Python 3.9+ union type syntax using | operator",
      typeScriptEquivalent: "TypeScript union types",
      explanation: "Python 3.9+ union syntax maps perfectly to TypeScript union types",
      complexity: "simple",
      caveats: ["Requires Python 3.9+", "Runtime type checking still needed"],
      examples: [
        {
          python: "# Python 3.9+\ndef process_data(value: str | int | None) -> str:\n    if value is None:\n        return 'empty'\n    return str(value)",
          typescript: "function processData(value: string | number | null): string {\n  if (value === null) {\n    return 'empty';\n  }\n  return String(value);\n}",
          notes: "Perfect syntax alignment between Python 3.9+ and TypeScript"
        }
      ]
    },
    {
      pythonPattern: "Dict Merge Operator (Python 3.9+)",
      description: "Python 3.9+ dictionary merge operators | and |=",
      typeScriptEquivalent: "Object spread operator or Object.assign",
      explanation: "Use object spread for merging, no direct |= equivalent",
      complexity: "simple",
      caveats: ["No mutating merge equivalent to |=", "Spread creates new object"],
      examples: [
        {
          python: "# Python 3.9+\ndict1: dict[str, int] = {'a': 1, 'b': 2}\ndict2: dict[str, int] = {'c': 3, 'd': 4}\nmerged = dict1 | dict2  # New dict\ndict1 |= dict2  # Mutate dict1",
          typescript: "const dict1: Record<string, number> = {a: 1, b: 2};\nconst dict2: Record<string, number> = {c: 3, d: 4};\nconst merged = {...dict1, ...dict2};  // New object\nObject.assign(dict1, dict2);  // Mutate dict1",
          notes: "Use Object.assign for mutation, spread for immutable merge"
        }
      ]
    },
    {
      pythonPattern: "String Prefix/Suffix Methods (Python 3.9+)",
      description: "Python 3.9+ removeprefix() and removesuffix() methods",
      typeScriptEquivalent: "String slice with startsWith/endsWith",
      explanation: "Manually implement prefix/suffix removal logic",
      complexity: "simple",
      caveats: ["No built-in methods", "Must check before removing"],
      examples: [
        {
          python: "# Python 3.9+\ntext = 'hello_world'\nwithout_prefix = text.removeprefix('hello_')\nwithout_suffix = text.removesuffix('_world')",
          typescript: "const text = 'hello_world';\nconst withoutPrefix = text.startsWith('hello_') ? text.slice(6) : text;\nconst withoutSuffix = text.endsWith('_world') ? text.slice(0, -6) : text;",
          notes: "Consider creating utility functions for common use cases"
        }
      ]
    },
    {
      pythonPattern: "Built-in Generic Types (Python 3.9+)",
      description: "Python 3.9+ built-in generic collections without typing imports",
      typeScriptEquivalent: "TypeScript built-in array and object types",
      explanation: "Direct mapping to TypeScript's native generic types",
      complexity: "simple",
      caveats: ["Perfect alignment", "No typing imports needed"],
      examples: [
        {
          python: "# Python 3.9+ - No typing import needed!\nnames: list[str] = ['Alice', 'Bob']\nages: dict[str, int] = {'Alice': 30, 'Bob': 25}\ncoords: tuple[float, float] = (1.0, 2.0)\nunique_ids: set[int] = {1, 2, 3}",
          typescript: "const names: string[] = ['Alice', 'Bob'];\nconst ages: Record<string, number> = {Alice: 30, Bob: 25};\nconst coords: readonly [number, number] = [1.0, 2.0];\nconst uniqueIds: Set<number> = new Set([1, 2, 3]);",
          notes: "Python 3.9+ syntax is much cleaner and aligns better with TypeScript"
        }
      ]
    }
  ];

  public mapPattern(input: unknown): { content: TextContent[]; isError?: boolean } {
    try {
      const data = input as { pattern: string };
      
      if (!data.pattern || typeof data.pattern !== 'string') {
        throw new Error('pattern is required and must be a string');
      }
      
      const matches = this.patterns.filter(p => 
        p.pythonPattern.toLowerCase().includes(data.pattern.toLowerCase()) ||
        p.description.toLowerCase().includes(data.pattern.toLowerCase())
      );
      
      if (matches.length === 0) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              pattern: data.pattern,
              found: false,
              availablePatterns: this.patterns.map(p => p.pythonPattern)
            }, null, 2)
          }]
        };
      }
      
      const result = matches[0]; // Return first match
      const visualization = this.visualizePattern(result);
      console.error(visualization);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
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

  private visualizePattern(pattern: PatternMapping): string {
    let output = `\n${chalk.bold(`🔄 PATTERN MAPPING: ${pattern.pythonPattern}`)}\n\n`;
    
    output += `${chalk.cyan('Description:')} ${pattern.description}\n`;
    output += `${chalk.cyan('TypeScript Equivalent:')} ${pattern.typeScriptEquivalent}\n`;
    output += `${chalk.cyan('Complexity:')} ${pattern.complexity}\n\n`;
    
    output += `${chalk.yellow('Explanation:')}\n${pattern.explanation}\n\n`;
    
    if (pattern.caveats.length > 0) {
      output += `${chalk.red('⚠️  Caveats:')}\n`;
      pattern.caveats.forEach(caveat => {
        output += `  • ${caveat}\n`;
      });
      output += '\n';
    }
    
    output += `${chalk.green('Examples:')}\n`;
    pattern.examples.forEach((example, index) => {
      output += `\n  ${index + 1}. Python:\n`;
      output += `     ${chalk.blue(example.python)}\n`;
      output += `     TypeScript:\n`;
      output += `     ${chalk.green(example.typescript)}\n`;
      if (example.notes) {
        output += `     Notes: ${example.notes}\n`;
      }
    });
    
    return output;
  }
}

export async function registerPatternMappingTool(server: McpServer): Promise<void> {
  const mapper = new PatternMapper();
  
  server.tool(
    "pattern-mapping",
    "Convert Python language patterns and idioms to TypeScript equivalents with examples and caveats. Emphasizes Python 3.9+ modern patterns including union operators, dict merge operators, and built-in generics.",
    {
      pattern: z.string().describe("Python pattern or idiom to convert. Supports Python 3.9+ patterns: 'union operator', 'dict merge', 'built-in generics', 'string prefix/suffix' as well as classic patterns: 'list comprehension', 'context manager', 'multiple assignment'")
    },
    {
      title: "Python Pattern to TypeScript Mapping (Python 3.9+ Optimized)",
      readOnlyHint: true,
      idempotentHint: true
    },
    async (args) => mapper.mapPattern(args)
  );
  
  console.error(chalk.green("✅ Registered Python 3.9+ optimized pattern mapping tool"));
} 