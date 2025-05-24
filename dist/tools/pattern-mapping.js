import { z } from "zod";
import chalk from "chalk";
class PatternMapper {
    patterns = [
        {
            pythonPattern: "List Comprehension",
            description: "Python list comprehension syntax",
            typeScriptEquivalent: "Array.map/filter/reduce",
            explanation: "Convert list comprehensions to functional array methods",
            complexity: "simple",
            caveats: ["Less readable for complex expressions", "May need multiple chained calls"],
            examples: [
                {
                    python: "[x * 2 for x in numbers if x > 0]",
                    typescript: "numbers.filter(x => x > 0).map(x => x * 2)",
                    notes: "Split filter and map operations"
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
        }
    ];
    mapPattern(input) {
        try {
            const data = input;
            if (!data.pattern || typeof data.pattern !== 'string') {
                throw new Error('pattern is required and must be a string');
            }
            const matches = this.patterns.filter(p => p.pythonPattern.toLowerCase().includes(data.pattern.toLowerCase()) ||
                p.description.toLowerCase().includes(data.pattern.toLowerCase()));
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
        }
        catch (error) {
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
    visualizePattern(pattern) {
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
export async function registerPatternMappingTool(server) {
    const mapper = new PatternMapper();
    server.tool("pattern-mapping", "Convert Python language patterns and idioms to TypeScript equivalents with examples and caveats.", {
        pattern: z.string().describe("Python pattern or idiom to convert (e.g., 'list comprehension', 'context manager', 'multiple assignment')")
    }, {
        title: "Python Pattern to TypeScript Mapping",
        readOnlyHint: true,
        idempotentHint: true
    }, async (args) => mapper.mapPattern(args));
    console.error(chalk.green("✅ Registered pattern mapping tool"));
}
//# sourceMappingURL=pattern-mapping.js.map