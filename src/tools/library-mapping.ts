import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TextContent } from "@modelcontextprotocol/sdk/types.js";
import chalk from "chalk";

interface LibraryMapping {
  pythonLibrary: string;
  typeScriptEquivalents: {
    name: string;
    package: string;
    confidence: "high" | "medium" | "low";
    notes: string[];
    installCommand: string;
    apiDifferences: string[];
  }[];
  migrationComplexity: "trivial" | "simple" | "moderate" | "complex" | "no-equivalent";
  recommendations: string[];
}

class LibraryMapper {
  private mappings: Record<string, LibraryMapping> = {
    // Web frameworks
    'flask': {
      pythonLibrary: 'flask',
      typeScriptEquivalents: [
        {
          name: 'Express.js',
          package: 'express',
          confidence: 'high',
          notes: ['Most popular Node.js web framework', 'Similar routing concepts'],
          installCommand: 'npm install express @types/express',
          apiDifferences: ['Different decorator syntax', 'Manual route definition']
        },
        {
          name: 'Fastify',
          package: 'fastify',
          confidence: 'medium',
          notes: ['High performance', 'TypeScript-first'],
          installCommand: 'npm install fastify',
          apiDifferences: ['Schema-based validation', 'Plugin architecture']
        }
      ],
      migrationComplexity: 'moderate',
      recommendations: ['Consider Express.js for familiarity', 'Fastify for performance and TypeScript']
    },
    'django': {
      pythonLibrary: 'django',
      typeScriptEquivalents: [
        {
          name: 'Nest.js',
          package: '@nestjs/core',
          confidence: 'high',
          notes: ['Enterprise-grade', 'Decorator-based like Django', 'Built-in TypeScript'],
          installCommand: 'npm install @nestjs/core @nestjs/common',
          apiDifferences: ['Different ORM integration', 'Module-based architecture']
        }
      ],
      migrationComplexity: 'complex',
      recommendations: ['Consider Nest.js for enterprise applications', 'Evaluate Next.js for full-stack']
    },
    
    // Data manipulation
    'pandas': {
      pythonLibrary: 'pandas',
      typeScriptEquivalents: [
        {
          name: 'Observable Plot',
          package: '@observablehq/plot',
          confidence: 'low',
          notes: ['Visualization focus', 'Not a direct replacement'],
          installCommand: 'npm install @observablehq/plot',
          apiDifferences: ['Limited data manipulation', 'Different API']
        }
      ],
      migrationComplexity: 'no-equivalent',
      recommendations: ['Keep pandas backend with API layer', 'Consider WebAssembly solutions']
    },
    'numpy': {
      pythonLibrary: 'numpy',
      typeScriptEquivalents: [
        {
          name: 'ML-Matrix',
          package: 'ml-matrix',
          confidence: 'medium',
          notes: ['Basic matrix operations', 'Limited compared to NumPy'],
          installCommand: 'npm install ml-matrix',
          apiDifferences: ['Smaller API surface', 'Different performance characteristics']
        }
      ],
      migrationComplexity: 'complex',
      recommendations: ['Consider keeping NumPy backend', 'Evaluate WebAssembly options']
    },
    
    // HTTP clients
    'requests': {
      pythonLibrary: 'requests',
      typeScriptEquivalents: [
        {
          name: 'Axios',
          package: 'axios',
          confidence: 'high',
          notes: ['Similar API design', 'Promise-based', 'Interceptors'],
          installCommand: 'npm install axios',
          apiDifferences: ['Promise-based vs blocking', 'Different error handling']
        },
        {
          name: 'Fetch API',
          package: 'node-fetch',
          confidence: 'high',
          notes: ['Native browser API', 'Lighter weight'],
          installCommand: 'npm install node-fetch @types/node-fetch',
          apiDifferences: ['More verbose', 'Manual JSON parsing']
        }
      ],
      migrationComplexity: 'simple',
      recommendations: ['Axios for complex HTTP needs', 'Fetch for simple requests']
    },
    
    // Database
    'sqlalchemy': {
      pythonLibrary: 'sqlalchemy',
      typeScriptEquivalents: [
        {
          name: 'TypeORM',
          package: 'typeorm',
          confidence: 'high',
          notes: ['Decorator-based', 'Similar to SQLAlchemy', 'TypeScript native'],
          installCommand: 'npm install typeorm',
          apiDifferences: ['Decorator syntax', 'Different query builder']
        },
        {
          name: 'Prisma',
          package: 'prisma',
          confidence: 'high',
          notes: ['Type-safe', 'Schema-first', 'Auto-generated client'],
          installCommand: 'npm install prisma @prisma/client',
          apiDifferences: ['Schema definition language', 'Generated client']
        }
      ],
      migrationComplexity: 'moderate',
      recommendations: ['TypeORM for SQLAlchemy-like experience', 'Prisma for type safety']
    },
    
    // Testing
    'pytest': {
      pythonLibrary: 'pytest',
      typeScriptEquivalents: [
        {
          name: 'Jest',
          package: 'jest',
          confidence: 'high',
          notes: ['Full-featured', 'Snapshot testing', 'Mocking'],
          installCommand: 'npm install jest @types/jest',
          apiDifferences: ['Different assertion syntax', 'Built-in mocking']
        },
        {
          name: 'Vitest',
          package: 'vitest',
          confidence: 'high',
          notes: ['Fast', 'Vite-powered', 'Jest-compatible'],
          installCommand: 'npm install vitest',
          apiDifferences: ['Faster execution', 'ESM native']
        }
      ],
      migrationComplexity: 'simple',
      recommendations: ['Jest for mature ecosystem', 'Vitest for modern projects']
    }
  };

