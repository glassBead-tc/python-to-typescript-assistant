import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TextContent } from "@modelcontextprotocol/sdk/types.js";
import chalk from "chalk";

// Types for type analysis
interface PythonType {
  name: string;
  module?: string;
  generic?: boolean;
  args?: PythonType[];
  union?: boolean;
  optional?: boolean;
  python39Plus?: boolean; // Indicates if this uses Python 3.9+ syntax
}

interface TypeScriptMapping {
  name: string;
  imports?: string[];
  generic?: boolean;
  args?: TypeScriptMapping[];
  confidence: "high" | "medium" | "low";
  notes?: string[];
  alternatives?: TypeScriptMapping[];
}

interface TypeAnalysisResult {
  pythonType: PythonType;
  typeScriptMapping: TypeScriptMapping;
  conversionNotes: string[];
  runtimeConsiderations: string[];
  testingApproach: string[];
  migrationComplexity: "trivial" | "simple" | "moderate" | "complex" | "requires-redesign";
}

class TypeAnalyzer {
  private builtinMappings: Record<string, TypeScriptMapping> = {
    // Primitive types
    'int': {
      name: 'number',
      confidence: 'high'
    },
    'float': {
      name: 'number',
      confidence: 'high'
    },
    'str': {
      name: 'string',
      confidence: 'high'
    },
    'bool': {
      name: 'boolean',
      confidence: 'high'
    },
    'bytes': {
      name: 'Uint8Array',
      confidence: 'medium',
      notes: ['Consider Buffer for Node.js environments'],
      alternatives: [{ name: 'Buffer', confidence: 'medium' }]
    },
    
    // Collections - Python 3.9+ built-in generics preferred
    'list': {
      name: 'Array',
      generic: true,
      confidence: 'high',
      notes: ['Python 3.9+ built-in generic - no typing import needed']
    },
    'tuple': {
      name: 'readonly',
      generic: true,
      confidence: 'high',
      notes: ['Use readonly tuple types for immutability', 'Python 3.9+ built-in generic preferred']
    },
    'dict': {
      name: 'Record',
      generic: true,
      confidence: 'medium',
      notes: ['Consider Map for dynamic keys', 'Python 3.9+ built-in generic preferred'],
      alternatives: [{ name: 'Map', confidence: 'medium' }]
    },
    'set': {
      name: 'Set',
      confidence: 'high',
      notes: ['Python 3.9+ built-in generic - no typing import needed']
    },
    'frozenset': {
      name: 'ReadonlySet',
      confidence: 'medium',
      notes: ['Python 3.9+ built-in generic', 'Consider readonly Set type in TypeScript']
    },
    
    // Optional and Union types
    'None': {
      name: 'null',
      confidence: 'high',
      notes: ['Consider undefined vs null semantics']
    },
    'Union': {
      name: 'union',
      confidence: 'high',
      notes: ['Use discriminated unions for better type safety']
    },
    'Optional': {
      name: 'optional',
      confidence: 'high',
      notes: ['Translates to T | undefined']
    },
    
    // Functions
    'Callable': {
      name: 'Function',
      confidence: 'medium',
      notes: ['Define specific function signatures when possible'],
      alternatives: [{ name: '(...args: any[]) => any', confidence: 'low' }]
    },
    
    // Any/Unknown
    'Any': {
      name: 'any',
      confidence: 'low',
      notes: ['Avoid any; use unknown or specific types']
    },
    'object': {
      name: 'unknown',
      confidence: 'medium',
      notes: ['Use unknown instead of any for type safety']
    }
  };

  private libraryMappings: Record<string, Record<string, TypeScriptMapping>> = {
    'datetime': {
      'datetime': {
        name: 'Date',
        confidence: 'high',
        notes: ['JavaScript Date has different behavior than Python datetime']
      },
      'timedelta': {
        name: 'number',
        confidence: 'medium',
        notes: ['Represent as milliseconds', 'Consider using date-fns or moment.js']
      }
    },
    'pathlib': {
      'Path': {
        name: 'string',
        confidence: 'medium',
        notes: ['Use string paths or path library like upath'],
        alternatives: [{ name: 'URL', confidence: 'low' }]
      }
    },
    'uuid': {
      'UUID': {
        name: 'string',
        confidence: 'high',
        notes: ['Use string representation', 'Consider uuid library for generation']
      }
    },
    'decimal': {
      'Decimal': {
        name: 'number',
        confidence: 'low',
        notes: ['JavaScript number precision issues', 'Consider decimal.js library'],
        alternatives: [{ name: 'Decimal', imports: ['decimal.js'], confidence: 'high' }]
      }
    },
    'dataclasses': {
      'dataclass': {
        name: 'interface',
        confidence: 'high',
        notes: ['Convert to TypeScript interface or class']
      }
    },
    'typing': {
      'List': { name: 'Array', generic: true, confidence: 'high' },
      'Dict': { name: 'Record', generic: true, confidence: 'high' },
      'Set': { name: 'Set', confidence: 'high' },
      'Tuple': { name: 'readonly', generic: true, confidence: 'high' },
      'Optional': { name: 'optional', confidence: 'high' },
      'Union': { name: 'union', confidence: 'high' },
      'Callable': { name: 'Function', confidence: 'medium' },
      'Any': { name: 'any', confidence: 'low' },
      'TypeVar': { name: 'generic', confidence: 'medium', notes: ['Convert to TypeScript generic parameter'] },
      'Protocol': { name: 'interface', confidence: 'high', notes: ['Convert to TypeScript interface'] },
      'Literal': { name: 'literal', confidence: 'high', notes: ['Use TypeScript literal types'] }
    }
  };

  private parseTypeString(typeStr: string): PythonType {
    // Enhanced type parsing optimized for Python 3.9+
    typeStr = typeStr.trim();
    
    // Handle Python 3.9+ union syntax: str | int | None
    if (typeStr.includes(' | ')) {
      const unionTypes = typeStr.split(' | ').map(t => t.trim());
      return {
        name: 'Union',
        args: unionTypes.map(t => this.parseTypeString(t)),
        union: true,
        python39Plus: true
      };
    }
    
    // Handle Optional[T] (legacy syntax)
    if (typeStr.startsWith('Optional[')) {
      const innerType = typeStr.slice(9, -1);
      return {
        name: 'Optional',
        args: [this.parseTypeString(innerType)],
        optional: true
      };
    }
    
    // Handle Union[T, U, ...] (legacy syntax)
    if (typeStr.startsWith('Union[')) {
      const innerTypes = typeStr.slice(6, -1).split(',').map(t => t.trim());
      return {
        name: 'Union',
        args: innerTypes.map(t => this.parseTypeString(t)),
        union: true
      };
    }
    
    // Handle Python 3.9+ built-in generics: list[str], dict[str, int], etc.
    const python39GenericMatch = typeStr.match(/^(list|dict|tuple|set|frozenset)\[(.+)\]$/);
    if (python39GenericMatch) {
      const [, baseName, argsStr] = python39GenericMatch;
      const args = this.parseGenericArgs(argsStr);
      return {
        name: baseName,
        generic: true,
        args,
        python39Plus: true
      };
    }
    
    // Handle typing module generics: List[str], Dict[str, int], etc. (legacy)
    const typingGenericMatch = typeStr.match(/^([A-Z][A-Za-z_][A-Za-z0-9_]*)\[(.+)\]$/);
    if (typingGenericMatch) {
      const [, baseName, argsStr] = typingGenericMatch;
      const args = this.parseGenericArgs(argsStr);
      return {
        name: baseName,
        generic: true,
        args
      };
    }
    
    // Handle other Generic[T, U, ...] patterns
    const genericMatch = typeStr.match(/^([A-Za-z_][A-Za-z0-9_]*)\[(.+)\]$/);
    if (genericMatch) {
      const [, baseName, argsStr] = genericMatch;
      const args = this.parseGenericArgs(argsStr);
      return {
        name: baseName,
        generic: true,
        args
      };
    }
    
    // Handle module.Type
    const moduleMatch = typeStr.match(/^([a-z_][a-z0-9_]*\.)*([A-Za-z_][A-Za-z0-9_]*)$/);
    if (moduleMatch) {
      const parts = typeStr.split('.');
      return {
        name: parts[parts.length - 1],
        module: parts.slice(0, -1).join('.')
      };
    }
    
    // Simple type
    return {
      name: typeStr
    };
  }
  