  public findMapping(input: unknown): { content: TextContent[]; isError?: boolean } {
    try {
      const data = input as { pythonLibrary: string };
      
      if (!data.pythonLibrary || typeof data.pythonLibrary !== 'string') {
        throw new Error('pythonLibrary is required and must be a string');
      }
      
      const mapping = this.mappings[data.pythonLibrary.toLowerCase()];
      
      if (!mapping) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              pythonLibrary: data.pythonLibrary,
              found: false,
              message: "No direct mapping found. Consider checking npm registry or creating custom implementation.",
              suggestions: [
                "Search npm for similar functionality",
                "Check awesome-typescript lists",
                "Consider keeping Python backend with API interface"
              ]
            }, null, 2)
          }]
        };
      }
      
      // Generate visualization
      const visualization = this.visualizeMapping(mapping);
      console.error(visualization);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(mapping, null, 2)
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

  private visualizeMapping(mapping: LibraryMapping): string {
    let output = `\n${chalk.bold(`📚 LIBRARY MAPPING: ${mapping.pythonLibrary}`)}\n\n`;
    
    // Complexity
    const complexityEmoji = {
      'trivial': '🟢',
      'simple': '🟡',
      'moderate': '🟠',
      'complex': '🔴',
      'no-equivalent': '💀'
    };
    output += `Migration Complexity: ${complexityEmoji[mapping.migrationComplexity]} ${mapping.migrationComplexity}\n\n`;
    
    // Equivalents
    if (mapping.typeScriptEquivalents.length > 0) {
      output += `${chalk.cyan('TypeScript Equivalents:')}\n`;
      mapping.typeScriptEquivalents.forEach((equiv, index) => {
        const confidenceColor = equiv.confidence === 'high' ? chalk.green :
                               equiv.confidence === 'medium' ? chalk.yellow : chalk.red;
        output += `\n  ${index + 1}. ${chalk.bold(equiv.name)} (${equiv.package})\n`;
        output += `     Confidence: ${confidenceColor(equiv.confidence)}\n`;
        output += `     Install: ${chalk.gray(equiv.installCommand)}\n`;
        
        if (equiv.notes.length > 0) {
          output += `     Notes: ${equiv.notes.join(', ')}\n`;
        }
        
        if (equiv.apiDifferences.length > 0) {
          output += `     API Differences: ${equiv.apiDifferences.join(', ')}\n`;
        }
      });
      output += '\n';
    }
    
    // Recommendations
    if (mapping.recommendations.length > 0) {
      output += `${chalk.green('💡 Recommendations:')}\n`;
      mapping.recommendations.forEach(rec => {
        output += `  • ${rec}\n`;
      });
    }
    
    return output;
  }
}

export async function registerLibraryMappingTool(server: McpServer): Promise<void> {
  const mapper = new LibraryMapper();
  
  server.tool(
    "library-mapping",
    "Find TypeScript/JavaScript equivalents for Python libraries with installation commands and migration guidance.",
    {
      pythonLibrary: z.string().describe("Name of the Python library to find TypeScript equivalents for")
    },
    {
      title: "Python Library to TypeScript Mapping",
      readOnlyHint: true,
      idempotentHint: true
    },
    async (args) => mapper.findMapping(args)
  );
  
  console.error(chalk.green("✅ Registered library mapping tool"));
} 