  private parseGenericArgs(argsStr: string): PythonType[] {
    // Smart parsing of generic arguments that handles nested brackets
    const args: PythonType[] = [];
    let current = '';
    let depth = 0;
    
    for (const char of argsStr) {
      if (char === '[') {
        depth++;
        current += char;
      } else if (char === ']') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0) {
        args.push(this.parseTypeString(current.trim()));
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      args.push(this.parseTypeString(current.trim()));
    }
    
    return args;
  }

  private mapPythonType(pythonType: PythonType): TypeScriptMapping {
    // Check builtin mappings first
    if (this.builtinMappings[pythonType.name]) {
      let mapping = { ...this.builtinMappings[pythonType.name] };
      
      // Handle generic types
      if (pythonType.generic && pythonType.args) {
        mapping.args = pythonType.args.map(arg => this.mapPythonType(arg));
      }
      
      return mapping;
    }
    
    // Check library mappings
    if (pythonType.module && this.libraryMappings[pythonType.module]?.[pythonType.name]) {
      return { ...this.libraryMappings[pythonType.module][pythonType.name] };
    }
    
    // Handle special cases
    if (pythonType.union && pythonType.args) {
      const mappedArgs = pythonType.args.map(arg => this.mapPythonType(arg));
      return {
        name: mappedArgs.map(arg => arg.name).join(' | '),
        confidence: 'high',
        notes: ['Union type - ensure all branches are handled']
      };
    }
    
    if (pythonType.optional && pythonType.args?.[0]) {
      const innerMapping = this.mapPythonType(pythonType.args[0]);
      return {
        name: `${innerMapping.name} | undefined`,
        confidence: innerMapping.confidence,
        notes: [...(innerMapping.notes || []), 'Optional type - handle undefined case']
      };
    }
    
    // Unknown type - provide guidance
    return {
      name: 'unknown',
      confidence: 'low',
      notes: [
        `Unknown Python type: ${pythonType.module ? pythonType.module + '.' : ''}${pythonType.name}`,
        'Consider creating a custom TypeScript interface',
        'Check if there are equivalent TypeScript libraries'
      ]
    };
  }

  private assessMigrationComplexity(pythonType: PythonType, tsMapping: TypeScriptMapping): TypeAnalysisResult['migrationComplexity'] {
    if (tsMapping.confidence === 'low') return 'requires-redesign';
    
    if (pythonType.name === 'Any' || pythonType.name === 'object') return 'complex';
    
    if (pythonType.module && !this.libraryMappings[pythonType.module]) {
      return 'complex';
    }
    
    if (pythonType.union && pythonType.args && pythonType.args.length > 3) {
      return 'moderate';
    }
    
    if (pythonType.generic && pythonType.args) {
      const argComplexities = pythonType.args.map(arg => 
        this.assessMigrationComplexity(arg, this.mapPythonType(arg))
      );
      if (argComplexities.some(c => c === 'requires-redesign')) return 'requires-redesign';
      if (argComplexities.some(c => c === 'complex')) return 'complex';
      if (argComplexities.some(c => c === 'moderate')) return 'moderate';
    }
    
    if (tsMapping.confidence === 'medium') return 'simple';
    
    return 'trivial';
  }

  private generateConversionNotes(pythonType: PythonType, tsMapping: TypeScriptMapping): string[] {
    const notes: string[] = [];
    
    // Add Python 3.9+ specific guidance first
    if (pythonType.python39Plus) {
      notes.push('✨ Using modern Python 3.9+ syntax - excellent for maintainability!');
      
      if (pythonType.union) {
        notes.push('🎯 Python 3.9+ union syntax (|) maps perfectly to TypeScript union types');
      }
      
      if (pythonType.generic && ['list', 'dict', 'tuple', 'set'].includes(pythonType.name)) {
        notes.push('🎯 Python 3.9+ built-in generics are the preferred approach');
        notes.push('📚 No need to import from typing module for basic collections');
      }
    } else {
      // Legacy syntax guidance
      if (pythonType.name === 'Union') {
        notes.push('💡 Consider upgrading to Python 3.9+ union syntax: use "str | int" instead of "Union[str, int]"');
      }
      
      if (['List', 'Dict', 'Tuple', 'Set'].includes(pythonType.name) && pythonType.module === 'typing') {
        const modernEquivalent = pythonType.name.toLowerCase();
        notes.push(`💡 Consider upgrading to Python 3.9+ syntax: use "${modernEquivalent}[...]" instead of "${pythonType.name}[...]"`);
      }
    }
    
    if (tsMapping.notes) {
      notes.push(...tsMapping.notes);
    }
    
    if (pythonType.name === 'dict') {
      notes.push('Consider using Map for dynamic keys or interface for known keys');
      if (pythonType.python39Plus) {
        notes.push('🎯 Python 3.9+ dict merge operators (| and |=) have no direct TypeScript equivalent');
      }
    }
    
    if (pythonType.name === 'list' && pythonType.args) {
      notes.push('Array type - ensure homogeneous elements or use union types');
    }
    
    if (pythonType.union) {
      notes.push('Use discriminated unions with type guards for type safety');
      if (pythonType.python39Plus) {
        notes.push('🎯 TypeScript union syntax aligns perfectly with Python 3.9+ union syntax');
      }
    }
    
    if (pythonType.module === 'datetime') {
      notes.push('JavaScript Date behavior differs from Python datetime');
      notes.push('Consider using date-fns or day.js for better date handling');
    }
    
    return notes;
  }

  private generateRuntimeConsiderations(pythonType: PythonType, tsMapping: TypeScriptMapping): string[] {
    const considerations: string[] = [];
    
    if (pythonType.name === 'int' || pythonType.name === 'float') {
      considerations.push('JavaScript number precision limits (53-bit integers)');
    }
    
    if (pythonType.name === 'dict') {
      considerations.push('Object iteration order guaranteed in modern JavaScript');
    }
    
    if (pythonType.name === 'str') {
      considerations.push('Unicode handling differences between Python and JavaScript');
    }
    
    if (pythonType.union) {
      considerations.push('Runtime type checking needed for union types');
    }
    
    if (pythonType.module === 'decimal') {
      considerations.push('Precision loss with JavaScript numbers');
    }
    
    return considerations;
  }

  private generateTestingApproach(pythonType: PythonType, complexity: TypeAnalysisResult['migrationComplexity']): string[] {
    const approaches: string[] = [];
    
    if (complexity === 'trivial') {
      approaches.push('Basic unit tests for type conversion');
    } else if (complexity === 'simple') {
      approaches.push('Unit tests with edge cases');
      approaches.push('Property-based testing for validation');
    } else if (complexity === 'moderate') {
      approaches.push('Comprehensive unit tests');
      approaches.push('Integration tests');
      approaches.push('Property-based testing');
    } else if (complexity === 'complex') {
      approaches.push('Extensive unit and integration tests');
      approaches.push('Property-based testing');
      approaches.push('Performance benchmarking');
      approaches.push('Cross-platform testing');
    } else {
      approaches.push('Complete test suite redesign');
      approaches.push('Behavioral compatibility testing');
      approaches.push('Performance and correctness validation');
    }
    
    if (pythonType.union) {
      approaches.push('Test all union type branches');
    }
    
    if (pythonType.optional) {
      approaches.push('Test undefined/null handling');
    }
    
    return approaches;
  }

  public analyzeType(input: unknown): { content: TextContent[]; isError?: boolean } {
    try {
      const data = input as { pythonType: string; context?: string };
      
      if (!data.pythonType || typeof data.pythonType !== 'string') {
        throw new Error('pythonType is required and must be a string');
      }
      
      const pythonType = this.parseTypeString(data.pythonType);
      const tsMapping = this.mapPythonType(pythonType);
      const complexity = this.assessMigrationComplexity(pythonType, tsMapping);
      
      const result: TypeAnalysisResult = {
        pythonType,
        typeScriptMapping: tsMapping,
        conversionNotes: this.generateConversionNotes(pythonType, tsMapping),
        runtimeConsiderations: this.generateRuntimeConsiderations(pythonType, tsMapping),
        testingApproach: this.generateTestingApproach(pythonType, complexity),
        migrationComplexity: complexity
      };
      
      // Generate visualization
      const visualization = this.visualizeTypeAnalysis(result);
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

  private visualizeTypeAnalysis(result: TypeAnalysisResult): string {
    let output = `\n${chalk.bold('🔍 TYPE ANALYSIS')}\n\n`;
    
    // Python type
    output += `${chalk.cyan('Python Type:')}\n`;
    output += `  ${result.pythonType.module ? result.pythonType.module + '.' : ''}${result.pythonType.name}`;
    if (result.pythonType.generic && result.pythonType.args) {
      output += `[${result.pythonType.args.map(arg => arg.name).join(', ')}]`;
    }
    
    // Add Python 3.9+ indicator
    if (result.pythonType.python39Plus) {
      output += ` ${chalk.green('✨ Python 3.9+')}`;
    } else {
      output += ` ${chalk.yellow('⚠️  Legacy syntax')}`;
    }
    output += '\n\n';
    
    // TypeScript mapping
    output += `${chalk.cyan('TypeScript Mapping:')}\n`;
    output += `  ${result.typeScriptMapping.name}`;
    if (result.typeScriptMapping.imports) {
      output += ` ${chalk.gray(`(from ${result.typeScriptMapping.imports.join(', ')})`)}`;
    }
    output += '\n';
    
    // Confidence
    const confidenceColor = result.typeScriptMapping.confidence === 'high' ? chalk.green :
                           result.typeScriptMapping.confidence === 'medium' ? chalk.yellow : chalk.red;
    output += `  Confidence: ${confidenceColor(result.typeScriptMapping.confidence)}\n`;
    
    // Complexity
    const complexityEmoji = {
      'trivial': '🟢',
      'simple': '🟡',
      'moderate': '🟠',
      'complex': '🔴',
      'requires-redesign': '💀'
    };
    output += `  Migration Complexity: ${complexityEmoji[result.migrationComplexity]} ${result.migrationComplexity}\n\n`;
    
    // Conversion notes
    if (result.conversionNotes.length > 0) {
      output += `${chalk.yellow('📝 Conversion Notes:')}\n`;
      result.conversionNotes.forEach(note => {
        output += `  • ${note}\n`;
      });
      output += '\n';
    }
    
    // Runtime considerations
    if (result.runtimeConsiderations.length > 0) {
      output += `${chalk.red('⚠️  Runtime Considerations:')}\n`;
      result.runtimeConsiderations.forEach(consideration => {
        output += `  • ${consideration}\n`;
      });
      output += '\n';
    }
    
    // Testing approach
    if (result.testingApproach.length > 0) {
      output += `${chalk.blue('🧪 Testing Approach:')}\n`;
      result.testingApproach.forEach(approach => {
        output += `  • ${approach}\n`;
      });
    }
    
    return output;
  }
}

export async function registerTypeAnalysisTool(server: McpServer): Promise<void> {
  const analyzer = new TypeAnalyzer();
  
  server.tool(
    "type-analysis",
    "Analyzes Python types and provides TypeScript mappings with migration guidance, runtime considerations, and testing approaches. Optimized for Python 3.9+ syntax including union operators (|) and built-in generics (list[str], dict[str, int]).",
    {
      pythonType: z.string().describe("Python type annotation as a string. Supports modern Python 3.9+ syntax: 'str | int', 'list[str]', 'dict[str, int]' as well as legacy 'Union[str, int]', 'List[str]', 'Dict[str, int]'"),
      context: z.string().optional().describe("Additional context about the type usage")
    },
    {
      title: "Python-to-TypeScript Type Analysis (Python 3.9+ Optimized)",
      readOnlyHint: true,
      idempotentHint: true
    },
    async (args) => analyzer.analyzeType(args)
  );
  
  console.error(chalk.green("✅ Registered Python 3.9+ optimized type analysis tool"));
} 